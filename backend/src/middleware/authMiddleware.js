// authMiddleware.js - UPDATED VERSION
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Please login first'
        });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Please login first'
        });
    }

    if (req.session.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access Denied: Admin privileges required'
        });
    }
    next();
}

function requireStaff(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Please login first'
        });
    }

    if (req.session.user.role !== 'staff' && req.session.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access Denied: Staff privileges required'
        });
    }
    next();
}

module.exports = { requireAuth, requireAdmin, requireStaff };