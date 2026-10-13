import express from 'express';
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  getResourceAlerts,
  assignResource,
} from '../controllers/resourceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole, requireVerified } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getResources);
router.get('/alerts', getResourceAlerts);
router.post('/', requireRole('ngo', 'resource_provider', 'admin'), requireVerified, createResource);
router.patch('/:id', requireRole('ngo', 'resource_provider', 'admin'), updateResource);
router.delete('/:id', requireRole('ngo', 'resource_provider', 'admin'), deleteResource);
router.post('/:id/assign', requireRole('ngo', 'admin'), requireVerified, assignResource);

export default router;
