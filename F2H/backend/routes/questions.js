import express from 'express';
import { body, validationResult } from 'express-validator';
import Question from '../models/Question.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/questions
// @desc    Get questions with filters
// @access  Public (for interview creation)
router.get('/', async (req, res) => {
  try {
    const {
      role,
      type,
      category,
      difficulty,
      tags,
      limit = 20,
      page = 1
    } = req.query;

    const query = { isActive: true };

    if (role) query.role = role.toLowerCase();
    if (type) query.type = type;
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (tags) {
      query.tags = { $in: tags.split(',').map(tag => tag.trim().toLowerCase()) };
    }

    const questions = await Question.find(query)
      .select('-aiPrompts -usage -createdBy')
      .sort({ 'usage.timesAsked': -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/questions/random
// @desc    Get random questions for practice
// @access  Public
router.get('/random', async (req, res) => {
  try {
    const { role, difficulty, limit = 5, excludeIds } = req.query;

    const options = {
      limit: parseInt(limit),
      role: role?.toLowerCase(),
      difficulty
    };

    if (excludeIds) {
      options.excludeIds = excludeIds.split(',').map(id => id.trim());
    }

    const questions = await Question.getRandomQuestions(options);

    res.json({
      success: true,
      data: {
        questions: questions.map(q => ({
          id: q._id,
          text: q.text,
          type: q.type,
          category: q.category,
          role: q.role,
          difficulty: q.difficulty,
          tags: q.tags,
          estimatedTime: q.metadata.estimatedTime
        }))
      }
    });

  } catch (error) {
    console.error('Get random questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/questions/:id
// @desc    Get single question
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      isActive: true
    }).select('-aiPrompts -usage -createdBy');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: {
        question
      }
    });

  } catch (error) {
    console.error('Get question error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/questions
// @desc    Create new question (Admin only)
// @access  Private (Admin)
router.post('/', protect, [
  body('text')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Question text must be between 10 and 500 characters'),
  body('type')
    .isIn([
      'introduction',
      'experience',
      'technical',
      'behavioral',
      'situational',
      'motivation',
      'future-goals',
      'case-study',
      'problem-solving',
      'leadership'
    ])
    .withMessage('Invalid question type'),
  body('category')
    .isIn([
      'personal',
      'company-fit',
      'behavioral',
      'technical',
      'career',
      'leadership',
      'problem-solving',
      'industry-specific'
    ])
    .withMessage('Invalid question category'),
  body('role')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Role is required'),
  body('difficulty')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level')
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

    const {
      text,
      type,
      category,
      role,
      company,
      industry,
      difficulty,
      tags,
      metadata,
      aiPrompts
    } = req.body;

    // Check if question already exists
    const existingQuestion = await Question.findOne({
      text: { $regex: new RegExp(`^${text.trim()}$`, 'i') },
      role: role.toLowerCase(),
      isActive: true
    });

    if (existingQuestion) {
      return res.status(400).json({
        success: false,
        message: 'Similar question already exists for this role'
      });
    }

    // Create question
    const question = new Question({
      text: text.trim(),
      type,
      category,
      role: role.toLowerCase(),
      company: company?.trim(),
      industry,
      difficulty,
      tags: tags?.map(tag => tag.trim().toLowerCase()) || [],
      metadata: {
        estimatedTime: metadata?.estimatedTime || 120,
        expectedLength: metadata?.expectedLength || 'moderate',
        keyPoints: metadata?.keyPoints || [],
        commonPitfalls: metadata?.commonPitfalls || [],
        sampleAnswer: metadata?.sampleAnswer
      },
      aiPrompts: aiPrompts || {},
      createdBy: req.user.id
    });

    await question.save();

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: {
        question
      }
    });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update question (Admin only)
// @access  Private (Admin)
router.put('/:id', protect, [
  body('text')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Question text must be between 10 and 500 characters'),
  body('type')
    .optional()
    .isIn([
      'introduction',
      'experience',
      'technical',
      'behavioral',
      'situational',
      'motivation',
      'future-goals',
      'case-study',
      'problem-solving',
      'leadership'
    ])
    .withMessage('Invalid question type'),
  body('category')
    .optional()
    .isIn([
      'personal',
      'company-fit',
      'behavioral',
      'technical',
      'career',
      'leadership',
      'problem-solving',
      'industry-specific'
    ])
    .withMessage('Invalid question category'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid difficulty level')
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

    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Update fields
    const updateFields = [
      'text', 'type', 'category', 'company', 'industry',
      'difficulty', 'tags', 'metadata', 'aiPrompts'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'tags' && Array.isArray(req.body[field])) {
          question[field] = req.body[field].map(tag => tag.trim().toLowerCase());
        } else if (field === 'role' && req.body[field]) {
          question[field] = req.body[field].toLowerCase();
        } else {
          question[field] = req.body[field];
        }
      }
    });

    await question.save();

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: {
        question
      }
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete question (Admin only)
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Soft delete
    question.isActive = false;
    await question.save();

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/questions/stats/overview
// @desc    Get question usage statistics
// @access  Private (Admin)
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const stats = await Question.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          averageScore: { $avg: '$usage.averageScore' },
          totalUsage: { $sum: '$usage.timesAsked' },
          byType: {
            $push: {
              type: '$type',
              count: 1,
              averageScore: '$usage.averageScore'
            }
          },
          byDifficulty: {
            $push: {
              difficulty: '$difficulty',
              count: 1,
              averageScore: '$usage.averageScore'
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          stats: {
            totalQuestions: 0,
            averageScore: 0,
            totalUsage: 0,
            byType: [],
            byDifficulty: []
          }
        }
      });
    }

    const result = stats[0];

    // Process byType and byDifficulty
    const typeStats = {};
    const difficultyStats = {};

    result.byType.forEach(item => {
      if (!typeStats[item.type]) {
        typeStats[item.type] = { count: 0, totalScore: 0 };
      }
      typeStats[item.type].count += item.count;
      typeStats[item.type].totalScore += item.averageScore || 0;
    });

    result.byDifficulty.forEach(item => {
      if (!difficultyStats[item.difficulty]) {
        difficultyStats[item.difficulty] = { count: 0, totalScore: 0 };
      }
      difficultyStats[item.difficulty].count += item.count;
      difficultyStats[item.difficulty].totalScore += item.averageScore || 0;
    });

    result.byType = Object.entries(typeStats).map(([type, data]) => ({
      type,
      count: data.count,
      averageScore: data.totalScore / data.count
    }));

    result.byDifficulty = Object.entries(difficultyStats).map(([difficulty, data]) => ({
      difficulty,
      count: data.count,
      averageScore: data.totalScore / data.count
    }));

    res.json({
      success: true,
      data: {
        stats: result
      }
    });

  } catch (error) {
    console.error('Get question stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;
