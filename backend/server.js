// CA Automation Station - Main Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const menuRoutes = require('./routes/menu');
const configRoutes = require('./routes/config');
const resourceRoutes = require('./routes/resources');
const adminRoutes = require('./routes/admin');
const slackRoutes = require('./routes/slack');
const menuManagementRoutes = require('./routes/menuManagement');
const resourcesMenuRoutes = require('./routes/resourcesMenu');
const epodTemplatesRoutes = require('./routes/epodTemplates');
const pssRequestRoutes = require('./routes/pssRequest');

// Import middleware
const { authenticateJWT, isAdmin } = require('./middleware/auth');
const { logger } = require('./utils/logger');
const { initializeDatabase } = require('./config/database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000
    }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Initialize SAML Strategy for CyberArk Identity SSO
if (process.env.SAML_ENABLED === 'true') {
    try {
        const { samlStrategy } = require('./config/saml');
        if (samlStrategy) {
            passport.use('saml', samlStrategy);
            logger.info('SAML SSO enabled for CyberArk Identity');
        } else {
            logger.warn('SAML SSO requested but passport-saml not available');
        }
    } catch (err) {
        logger.error('Failed to load SAML configuration:', err.message);
        logger.warn('SAML SSO disabled - continuing without SSO');
    }
} else {
    logger.info('SAML SSO disabled (set SAML_ENABLED=true to enable)');
}

// Rate limiting
const limiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateJWT, userRoutes);
app.use('/api/menu', authenticateJWT, menuRoutes);
app.use('/api/config', authenticateJWT, configRoutes);
app.use('/api/resources', authenticateJWT, resourceRoutes);
app.use('/api/admin', authenticateJWT, isAdmin, adminRoutes);
app.use('/api/admin/menu-management', authenticateJWT, isAdmin, menuManagementRoutes);
app.use('/api/slack', authenticateJWT, slackRoutes);
app.use('/api/resources-menu', authenticateJWT, resourcesMenuRoutes);
app.use('/api/epod-templates', authenticateJWT, epodTemplatesRoutes);
app.use('/api/pss-request', authenticateJWT, pssRequestRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });
    
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }
    
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            logger.info(`🚀 CA Automation Station server running on port ${PORT}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
            logger.info(`🔐 SAML SSO: ${process.env.SAML_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
            logger.info(`💬 Slack Notifications: ${process.env.SLACK_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
        });
    })
    .catch(err => {
        logger.error('Failed to initialize database:', err);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;
