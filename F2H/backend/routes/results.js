import express from 'express';
import {
    createResult,
    getResult,
    getResultByInterview,
    updateResult,
    deleteResult,
    getUserResults,
    getSharedResult,
    shareResult
} from '../controllers/resultController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/shared/:shareableLink', getSharedResult);

// Protected routes
router.use(protect); // All routes below require authentication

router.route('/')
    .get(getUserResults)
    .post(createResult);

router.route('/:id')
    .get(getResult)
    .put(updateResult)
    .delete(deleteResult);

router.get('/interview/:interviewId', getResultByInterview);
router.post('/:id/share', shareResult);

export default router;
