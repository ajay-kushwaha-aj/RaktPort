import { Router, Request, Response } from 'express';
import { verifyAuthToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   GET /api/requests/active
 * @desc    Fetch all open/active emergency blood requests
 * @access  Public
 */
router.get('/active', async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Query Firestore 'bloodRequests' for active/open requests
    // const snapshot = await admin.firestore().collection('bloodRequests')
    //   .where('status', 'in', ['PENDING', 'CREATED', 'PARTIAL'])
    //   .where('urgency', 'in', ['Emergency', 'Critical'])
    //   .get();
    
    // Mock Response
    res.status(200).json({
      success: true,
      data: [
        {
          requestId: 'mock-req-999',
          hospitalName: 'General Hospital',
          bloodGroup: 'B-',
          unitsRequired: 2,
          unitsFulfilled: 0,
          urgency: 'Emergency',
          city: 'Delhi',
          status: 'PENDING',
          createdAt: new Date().toISOString()
        }
      ]
    });
  } catch (error: any) {
    console.error('Fetch Active Requests Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active requests' });
  }
});

/**
 * @route   POST /api/requests
 * @desc    Create a new emergency blood request
 * @access  Protected (blood_bank or hospital role only)
 */
router.post('/', verifyAuthToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientName, bloodGroup, unitsRequired, urgency, city, hospitalName } = req.body;

    // RBAC: Ensure requesting user is authorized to create requests
    if (req.user?.role !== 'blood_bank' && req.user?.role !== 'hospital') {
      res.status(403).json({ success: false, error: 'Access denied: Insufficient permissions to create requests' });
      return;
    }

    if (!patientName || !bloodGroup || !unitsRequired || !city) {
      res.status(400).json({ success: false, error: 'Missing required fields for blood request' });
      return;
    }

    // TODO: Create request in Firestore
    // const requestRef = await admin.firestore().collection('bloodRequests').add({
    //   hospitalId: req.user.uid,
    //   hospitalName,
    //   patientName,
    //   bloodGroup,
    //   unitsRequired,
    //   unitsFulfilled: 0,
    //   urgency: urgency || 'Routine',
    //   city,
    //   status: 'CREATED',
    //   createdAt: admin.firestore.FieldValue.serverTimestamp()
    // });

    // Mock Response
    res.status(201).json({
      success: true,
      message: 'Emergency request created successfully',
      data: {
        requestId: 'mock-new-req-abc',
        hospitalId: req.user.uid,
        patientName,
        bloodGroup,
        unitsRequired,
        urgency: urgency || 'Routine',
        status: 'CREATED'
      }
    });

  } catch (error: any) {
    console.error('Create Request Error:', error);
    res.status(500).json({ success: false, error: 'Failed to create emergency request' });
  }
});

export default router;
