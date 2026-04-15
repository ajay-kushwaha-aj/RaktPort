import { Router, Request, Response } from 'express';
import { verifyAuthToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// TODO: Import Firebase Admin to interact with Firestore
// import * as admin from 'firebase-admin';

/**
 * @route   POST /api/users/register
 * @desc    Register a new user (donor or blood_bank)
 * @access  Public (or authenticated via Firebase token depending on auth flow)
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, fullName, bloodGroup } = req.body;

    if (!email || !password || !role) {
      res.status(400).json({ success: false, error: 'Email, password, and role are required' });
      return;
    }

    if (!['donor', 'blood_bank'].includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role provided' });
      return;
    }

    // TODO: Create user via Firebase Auth
    // const userRecord = await admin.auth().createUser({ email, password });
    
    // TODO: Store extra user metadata in Firestore
    // await admin.firestore().collection('users').doc(userRecord.uid).set({
    //   email,
    //   role,
    //   fullName,
    //   bloodGroup,
    //   createdAt: admin.firestore.FieldValue.serverTimestamp()
    // });

    // Mock successful creation
    res.status(201).json({
      success: true,
      data: {
        uid: 'mock-new-uid-789',
        email,
        role,
        fullName,
        bloodGroup
      }
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Error occurred during registration' });
  }
});

/**
 * @route   GET /api/users/:userId
 * @desc    Fetch user profile metadata
 * @access  Protected
 */
router.get('/:userId', verifyAuthToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Security check: Only allow users to fetch their own profile, unless they are admin logic
    if (req.user?.uid !== userId && req.user?.role !== 'blood_bank') {
      res.status(403).json({ success: false, error: 'Access denied to this profile' });
      return;
    }

    // TODO: Fetch from Firestore
    // const userDoc = await admin.firestore().collection('users').doc(userId).get();
    // if (!userDoc.exists) { ... }

    // Mock profile
    res.status(200).json({
      success: true,
      data: {
        uid: userId,
        fullName: 'Mock User',
        role: 'donor',
        bloodGroup: 'O+',
        city: 'Delhi',
        donationsCount: 5
      }
    });

  } catch (error: any) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ success: false, error: 'Error fetching profile data' });
  }
});

export default router;
