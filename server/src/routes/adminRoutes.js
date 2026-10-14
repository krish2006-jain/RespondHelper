import express from 'express';
import {
  getAdminStats,
  getUsers,
  toggleBlockUser,
  getAnalytics,
  reassignRequest,
  getAvailableResponders,
} from '../controllers/adminController.js';
import {
  getVerificationQueue,
  reviewVerification,
} from '../controllers/verificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.get('/responders', getAvailableResponders);
router.patch('/users/:id/block', toggleBlockUser);
router.get('/analytics', getAnalytics);
router.post('/requests/:id/reassign', reassignRequest);
router.get('/verifications', getVerificationQueue);
router.patch('/verifications/:id', reviewVerification);

export default router;

