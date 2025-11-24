// Authentication Middleware
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');

// JWT Authentication Middleware
const authenticateJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }
        
        const token = authHeader.split(' ')[1]; // Bearer <token>
        
        if (!token) {
            return res.status(401).json({ error: 'Invalid token format' });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const result = await executeQuery(
            'SELECT user_id, username, email, full_name, title, profile_picture, is_sso_user FROM users WHERE user_id = @userId AND is_active = 1',
            { userId: decoded.userId }
        );
        
        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }
        
        req.user = result.recordset[0];
        next();
        
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        logger.error('JWT authentication error:', err);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

// Check if user has admin role
const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.user_id) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const result = await executeQuery(
            'SELECT * FROM user_roles WHERE user_id = @userId AND role_name = @roleName',
            { userId: req.user.user_id, roleName: 'admin' }
        );
        
        if (result.recordset.length === 0) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        next();
        
    } catch (err) {
        logger.error('Admin check error:', err);
        return res.status(500).json({ error: 'Authorization check failed' });
    }
};

// Check if user has specific role
const hasRole = (roleName) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.user_id) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            const result = await executeQuery(
                'SELECT * FROM user_roles WHERE user_id = @userId AND role_name = @roleName',
                { userId: req.user.user_id, roleName }
            );
            
            if (result.recordset.length === 0) {
                return res.status(403).json({ error: `Role '${roleName}' required` });
            }
            
            next();
            
        } catch (err) {
            logger.error('Role check error:', err);
            return res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};

// Optional authentication (doesn't require token but decodes if present)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const result = await executeQuery(
                    'SELECT user_id, username, email, full_name FROM users WHERE user_id = @userId AND is_active = 1',
                    { userId: decoded.userId }
                );
                
                if (result.recordset.length > 0) {
                    req.user = result.recordset[0];
                }
            }
        }
        
        next();
        
    } catch (err) {
        // If token is invalid, just proceed without user
        next();
    }
};

module.exports = {
    authenticateJWT,
    isAdmin,
    hasRole,
    optionalAuth
};
