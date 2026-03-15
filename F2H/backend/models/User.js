import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // ADD THIS IMPORT

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    jobTitle: String,
    industry: String,
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: Date,
    refreshToken: String,
    
    // Preferences
    preferences: {
        emailNotifications: { type: Boolean, default: true },
        practiceReminders: { type: Boolean, default: true },
        achievementNotifications: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: true },
        newFeatures: { type: Boolean, default: true },
        emailFrequency: {
            type: String,
            enum: ['immediate', 'daily', 'weekly'],
            default: 'immediate'
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'light'
        },
        language: { type: String, default: 'en' },
        interviewSettings: {
            preferredAvatar: { type: String, default: 'female-1' },
            defaultInterviewType: {
                type: String,
                enum: ['role-based', 'job-description', 'quick-practice'],
                default: 'role-based'
            },
            responseTimeLimit: { type: Number, default: 120 },
            difficulty: {
                type: String,
                enum: ['entry', 'mid', 'senior', 'executive'],
                default: 'mid'
            },
            enableVoiceRecognition: { type: Boolean, default: true },
            realtimeFeedback: { type: Boolean, default: true },
            autoSaveResponses: { type: Boolean, default: true }
        }
    },
    
    // Privacy settings
    privacySettings: {
        anonymousAnalytics: { type: Boolean, default: true },
        interviewRecording: { type: Boolean, default: true }
    },
    
    // Stats (embedded from your schema)
    stats: {
        totalInterviews: { type: Number, default: 0 },
        completedInterviews: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        bestScore: { type: Number, default: 0 },
        totalPracticeTime: { type: Number, default: 0 }, // in seconds
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        lastPracticeDate: Date,
        communicationHighScores: { type: Number, default: 0 },
        technicalHighScores: { type: Number, default: 0 },
        fastInterviews: { type: Number, default: 0 },
        shares: { type: Number, default: 0 }
    },
    
    // Experience
    experience: {
        level: {
            type: String,
            enum: ['entry', 'junior', 'mid', 'senior', 'expert'],
            default: 'mid'
        },
        years: { type: Number, default: 3 }
    },
    
    // Achievements (embedded from your schema)
    achievements: [{
        achievementId: String,
        title: String,
        description: String,
        unlockedAt: Date,
        progress: { type: Number, default: 0 },
        target: Number,
        category: String
    }],
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_SECRET || 'face2hire-secret-key-2024',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_REFRESH_SECRET || 'face2hire-refresh-secret-2024-change-this',
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
};

// Update user stats after interview
userSchema.methods.updateInterviewStats = function(score, duration) {
    this.stats.totalInterviews += 1;
    this.stats.completedInterviews += 1;
    this.stats.totalPracticeTime += duration;
    
    // Update average score
    const currentTotal = this.stats.averageScore * (this.stats.completedInterviews - 1);
    this.stats.averageScore = Math.round((currentTotal + score) / this.stats.completedInterviews);
    
    // Update best score
    if (score > this.stats.bestScore) {
        this.stats.bestScore = score;
    }
    
    // Update streak (simplified logic)
    const today = new Date().toDateString();
    const lastPractice = this.stats.lastPracticeDate ? 
        new Date(this.stats.lastPracticeDate).toDateString() : null;
    
    if (lastPractice === today) {
        // Already practiced today, no streak change
    } else if (lastPractice && 
               (new Date(today) - new Date(lastPractice)) / (1000 * 60 * 60 * 24) === 1) {
        // Consecutive day
        this.stats.currentStreak += 1;
        if (this.stats.currentStreak > this.stats.longestStreak) {
            this.stats.longestStreak = this.stats.currentStreak;
        }
    } else {
        // Streak broken or first practice
        this.stats.currentStreak = 1;
    }
    
    this.stats.lastPracticeDate = new Date();
    
    return this.save();
};

export default mongoose.model('User', userSchema);