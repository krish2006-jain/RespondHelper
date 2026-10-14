import express from 'express';
import {
  getShelters,
  getNearbyShelters,
  getMyShelter,
  getShelterById,
  createShelter,
  updateShelter,
  updateOccupancy,
  deleteShelter,
  getAssignedRequests,
  acceptShelterRequest,
  allocateShelterBed,
  declineShelterRequest,
} from '../controllers/shelterController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole, requireVerified } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getShelters);
router.get('/nearby', getNearbyShelters);
router.get('/my-shelter', requireRole('shelter', 'admin'), getMyShelter);
router.get('/assigned-requests', requireRole('shelter', 'admin'), getAssignedRequests);
router.post('/requests/:id/accept', requireRole('shelter', 'admin'), acceptShelterRequest);
router.post('/requests/:id/allocate', requireRole('shelter', 'admin'), allocateShelterBed);
router.post('/requests/:id/decline', requireRole('shelter', 'admin'), declineShelterRequest);
router.get('/:id', getShelterById);
router.post('/', requireRole('shelter', 'admin'), requireVerified, createShelter);
router.patch('/:id/occupancy', requireRole('shelter', 'admin'), updateOccupancy);
router.patch('/:id', requireRole('shelter', 'admin'), updateShelter);
router.delete('/:id', requireRole('shelter', 'admin'), deleteShelter);

export default router;

