import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [500, 'Question text cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: [
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
    ],
    required: [true, 'Question type is required']
  },
  category: {
    type: String,
    enum: [
      'personal',
      'company-fit',
      'behavioral',
      'technical',
      'career',
      'leadership',
      'problem-solving',
      'industry-specific'
    ],
    required: [true, 'Question category is required']
  },
  role: {
    type: String,
    required: [true, 'Target role is required'],
    trim: true,
    lowercase: true
  },
  company: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true,
    enum: [
      'technology',
      'finance',
      'healthcare',
      'education',
      'retail',
      'manufacturing',
      'consulting',
      'marketing',
      'hr',
      'legal',
      'general'
    ]
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    estimatedTime: {
      type: Number, // in seconds
      min: 30,
      max: 600,
      default: 120
    },
    expectedLength: {
      type: String,
      enum: ['brief', 'moderate', 'detailed'],
      default: 'moderate'
    },
    keyPoints: [{
      type: String,
      trim: true,
      maxlength: [200, 'Key point cannot exceed 200 characters']
    }],
    commonPitfalls: [{
      type: String,
      trim: true,
      maxlength: [200, 'Pitfall description cannot exceed 200 characters']
    }],
    sampleAnswer: {
      type: String,
      maxlength: [2000, 'Sample answer cannot exceed 2000 characters']
    }
  },
  aiPrompts: {
    evaluation: {
      type: String,
      maxlength: [1000, 'AI evaluation prompt cannot exceed 1000 characters']
    },
    feedback: {
      type: String,
      maxlength: [1000, 'AI feedback prompt cannot exceed 1000 characters']
    },
    followUp: {
      type: String,
      maxlength: [500, 'AI follow-up prompt cannot exceed 500 characters']
    }
  },
  usage: {
    timesAsked: {
      type: Number,
      default: 0,
      min: 0
    },
    averageScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    successRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastUsed: {
      type: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
questionSchema.index({ role: 1, type: 1, difficulty: 1 });
questionSchema.index({ category: 1, isActive: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ 'usage.timesAsked': -1 });
questionSchema.index({ createdAt: -1 });

// Virtual for full question info
questionSchema.virtual('fullInfo').get(function() {
  return {
    id: this._id,
    text: this.text,
    type: this.type,
    category: this.category,
    role: this.role,
    difficulty: this.difficulty,
    tags: this.tags,
    estimatedTime: this.metadata.estimatedTime,
    expectedLength: this.metadata.expectedLength
  };
});

// Pre-save middleware to update usage statistics
questionSchema.pre('save', function(next) {
  if (this.isModified('usage.timesAsked') || this.isModified('usage.averageScore')) {
    // Recalculate success rate based on average score
    // Assuming scores above 70 are considered successful
    this.usage.successRate = this.usage.averageScore >= 70 ? Math.min(100, this.usage.averageScore) : Math.max(0, this.usage.averageScore - 30);
  }
  next();
});

// Static method to get questions by role and criteria
questionSchema.statics.getQuestionsByCriteria = function(criteria) {
  const query = {
    isActive: true,
    role: criteria.role
  };

  if (criteria.type) query.type = criteria.type;
  if (criteria.category) query.category = criteria.category;
  if (criteria.difficulty) query.difficulty = criteria.difficulty;
  if (criteria.tags && criteria.tags.length > 0) {
    query.tags = { $in: criteria.tags };
  }

  return this.find(query)
    .sort({ 'usage.timesAsked': 1, createdAt: -1 }) // Prefer less-used questions
    .limit(criteria.limit || 10);
};

// Static method to get random questions for practice
questionSchema.statics.getRandomQuestions = function(options = {}) {
  const pipeline = [
    { $match: { isActive: true } },
    { $sample: { size: options.limit || 5 } }
  ];

  if (options.role) {
    pipeline[0].$match.role = options.role;
  }

  if (options.difficulty) {
    pipeline[0].$match.difficulty = options.difficulty;
  }

  if (options.excludeIds && options.excludeIds.length > 0) {
    pipeline[0].$match._id = { $nin: options.excludeIds };
  }

  return this.aggregate(pipeline);
};

// Static method to update question usage statistics
questionSchema.statics.updateUsageStats = async function(questionId, score) {
  const question = await this.findById(questionId);
  if (!question) return;

  const currentTimes = question.usage.timesAsked;
  const currentAvg = question.usage.averageScore;

  // Calculate new average score
  const newAverage = ((currentAvg * currentTimes) + score) / (currentTimes + 1);

  await this.findByIdAndUpdate(questionId, {
    $inc: { 'usage.timesAsked': 1 },
    $set: {
      'usage.averageScore': Math.round(newAverage),
      'usage.lastUsed': new Date()
    }
  });
};

// Instance method to get evaluation criteria
questionSchema.methods.getEvaluationCriteria = function() {
  const criteria = {
    type: this.type,
    category: this.category,
    difficulty: this.difficulty,
    estimatedTime: this.metadata.estimatedTime,
    keyPoints: this.metadata.keyPoints,
    commonPitfalls: this.metadata.commonPitfalls
  };

  return criteria;
};

export default mongoose.model('Question', questionSchema);
