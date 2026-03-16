// src/lib/auth.ts
// Firebase Authentication helper — supports:
//   • Email / password  (loginUser, registerUserWithPhone)
//   • Phone OTP         (initRecaptcha, sendRegistrationOTP, verifyRegistrationOTP)
//   • Google Sign-In    (signInWithGoogle)

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from '../firebase'; // adjust path to your firebase.ts init file

const auth = getAuth(app);

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

export interface AuthResult {
  success: boolean;
  userId?: string;
  displayName?: string;
  email?: string;
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
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
  isVerified?: boolean;
  // Donor-specific
  aadhar?: string;
  bloodGroup?: string;
  gender?: string;
  dob?: string;
  lastDonationDate?: string | null;
  credits?: number;
  // Hospital-specific
  registrationNo?: string;
  // Blood bank-specific
  licenseNo?: string;
  inventory?: Record<string, number>;
  [key: string]: unknown;
}

/* ─────────────────────────────────────────────────────────────
   reCAPTCHA (invisible, for phone OTP)
───────────────────────────────────────────────────────────── */

let recaptchaVerifierInstance: RecaptchaVerifier | null = null;

export function initRecaptcha(containerId: string): RecaptchaVerifier {
  // Clear any stale instance first
  if (recaptchaVerifierInstance) {
    try { recaptchaVerifierInstance.clear(); } catch (_) {}
    recaptchaVerifierInstance = null;
  }

  recaptchaVerifierInstance = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {/* OTP request allowed */},
    'expired-callback': () => {
      recaptchaVerifierInstance = null;
    },
  });

  return recaptchaVerifierInstance;
}

/* ─────────────────────────────────────────────────────────────
   Phone OTP — send
───────────────────────────────────────────────────────────── */

export async function sendRegistrationOTP(
  mobileNumber: string,
  verifier: RecaptchaVerifier,
): Promise<OtpResult> {
  try {
    const phoneNumber = mobileNumber.startsWith('+')
      ? mobileNumber
      : `+91${mobileNumber}`;

    const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return { success: true, confirmationResult: result };
  } catch (error: any) {
    console.error('[Auth] sendRegistrationOTP:', error);
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

/* ─────────────────────────────────────────────────────────────
   Phone OTP — verify
───────────────────────────────────────────────────────────── */

export async function verifyRegistrationOTP(
  otpCode: string,
  confirmationResult: ConfirmationResult | null,
): Promise<OtpResult> {
  if (!confirmationResult) {
    return { success: false, error: 'No OTP session found. Please resend.' };
  }
  try {
    const credential = await confirmationResult.confirm(otpCode);
    return { success: true, phoneAuthUser: credential.user };
  } catch (error: any) {
    console.error('[Auth] verifyRegistrationOTP:', error);
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

/* ─────────────────────────────────────────────────────────────
   Register user (email + phone-verified)
───────────────────────────────────────────────────────────── */

export async function registerUserWithPhone(
  email: string,
  password: string,
  profile: UserProfile,
  _phoneAuthUid: string, // kept for API compatibility
): Promise<AuthResult> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Update Firebase display name
    await updateProfile(user, { displayName: profile.fullName });

    // Write Firestore profile
    await setDoc(doc(db, 'users', user.uid), {
      ...profile,
      email,
      uid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, userId: user.uid, displayName: profile.fullName };
  } catch (error: any) {
    console.error('[Auth] registerUserWithPhone:', error);
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

/* ─────────────────────────────────────────────────────────────
   Login (email + password)
───────────────────────────────────────────────────────────── */

export async function loginUser(
  email: string,
  password: string,
  role: string,
): Promise<AuthResult> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Verify role in Firestore
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data();
      if (data.role && data.role !== role) {
        await auth.signOut();
        return {
          success: false,
          error: `This account is registered as "${data.role}". Please select the correct role.`,
        };
      }
    }

    return {
      success: true,
      userId: user.uid,
      displayName: user.displayName ?? undefined,
      email: user.email ?? undefined,
    };
  } catch (error: any) {
    console.error('[Auth] loginUser:', error);
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

/* ─────────────────────────────────────────────────────────────
   Google Sign-In / Sign-Up
───────────────────────────────────────────────────────────── */

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export async function signInWithGoogle(role: string): Promise<AuthResult> {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    const credential = await signInWithPopup(auth, googleProvider);
    const user = credential.user;

    // Check if Firestore profile already exists
    const snap = await getDoc(doc(db, 'users', user.uid));

    if (snap.exists()) {
      // Existing user — verify role
      const data = snap.data();
      if (data.role && data.role !== role) {
        await auth.signOut();
        return {
          success: false,
          error: `This Google account is registered as "${data.role}". Please select the correct role.`,
        };
      }
    } else {
      // New user — create minimal Firestore profile
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName ?? '',
        photoURL: user.photoURL ?? '',
        mobile: '',
        role,
        isVerified: role === 'donor',
        authProvider: 'google',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return {
      success: true,
      userId: user.uid,
      displayName: user.displayName ?? undefined,
      email: user.email ?? undefined,
      isNewUser: !snap.exists(),
    };
  } catch (error: any) {
    // User closed the popup — not a real error
    if (error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request') {
      return { success: false, error: 'Sign-in cancelled.' };
    }
    console.error('[Auth] signInWithGoogle:', error);
    return { success: false, error: friendlyAuthError(error.code) };
  }
}

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function friendlyAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found':           'No account found with this email.',
    'auth/wrong-password':           'Incorrect password. Please try again.',
    'auth/email-already-in-use':     'This email is already registered. Try logging in.',
    'auth/invalid-email':            'Invalid email address.',
    'auth/weak-password':            'Password must be at least 6 characters.',
    'auth/invalid-verification-code':'Incorrect OTP. Please try again.',
    'auth/code-expired':             'OTP has expired. Please request a new one.',
    'auth/too-many-requests':        'Too many attempts. Please wait a moment.',
    'auth/network-request-failed':   'Network error. Check your connection.',
    'auth/popup-blocked':            'Popup blocked by browser. Allow popups and try again.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
  };
  return map[code] ?? 'An unexpected error occurred. Please try again.';
}
