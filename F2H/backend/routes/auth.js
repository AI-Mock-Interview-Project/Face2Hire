import express from 'express';
import {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  checkEmail,
  checkAuth
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/check-email', checkEmail);
router.get('/check', checkAuth); // Add check auth endpoint

// Protected routes
router.get('/me', protect, getCurrentUser);

export default router;  // Keep this as ES6 export
