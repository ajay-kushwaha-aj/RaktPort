// src/lib/auth.ts
// ═══════════════════════════════════════════════════════════════
// Secure Firebase Authentication for RaktPort
//
// Identity:  Dual-layer — internalId (DON-DL-26-XXXX) + @rakt username
// Auth:      OTP-verified, Firestore-validated
//
// Login methods:
//   • Internal ID + OTP   (DON-*, HSP-*, BBK-*, ADM-*, RKT-*)
//   • @rakt username + OTP
//   • Phone + OTP
//   • Email + Password
//   • Google Sign-In
// ═══════════════════════════════════════════════════════════════

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
  sendPasswordResetEmail,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, serverTimestamp,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { app, db } from '../firebase';
import {
  generateInternalId,
  reserveUsername,
  parseUsername,
} from './identity';
import { hashField, decryptField } from './crypto';

const auth = getAuth(app);

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

export interface AuthResult {
  success: boolean;
  userId?: string;
  displayName?: string;
  email?: string;
  internalId?: string;
  donorId?: string;       // legacy compat
  username?: string;
  isNewUser?: boolean;
  error?: string;
}

export interface OtpResult {
  success: boolean;
  confirmationResult?: ConfirmationResult;
  phoneAuthUser?: User;
  error?: string;
}

export interface UserProfile {
  role: string;
  fullName: string;
  mobile: string;
  username?: string;
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
  isVerified?: boolean;
  aadhar?: string;
  bloodGroup?: string;
  gender?: string;
  dob?: string;
  lastDonationDate?: string | null;
  credits?: number;
  registrationNo?: string;
  licenseNo?: string;
  totalBeds?: string;
  operatingHours?: string;
  inventory?: Record<string, number>;
  [key: string]: unknown;
}

/** Result of a Firestore user lookup. */
export interface UserLookupResult {
  found: boolean;
  uid?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  role?: string;
  status?: string;
  internalId?: string;
  donorId?: string;      // legacy
  username?: string;
}

/* ─────────────────────────────────────────────────────────────
   Legacy: generateDonorId (kept for backward compat)
───────────────────────────────────────────────────────────── */

export const generateDonorId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'RKT-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

/* ─────────────────────────────────────────────────────────────
   reCAPTCHA
───────────────────────────────────────────────────────────── */

let recaptchaVerifierInstance: RecaptchaVerifier | null = null;

export function initRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptchaVerifierInstance) {
    try { recaptchaVerifierInstance.clear(); } catch (_) {}
    recaptchaVerifierInstance = null;
  }
  recaptchaVerifierInstance = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => { recaptchaVerifierInstance = null; },
  });
  return recaptchaVerifierInstance;
}

/* ─────────────────────────────────────────────────────────────
   Phone OTP — send / verify (signup)
───────────────────────────────────────────────────────────── */

export async function sendRegistrationOTP(
  mobileNumber: string, verifier: RecaptchaVerifier,
): Promise<OtpResult> {
  try {
    const phone = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;
    const result = await signInWithPhoneNumber(auth, phone, verifier);
    return { success: true, confirmationResult: result };
  } catch (error: any) {
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

export async function verifyRegistrationOTP(
  otpCode: string, confirmationResult: ConfirmationResult | null,
): Promise<OtpResult> {
  if (!confirmationResult)
    return { success: false, error: 'No OTP session found. Please resend.' };
  try {
    const cred = await confirmationResult.confirm(otpCode);
    return { success: true, phoneAuthUser: cred.user };
  } catch (error: any) {
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

/* ─────────────────────────────────────────────────────────────
   Register user
   Generates structured internalId + reserves @rakt username
───────────────────────────────────────────────────────────── */

export async function registerUserWithPhone(
  email: string,
  password: string,
  profile: UserProfile,
  _phoneAuthUid: string,
): Promise<AuthResult> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    await updateProfile(user, { displayName: profile.fullName });

    // Generate structured internal ID
    let internalId: string | undefined;
    try {
      internalId = await generateInternalId(
        profile.role,
        profile.state || 'Unknown',
        profile.district,
      );
    } catch (e) {
      console.warn('[Auth] internalId generation failed, using legacy:', e);
      internalId = undefined;
    }

    // Legacy donorId for backward compatibility (donors only)
    const donorId = profile.role === 'donor' ? generateDonorId() : undefined;

    // Reserve username if provided
    const usernameHandle = profile.username?.toLowerCase().trim();
    if (usernameHandle) {
      const reserved = await reserveUsername(usernameHandle, user.uid, profile.role);
      if (!reserved) {
        // Username taken — still register but without username
        console.warn('[Auth] Username already taken:', usernameHandle);
      }
    }

    const status = profile.isVerified ? 'active' : 'pending';

    await setDoc(doc(db, 'users', user.uid), {
      ...profile,
      email,
      uid: user.uid,
      status,
      ...(internalId && { internalId }),
      ...(donorId && { donorId }),
      ...(usernameHandle && { username: usernameHandle }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      userId: user.uid,
      email: user.email ?? email,
      displayName: profile.fullName,
      internalId,
      donorId,
      username: usernameHandle,
    };
  } catch (error: any) {
    console.error('[Auth] registerUserWithPhone:', error);
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

/* ─────────────────────────────────────────────────────────────
   Login (email + password) — with Firestore status check
───────────────────────────────────────────────────────────── */

export async function loginUser(
  email: string, password: string, role: string,
): Promise<AuthResult> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data();
      if (data.role && data.role !== role) {
        await auth.signOut();
        return { success: false, error: `This account is registered as "${data.role}".` };
      }
      const status = (data.status === 'pending' && data.isVerified) 
        ? 'active' 
        : (data.status ?? (data.isVerified ? 'active' : 'inactive'));
      if (status !== 'active') {
        await auth.signOut();
        return { success: false, error: 'Your account is not active. Contact an administrator.' };
      }
    }

    return {
      success: true,
      userId: user.uid,
      email: user.email ?? email,
      displayName: user.displayName ?? undefined,
    };
  } catch (error: any) {
    console.error('[Auth] loginUser:', error);
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

/* ─────────────────────────────────────────────────────────────
   Google Sign-In
───────────────────────────────────────────────────────────── */

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export async function signInWithGoogle(role: string): Promise<AuthResult> {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const credential = await signInWithPopup(auth, googleProvider);
    const user = credential.user;

    const snap = await getDoc(doc(db, 'users', user.uid));

    if (snap.exists()) {
      const data = snap.data();
      if (data.role && data.role !== role) {
        await auth.signOut();
        return { success: false, error: `This Google account is registered as "${data.role}".` };
      }
      const status = (data.status === 'pending' && data.isVerified) 
        ? 'active' 
        : (data.status ?? (data.isVerified ? 'active' : 'inactive'));
      if (status !== 'active') {
        await auth.signOut();
        return { success: false, error: 'Your account is not active. Contact an administrator.' };
      }
    } else {
      // New user — generate IDs
      const donorId = role === 'donor' ? generateDonorId() : undefined;
      let internalId: string | undefined;
      try {
        internalId = await generateInternalId(role, 'Unknown');
      } catch (_) {}

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName ?? '',
        photoURL: user.photoURL ?? '',
        mobile: '',
        role,
        isVerified: role === 'donor',
        status: role === 'donor' ? 'active' : 'pending',
        authProvider: 'google',
        ...(donorId && { donorId }),
        ...(internalId && { internalId }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return {
      success: true,
      userId: user.uid,
      email: user.email ?? undefined,
      displayName: user.displayName ?? undefined,
      isNewUser: !snap.exists(),
    };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request')
      return { success: false, error: 'Sign-in cancelled.' };
    console.error('[Auth] signInWithGoogle:', error);
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

/* ═════════════════════════════════════════════════════════════
   SECURE LOGIN VIA OTP — Lookup + Verify
═════════════════════════════════════════════════════════════ */

/** Helper: extract common lookup fields from a user doc. */
function toLookupResult(docId: string, data: any): UserLookupResult {
  const status = (data.status === 'pending' && data.isVerified) 
    ? 'active' 
    : (data.status ?? (data.isVerified ? 'active' : 'inactive'));
  return {
    found: true,
    uid: docId,
    fullName: data.fullName || 'User',
    phone: data.mobile || '',
    email: data.email || '',
    role: data.role || 'donor',
    status,
    internalId: data.internalId,
    donorId: data.donorId,
    username: data.username,
  };
}

/**
 * Lookup user by internal ID: DON-*, HSP-*, BBK-*, ADM-*
 * Also supports legacy RKT-* format (searches donorId field).
 */
export async function lookupUserByInternalId(id: string): Promise<UserLookupResult> {
  try {
    const upper = id.toUpperCase().trim();

    // Try new internalId field first
    let q = query(collection(db, 'users'), where('internalId', '==', upper));
    let snap = await getDocs(q);

    // Fallback: search legacy donorId
    if (snap.empty) {
      q = query(collection(db, 'users'), where('donorId', '==', upper));
      snap = await getDocs(q);
    }

    if (snap.empty) return { found: false };
    const result = toLookupResult(snap.docs[0].id, snap.docs[0].data());
    if (result.phone) result.phone = await decryptField(result.phone);
    return result;
  } catch (error: any) {
    console.error('[Auth] lookupUserByInternalId:', error);
    return { found: false };
  }
}

/**
 * Lookup user by @rakt username.
 * Checks the `usernames` collection first, then fetches the user doc.
 */
export async function lookupUserByUsername(rawInput: string): Promise<UserLookupResult> {
  try {
    const handle = parseUsername(rawInput);
    if (!handle) return { found: false };

    // 1. Find UID from usernames collection
    const usernameDoc = await getDoc(doc(db, 'usernames', handle));
    if (usernameDoc.exists()) {
      const { uid } = usernameDoc.data();
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const result = toLookupResult(userDoc.id, userDoc.data());
        if (result.phone) result.phone = await decryptField(result.phone);
        return result;
      }
    }

    // 2. Fallback: search username field in users collection
    const q = query(collection(db, 'users'), where('username', '==', handle));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const result = toLookupResult(snap.docs[0].id, snap.docs[0].data());
      if (result.phone) result.phone = await decryptField(result.phone);
      return result;
    }

    return { found: false };
  } catch (error: any) {
    console.error('[Auth] lookupUserByUsername:', error);
    return { found: false };
  }
}

/** Lookup user by phone number (uses mobileHash for encrypted lookup). */
export async function lookupUserByPhone(phone: string): Promise<UserLookupResult> {
  try {
    const normalized = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const phoneHash = await hashField(normalized);
    
    // Try mobileHash first (encrypted records)
    let q = query(collection(db, 'users'), where('mobileHash', '==', phoneHash));
    let snap = await getDocs(q);
    
    // Fallback: try legacy plaintext mobile field
    if (snap.empty) {
      q = query(collection(db, 'users'), where('mobile', '==', normalized));
      snap = await getDocs(q);
    }
    
    if (snap.empty) return { found: false };
    
    const docData = snap.docs[0].data();
    const result = toLookupResult(snap.docs[0].id, docData);
    // Decrypt the phone for OTP sending
    if (result.phone) {
      result.phone = await decryptField(result.phone);
    }
    return result;
  } catch (error: any) {
    console.error('[Auth] lookupUserByPhone:', error);
    return { found: false };
  }
}

/** Send OTP for login. Caller MUST verify user exists first. */
export async function sendLoginOTP(
  phone: string, verifier: RecaptchaVerifier,
): Promise<OtpResult> {
  try {
    const normalized = phone.startsWith('+') ? phone : `+91${phone}`;
    const result = await signInWithPhoneNumber(auth, normalized, verifier);
    return { success: true, confirmationResult: result };
  } catch (error: any) {
    console.error('[Auth] sendLoginOTP:', error);
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

/**
 * Verify login OTP with STRICT Firestore security checks.
 *
 * Post-verification: user exists, phone match, role match,
 * active status, internalId match.
 */
export async function verifyLoginOTP(
  otpCode: string,
  confirmationResult: ConfirmationResult | null,
  expectedUser: {
    uid: string;
    phone: string;
    role: string;
    internalId?: string;
    donorId?: string;
  },
): Promise<AuthResult> {
  if (!confirmationResult)
    return { success: false, error: 'No OTP session found. Please resend.' };

  try {
    await confirmationResult.confirm(otpCode);

    const userDoc = await getDoc(doc(db, 'users', expectedUser.uid));
    if (!userDoc.exists()) {
      try { await auth.signOut(); } catch (_) {}
      return { success: false, error: 'Access denied. User not found.' };
    }

    const data = userDoc.data();

    // Phone match (decrypt if encrypted)
    const storedPhone = (await decryptField(data.mobile || '')).replace(/\s/g, '');
    const expectedPhone = expectedUser.phone.startsWith('+91')
      ? expectedUser.phone : `+91${expectedUser.phone}`;
    if (storedPhone !== expectedPhone) {
      try { await auth.signOut(); } catch (_) {}
      return { success: false, error: 'Access denied. Phone mismatch.' };
    }

    // Role match
    if (data.role && data.role !== expectedUser.role) {
      try { await auth.signOut(); } catch (_) {}
      return { success: false, error: `Access denied. Account is registered as "${data.role}".` };
    }

    // Active status
    const status = (data.status === 'pending' && data.isVerified) 
      ? 'active' 
      : (data.status ?? (data.isVerified ? 'active' : 'inactive'));
    if (status !== 'active') {
      try { await auth.signOut(); } catch (_) {}
      return { success: false, error: 'Access denied. Account not active.' };
    }

    // Internal ID / Donor ID match
    if (expectedUser.internalId && data.internalId && data.internalId !== expectedUser.internalId) {
      try { await auth.signOut(); } catch (_) {}
      return { success: false, error: 'Access denied. Identity verification failed.' };
    }
    if (expectedUser.donorId && data.donorId && data.donorId !== expectedUser.donorId) {
      try { await auth.signOut(); } catch (_) {}
      return { success: false, error: 'Access denied. Identity verification failed.' };
    }

    return {
      success: true,
      userId: expectedUser.uid,
      email: data.email || '',
      displayName: data.fullName || '',
      internalId: data.internalId,
      donorId: data.donorId,
      username: data.username,
    };
  } catch (error: any) {
    try { await auth.signOut(); } catch (_) {}
    console.error('[Auth] verifyLoginOTP:', error);
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

/* ─────────────────────────────────────────────────────────────
   Forgot Password & Registration Check
───────────────────────────────────────────────────────────── */

export async function lookupUserByEmail(email: string): Promise<boolean> {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (error) {
    console.error('[Auth] lookupUserByEmail:', error);
    return false;
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function friendlyAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password.',
    'auth/email-already-in-use':    'This email is already registered.',
    'auth/invalid-email':           'Invalid email address.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/invalid-verification-code': 'Incorrect OTP. Please try again.',
    'auth/code-expired':            'OTP has expired. Please request a new one.',
    'auth/too-many-requests':       'Too many attempts. Please wait.',
    'auth/network-request-failed':  'Network error. Check your connection.',
    'auth/popup-blocked':           'Popup blocked. Allow popups and try again.',
    'auth/account-exists-with-different-credential': 'Account exists with different sign-in method.',
    'auth/invalid-credential':      'Invalid credentials. Check email and password.',
  };
  return map[code] ?? 'An unexpected error occurred. Please try again.';
}