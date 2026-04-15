import * as functions from 'firebase-functions';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Route Imports
import userRoutes from './routes/userRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import requestRoutes from './routes/requestRoutes';

// Initialize Express App
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);

// Base route for health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'RaktPort API is running successfully.' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled API Error:', err.stack);
  res.status(500).json({ success: false, error: 'An unexpected internal server error occurred' });
});

// Export Express APi as a Firebase Cloud Function
// Note: This relies on the "firebase-functions" SDK wrapper for V1 or V2 HTTP functions.
export const api = functions.https.onRequest(app);
