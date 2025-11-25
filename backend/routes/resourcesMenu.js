// Resources Menu Routes
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');

// @route   GET /api/resources-menu
// @desc    Get resources navigation menu
// @access  Private
router.get('/', async (req, res) => {
    try {
        const result = await executeQuery(
            `SELECT menu_id, icon, title, route, display_order, description
             FROM navmenu_resources
             WHERE is_active = 1
             ORDER BY display_order ASC`
        );
        
        res.json({ menuItems: result.recordset });
    } catch (err) {
        logger.error('Get resources menu error:', err);
        res.status(500).json({ error: 'Failed to fetch resources menu' });
    }
});

module.exports = router;
