import Result from '../models/Result.js';
import Interview from '../models/Interview.js';

// @desc    Create a new result
// @route   POST /api/results
// @access  Private
export const createResult = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { interviewId, title, scores, feedback, metrics, responses } = req.body;

        // Verify the interview belongs to the user
        const interview = await Interview.findOne({ _id: interviewId, user: userId });
        if (!interview) {
            return res.status(404).json({
                success: false,
                error: 'Interview not found'
            });
        }

        // Create the result
        const result = await Result.create({
            user: userId,
            interview: interviewId,
            title: title || `${interview.role} Interview Result`,
            role: interview.role,
            company: interview.company,
            scores,
            feedback,
            metrics,
            responses
        });

        // Populate the result
        await result.populate('interview', 'title role company');

        res.status(201).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Create result error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create result'
        });
    }
};

// @desc    Get a specific result
// @route   GET /api/results/:id
// @access  Private
export const getResult = async (req, res) => {
    try {
        const userId = req.user.userId;
        const resultId = req.params.id;

        const result = await Result.findOne({
            _id: resultId,
            user: userId,
            isActive: true
        })
        .populate('interview', 'title role company settings')
        .populate('user', 'name email');

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Result not found'
            });
        }

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get result error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get result'
        });
    }
};

// @desc    Get result by interview ID
// @route   GET /api/results/interview/:interviewId
// @access  Private
export const getResultByInterview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const interviewId = req.params.interviewId;

        const result = await Result.findOne({
            interview: interviewId,
            user: userId,
            isActive: true
        })
        .populate('interview', 'title role company settings');

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Result not found for this interview'
            });
        }

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get result by interview error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get result'
        });
    }
};

// @desc    Update a result
// @route   PUT /api/results/:id
// @access  Private
export const updateResult = async (req, res) => {
    try {
        const userId = req.user.userId;
        const resultId = req.params.id;
        const updates = req.body;

        // Remove fields that shouldn't be updated directly
        delete updates.user;
        delete updates.interview;
        delete updates.shareableLink;
        delete updates.sharedAt;
        delete updates.expiresAt;

        const result = await Result.findOneAndUpdate(
            { _id: resultId, user: userId, isActive: true },
            updates,
            { new: true, runValidators: true }
        )
        .populate('interview', 'title role company');

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Result not found'
            });
        }

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Update result error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update result'
        });
    }
};

// @desc    Delete a result
// @route   DELETE /api/results/:id
// @access  Private
export const deleteResult = async (req, res) => {
    try {
        const userId = req.user.userId;
        const resultId = req.params.id;

        const result = await Result.findOneAndUpdate(
            { _id: resultId, user: userId, isActive: true },
            { isActive: false },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Result not found'
            });
        }

        res.json({
            success: true,
            message: 'Result deleted successfully'
        });

    } catch (error) {
        console.error('Delete result error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete result'
        });
    }
};

// @desc    Get user's results
// @route   GET /api/results
// @access  Private
export const getUserResults = async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const results = await Result.find({
            user: userId,
            isActive: true
        })
        .populate('interview', 'title role company createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

        const total = await Result.countDocuments({
            user: userId,
            isActive: true
        });

        res.json({
            success: true,
            data: results,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get user results error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get results'
        });
    }
};

// @desc    Get shared result (public access)
// @route   GET /api/results/shared/:shareableLink
// @access  Public
export const getSharedResult = async (req, res) => {
    try {
        const shareableLink = req.params.shareableLink;

        const result = await Result.getSharedResult(shareableLink);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get shared result error:', error);

        if (error.message === 'Result not found or expired') {
            return res.status(404).json({
                success: false,
                error: 'Result not found or has expired'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to get shared result'
        });
    }
};

// @desc    Share a result (make it public)
// @route   POST /api/results/:id/share
// @access  Private
export const shareResult = async (req, res) => {
    try {
        const userId = req.user.userId;
        const resultId = req.params.id;

        const result = await Result.findOneAndUpdate(
            { _id: resultId, user: userId, isActive: true },
            {
                isPublic: true,
                sharedAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            },
            { new: true, runValidators: true }
        )
        .populate('interview', 'title role company');

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Result not found'
            });
        }

        res.json({
            success: true,
            data: {
                ...result.toObject(),
                shareUrl: `${req.protocol}://${req.get('host')}/shared/${result.shareableLink}`
            }
        });

    } catch (error) {
        console.error('Share result error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to share result'
        });
    }
};
