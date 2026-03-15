import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate tokens
const generateTokens = (user) => {
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();
  
  // Save refresh token to user
  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false });
  
  return { accessToken, refreshToken };
};

// Set cookies helper
const setAuthCookies = (res, accessToken, refreshToken, rememberMe = false) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site in development
    path: '/'
  };
  
  // Access token cookie
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  });
  
  // Refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000 // Always 30 days for refresh token
  });
  
  // Also set a simple auth cookie for frontend detection
  res.cookie('isAuthenticated', 'true', {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

// Register user
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, jobTitle } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      jobTitle: jobTitle || '',
      stats: {
        totalInterviews: 0,
        completedInterviews: 0,
        averageScore: 0,
        bestScore: 0,
        totalPracticeTime: 0,
        currentStreak: 0,
        longestStreak: 0
      }
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Set cookies
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        jobTitle: user.jobTitle,
        fullName: user.fullName,
        stats: user.stats
      },
      accessToken: tokens.accessToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    console.log('Login attempt - Body:', req.body);
    console.log('Login attempt - Cookies:', req.cookies);
    
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const tokens = generateTokens(user);

    // Set cookies
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken, rememberMe);

    console.log('Login successful - Cookies set for user:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        jobTitle: user.jobTitle,
        fullName: user.fullName,
        avatar: user.avatar,
        stats: user.stats || {}
      },
      accessToken: tokens.accessToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (refreshToken) {
      try {
        // Clear refresh token from user document
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'face2hire-refresh-secret-key-2024');
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      } catch (error) {
        console.log('Could not clear refresh token:', error.message);
      }
    }

    // Clear all auth cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('isAuthenticated');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    console.log('Get current user - req.user:', req.user);
    console.log('Get current user - Cookies:', req.cookies);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        jobTitle: user.jobTitle,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        profile: user.profile,
        stats: user.stats || {},
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    console.log('Refresh token - Cookies:', req.cookies);
    
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'face2hire-refresh-secret-key-2024'
    );

    const user = await User.findById(decoded.id).select('+refreshToken');
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const newAccessToken = user.generateAuthToken();
    
    // Update access token cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({
      success: true,
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// Check email availability
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    res.json({
      success: true,
      available: !existingUser
    });

  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking email availability'
    });
  }
};

// Check auth status (public endpoint)
export const checkAuth = async (req, res) => {
  try {
    // Check for token in Authorization header first, then cookies
    let accessToken;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }

    // If no header token, check cookies
    if (!accessToken) {
      accessToken = req.cookies.accessToken;
    }

    if (!accessToken) {
      return res.json({
        success: false,
        authenticated: false,
        message: 'No access token'
      });
    }

    try {
      const decoded = jwt.verify(
        accessToken,
        process.env.JWT_SECRET || 'face2hire-secret-key-2024'
      );

      const user = await User.findById(decoded.id);

      if (!user) {
        return res.json({
          success: false,
          authenticated: false,
          message: 'User not found'
        });
      }

      return res.json({
        success: true,
        authenticated: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          fullName: user.fullName
        }
      });

    } catch (error) {
      return res.json({
        success: false,
        authenticated: false,
        message: 'Invalid token'
      });
    }

  } catch (error) {
    console.error('Check auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking authentication'
    });
  }
};
