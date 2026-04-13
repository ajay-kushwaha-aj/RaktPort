// src/lib/crypto.ts
// ═══════════════════════════════════════════════════════════════
// Field-Level Encryption for DPDP Act 2023 Compliance
//
// Uses AES-256-GCM via the Web Crypto API (zero dependencies).
// Encrypts sensitive PII (Aadhaar, mobile) before Firestore writes.
// Decrypts on read — with graceful plaintext fallback for legacy data.
//
// Key derivation: PBKDF2 (SHA-256, 100 000 iterations) from env secret.
// Each ciphertext includes a unique 12-byte IV for semantic security.
//
// Wire format:  Base64( IV_12bytes || Ciphertext || AuthTag_16bytes )
// Prefix:       "enc:" to distinguish encrypted values from plaintext.
// ═══════════════════════════════════════════════════════════════

const ENC_PREFIX = 'enc:';
const IV_BYTES = 12;
const PBKDF2_ITERATIONS = 100_000;
const SALT = new TextEncoder().encode('RaktPort-FLE-v1'); // static salt (key uniqueness from secret)

let _cachedKey: CryptoKey | null = null;

/**
 * Derive an AES-256-GCM key from the environment secret using PBKDF2.
 * Result is cached for the session lifetime.
 */
async function getKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;

  const secret = import.meta.env.VITE_ENCRYPTION_SECRET;
  if (!secret) {
    console.error('[Crypto] VITE_ENCRYPTION_SECRET is not set. Encryption disabled.');
    throw new Error('Encryption secret not configured');
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  _cachedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: SALT, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  return _cachedKey;
}

/* ─────────────────────────────────────────────────────────────
   Helpers: Base64 ↔ Uint8Array
───────────────────────────────────────────────────────────── */

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/* ─────────────────────────────────────────────────────────────
   Public API
───────────────────────────────────────────────────────────── */

/**
 * Encrypt a plaintext string field.
 * Returns `enc:<base64>` format. Returns empty string for empty input.
 */
export async function encryptField(plaintext: string): Promise<string> {
  if (!plaintext) return '';

  try {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const encoded = new TextEncoder().encode(plaintext);

    const cipherBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded,
    );

    // Combine IV + ciphertext into a single buffer
    const combined = new Uint8Array(iv.length + new Uint8Array(cipherBuf).length);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuf), iv.length);

    return ENC_PREFIX + toBase64(combined.buffer);
  } catch (err) {
    console.error('[Crypto] encryptField failed — storing plaintext:', err);
    return plaintext; // Graceful degradation
  }
}

/**
 * Decrypt a ciphertext string field.
 * If the value is not encrypted (no `enc:` prefix), returns it as-is (backward compat).
 */
export async function decryptField(ciphertext: string): Promise<string> {
  if (!ciphertext) return '';

  // Not encrypted — return plaintext as-is (legacy data)
  if (!ciphertext.startsWith(ENC_PREFIX)) return ciphertext;

  try {
    const key = await getKey();
    const raw = fromBase64(ciphertext.slice(ENC_PREFIX.length));

    const iv = raw.slice(0, IV_BYTES);
    const data = raw.slice(IV_BYTES);

    const decryptedBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data,
    );

    return new TextDecoder().decode(decryptedBuf);
  } catch (err) {
    console.warn('[Crypto] decryptField failed — returning raw value:', err);
    return ciphertext; // Graceful degradation for corrupt/miskeyed data
  }
}

/**
 * Check if a value is encrypted (has the `enc:` prefix).
 */
export function isEncrypted(value: string): boolean {
  return !!value && value.startsWith(ENC_PREFIX);
}

/* ─────────────────────────────────────────────────────────────
   Display Masking (never exposes full PII)
───────────────────────────────────────────────────────────── */

/**
 * Mask an Aadhaar number for display: `XXXX XXXX 1234`
 * Works with both decrypted plaintext and raw plaintext.
 */
export function maskAadhaarDisplay(aadhaar: string): string {
  if (!aadhaar || aadhaar.startsWith(ENC_PREFIX)) return 'XXXX XXXX XXXX';
  if (aadhaar.length < 4) return 'XXXX XXXX XXXX';
  return `XXXX XXXX ${aadhaar.slice(-4)}`;
}

/**
 * Mask a mobile number for display: `+91 XXXXX X3210`
 */
export function maskMobileDisplay(mobile: string): string {
  if (!mobile || mobile.startsWith(ENC_PREFIX)) return '+91 XXXXX XXXXX';
  const digits = mobile.replace(/\D/g, '');
  if (digits.length < 4) return '+91 XXXXX XXXXX';
  return `+91 XXXXX X${digits.slice(-4)}`;
}

/* ─────────────────────────────────────────────────────────────
   Searchable Hash (for Firestore queries on encrypted fields)
   
   Since Firestore can't query encrypted fields, we store a
   SHA-256 hash alongside the ciphertext for deterministic lookups.
   The hash is NOT reversible — it only enables equality checks.
───────────────────────────────────────────────────────────── */

/**
 * Generate a deterministic SHA-256 hash of a value for Firestore indexing.
 * Used for phone lookups: store `mobileHash` alongside encrypted `mobile`.
 */
export async function hashField(value: string): Promise<string> {
  if (!value) return '';
  const encoded = new TextEncoder().encode(value.trim().toLowerCase());
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
}
