import { Request, Response, NextFunction } from 'express';

// Mocking Firebase Admin SDK usage for scaffolding.
// In actual implementation: import * as admin from 'firebase-admin';
// admin.initializeApp();

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

export const verifyAuthToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    // TODO: Replace with actual Firebase Admin verification
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // req.user = decodedToken;
    
    // MOCK VERIFICATION
    if (token === 'mock-invalid-token') {
      res.status(403).json({ success: false, error: 'Forbidden: Invalid token payload' });
      return;
    }
    
    // Attach dummy decoded token for scaffolding
    req.user = {
      uid: 'mock-uid-1234',
      email: 'mock-user@raktport.in',
      role: 'donor', // or 'blood_bank'
    };

    next();
  } catch (error: any) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during authentication' });
  }
};
