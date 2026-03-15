// controllers/userController.js
import User from '../models/User.js';
import Interview from '../models/Interview.js';

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
export const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get user with stats
        const user = await User.findById(userId)
            .select('-password')
            .lean();
        
        // Get recent interviews
        const recentInterviews = await Interview.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        
        // Calculate stats
        const totalInterviews = await Interview.countDocuments({ user: userId });
        const completedInterviews = await Interview.countDocuments({ 
            user: userId, 
            status: 'completed' 
        });
        
        // Get average scores
        const scoreAggregation = await Interview.aggregate([
            { $match: { user: userId, status: 'completed' } },
            { 
                $group: {
                    _id: null,
                    avgCommunication: { $avg: '$scores.communication' },
                    avgContent: { $avg: '$scores.content' },
                    avgConfidence: { $avg: '$scores.confidence' },
                    totalPracticeTime: { $sum: '$duration' }
                }
            }
        ]);
        
        const stats = scoreAggregation[0] || {
            avgCommunication: 0,
            avgContent: 0,
            avgConfidence: 0,
            totalPracticeTime: 0
        };
        
        // Calculate overall average
        const overallAvg = Math.round(
            (stats.avgCommunication + stats.avgContent + stats.avgConfidence) / 3
        );
        
        // Get achievements
        const achievements = calculateAchievements(user, totalInterviews, overallAvg);
        
        res.json({
            success: true,
            data: {
                user,
                stats: {
                    totalInterviews,
                    completedInterviews,
                    averageScore: overallAvg,
                    practiceTime: Math.round(stats.totalPracticeTime / 60), // Convert to minutes
                    improvement: calculateImprovement(userId),
                    dayStreak: user.dayStreak || 0,
                    achievementsCount: achievements.length
                },
                recentActivity: recentInterviews.map(interview => ({
                    type: 'interview',
                    title: `${interview.role} Interview`,
                    score: interview.overallScore || 0,
                    time: formatTimeAgo(interview.createdAt),
                    description: `Completed ${interview.role} practice`
                })),
                achievements,
                recommendedPractice: getRecommendedPractice(stats),
                performanceData: getPerformanceTrend(userId)
            }
        });
        
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load dashboard data'
        });
    }
};

// Helper functions
function calculateAchievements(user, totalInterviews, averageScore) {
    const achievements = [];
    
    if (totalInterviews >= 1) {
        achievements.push({
            name: 'First Interview',
            description: 'Completed your first practice interview',
            colorClass: 'bg-blue-100',
            iconColorClass: 'text-blue-600'
        });
    }
    
    if (totalInterviews >= 5) {
        achievements.push({
            name: 'Consistent Learner',
            description: 'Completed 5 practice interviews',
            colorClass: 'bg-green-100',
            iconColorClass: 'text-green-600'
        });
    }
    
    if (averageScore >= 80) {
        achievements.push({
            name: 'High Performer',
            description: 'Average score above 80',
            colorClass: 'bg-purple-100',
            iconColorClass: 'text-purple-600'
        });
    }
    
    if (user.dayStreak >= 3) {
        achievements.push({
            name: 'Streak Starter',
            description: 'Practiced for 3 consecutive days',
            colorClass: 'bg-orange-100',
            iconColorClass: 'text-orange-600'
        });
    }
    
    return achievements.slice(0, 6); // Limit to 6 achievements
}

function calculateImprovement(userId) {
    // Simplified - in production, compare with previous period
    return Math.floor(Math.random() * 20) + 5; // 5-25% improvement
}

function getRecommendedPractice(stats) {
    const areas = [];
    
    if (stats.avgCommunication < 70) {
        areas.push({
            title: 'Communication Skills',
            description: 'Focus on clarity and structure in your responses',
            iconBgColor: 'bg-blue-100',
            iconColor: 'text-blue-600',
            tag: 'Focus Area',
            currentScore: Math.round(stats.avgCommunication),
            targetScore: 80
        });
    }
    
    if (stats.avgContent < 70) {
        areas.push({
            title: 'Technical Knowledge',
            description: 'Improve depth and accuracy of your answers',
            iconBgColor: 'bg-purple-100',
            iconColor: 'text-purple-600',
            tag: 'Knowledge',
            currentScore: Math.round(stats.avgContent),
            targetScore: 85
        });
    }
    
    if (stats.avgConfidence < 70) {
        areas.push({
            title: 'Confidence Building',
            description: 'Work on delivery and body language',
            iconBgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            tag: 'Delivery',
            currentScore: Math.round(stats.avgConfidence),
            targetScore: 80
        });
    }
    
    // Fill with default recommendations if needed
    while (areas.length < 3) {
        areas.push({
            title: 'Behavioral Questions',
            description: 'Practice STAR method responses',
            iconBgColor: 'bg-orange-100',
            iconColor: 'text-orange-600',
            tag: 'Practice',
            currentScore: 'N/A',
            targetScore: 85
        });
    }
    
    return areas;
}

function getPerformanceTrend(userId) {
    // Simplified - in production, fetch actual historical data
    return {
        dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        technical: [65, 70, 75, 72, 78, 80, 82],
        behavioral: [75, 78, 82, 85, 88, 90, 91],
        communication: [70, 75, 78, 82, 85, 87, 88],
        overall: [70, 74, 78, 80, 84, 86, 87]
    };
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}