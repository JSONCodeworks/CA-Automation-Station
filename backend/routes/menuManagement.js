// Menu Management Routes
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');

// @route   GET /api/admin/menu-management/main
// @desc    Get all main menu items for management
// @access  Admin
router.get('/main', async (req, res) => {
    try {
        const result = await executeQuery(
            `SELECT menu_id, icon, title, route, display_order, is_active, required_role, created_at
             FROM navmenu_main
             ORDER BY display_order ASC`
        );
        
        res.json({ menuItems: result.recordset });
    } catch (err) {
        logger.error('Get main menu items error:', err);
        res.status(500).json({ error: 'Failed to fetch menu items' });
    }
});

// @route   GET /api/admin/menu-management/admin
// @desc    Get all admin menu items for management
// @access  Admin
router.get('/admin', async (req, res) => {
    try {
        const result = await executeQuery(
            `SELECT menu_id, icon, title, route, display_order, is_active, description, created_at
             FROM navmenu_admin
             ORDER BY display_order ASC`
        );
        
        res.json({ menuItems: result.recordset });
    } catch (err) {
        logger.error('Get admin menu items error:', err);
        res.status(500).json({ error: 'Failed to fetch admin menu items' });
    }
});

// @route   POST /api/admin/menu-management/main
// @desc    Create new main menu item
// @access  Admin
router.post('/main', async (req, res) => {
    try {
        const { icon, title, route, display_order, required_role } = req.body;
        
        const result = await executeQuery(
            `INSERT INTO navmenu_main (icon, title, route, display_order, required_role, is_active)
             OUTPUT INSERTED.*
             VALUES (@icon, @title, @route, @order, @role, 1)`,
            { icon, title, route, order: display_order, role: required_role || null }
        );
        
        logger.info(`Main menu item created: ${title} by ${req.user.username}`);
        res.status(201).json({ message: 'Menu item created', menuItem: result.recordset[0] });
    } catch (err) {
        logger.error('Create main menu item error:', err);
        res.status(500).json({ error: 'Failed to create menu item' });
    }
});

// @route   POST /api/admin/menu-management/admin
// @desc    Create new admin menu item
// @access  Admin
router.post('/admin', async (req, res) => {
    try {
        const { icon, title, route, display_order, description } = req.body;
        
        const result = await executeQuery(
            `INSERT INTO navmenu_admin (icon, title, route, display_order, description, is_active)
             OUTPUT INSERTED.*
             VALUES (@icon, @title, @route, @order, @desc, 1)`,
            { icon, title, route, order: display_order, desc: description || null }
        );
        
        logger.info(`Admin menu item created: ${title} by ${req.user.username}`);
        res.status(201).json({ message: 'Admin menu item created', menuItem: result.recordset[0] });
    } catch (err) {
        logger.error('Create admin menu item error:', err);
        res.status(500).json({ error: 'Failed to create admin menu item' });
    }
});

// @route   PUT /api/admin/menu-management/main/:menuId
// @desc    Update main menu item
// @access  Admin
router.put('/main/:menuId', async (req, res) => {
    try {
        const { menuId } = req.params;
        const { icon, title, route, display_order, required_role, is_active } = req.body;
        
        await executeQuery(
            `UPDATE navmenu_main
             SET icon = @icon, title = @title, route = @route, 
                 display_order = @order, required_role = @role, is_active = @active
             WHERE menu_id = @menuId`,
            { 
                menuId, 
                icon, 
                title, 
                route, 
                order: display_order, 
                role: required_role || null,
                active: is_active ? 1 : 0
            }
        );
        
        logger.info(`Main menu item ${menuId} updated by ${req.user.username}`);
        res.json({ message: 'Menu item updated successfully' });
    } catch (err) {
        logger.error('Update main menu item error:', err);
        res.status(500).json({ error: 'Failed to update menu item' });
    }
});

// @route   PUT /api/admin/menu-management/admin/:menuId
// @desc    Update admin menu item
// @access  Admin
router.put('/admin/:menuId', async (req, res) => {
    try {
        const { menuId } = req.params;
        const { icon, title, route, display_order, description, is_active } = req.body;
        
        await executeQuery(
            `UPDATE navmenu_admin
             SET icon = @icon, title = @title, route = @route, 
                 display_order = @order, description = @desc, is_active = @active,
                 updated_at = GETDATE()
             WHERE menu_id = @menuId`,
            { 
                menuId, 
                icon, 
                title, 
                route, 
                order: display_order, 
                desc: description || null,
                active: is_active ? 1 : 0
            }
        );
        
        logger.info(`Admin menu item ${menuId} updated by ${req.user.username}`);
        res.json({ message: 'Admin menu item updated successfully' });
    } catch (err) {
        logger.error('Update admin menu item error:', err);
        res.status(500).json({ error: 'Failed to update admin menu item' });
    }
});

// @route   DELETE /api/admin/menu-management/main/:menuId
// @desc    Delete main menu item
// @access  Admin
router.delete('/main/:menuId', async (req, res) => {
    try {
        const { menuId } = req.params;
        
        await executeQuery(
            `DELETE FROM navmenu_main WHERE menu_id = @menuId`,
            { menuId }
        );
        
        logger.info(`Main menu item ${menuId} deleted by ${req.user.username}`);
        res.json({ message: 'Menu item deleted successfully' });
    } catch (err) {
        logger.error('Delete main menu item error:', err);
        res.status(500).json({ error: 'Failed to delete menu item' });
    }
});

// @route   DELETE /api/admin/menu-management/admin/:menuId
// @desc    Delete admin menu item
// @access  Admin
router.delete('/admin/:menuId', async (req, res) => {
    try {
        const { menuId } = req.params;
        
        await executeQuery(
            `DELETE FROM navmenu_admin WHERE menu_id = @menuId`,
            { menuId }
        );
        
        logger.info(`Admin menu item ${menuId} deleted by ${req.user.username}`);
        res.json({ message: 'Admin menu item deleted successfully' });
    } catch (err) {
        logger.error('Delete admin menu item error:', err);
        res.status(500).json({ error: 'Failed to delete admin menu item' });
    }
});

module.exports = router;
