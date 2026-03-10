// firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYGXLwrtutPremWLDblWsTJEqxtsmwuO0",
  authDomain: "raktport.firebaseapp.com",
  projectId: "raktport",
  storageBucket: "raktport.firebasestorage.app",
  messagingSenderId: "462310246892",
  appId: "1:462310246892:web:288e9e3323b418498cd8c9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable phone authentication
auth.useDeviceLanguage();