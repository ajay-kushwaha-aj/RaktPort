
  # RaktPort — Blood Donation Management Platform

  RaktPort is a full-stack blood donation management platform built with **React**, **TypeScript**, and **Firebase**.
  The platform is branded as **RaktSetu** in the user-facing UI; "RaktPort" is the repository / project name.

  ## Features

  - Multi-role authentication — Donor, Hospital, Blood Bank, and Admin
  - Email/Password, Phone OTP, and Google Sign-In
  - Real-time blood inventory management
  - Blood request matching and fulfilment
  - Donation appointment scheduling
  - Blood centre finder powered directly by Firebase
  - QR code generation for appointments and donations
  - Credit/redemption system for donors

  ## Tech Stack

  | Layer | Technology |
  |-------|-----------|
  | Frontend | React 18 + TypeScript + Vite |
  | Database | Firebase Firestore |
  | Authentication | Firebase Auth (Email, Phone OTP, Google) |
  | UI | Tailwind CSS + Shadcn UI |
  | Analytics | Firebase Analytics |

  ## Running the code

  ### 1. Install dependencies
  ```bash
  npm i
  ```

  ### 2. Configure Firebase
  Copy `.env.example` to `.env` and fill in your Firebase project credentials:
  ```bash
  cp .env.example .env
  ```

  Then edit `.env` with your actual Firebase values (see `.env.example` for the required variables).

  ### 3. Configure Firebase for static HTML pages
  The blood centre finder at `public/bloodcenter.html` is a standalone HTML page that
  queries registered blood banks directly from Firestore. It uses `public/firebase-config.js`
  for its Firebase credentials.

  Edit `public/firebase-config.js` and replace the placeholder values with the same Firebase
  credentials you put in `.env`:
  ```js
  window.FIREBASE_CONFIG = {
    apiKey:            "your_firebase_api_key_here",
    authDomain:        "your_project.firebaseapp.com",
    projectId:         "your_project_id",
    // ...
  };
  ```

  If `firebase-config.js` is left with placeholder values the page runs in **demo mode**,
  showing a small set of built-in sample centres (useful for local development).

  ### 4. Start the development server
  ```bash
  npm run dev
  ```

  ## Database Architecture

  **Firebase Firestore** is the single database for the entire project.
  Google Apps Script is **not required** — the blood centre finder page queries blood banks
  registered in the `users` collection (`role: 'bloodbank'`) directly.

  | Collection | Purpose |
  |-----------|---------|
  | `users` | Donors, Hospitals, Blood Banks, Admins |
  | `donations` | Donation records |
  | `bloodRequests` | Hospital blood requests |
  | `inventory` | Blood bank stock |
  | `appointments` | Donation appointments |
  