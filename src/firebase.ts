// firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Values are loaded from environment variables (see .env.example)
const {
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID,
} = import.meta.env;

const missingVars = [
  ["VITE_FIREBASE_API_KEY", VITE_FIREBASE_API_KEY],
  ["VITE_FIREBASE_AUTH_DOMAIN", VITE_FIREBASE_AUTH_DOMAIN],
  ["VITE_FIREBASE_PROJECT_ID", VITE_FIREBASE_PROJECT_ID],
  ["VITE_FIREBASE_STORAGE_BUCKET", VITE_FIREBASE_STORAGE_BUCKET],
  ["VITE_FIREBASE_MESSAGING_SENDER_ID", VITE_FIREBASE_MESSAGING_SENDER_ID],
  ["VITE_FIREBASE_APP_ID", VITE_FIREBASE_APP_ID],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(", ")}. ` +
      "Please copy .env.example to .env and fill in the values."
  );
}

const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable phone authentication
auth.useDeviceLanguage();
