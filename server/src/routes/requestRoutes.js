import express from 'express';
import {
  createRequest,
  getRequests,
  getRequestById,
  getRequestMatches,
  updateRequestStatus,
  cancelRequest,
} from '../controllers/requestController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { sosLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/', authenticate, sosLimiter, upload.array('media', 5), createRequest);
router.get('/', authenticate, getRequests);
router.get('/:id', authenticate, getRequestById);
router.get('/:id/matches', authenticate, getRequestMatches);
router.patch('/:id/status', authenticate, updateRequestStatus);
router.patch('/:id/cancel', authenticate, cancelRequest);

export default router;
