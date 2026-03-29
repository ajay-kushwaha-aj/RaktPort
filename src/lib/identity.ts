// src/lib/identity.ts
// ═══════════════════════════════════════════════════════════════
// RaktPort — Dual-Layer Identity System
//
// Internal IDs:
//   DON-<STATE>-<YEAR>-<SEQ>     (donors)
//   HSP-<STATE>-<CITY>-<SEQ>     (hospitals)
//   BBK-<STATE>-<CITY>-<SEQ>     (blood banks)
//   ADM-<STATE>-<YEAR>-<SEQ>     (admins)
//
// Usernames:
//   <handle>@rakt   (unique, case-insensitive)
// ═══════════════════════════════════════════════════════════════

import {
  doc, getDoc, setDoc, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

/* ─────────────────────────────────────────────────────────────
   State Code Mapping (ISO 3166-2:IN)
───────────────────────────────────────────────────────────── */

export const STATE_CODES: Record<string, string> = {
  'Andhra Pradesh':   'AP', 'Arunachal Pradesh': 'AR', 'Assam':           'AS',
  'Bihar':            'BR', 'Chhattisgarh':      'CG', 'Goa':             'GA',
  'Gujarat':          'GJ', 'Haryana':           'HR', 'Himachal Pradesh':'HP',
  'Jharkhand':        'JH', 'Karnataka':         'KA', 'Kerala':          'KL',
  'Madhya Pradesh':   'MP', 'Maharashtra':       'MH', 'Manipur':         'MN',
  'Meghalaya':        'ML', 'Mizoram':           'MZ', 'Nagaland':        'NL',
  'Odisha':           'OD', 'Punjab':            'PB', 'Rajasthan':       'RJ',
  'Sikkim':           'SK', 'Tamil Nadu':        'TN', 'Telangana':       'TS',
  'Tripura':          'TR', 'Uttar Pradesh':     'UP', 'Uttarakhand':     'UK',
  'West Bengal':      'WB',
  // Union Territories
  'Andaman and Nicobar Islands':                    'AN',
  'Chandigarh':                                     'CH',
  'Dadra and Nagar Haveli and Daman and Diu':       'DD',
  'Delhi':                                          'DL',
  'Jammu and Kashmir':                              'JK',
  'Ladakh':                                         'LA',
  'Lakshadweep':                                    'LD',
  'Puducherry':                                     'PY',
};

/** Get 2-letter state code from full name. Falls back to first 2 chars. */
export function getStateCode(stateName: string): string {
  return STATE_CODES[stateName] ?? stateName.slice(0, 2).toUpperCase();
}

/** Derive 2-letter city code from district name. Uses first 2 consonants or chars. */
export function getCityCode(district: string): string {
  const clean = district.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (clean.length < 2) return clean.padEnd(2, 'X');
  // Try first + first consonant after
  const consonants = clean.slice(1).replace(/[AEIOU]/g, '');
  if (consonants.length > 0) return clean[0] + consonants[0];
  return clean.slice(0, 2);
}

/* ─────────────────────────────────────────────────────────────
   Internal ID Generation (atomic counter-based)
───────────────────────────────────────────────────────────── */

const ROLE_PREFIX: Record<string, string> = {
  donor:     'DON',
  hospital:  'HSP',
  bloodbank: 'BBK',
  admin:     'ADM',
};

/**
 * Generate a unique internal ID using Firestore atomic counters.
 *
 * Format:
 *   DON-DL-26-0001  (donor: state + year + seq)
 *   HSP-DL-ND-0001  (hospital: state + city + seq)
 *   BBK-MH-BM-0001  (bloodbank: state + city + seq)
 *   ADM-DL-26-0001  (admin: state + year + seq)
 */
export async function generateInternalId(
  role: string,
  stateName: string,
  district?: string,
): Promise<string> {
  const prefix = ROLE_PREFIX[role] ?? 'USR';
  const sc = getStateCode(stateName);
  const year = new Date().getFullYear().toString().slice(-2);

  let counterKey: string;
  if (role === 'hospital' || role === 'bloodbank') {
    const cc = getCityCode(district || 'XX');
    counterKey = `${prefix}-${sc}-${cc}`;
  } else {
    counterKey = `${prefix}-${sc}-${year}`;
  }

  // Atomic counter via transaction
  const counterRef = doc(db, 'counters', counterKey);
  const seq = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? (snap.data().count as number) : 0;
    const next = current + 1;
    tx.set(counterRef, { count: next }, { merge: true });
    return next;
  });

  return `${counterKey}-${seq.toString().padStart(4, '0')}`;
}

/* ─────────────────────────────────────────────────────────────
   @rakt Username System
───────────────────────────────────────────────────────────── */

const USERNAME_REGEX = /^[a-z0-9][a-z0-9.]{1,18}[a-z0-9]$/;
const CONSECUTIVE_DOTS = /\.\./;
const RESERVED = new Set([
  'admin', 'support', 'help', 'raktport', 'rakt', 'system',
  'hospital', 'donor', 'bloodbank', 'blood', 'bank', 'test',
  'info', 'contact', 'emergency', 'api', 'app', 'www',
]);

/** Validate username format (without @rakt suffix). */
export function isValidUsername(name: string): { valid: boolean; error?: string } {
  const lower = name.toLowerCase().trim();
  if (lower.length < 3)                   return { valid: false, error: 'At least 3 characters' };
  if (lower.length > 20)                  return { valid: false, error: 'Maximum 20 characters' };
  if (!USERNAME_REGEX.test(lower))        return { valid: false, error: 'Only lowercase letters, numbers, and dots (.)' };
  if (CONSECUTIVE_DOTS.test(lower))       return { valid: false, error: 'No consecutive dots' };
  if (RESERVED.has(lower))                return { valid: false, error: 'This name is reserved' };
  return { valid: true };
}

/** Check username availability in Firestore. */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const lower = username.toLowerCase().trim();
  const snap = await getDoc(doc(db, 'usernames', lower));
  return !snap.exists();
}

/**
 * Reserve a username atomically.
 * Returns true if reserved successfully, false if already taken.
 */
export async function reserveUsername(
  username: string, uid: string, role: string,
): Promise<boolean> {
  const lower = username.toLowerCase().trim();
  try {
    const ref = doc(db, 'usernames', lower);
    const success = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) return false; // Already taken
      tx.set(ref, { uid, role, createdAt: serverTimestamp() });
      return true;
    });
    return success;
  } catch (e) {
    console.error('[Identity] reserveUsername error:', e);
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────
   Input Type Detection (for smart login)
───────────────────────────────────────────────────────────── */

export type InputType = 'internalId' | 'username' | 'phone' | 'email' | 'unknown';

/**
 * Detect what kind of identifier the user entered.
 *
 *  DON-*, HSP-*, BBK-*, ADM-*, RKT-*         → internalId
 *  something@rakt                              → username
 *  10 digits (or +91 prefixed)                 → phone
 *  something@something.something (not @rakt)   → email
 *  otherwise                                   → unknown
 */
export function detectInputType(input: string): InputType {
  const v = input.trim();
  if (!v) return 'unknown';

  // Internal ID
  if (/^(DON|HSP|BBK|ADM|RKT)-/i.test(v)) return 'internalId';

  // Username: ends with @rakt (case insensitive)
  if (/@rakt$/i.test(v)) return 'username';

  // Phone: 10 digits or +91 prefixed
  const digits = v.replace(/[\s\-+]/g, '');
  if (/^(91)?\d{10}$/.test(digits)) return 'phone';

  // Email: standard format (not @rakt)
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'email';

  return 'unknown';
}

/** Parse the bare handle from "@rakt" input. e.g. "ajay@rakt" → "ajay" */
export function parseUsername(input: string): string {
  return input.replace(/@rakt$/i, '').toLowerCase().trim();
}

/** Format a handle for display. e.g. "ajay" → "ajay@rakt" */
export function formatUsername(handle: string): string {
  if (!handle) return '';
  return `${handle.toLowerCase()}@rakt`;
}

/** Extract phone digits from various formats. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[\s\-+]/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+91${digits}`;
}
