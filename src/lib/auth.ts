// auth.ts
// src/lib/auth.ts
import { auth, db } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPhoneNumber,
    signOut,
    RecaptchaVerifier,
    ConfirmationResult,
    linkWithCredential,
    PhoneAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, query, where, collection, getDocs } from 'firebase/firestore';

// Store confirmation result globally
let confirmationResult: ConfirmationResult | null = null;

// Initialize RecaptchaVerifier
export const initRecaptcha = (elementId: string): RecaptchaVerifier => {
    // Clear any existing recaptcha
    const container = document.getElementById(elementId);
    if (container) {
        container.innerHTML = '';
    }

    const recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        size: 'invisible',
        callback: () => {
            console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
            console.log('reCAPTCHA expired');
        }
    });

    return recaptchaVerifier;
};

// Send OTP to phone number during registration
export const sendRegistrationOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
    try {
        // Ensure phone number is in correct format
        const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;

        // Check if phone number already exists
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('mobile', '==', formattedPhone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return {
                success: false,
                error: 'Phone number already registered'
            };
        }

        // Send OTP
        confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);

        return {
            success: true,
            message: 'OTP sent successfully',
            confirmationResult
        };
    } catch (error: any) {
        console.error('OTP send error:', error);

        let errorMessage = 'Failed to send OTP';
        if (error.code === 'auth/invalid-phone-number') {
            errorMessage = 'Invalid phone number format';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many requests. Please try again later';
        } else if (error.code === 'auth/quota-exceeded') {
            errorMessage = 'SMS quota exceeded. Please try again later';
        }

        return { success: false, error: errorMessage };
    }
};

// Verify OTP during registration
export const verifyRegistrationOTP = async (otp: string, storedConfirmationResult?: ConfirmationResult) => {
    try {
        const result = storedConfirmationResult || confirmationResult;

        if (!result) {
            throw new Error('No confirmation result found. Please request OTP again.');
        }

        // Verify the OTP code
        const credential = await result.confirm(otp);

        return {
            success: true,
            phoneAuthUser: credential.user,
            message: 'Phone number verified successfully'
        };
    } catch (error: any) {
        console.error('OTP verification error:', error);

        let errorMessage = 'Invalid OTP';
        if (error.code === 'auth/invalid-verification-code') {
            errorMessage = 'Invalid OTP code. Please check and try again';
        } else if (error.code === 'auth/code-expired') {
            errorMessage = 'OTP has expired. Please request a new one';
        }

        return { success: false, error: errorMessage };
    }
};

// Register user with verified phone number
export const registerUserWithPhone = async (
    email: string,
    password: string,
    userData: any,
    phoneAuthUid: string
) => {
    try {
        // Create Firebase Auth user with email
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user data in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            ...userData,
            userId: email.toLowerCase(),
            createdAt: new Date().toISOString(),
            uid: user.uid,
            phoneVerified: true,
            phoneAuthUid: phoneAuthUid
        });

        return { success: true, userId: user.uid };
    } catch (error: any) {
        console.error('Registration error:', error);

        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email already registered';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak';
        }

        return { success: false, error: errorMessage };
    }
};

// Original registerUser function (kept for compatibility)
export const registerUser = async (
    email: string,
    password: string,
    userData: any
) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
            ...userData,
            userId: email.toLowerCase(),
            createdAt: new Date().toISOString(),
            uid: user.uid
        });

        return { success: true, userId: user.uid };
    } catch (error: any) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
};

// Login user
export const loginUser = async (email: string, password: string, role: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            throw new Error('User data not found');
        }

        const userData = userDoc.data();

        if (userData.role !== role) {
            await signOut(auth);
            throw new Error('Invalid role selected');
        }

        if (role !== 'donor' && !userData.isVerified) {
            await signOut(auth);
            throw new Error('Account not verified. Please wait for admin approval.');
        }

        return { success: true, userData, userId: user.uid };
    } catch (error: any) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
};

// Logout user
export const logoutUser = async () => {
    try {
        await signOut(auth);
        localStorage.clear();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};