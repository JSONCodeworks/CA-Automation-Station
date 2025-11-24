// Menu Routes
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');

// @route   GET /api/menu/main
// @desc    Get main navigation menu
// @access  Private
router.get('/main', async (req, res) => {
    try {
        // Get user roles
        const rolesResult = await executeQuery(
            'SELECT role_name FROM user_roles WHERE user_id = @userId',
            { userId: req.user.user_id }
        );
        const userRoles = rolesResult.recordset.map(r => r.role_name);
        
        // Get menu items
        const result = await executeQuery(
            `SELECT menu_id, icon, title, route, display_order, required_role
             FROM navmenu_main
             WHERE is_active = 1
             ORDER BY display_order ASC`
        );
        
        // Filter menu items based on user roles
        const menuItems = result.recordset.filter(item => {
            if (!item.required_role) return true;
            return userRoles.includes(item.required_role);
        });
        
        res.json({ menuItems });
    } catch (err) {
        logger.error('Get menu error:', err);
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

module.exports = router;
