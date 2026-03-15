import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for result']
  },
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: [true, 'Interview is required for result']
  },
  title: {
    type: String,
    required: [true, 'Result title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
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
  scores: {
    communication: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    content: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    overall: {
      type: Number,
      min: 0,
      max: 100,
      required: true
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
  metrics: {
    totalQuestions: {
      type: Number,
      min: 0,
      default: 0
    },
    answeredQuestions: {
      type: Number,
      min: 0,
      default: 0
    },
    averageResponseTime: {
      type: Number, // in seconds
      min: 0
    },
    totalDuration: {
      type: Number, // in seconds
      min: 0
    }
  },
  responses: [{
    question: {
      text: String,
      type: String,
      category: String
    },
    response: {
      text: String,
      transcript: String
    },
    scores: {
      communication: Number,
      content: Number,
      confidence: Number,
      overall: Number
    },
    metrics: {
      duration: Number,
      pace: Number,
      fillers: Number,
      clarity: Number
    },
    feedback: String
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  shareableLink: {
    type: String,
    unique: true,
    sparse: true
  },
  sharedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
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
resultSchema.index({ user: 1, createdAt: -1 });
resultSchema.index({ interview: 1 });
resultSchema.index({ shareableLink: 1 });
resultSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for completion percentage
resultSchema.virtual('completionPercentage').get(function() {
  if (this.metrics.totalQuestions === 0) return 0;
  return Math.round((this.metrics.answeredQuestions / this.metrics.totalQuestions) * 100);
});

// Pre-save middleware to generate shareable link when shared
resultSchema.pre('save', function(next) {
  if (this.isPublic && !this.shareableLink) {
    // Generate a unique shareable link
    this.shareableLink = generateShareableLink();
    this.sharedAt = new Date();

    // Set expiration to 30 days from now
    this.expiresAt = new Date();
    this.expiresAt.setDate(this.expiresAt.getDate() + 30);
  }

  next();
});

// Helper function to generate shareable link
function generateShareableLink() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Static method to get user's results
resultSchema.statics.getUserResults = async function(userId, limit = 10) {
  return this.find({ user: userId, isActive: true })
    .populate('interview', 'title role company')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get result by shareable link
resultSchema.statics.getSharedResult = async function(shareableLink) {
  const result = await this.findOne({
    shareableLink,
    isPublic: true,
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
  .populate('user', 'name email')
  .populate('interview', 'title role company settings')
  .lean();

  if (!result) {
    throw new Error('Result not found or expired');
  }

  return result;
};

export default mongoose.model('Result', resultSchema);
