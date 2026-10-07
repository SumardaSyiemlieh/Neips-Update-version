const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const formRoutes = require('./routes/formRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 1. Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'neips-secret-' + Date.now(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Auto HTTPS in production
        httpOnly: true, // Prevents XSS attacks
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

// 2. Other middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// 3. API Routes (unprotected login/register should work)
app.use('/api', formRoutes);
app.use('/api/admin', adminRoutes);

// 4. MANUAL PAGE PROTECTION for specific routes
app.get('/admin/*', (req, res, next) => {
    console.log('🔒 Checking admin access for:', req.path);

    if (!req.session.user) {
        console.log('❌ No user session');
        return res.redirect('/login.html');
    }

    if (req.session.user.role !== 'admin') {
        console.log('❌ Not admin, role is:', req.session.user.role);
        return res.status(403).send(`
            <h1>Access Denied</h1>
            <p>Admin privileges required</p>
            <a href="/student/student.html">Go to Your Dashboard</a>
        `);
    }

    console.log('✅ Admin access granted');
    next();
});

app.get('/staff/*', (req, res, next) => {
    console.log('🔒 Checking staff access for:', req.path);

    if (!req.session.user) {
        return res.redirect('/login.html');
    }

    if (!['staff', 'admin'].includes(req.session.user.role)) {
        return res.status(403).send(`
            <h1>Access Denied</h1>
            <p>Staff privileges required</p>
            <a href="/student/student.html">Go to Your Dashboard</a>
        `);
    }

    next();
});

// 5. Serve static files (this will use the protection above)
app.use(express.static(path.join(__dirname, '../../frontend')));

// 6. Health check
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server running', status: 'active' });
});

// 7. Catch-all route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

module.exports = app;