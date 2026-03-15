import User from '../models/User.js';
import mongoose from 'mongoose';
import Interview from '../models/Interview.js';


// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          jobTitle: user.jobTitle,
          industry: user.industry,
          avatar: user.avatar,
          role: user.role,
          experience: user.experience,
          fullName: user.fullName,
          level: user.level,
          xpProgress: user.xpProgress
        },
        stats: user.stats,
        preferences: user.preferences,
        privacySettings: user.privacySettings,
        achievements: user.achievements
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile data'
    });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      jobTitle,
      industry,
      experience
    } = req.body;

    const updateData = {};
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (jobTitle) updateData.jobTitle = jobTitle;
    if (industry) updateData.industry = industry;
    if (experience) updateData.experience = experience;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          jobTitle: user.jobTitle,
          industry: user.industry,
          experience: user.experience,
          fullName: user.fullName
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// Update preferences
export const updatePreferences = async (req, res) => {
  try {
    const {
      emailNotifications,
      practiceReminders,
      achievementNotifications,
      weeklyReports,
      newFeatures,
      emailFrequency,
      theme,
      language,
      interviewSettings
    } = req.body;

    const updateData = { preferences: {} };

    if (emailNotifications !== undefined) updateData.preferences.emailNotifications = emailNotifications;
    if (practiceReminders !== undefined) updateData.preferences.practiceReminders = practiceReminders;
    if (achievementNotifications !== undefined) updateData.preferences.achievementNotifications = achievementNotifications;
    if (weeklyReports !== undefined) updateData.preferences.weeklyReports = weeklyReports;
    if (newFeatures !== undefined) updateData.preferences.newFeatures = newFeatures;
    if (emailFrequency) updateData.preferences.emailFrequency = emailFrequency;
    if (theme) updateData.preferences.theme = theme;
    if (language) updateData.preferences.language = language;
    if (interviewSettings) updateData.preferences.interviewSettings = interviewSettings;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences'
    });
  }
};

// Update privacy settings
export const updatePrivacySettings = async (req, res) => {
  try {
    const {
      anonymousAnalytics,
      interviewRecording
    } = req.body;

    const updateData = { privacySettings: {} };

    if (anonymousAnalytics !== undefined) updateData.privacySettings.anonymousAnalytics = anonymousAnalytics;
    if (interviewRecording !== undefined) updateData.privacySettings.interviewRecording = interviewRecording;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: {
        privacySettings: user.privacySettings
      }
    });

  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating privacy settings'
    });
  }
};

// Update password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    // In production, you would upload to cloud storage
    // For now, we'll accept a URL or base64 string
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        message: 'Avatar URL is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: {
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading avatar'
    });
  }
};

// Delete account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to confirm account deletion'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    // Clear refresh token
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account'
    });
  }
};

// Get achievements
export const getAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Define all possible achievements
    const allAchievements = [
      {
        id: 'first-interview',
        title: 'First Steps',
        description: 'Complete your first practice interview',
        icon: '🏠',
        category: 'milestone',
        target: 1,
        checkFunction: (stats) => stats.totalInterviews >= 1
      },
      {
        id: 'streak-7',
        title: 'Week Warrior',
        description: 'Practice for 7 consecutive days',
        icon: '🔥',
        category: 'streak',
        target: 7,
        checkFunction: (stats) => stats.currentStreak >= 7
      },
      {
        id: 'streak-30',
        title: 'Consistency King',
        description: 'Practice for 30 consecutive days',
        icon: '👑',
        category: 'streak',
        target: 30,
        checkFunction: (stats) => stats.currentStreak >= 30
      },
      {
        id: 'communication-master',
        title: 'Communication Master',
        description: 'Score 90+ in communication 5 times',
        icon: '💬',
        category: 'skill',
        target: 5,
        checkFunction: (stats) => stats.communicationHighScores >= 5
      },
      {
        id: 'perfect-score',
        title: 'Perfect Score',
        description: 'Achieve a perfect 100 in any category',
        icon: '⭐',
        category: 'performance',
        target: 1,
        checkFunction: (stats) => stats.bestScore >= 100
      },
      {
        id: 'interview-pro-10',
        title: 'Interview Pro',
        description: 'Complete 10 practice interviews',
        icon: '🎯',
        category: 'milestone',
        target: 10,
        checkFunction: (stats) => stats.totalInterviews >= 10
      },
      {
        id: 'interview-pro-50',
        title: 'Interview Master',
        description: 'Complete 50 practice interviews',
        icon: '🏆',
        category: 'milestone',
        target: 50,
        checkFunction: (stats) => stats.totalInterviews >= 50
      },
      {
        id: 'speed-demon',
        title: 'Speed Demon',
        description: 'Complete an interview in under 10 minutes',
        icon: '⚡',
        category: 'special',
        target: 1,
        checkFunction: (stats) => stats.fastInterviews >= 1
      },
      {
        id: 'technical-guru',
        title: 'Technical Guru',
        description: 'Score 95+ in technical skills 3 times',
        icon: '🧠',
        category: 'skill',
        target: 3,
        checkFunction: (stats) => stats.technicalHighScores >= 3
      },
      {
        id: 'social-butterfly',
        title: 'Social Butterfly',
        description: 'Share your results on social media',
        icon: '🦋',
        category: 'social',
        target: 1,
        checkFunction: (stats) => stats.shares >= 1
      },
      {
        id: 'practice-hour',
        title: 'Dedicated Learner',
        description: 'Complete 1 hour of total practice time',
        icon: '⏰',
        category: 'time',
        target: 60,
        checkFunction: (stats) => stats.totalPracticeTime >= 60
      },
      {
        id: 'practice-master',
        title: 'Practice Master',
        description: 'Complete 10 hours of total practice time',
        icon: '📚',
        category: 'time',
        target: 600,
        checkFunction: (stats) => stats.totalPracticeTime >= 600
      }
    ];

    // Check and update achievements
    const updatedAchievements = allAchievements.map(achievement => {
      const userAchievement = user.achievements.find(a => a.achievementId === achievement.id);
      const isUnlocked = achievement.checkFunction(user.stats);
      const progress = achievement.checkFunction(user.stats) ? achievement.target : getProgress(user, achievement);
      
      return {
        ...achievement,
        unlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlockedAt,
        progress,
        target: achievement.target
      };
    });

    res.json({
      success: true,
      data: {
        achievements: updatedAchievements
      }
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements'
    });
  }
};

// Helper function to calculate progress
function getProgress(user, achievement) {
  switch (achievement.id) {
    case 'first-interview':
    case 'interview-pro-10':
    case 'interview-pro-50':
      return user.stats.totalInterviews;
    case 'streak-7':
    case 'streak-30':
      return user.stats.currentStreak;
    case 'practice-hour':
    case 'practice-master':
      return user.stats.totalPracticeTime;
    default:
      return 0;
  }
}

// Get dashboard data with charts (last 7 days)
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Aggregate completed interviews last 7 days
    const Interview = mongoose.model('Interview');
    const interviewStats = await Interview.aggregate([

      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          'metadata.completedAt': { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$metadata.completedAt" }
          },
          overallAvg: { $avg: "$scores.overall" },
          communicationAvg: { $avg: "$scores.communication" },
          contentAvg: { $avg: "$scores.content" },
          confidenceAvg: { $avg: "$scores.confidence" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Generate all 7 days dates
    const dates = [];
    const sevenDaysFromNow = new Date(sevenDaysAgo);
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysFromNow);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Map data
    const performanceData = {
      dates,
      overall: dates.map(date => {
        const stat = interviewStats.find(s => s._id === date);
        return stat ? Math.round(stat.overallAvg) : 0;
      }),
      communication: dates.map(date => {
        const stat = interviewStats.find(s => s._id === date);
        return stat ? Math.round(stat.communicationAvg) : 0;
      }),
      content: dates.map(date => {
        const stat = interviewStats.find(s => s._id === date);
        return stat ? Math.round(stat.contentAvg) : 0;
      }),
      confidence: dates.map(date => {
        const stat = interviewStats.find(s => s._id === date);
        return stat ? Math.round(stat.confidenceAvg) : 0;
      })
    };

    // Demo data if no real data (bit of demo, non-altering)
    const hasData = interviewStats.some(stat => stat.count > 0);
    if (!hasData) {
      // Demo: ramping scores last 7 days
      performanceData.overall = [65, 72, 78, 82, 85, 88, 90];
      performanceData.communication = [70, 75, 80, 83, 86, 89, 92];
      performanceData.content = [62, 70, 76, 81, 84, 87, 89];
      performanceData.confidence = [68, 73, 78, 82, 85, 88, 91];
    }

    // Recent activity (last 5 completed)
    const recentInterviews = await Interview.find({

      user: userId,
      status: 'completed'
    }).populate('questions.questionId', 'text').sort({ 'metadata.completedAt': -1 }).limit(5);

    const recentActivity = recentInterviews.map(interview => ({
      title: interview.title,
      role: interview.role,
      score: interview.scores.overall,
      time: interview.metadata.totalDuration ? Math.round(interview.metadata.totalDuration / 60) + 'm' : 'N/A',
      date: interview.metadata.completedAt.toLocaleDateString()
    }));

    // User basic stats
    const user = await User.findById(userId);
    const stats = user.stats || {};

    // Compute achievements (like getAchievements)
    const allAchievements = [
      {
        id: 'first-interview',
        title: 'First Steps',
        description: 'Complete your first practice interview',
        category: 'milestone',
        target: 1,
        unlocked: stats.totalInterviews >= 1
      },
      {
        id: 'week-streak',
        title: 'Week Warrior',
        description: '7 day streak',
        category: 'streak',
        target: 7,
        unlocked: (stats.currentStreak || 0) >= 7
      },
      {
        id: 'pro-interviewer',
        title: 'Interview Pro',
        description: '10+ interviews',
        category: 'milestone',
        target: 10,
        unlocked: stats.totalInterviews >= 10
      }
      // Add more as needed
    ];

    res.json({
      success: true,
      data: {
        stats,
        performanceData,
        recentActivity,
        achievements: allAchievements
      }
    });
  } catch (error) {

    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

