const GoogleSheetsService = require('../services/googleSheetsService');

class AuthController {
    async register(req, res) {
        try {
            const { email, password, role, center, firstName, lastName } = req.body;

            console.log('👤 User registration request:', { email, role, center });

            // Validate required fields
            if (!email || !password || !role || !center || !firstName || !lastName) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required: email, password, role, center, firstName, lastName'
                });
            }

            // Validate role
            const validRoles = ['admin', 'staff'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role. Must be admin or staff'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter a valid email address'
                });
            }

            // Register user via Google Sheets
            const result = await GoogleSheetsService.registerUser({
                email,
                password,
                role,
                center,
                firstName,
                lastName
            });

            res.json(result);

        } catch (error) {
            console.error('❌ Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Registration failed: ' + error.message
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password, center } = req.body;

            console.log('🔐 Login attempt:', { email, center });

            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // For staff login, center is required
            if (!center && !email.includes('admin')) {
                return res.status(400).json({
                    success: false,
                    message: 'Center selection is required for staff login'
                });
            }

            // Verify credentials via Google Sheets
            const result = await GoogleSheetsService.verifyUser({
                email,
                password,
                center: center || 'Nongstoin' // Default to HQ for admin
            });

            if (result.success) {
                // Store session info
                req.session.user = {
                    email: result.user.email,
                    role: result.user.role,
                    center: result.user.center,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    loginTime: new Date().toISOString()
                };

                console.log('✅ Login successful for:', result.user.email);
            }

            res.json(result);

        } catch (error) {
            console.error('❌ Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed: ' + error.message
            });
        }
    }

    async logout(req, res) {
        try {
            const userEmail = req.session.user?.email;

            req.session.destroy((err) => {
                if (err) {
                    console.error('❌ Logout error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Logout failed'
                    });
                }

                console.log('✅ User logged out:', userEmail);
                res.json({
                    success: true,
                    message: 'Logged out successfully'
                });
            });

        } catch (error) {
            console.error('❌ Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
    }

    async getProfile(req, res) {
        try {
            if (!req.session.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
            }

            res.json({
                success: true,
                user: req.session.user
            });

        } catch (error) {
            console.error('❌ Profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get profile'
            });
        }
    }

    async checkAuth(req, res) {
        try {
            if (!req.session.user) {
                return res.json({
                    authenticated: false,
                    message: 'Not logged in'
                });
            }

            res.json({
                authenticated: true,
                user: req.session.user
            });

        } catch (error) {
            console.error('❌ Auth check error:', error);
            res.status(500).json({
                authenticated: false,
                message: 'Auth check failed'
            });
        }
    }
}
exports.login = async (req, res) => {
    try {
        const { username, password, userType } = req.body;

        // Your existing login validation logic...
        // ...

        // AFTER successful login, SET THE SESSION:
        req.session.userId = user.id; // or username
        req.session.username = username;
        req.session.userRole = userType; // ← THIS IS CRITICAL: 'admin', 'student', or 'staff'

        res.json({
            success: true,
            message: 'Login successful',
            userType: userType,
            user: {
                id: user.id,
                username: username,
                role: userType
            }
        });

    } catch (error) {
        res.json({
            success: false,
            message: 'Login failed'
        });
    }
};

module.exports = new AuthController();