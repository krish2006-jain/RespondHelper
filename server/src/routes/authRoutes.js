import express from 'express';
import {
  register,
  login,
  refresh,
  getMe,
  updateLocation,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);
router.get('/me', authenticate, getMe);
router.patch('/location', authenticate, updateLocation);
router.post('/logout', authenticate, logout);


export default router;
