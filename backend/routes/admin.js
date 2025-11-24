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
            `SELECT u.user_id, u.username, u.email, u.full_name, u.title, u.is_sso_user, u.is_active, u.created_at, u.last_login,
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

// @route   PUT /api/admin/users/:userId/disable
// @desc    Disable/Enable user account
// @access  Admin
router.put('/users/:userId/disable', async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_active } = req.body;
        
        // Prevent admin from disabling themselves
        if (parseInt(userId) === req.user.user_id) {
            return res.status(400).json({ error: 'You cannot disable your own account' });
        }
        
        await executeQuery(
            `UPDATE users SET is_active = @active, updated_at = GETDATE() WHERE user_id = @userId`,
            { userId, active: is_active ? 1 : 0 }
        );
        
        // Log audit
        await executeQuery(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES (@adminId, @action, 'user', @userId, @details)`,
            {
                adminId: req.user.user_id,
                action: is_active ? 'enable_user' : 'disable_user',
                userId,
                details: `User ${is_active ? 'enabled' : 'disabled'} by ${req.user.username}`
            }
        );
        
        logger.info(`User ${userId} ${is_active ? 'enabled' : 'disabled'} by ${req.user.username}`);
        res.json({ message: `User ${is_active ? 'enabled' : 'disabled'} successfully` });
    } catch (err) {
        logger.error('Disable user error:', err);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// @route   DELETE /api/admin/users/:userId
// @desc    Delete user account
// @access  Admin
router.delete('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Prevent admin from deleting themselves
        if (parseInt(userId) === req.user.user_id) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }
        
        // Get user info for logging
        const userResult = await executeQuery(
            `SELECT username, email FROM users WHERE user_id = @userId`,
            { userId }
        );
        
        if (userResult.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const deletedUser = userResult.recordset[0];
        
        // Delete user (cascade will handle roles)
        await executeQuery(
            `DELETE FROM users WHERE user_id = @userId`,
            { userId }
        );
        
        // Log audit
        await executeQuery(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES (@adminId, 'delete_user', 'user', @userId, @details)`,
            {
                adminId: req.user.user_id,
                userId,
                details: `User ${deletedUser.username} (${deletedUser.email}) deleted by ${req.user.username}`
            }
        );
        
        logger.info(`User ${userId} (${deletedUser.username}) deleted by ${req.user.username}`);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        logger.error('Delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// @route   GET /api/admin/audit-logs
// @desc    Get audit logs
// @access  Admin
router.get('/audit-logs', async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        
        const result = await executeQuery(
            `SELECT a.log_id, a.action, a.entity_type, a.entity_id, a.details, 
                    a.ip_address, a.created_at, u.username, u.email
             FROM audit_logs a
             LEFT JOIN users u ON a.user_id = u.user_id
             ORDER BY a.created_at DESC
             OFFSET @offset ROWS
             FETCH NEXT @limit ROWS ONLY`,
            { offset: parseInt(offset), limit: parseInt(limit) }
        );
        
        res.json({ logs: result.recordset });
    } catch (err) {
        logger.error('Get audit logs error:', err);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

module.exports = router;
