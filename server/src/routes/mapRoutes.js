import express from 'express';
import { getMapEntities } from '../controllers/mapController.js';
import { optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/entities', optionalAuthenticate, getMapEntities);

export default router;
