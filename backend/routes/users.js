// User Routes
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
    try {
        res.json({ user: req.user });
    } catch (err) {
        logger.error('Get profile error:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', async (req, res) => {
    try {
        const { full_name, title, profile_picture } = req.body;
        
        await executeQuery(
            `UPDATE users
             SET full_name = @fullName, title = @title, profile_picture = @picture, updated_at = GETDATE()
             WHERE user_id = @userId`,
            { userId: req.user.user_id, fullName: full_name, title, picture: profile_picture }
        );
        
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        logger.error('Update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;
