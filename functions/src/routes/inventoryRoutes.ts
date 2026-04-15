import { Router, Request, Response } from 'express';
import { verifyAuthToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

/**
 * @route   GET /api/inventory
 * @desc    Fetch blood inventory, optionally filtered by city or bloodGroup
 * @access  Public
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { city, bloodGroup } = req.query;

    // TODO: Query Firestore 'inventory' collection
    // let query = admin.firestore().collection('inventory');
    // if (city) query = query.where('city', '==', city);
    // if (bloodGroup) query = query.where('bloodGroup', '==', bloodGroup);
    // const snapshot = await query.get();
    
    // Mock Response
    res.status(200).json({
      success: true,
      filters_applied: { city: city || null, bloodGroup: bloodGroup || null },
      data: [
        {
          bloodBankId: 'mock-bank-1',
          bloodBankName: 'Delhi Central Hospital',
          city: 'Delhi',
          inventory: {
            'O+': { available: 45, total: 50 },
            'A-': { available: 5, total: 10 }
          },
          lastUpdated: new Date().toISOString()
        }
      ]
    });
  } catch (error: any) {
    console.error('Fetch Inventory Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
  }
});

/**
 * @route   PUT /api/inventory/:bloodBankId
 * @desc    Update blood stock levels for a blood bank
 * @access  Protected (blood_bank role only)
 */
router.put('/:bloodBankId', verifyAuthToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { bloodBankId } = req.params;
    const { inventoryUpdates } = req.body;

    // RBAC: Ensure requesting user is the blood bank updating its own stock
    if (req.user?.uid !== bloodBankId || req.user?.role !== 'blood_bank') {
      res.status(403).json({ success: false, error: 'Access denied: Insufficient permissions to update this inventory' });
      return;
    }

    if (!inventoryUpdates) {
      res.status(400).json({ success: false, error: 'No inventory updates provided' });
      return;
    }

    // TODO: Update Firestore inventory document
    // await admin.firestore().collection('inventory').doc(bloodBankId).update(inventoryUpdates);

    // Mock Response
    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        bloodBankId,
        updates_applied: inventoryUpdates,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Update Inventory Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update inventory' });
  }
});

export default router;
