// Admin Routes
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res) => {
    try {
        const result = await executeQuery(
            `SELECT u.user_id, u.username, u.email, u.full_name, u.title, u.is_sso_user, u.is_active, u.created_at,
                    (SELECT STRING_AGG(role_name, ',') FROM user_roles WHERE user_id = u.user_id) as roles
             FROM users u
             ORDER BY u.created_at DESC`
        );
        res.json({ users: result.recordset });
    } catch (err) {
        logger.error('Get users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// @route   POST /api/admin/users/:userId/roles
// @desc    Assign role to user
// @access  Admin
router.post('/users/:userId/roles', async (req, res) => {
    try {
        const { userId } = req.params;
        const { role_name } = req.body;
        
        await executeQuery(
            `INSERT INTO user_roles (user_id, role_name, assigned_by)
             VALUES (@userId, @roleName, @assignedBy)`,
            { userId, roleName: role_name, assignedBy: req.user.user_id }
        );
        
        logger.info(`Role ${role_name} assigned to user ${userId} by ${req.user.username}`);
        res.json({ message: 'Role assigned successfully' });
    } catch (err) {
        logger.error('Assign role error:', err);
        res.status(500).json({ error: 'Failed to assign role' });
    }
});

// @route   DELETE /api/admin/users/:userId/roles/:roleName
// @desc    Remove role from user
// @access  Admin
router.delete('/users/:userId/roles/:roleName', async (req, res) => {
    try {
        const { userId, roleName } = req.params;
        
        await executeQuery(
            `DELETE FROM user_roles WHERE user_id = @userId AND role_name = @roleName`,
            { userId, roleName }
        );
        
        logger.info(`Role ${roleName} removed from user ${userId} by ${req.user.username}`);
        res.json({ message: 'Role removed successfully' });
    } catch (err) {
        logger.error('Remove role error:', err);
        res.status(500).json({ error: 'Failed to remove role' });
    }
});

module.exports = router;
