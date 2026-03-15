// profileRoutes.js - Final corrected version
import express from 'express';
import * as profileController from '../controllers/profileController.js';   
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile routes
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.put('/preferences', profileController.updatePreferences);
router.put('/privacy', profileController.updatePrivacySettings);
router.put('/password', profileController.updatePassword);
router.put('/avatar', profileController.uploadAvatar);
router.delete('/', profileController.deleteAccount);

// Achievements
router.get('/achievements', profileController.getAchievements);

// Dashboard charts
router.get('/dashboard', profileController.getDashboard);

// Default export
export default router;

