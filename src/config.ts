// src/config.ts
// API URL is loaded from environment variables (see .env.example)
if (!import.meta.env.VITE_API_URL) {
  throw new Error(
    "Missing required environment variable: VITE_API_URL. " +
      "Please copy .env.example to .env and fill in the values."
  );
}

export const API_URL = import.meta.env.VITE_API_URL as string;
