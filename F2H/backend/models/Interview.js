import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for interview']
  },
  title: {
    type: String,
    required: [true, 'Interview title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  type: {
    type: String,
    enum: ['ai-generated', 'jd-based', 'custom'],
    default: 'ai-generated',
    required: true
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  jobDescription: {
    originalFile: {
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      path: String
    },
    extractedText: {
      type: String,
      maxlength: [10000, 'Job description text cannot exceed 10,000 characters']
    },
    requirements: [{
      type: String,
      trim: true
    }],
    skills: [{
      type: String,
      trim: true
    }]
  },
  settings: {
    avatar: {
      type: String,
      enum: ['female-1', 'male-1', 'diverse-1'],
      default: 'female-1'
    },
    voiceEnabled: {
      type: Boolean,
      default: true
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    questionCount: {
      type: Number,
      min: 1,
      max: 20,
      default: 5
    },
    timeLimit: {
      type: Number, // in minutes, 0 means no limit
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'abandoned'],
    default: 'scheduled'
  },
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    text: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['introduction', 'experience', 'technical', 'behavioral', 'situational', 'motivation', 'future-goals'],
      required: true
    },
    category: {
      type: String,
      enum: ['personal', 'company-fit', 'behavioral', 'technical', 'career'],
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    askedAt: {
      type: Date
    }
  }],
  responses: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    response: {
      text: {
        type: String,
        required: true
      },
      audioFile: {
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        path: String,
        duration: Number // in seconds
      },
      transcript: {
        raw: String,
        cleaned: String
      }
    },
    metrics: {
      delivery: {
        pace: { type: Number, min: 0, max: 200 }, // words per minute
        fillers: { type: Number, min: 0 }, // filler word count
        clarity: { type: Number, min: 0, max: 100 }, // clarity score
        energy: { type: Number, min: 0, max: 100 }, // energy level
        volume: { type: Number, min: 0, max: 100 }, // volume level
        pitch: { type: Number, min: 0, max: 500 } // pitch in Hz
      },
      content: {
        relevance: { type: Number, min: 0, max: 100 },
        completeness: { type: Number, min: 0, max: 100 },
        structure: { type: Number, min: 0, max: 100 }
      },
      aiAnalysis: {
        feedback: String,
        suggestions: [String],
        score: { type: Number, min: 0, max: 100 }
      }
    },
    scores: {
      communication: { type: Number, min: 0, max: 100 },
      content: { type: Number, min: 0, max: 100 },
      confidence: { type: Number, min: 0, max: 100 },
      overall: { type: Number, min: 0, max: 100 }
    },
    respondedAt: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number, // in seconds
      min: 0
    }
  }],
  scores: {
    communication: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    content: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    overall: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  feedback: {
    summary: {
      type: String,
      maxlength: [1000, 'Summary cannot exceed 1000 characters']
    },
    strengths: [{
      type: String,
      trim: true
    }],
    improvements: [{
      type: String,
      trim: true
    }],
    recommendations: [{
      type: String,
      trim: true
    }]
  },
  metadata: {
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    totalDuration: {
      type: Number, // in seconds
      min: 0
    },
    pauses: [{
      startedAt: Date,
      endedAt: Date,
      duration: Number // in seconds
    }],
    browserInfo: {
      userAgent: String,
      language: String,
      platform: String
    },
    ipAddress: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
interviewSchema.index({ user: 1, status: 1 });
interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ status: 1, createdAt: -1 });
interviewSchema.index({ 'scores.overall': -1 });
interviewSchema.index({ role: 1 });

// Virtual for completion percentage
interviewSchema.virtual('completionPercentage').get(function() {
  if (this.questions.length === 0) return 0;
  const answeredQuestions = this.responses.length;
  return Math.round((answeredQuestions / this.questions.length) * 100);
});

// Virtual for average response time
interviewSchema.virtual('averageResponseTime').get(function() {
  if (this.responses.length === 0) return 0;
  const totalTime = this.responses.reduce((sum, response) => sum + (response.duration || 0), 0);
  return Math.round(totalTime / this.responses.length);
});

// Pre-save middleware to calculate overall score
interviewSchema.pre('save', function(next) {
  if (this.responses && this.responses.length > 0) {
    // Calculate average scores from responses
    const avgCommunication = this.responses.reduce((sum, r) => sum + (r.scores.communication || 0), 0) / this.responses.length;
    const avgContent = this.responses.reduce((sum, r) => sum + (r.scores.content || 0), 0) / this.responses.length;
    const avgConfidence = this.responses.reduce((sum, r) => sum + (r.scores.confidence || 0), 0) / this.responses.length;

    this.scores.communication = Math.round(avgCommunication);
    this.scores.content = Math.round(avgContent);
    this.scores.confidence = Math.round(avgConfidence);
    this.scores.overall = Math.round((avgCommunication + avgContent + avgConfidence) / 3);
  }

  // Update completion status
  if (this.status === 'in-progress' && this.completionPercentage === 100) {
    this.status = 'completed';
    this.metadata.completedAt = new Date();
    if (this.metadata.startedAt) {
      this.metadata.totalDuration = Math.round((this.metadata.completedAt - this.metadata.startedAt) / 1000);
    }
  }

  next();
});

// Static method to get user's interview statistics
interviewSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalInterviews: { $sum: 1 },
        averageScore: { $avg: '$scores.overall' },
        bestScore: { $max: '$scores.overall' },
        totalTime: { $sum: '$metadata.totalDuration' },
        recentScores: {
          $push: {
            score: '$scores.overall',
            date: '$completedAt'
          }
        }
      }
    },
    {
      $project: {
        totalInterviews: 1,
        averageScore: { $round: ['$averageScore', 1] },
        bestScore: 1,
        totalTime: 1,
        recentScores: { $slice: ['$recentScores', -10] } // Last 10 interviews
      }
    }
  ]);

  return stats[0] || {
    totalInterviews: 0,
    averageScore: 0,
    bestScore: 0,
    totalTime: 0,
    recentScores: []
  };
};

export default mongoose.model('Interview', interviewSchema);
