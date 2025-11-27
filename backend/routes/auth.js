// Authentication Routes
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');
const { authenticateJWT } = require('../middleware/auth');

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        {
            userId: user.user_id,
            username: user.username,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );
}

// @route   POST /api/auth/register
// @desc    Register a new local user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, fullName, title } = req.body;
        
        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }
        
        // Check if user already exists
        const existingUser = await executeQuery(
            'SELECT * FROM users WHERE username = @username OR email = @email',
            { username, email }
        );
        
        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // Create user
        const result = await executeQuery(
            `INSERT INTO users (username, email, password_hash, full_name, title, is_sso_user)
             OUTPUT INSERTED.user_id, INSERTED.username, INSERTED.email, INSERTED.full_name
             VALUES (@username, @email, @passwordHash, @fullName, @title, 0)`,
            { username, email, passwordHash, fullName: fullName || null, title: title || null }
        );
        
        const newUser = result.recordset[0];
        
        logger.info(`New user registered: ${username}`);
        
        // Generate token
        const token = generateToken(newUser);
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                user_id: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
                full_name: newUser.full_name
            }
        });
        
    } catch (err) {
        logger.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// @route   POST /api/auth/login
// @desc    Login with local credentials
// @access  Public
router.post('/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, async (err, user, info) => {
        try {
            if (err) {
                logger.error('Login error:', err);
                return res.status(500).json({ error: 'Login failed' });
            }
            
            if (!user) {
                return res.status(401).json({ error: info.message || 'Invalid credentials' });
            }
            
            // Get user roles
            const rolesResult = await executeQuery(
                'SELECT role_name FROM user_roles WHERE user_id = @userId',
                { userId: user.user_id }
            );
            
            const roles = rolesResult.recordset.map(r => r.role_name);
            
            // Generate token
            const token = generateToken(user);
            
            // Log audit
            await executeQuery(
                `INSERT INTO audit_logs (user_id, action, entity_type, ip_address, user_agent)
                 VALUES (@userId, 'login', 'auth', @ipAddress, @userAgent)`,
                {
                    userId: user.user_id,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent')
                }
            );
            
            res.json({
                message: 'Login successful',
                token,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    title: user.title,
                    profile_picture: user.profile_picture,
                    is_sso_user: user.is_sso_user,
                    roles
                }
            });
            
        } catch (err) {
            logger.error('Login error:', err);
            res.status(500).json({ error: 'Login failed' });
        }
    })(req, res, next);
});

// @route   GET /api/auth/sso/cyberark
// @desc    Initiate CyberArk SSO login
// @access  Public
router.get('/sso/cyberark', (req, res, next) => {
    if (process.env.SSO_ENABLED !== 'true') {
        return res.status(400).json({ error: 'SSO is not enabled' });
    }
    passport.authenticate('cyberark-saml')(req, res, next);
});

// @route   POST /api/auth/sso/cyberark/callback
// @desc    CyberArk SSO callback
// @access  Public
router.post('/sso/cyberark/callback',
    passport.authenticate('cyberark-saml', { session: false, failureRedirect: '/login?error=sso_failed' }),
    async (req, res) => {
        try {
            // Get user roles
            const rolesResult = await executeQuery(
                'SELECT role_name FROM user_roles WHERE user_id = @userId',
                { userId: req.user.user_id }
            );
            
            const roles = rolesResult.recordset.map(r => r.role_name);
            
            // Generate token
            const token = generateToken(req.user);
            
            // Log audit
            await executeQuery(
                `INSERT INTO audit_logs (user_id, action, entity_type, details, ip_address, user_agent)
                 VALUES (@userId, 'sso_login', 'auth', 'CyberArk SSO login', @ipAddress, @userAgent)`,
                {
                    userId: req.user.user_id,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent')
                }
            );
            
            // Redirect to frontend with token
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
            
        } catch (err) {
            logger.error('SSO callback error:', err);
            res.redirect('/login?error=sso_callback_failed');
        }
    }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateJWT, async (req, res) => {
    try {
        // Get user roles
        const rolesResult = await executeQuery(
            'SELECT role_name FROM user_roles WHERE user_id = @userId',
            { userId: req.user.user_id }
        );
        
        const roles = rolesResult.recordset.map(r => r.role_name);
        
        res.json({
            user: {
                ...req.user,
                roles
            }
        });
        
    } catch (err) {
        logger.error('Get current user error:', err);
        res.status(500).json({ error: 'Failed to get user information' });
    }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateJWT, (req, res) => {
    try {
        const token = generateToken(req.user);
        res.json({ token });
    } catch (err) {
        logger.error('Token refresh error:', err);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateJWT, async (req, res) => {
    try {
        // Log audit
        await executeQuery(
            `INSERT INTO audit_logs (user_id, action, entity_type)
             VALUES (@userId, 'logout', 'auth')`,
            { userId: req.user.user_id }
        );
        
        res.json({ message: 'Logout successful' });
    } catch (err) {
        logger.error('Logout error:', err);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// @route   GET /api/auth/saml
// @desc    Initiate SAML SSO login
// @access  Public
router.get('/saml', 
    passport.authenticate('saml', { 
        failureRedirect: '/login',
        failureFlash: true 
    })
);

// @route   POST /api/auth/saml/callback
// @desc    SAML SSO callback
// @access  Public
router.post('/saml/callback',
    passport.authenticate('saml', { 
        failureRedirect: '/login',
        session: false 
    }),
    async (req, res) => {
        try {
            // Generate JWT for SSO user
            const token = generateToken(req.user);
            
            // Log successful SSO login
            await executeQuery(
                `INSERT INTO audit_logs (user_id, action, entity_type, details)
                 VALUES (@userId, 'sso_login', 'auth', @details)`,
                { 
                    userId: req.user.user_id,
                    details: JSON.stringify({ method: 'SAML', provider: 'CyberArk Identity' })
                }
            );
            
            logger.info('SSO login successful', { 
                user_id: req.user.user_id,
                email: req.user.email 
            });
            
            // Redirect to frontend with token
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
            
        } catch (err) {
            logger.error('SSO callback error:', err);
            res.redirect('/login?error=sso_failed');
        }
    }
);

// @route   GET /api/auth/saml/metadata
// @desc    Get SAML metadata for IdP configuration
// @access  Public
router.get('/saml/metadata', (req, res) => {
    try {
        const samlStrategy = passport._strategy('saml');
        if (!samlStrategy) {
            return res.status(500).json({ error: 'SAML not configured' });
        }
        
        samlStrategy.generateServiceProviderMetadata(
            process.env.SAML_DECRYPTION_CERT || '',
            process.env.SAML_SIGNING_CERT || '',
            (err, metadata) => {
                if (err) {
                    logger.error('Metadata generation error:', err);
                    return res.status(500).json({ error: 'Failed to generate metadata' });
                }
                res.type('application/xml');
                res.send(metadata);
            }
        );
    } catch (err) {
        logger.error('Metadata endpoint error:', err);
        res.status(500).json({ error: 'Metadata generation failed' });
    }
});

module.exports = router;
