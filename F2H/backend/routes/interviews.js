import express from 'express';
import { body, validationResult } from 'express-validator';
import Interview from '../models/Interview.js';
import Result from '../models/Result.js';
import { protect } from '../middleware/authMiddleware.js';
import aiService from '../services/aiService.js';

const router = express.Router();


router.get('/', protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('questions.question', 'text type difficulty category');
    res.json(interviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/interviews/:id
// @desc    Get interview by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('questions.question', 'text type difficulty category')
      .populate('user', 'name email');

    if (!interview) {
      return res.status(404).json({ msg: 'Interview not found' });
    }

    // Check if user owns the interview
    if (interview.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(interview);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Interview not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/interviews
// @desc    Create a new interview
// @access  Private
router.post('/', [
  protect,
  [
    body('role', 'Role is required').not().isEmpty(),
    body('difficulty', 'Difficulty is required').isIn(['Easy', 'Medium', 'Hard']),
    body('questionCount', 'Question count must be between 5 and 20').isInt({ min: 5, max: 20 })
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, difficulty, questionCount, customQuestions, jobDescription } = req.body;

    // Generate questions dynamically using AI
    let questions = [];
    if (customQuestions && customQuestions.length > 0) {
      // Use custom questions
      questions = customQuestions.map(q => ({
        text: q.text,
        type: q.type || 'technical',
        category: q.category || 'technical',
        order: q.order || 1,
        answered: false,
        response: '',
        metrics: {
          pace: 0,
          fillers: 0,
          clarity: 0,
          energy: 0
        },
        aiAnalysis: {},
        scores: {
          communication: 0,
          content: 0,
          confidence: 0,
          overall: 0
        }
      }));
    } else {
      // Generate AI-powered questions
      try {
        const aiQuestions = await aiService.generateInterviewQuestions(
          role,
          jobDescription || '',
          questionCount,
          difficulty.toLowerCase()
        );

        questions = aiQuestions.map(q => ({
          text: q.text,
          type: q.type,
          category: q.category,
          order: q.order,
          answered: false,
          response: '',
          metrics: {
            pace: 0,
            fillers: 0,
            clarity: 0,
            energy: 0
          },
          aiAnalysis: {},
          scores: {
            communication: 0,
            content: 0,
            confidence: 0,
            overall: 0
          }
        }));
      } catch (error) {
        console.error('Error generating AI questions:', error);
        // Fallback to basic questions if AI fails
        questions = [
          {
            text: `Tell me about your experience with ${role} roles.`,
            type: 'experience',
            category: 'personal',
            order: 1,
            answered: false,
            response: '',
            metrics: { pace: 0, fillers: 0, clarity: 0, energy: 0 },
            aiAnalysis: {},
            scores: { communication: 0, content: 0, confidence: 0, overall: 0 }
          },
          {
            text: `What interests you about working in ${role}?`,
            type: 'motivation',
            category: 'career',
            order: 2,
            answered: false,
            response: '',
            metrics: { pace: 0, fillers: 0, clarity: 0, energy: 0 },
            aiAnalysis: {},
            scores: { communication: 0, content: 0, confidence: 0, overall: 0 }
          }
        ];
      }
    }

    const newInterview = new Interview({
      user: req.user.id,
      role,
      difficulty,
      questions,
      status: 'active',
      currentQuestion: 0,
      metrics: {
        totalQuestions: questions.length,
        answeredQuestions: 0,
        averageScore: 0,
        totalTime: 0
      }
    });

    const interview = await newInterview.save();
    await interview.populate('questions.question', 'text type difficulty category');

    res.json(interview);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/interviews/:id/response
// @desc    Submit response for a question
// @access  Private
router.put('/:id/response', [
  protect,
  [
    body('questionIndex', 'Question index is required').isInt({ min: 0 }),
    body('response', 'Response is required').not().isEmpty(),
    body('metrics', 'Metrics are required').exists()
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { questionIndex, response, metrics } = req.body;

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ msg: 'Interview not found' });
    }

    // Check if user owns the interview
    if (interview.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Get AI analysis for the response
    let aiAnalysis = {};
    let scores = { communication: 70, content: 70, confidence: 70, overall: 70 };

    try {
      const questionText = interview.questions[questionIndex]?.text || '';
      const analysis = await aiService.analyzeResponse(questionText, response, interview.role);
      aiAnalysis = analysis.aiAnalysis;
      scores = analysis.scores;
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      aiAnalysis = {
        feedback: "Analysis temporarily unavailable",
        suggestions: ["Please try again later"]
      };
    }

    // Update the question response
    if (interview.questions[questionIndex]) {
      interview.questions[questionIndex].answered = true;
      interview.questions[questionIndex].response = response;
      interview.questions[questionIndex].metrics = metrics;
      interview.questions[questionIndex].aiAnalysis = aiAnalysis;
      interview.questions[questionIndex].scores = scores;
      interview.questions[questionIndex].answeredAt = new Date();
    }

    // Create response object for the interview
    const responseObj = {
      questionId: interview.questions[questionIndex]?._id,
      response: {
        text: response
      },
      metrics: metrics,
      scores: scores,
      respondedAt: new Date()
    };

    interview.responses.push(responseObj);

    // Update interview metrics
    const answeredCount = interview.questions.filter(q => q.answered).length;
    const totalScore = interview.questions.reduce((sum, q) => sum + (q.score || 0), 0);
    const averageScore = answeredCount > 0 ? totalScore / answeredCount : 0;

    interview.metrics.answeredQuestions = answeredCount;
    interview.metrics.averageScore = averageScore;

    // Move to next question or complete interview
    if (questionIndex + 1 >= interview.questions.length) {
      interview.status = 'completed';
      interview.completedAt = new Date();

      // Create result record
      const result = new Result({
        user: req.user.id,
        interview: interview._id,
        role: interview.role,
        difficulty: interview.difficulty,
        score: averageScore,
        totalQuestions: interview.questions.length,
        answeredQuestions: answeredCount,
        metrics: interview.metrics,
        questions: interview.questions,
        completedAt: new Date()
      });
      await result.save();
    } else {
      interview.currentQuestion = questionIndex + 1;
    }

    await interview.save();
    await interview.populate('questions.question', 'text type difficulty category');

    res.json(interview);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/interviews/:id/pause
// @desc    Pause interview
// @access  Private
router.put('/:id/pause', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ msg: 'Interview not found' });
    }

    // Check if user owns the interview
    if (interview.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    interview.status = 'paused';
    await interview.save();

    res.json(interview);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/interviews/:id/resume
// @desc    Resume interview
// @access  Private
router.put('/:id/resume', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ msg: 'Interview not found' });
    }

    // Check if user owns the interview
    if (interview.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    interview.status = 'active';
    await interview.save();

    res.json(interview);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/interviews/:id
// @desc    Delete interview
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ msg: 'Interview not found' });
    }

    // Check if user owns the interview
    if (interview.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Interview.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Interview removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
