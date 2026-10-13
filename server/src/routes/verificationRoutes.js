import express from 'express';
import {
  submitVerification,
  getVerificationQueue,
  reviewVerification,
} from '../controllers/verificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/submit', upload.single('document'), submitVerification);
router.get('/queue', requireRole('admin'), getVerificationQueue);
router.get('/', requireRole('admin'), getVerificationQueue);
router.patch('/review/:id', requireRole('admin'), reviewVerification);
router.patch('/:id', requireRole('admin'), reviewVerification);

export default router;
