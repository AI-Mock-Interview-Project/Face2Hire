
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interviews.js';
import userRoutes from './routes/users.js';
import questionRoutes from './routes/questions.js';
import uploadRoutes from './routes/upload.js';
import resultRoutes from './routes/results.js';
import profileRoutes from './routes/profile.js';
import express from 'express';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use(cookieParser());

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:5000', 'http://127.0.0.1:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
  maxAge: 86400 // 24 hours
}));
// Apply rate limiting to API routes
app.use('/api/', limiter);

// Body parser - only once
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the Face2Hire directory
app.use(express.static('../Face2Hire'));

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/face2hire';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      dbName: process.env.DB_NAME || 'face2hire',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Basic route
app.get('/', (req, res) => {
    console.log('Cookies received:', req.cookies); // Debug
    res.json({ 
        message: 'Face2Hire API Server',
        version: '1.0.0',
        status: 'running',
        cookiesEnabled: !!req.cookies,
        endpoints: {
            auth: '/api/auth/*',
            interviews: '/api/interviews/*',
            users: '/api/users/*',
            questions: '/api/questions/*',
            upload: '/api/upload/*',
            results: '/api/results/*',
            profile: '/api/profile/*'
        },
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Cookie test endpoint
app.get('/api/test-cookie', (req, res) => {
    console.log('Test endpoint - Cookies:', req.cookies);
    console.log('Test endpoint - Headers:', req.headers);
    
    // Set a test cookie
    res.cookie('testCookie', 'working_' + Date.now(), {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 // 1 hour
    });
    
    res.json({
        success: true,
        message: 'Cookie test',
        cookies: req.cookies,
        hasAccessToken: !!req.cookies.accessToken,
        headers: req.headers
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// API key endpoint for frontend
app.get('/api-key', (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            return res.status(404).json({ error: 'API key not configured' });
        }
        res.json({ apiKey });
    } catch (error) {
        console.error('Error serving API key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/profile', profileRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('🚨 Error:', err.message);
    
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
        timestamp: new Date().toISOString()
    });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API: http://localhost:${PORT}`);
        console.log(`🍪 Cookie test: http://localhost:${PORT}/api/test-cookie`);
        console.log(`💾 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();
