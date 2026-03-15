// AuthService - Handles authentication state and API communication
function AuthService() {
    this.baseURL = 'http://localhost:5000/api';
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
    this.refreshPromise = null;

    // Initialize from localStorage
    this.loadFromStorage();
}

// Load authentication data from localStorage
AuthService.prototype.loadFromStorage = function() {
    try {
        const token = localStorage.getItem('accessToken');
        const user = localStorage.getItem('user');

        if (token && user) {
            this.token = token;
            this.user = JSON.parse(user);
            this.isAuthenticated = true;
        }
    } catch (error) {
        console.error('Error loading auth data from storage:', error);
        this.clearStorage();
    }
};

// Save authentication data to localStorage
AuthService.prototype.saveToStorage = function() {
    try {
        if (this.token && this.user) {
            localStorage.setItem('accessToken', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));
        }
    } catch (error) {
        console.error('Error saving auth data to storage:', error);
    }
};

// Clear authentication data from storage
AuthService.prototype.clearStorage = function() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;
};

// Get stored token
AuthService.prototype.getToken = function() {
    return this.token;
};

// Get stored user
AuthService.prototype.getUser = function() {
    return this.user;
};

// Check if user is authenticated
AuthService.prototype.isAuth = function() {
    return this.isAuthenticated && !!this.token;
};

// Set authentication data
AuthService.prototype.setAuth = function(token, user) {
    this.token = token;
    this.user = user;
    this.isAuthenticated = true;
    this.saveToStorage();
};

// Clear authentication
AuthService.prototype.logout = function() {
    this.clearStorage();
    window.location.href = 'login.html';
};

// Require authentication - redirect to login if not authenticated
AuthService.prototype.requireAuth = async function() {
    if (this.isAuth()) {
        // Verify token is still valid
        try {
            const response = await this.checkAuth();
            if (response.authenticated) {
                return true;
            }
        } catch (error) {
            console.warn('Token verification failed:', error);
        }
    }

    // Not authenticated or token invalid
    this.logout();
    return false;
};

// Login user
AuthService.prototype.login = async function(email, password, rememberMe = false) {
    try {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, rememberMe }),
            credentials: 'include'
        });

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            // Handle non-JSON responses (like rate limiting errors)
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store auth data
        this.setAuth(data.accessToken, data.user);

        return { success: true, data };
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// Register user
AuthService.prototype.register = async function(userData) {
    try {
        const response = await fetch(`${this.baseURL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
            credentials: 'include'
        });

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            // Handle non-JSON responses (like rate limiting errors)
            const text = await response.text();
            throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        // Store auth data
        this.setAuth(data.accessToken, data.user);

        return { success: true, data };
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

// Refresh access token
AuthService.prototype.refreshToken = async function() {
    if (this.refreshPromise) {
        return this.refreshPromise;
    }

    this.refreshPromise = this._refreshToken();

    try {
        const result = await this.refreshPromise;
        return result;
    } finally {
        this.refreshPromise = null;
    }
};

AuthService.prototype._refreshToken = async function() {
    try {
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Token refresh failed');
        }

        // Update token
        this.token = data.accessToken;
        this.saveToStorage();

        return { success: true, token: data.accessToken };
    } catch (error) {
        console.error('Token refresh error:', error);
        this.logout();
        throw error;
    }
};

// Check authentication status
AuthService.prototype.checkAuth = async function() {
    try {
        const response = await fetch(`${this.baseURL}/auth/check`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': this.token ? `Bearer ${this.token}` : undefined,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success && data.authenticated) {
            // Update user data if provided
            if (data.user) {
                this.user = data.user;
                this.saveToStorage();
            }
            return { authenticated: true, user: data.user };
        } else {
            return { authenticated: false, message: data.message };
        }
    } catch (error) {
        console.error('Auth check error:', error);
        return { authenticated: false, message: 'Network error' };
    }
};

// Get current user profile
AuthService.prototype.getCurrentUser = async function() {
    try {
        const response = await fetch(`${this.baseURL}/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get user data');
        }

        // Update stored user data
        this.user = data.user;
        this.saveToStorage();

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Get current user error:', error);
        throw error;
    }
};

// Update user profile
AuthService.prototype.updateProfile = async function(userData) {
    try {
        const response = await fetch(`${this.baseURL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile');
        }

        // Update stored user data
        this.user = { ...this.user, ...data.user };
        this.saveToStorage();

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
};

// Get user dashboard data
AuthService.prototype.getDashboardData = async function() {
    try {
        const response = await fetch(`${this.baseURL}/users/dashboard`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get dashboard data');
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Get dashboard data error:', error);
        throw error;
    }
};

// Get user profile data
AuthService.prototype.getProfileData = async function() {
    try {
        const response = await fetch(`${this.baseURL}/users/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get profile data');
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Get profile data error:', error);
        throw error;
    }
};

// Get user achievements
AuthService.prototype.getAchievements = async function() {
    try {
        const response = await fetch(`${this.baseURL}/users/achievements`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get achievements');
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Get achievements error:', error);
        throw error;
    }
};

// Update user preferences
AuthService.prototype.updatePreferences = async function(preferences) {
    try {
        const response = await fetch(`${this.baseURL}/users/preferences`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferences),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update preferences');
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Update preferences error:', error);
        throw error;
    }
};

// Update privacy settings
AuthService.prototype.updatePrivacySettings = async function(settings) {
    try {
        const response = await fetch(`${this.baseURL}/users/privacy`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update privacy settings');
        }

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Update privacy settings error:', error);
        throw error;
    }
};

// Delete user account
AuthService.prototype.deleteAccount = async function(password) {
    try {
        const response = await fetch(`${this.baseURL}/users/account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password }),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete account');
        }

        // Clear local data after successful deletion
        this.clearStorage();

        return { success: true, data: data.data };
    } catch (error) {
        console.error('Delete account error:', error);
        throw error;
    }
};

// Check email availability
AuthService.prototype.checkEmail = async function(email) {
    try {
        const response = await fetch(`${this.baseURL}/auth/check-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email }),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to check email');
        }

        return { success: true, available: data.available };
    } catch (error) {
        console.error('Check email error:', error);
        throw error;
    }
};

// Make authenticated API request with automatic token refresh
AuthService.prototype.authenticatedRequest = async function(url, options = {}) {
    const makeRequest = async (token) => {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return fetch(url, {
            ...options,
            headers,
            credentials: 'include'
        });
    };

    try {
        // First attempt with current token
        let response = await makeRequest(this.token);

        // If unauthorized, try to refresh token
        if (response.status === 401) {
            try {
                await this.refreshToken();
                response = await makeRequest(this.token);
            } catch (refreshError) {
                // Refresh failed, logout
                this.logout();
                throw new Error('Authentication expired');
            }
        }

        return response;
    } catch (error) {
        console.error('Authenticated request error:', error);
        throw error;
    }
};

// Create global instance
window.AuthService = new AuthService();

// Export for ES modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}
