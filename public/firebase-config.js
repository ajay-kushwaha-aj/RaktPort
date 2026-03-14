// Firebase configuration for static HTML pages (e.g. bloodcenter.html).
// These values must match the VITE_FIREBASE_* variables in your .env file.
// See .env.example for the required variable names.
//
// NOTE: Firebase client-side credentials are intentionally public.
//       Security is enforced through Firebase Security Rules, not by hiding keys.
//
// Fill in your project's values below before deploying.
window.FIREBASE_CONFIG = {
  apiKey:            "YOUR_FIREBASE_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.firebasestorage.app",  // older projects may use .appspot.com — check the Firebase console
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
