// Configuration Routes
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');
const { isAdmin } = require('../middleware/auth');

// @route   GET /api/config
// @desc    Get all public configuration
// @access  Private
router.get('/', async (req, res) => {
    try {
        const result = await executeQuery(
            `SELECT config_key, config_value, config_type, description
             FROM app_config
             WHERE is_editable = 1`
        );
        
        res.json({ config: result.recordset });
    } catch (err) {
        logger.error('Get config error:', err);
        res.status(500).json({ error: 'Failed to fetch configuration' });
    }
});

// @route   PUT /api/config/:key
// @desc    Update configuration
// @access  Admin
router.put('/:key', isAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        
        await executeQuery(
            `UPDATE app_config
             SET config_value = @value, updated_at = GETDATE(), updated_by = @userId
             WHERE config_key = @key AND is_editable = 1`,
            { key, value, userId: req.user.user_id }
        );
        
        logger.info(`Configuration ${key} updated by ${req.user.username}`);
        res.json({ message: 'Configuration updated successfully' });
    } catch (err) {
        logger.error('Update config error:', err);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

module.exports = router;
