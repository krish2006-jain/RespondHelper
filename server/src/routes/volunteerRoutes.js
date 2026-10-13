import express from 'express';
import {
  getNearbyRequests,
  getActiveTasks,
  acceptTask,
  updateTaskStatus,
  declineTask,
  toggleAvailability,
  updateVolunteerProfile,
} from '../controllers/volunteerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole, requireVerified } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('volunteer', 'admin'));

router.get('/nearby-requests', getNearbyRequests);
router.get('/active-tasks', getActiveTasks);
router.post('/tasks/:id/accept', requireVerified, acceptTask);
router.patch('/tasks/:id/status', updateTaskStatus);
router.post('/tasks/:id/decline', declineTask);
router.patch('/availability', toggleAvailability);
router.patch('/profile', updateVolunteerProfile);

export default router;
