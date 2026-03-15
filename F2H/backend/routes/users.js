import mongoose from 'mongoose';
import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Interview from '../models/Interview.js';
import Result from '../models/Result.js';
import { protect } from '../middleware/authMiddleware.js';  

const router = express.Router();
// @route   GET /api/users/profile
// @desc    Get user profile with statistics
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const interviewStats = await Interview.getUserStats(req.user.id);
    const totalResults = await Result.countDocuments({ user: req.user.id, isActive: true });

    // Get recent interviews
    const recentInterviews = await Interview.find({
      user: req.user.id,
      isActive: true
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title role status scores createdAt')
    .populate('questions.questionId', 'text type');

    res.json({
      success: true,
      data: {
        user,
        statistics: {
          ...interviewStats,
          totalResults
        },
        recentInterviews
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password is required to change password'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic profile info
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set new password'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    // Return updated user data (without password)
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get interview statistics
    const interviewStats = await Interview.getUserStats(userId);

    // Get recent interviews with details
    const recentInterviews = await Interview.find({
      user: userId,
      isActive: true
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('title role company status scores createdAt metadata.completedAt')
    .populate('questions.questionId', 'text type category');

    // Get upcoming interviews (scheduled but not started)
    const upcomingInterviews = await Interview.find({
      user: userId,
      status: 'scheduled',
      isActive: true
    })
    .sort({ createdAt: 1 })
    .limit(5)
    .select('title role company settings.createdAt');

    // Get performance trends (last 10 completed interviews)
    const performanceData = await Interview.find({
      user: userId,
      status: 'completed',
      isActive: true
    })
    .sort({ 'metadata.completedAt': -1 })
    .limit(10)
    .select('scores metadata.completedAt')
    .lean();

    // Calculate trends
    const trends = {
      scores: performanceData.map(item => ({
        date: item.metadata.completedAt,
        overall: item.scores.overall,
        communication: item.scores.communication,
        content: item.scores.content,
        confidence: item.scores.confidence
      })).reverse()
    };

    // Get skill breakdown (from completed interviews)
    const skillBreakdown = await Interview.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed', isActive: true } },
      { $unwind: '$responses' },
      {
        $group: {
          _id: '$responses.metrics.content.relevance',
          count: { $sum: 1 },
          avgScore: { $avg: '$responses.scores.content' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        statistics: interviewStats,
        recentInterviews,
        upcomingInterviews,
        trends,
        skillBreakdown
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/achievements
// @desc    Get user achievements and badges
// @access  Private
router.get('/achievements', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user results with badges
    const results = await Result.find({
      user: userId,
      isActive: true
    })
    .select('badges earnedAt')
    .sort({ earnedAt: -1 });

    // Calculate achievements based on user activity
    const interviewStats = await Interview.getUserStats(userId);

    const achievements = [];

    // Interview count achievements
    achievements.push({
      id: 'first-interview',
      title: 'First Steps',
      description: 'Complete your first interview',
      type: 'first-interview',
      unlocked: interviewStats.totalInterviews >= 1,
      unlockedAt: interviewStats.totalInterviews >= 1 ? new Date().toISOString() : null,
      progress: Math.min(interviewStats.totalInterviews || 0, 1),
      target: 1
    });

    achievements.push({
      id: 'interview-streak',
      title: 'Practice Streak',
      description: 'Complete 5 interviews in a row',
      type: 'streak',
      unlocked: (interviewStats.totalInterviews || 0) >= 5,
      unlockedAt: (interviewStats.totalInterviews || 0) >= 5 ? new Date().toISOString() : null,
      progress: Math.min(interviewStats.totalInterviews || 0, 5),
      target: 5
    });

    achievements.push({
      id: 'score-master',
      title: 'Score Master',
      description: 'Achieve an average score of 85% or higher',
      type: 'score',
      unlocked: (interviewStats.averageScore || 0) >= 85,
      unlockedAt: (interviewStats.averageScore || 0) >= 85 ? new Date().toISOString() : null,
      progress: Math.min(Math.round(interviewStats.averageScore || 0), 85),
      target: 85
    });

    achievements.push({
      id: 'consistency',
      title: 'Consistent Performer',
      description: 'Complete 10 interviews',
      type: 'consistency',
      unlocked: (interviewStats.totalInterviews || 0) >= 10,
      unlockedAt: (interviewStats.totalInterviews || 0) >= 10 ? new Date().toISOString() : null,
      progress: Math.min(interviewStats.totalInterviews || 0, 10),
      target: 10
    });

    achievements.push({
      id: 'improvement',
      title: 'Rising Star',
      description: 'Show improvement in 3 consecutive interviews',
      type: 'improvement',
      unlocked: false, // Would need improvement tracking
      unlockedAt: null,
      progress: 0,
      target: 3
    });

    achievements.push({
      id: 'dedication',
      title: 'Dedicated Learner',
      description: 'Practice for 7 days in a row',
      type: 'dedication',
      unlocked: false, // Would need streak tracking
      unlockedAt: null,
      progress: 0,
      target: 7
    });

    res.json({
      success: true,
      data: {
        achievements,
        statistics: interviewStats
      }
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account (soft delete)
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete user
    user.isActive = false;
    await user.save();

    // Soft delete all user's interviews and results
    await Interview.updateMany(
      { user: req.user.id },
      { isActive: false }
    );

    await Result.updateMany(
      { user: req.user.id },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;

