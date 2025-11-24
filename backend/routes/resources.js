// Resources Routes
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');

// @route   GET /api/resources
// @desc    Get all resources
// @access  Private
router.get('/', async (req, res) => {
    try {
        const result = await executeQuery(
            `SELECT r.*, u.username as creator_username
             FROM resources r
             JOIN users u ON r.created_by = u.user_id
             ORDER BY r.created_at DESC`
        );
        res.json({ resources: result.recordset });
    } catch (err) {
        logger.error('Get resources error:', err);
        res.status(500).json({ error: 'Failed to fetch resources' });
    }
});

// @route   POST /api/resources
// @desc    Create new resource
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { resource_type, resource_name, configuration } = req.body;
        
        const result = await executeQuery(
            `INSERT INTO resources (resource_type, resource_name, configuration, created_by, status)
             OUTPUT INSERTED.*
             VALUES (@type, @name, @config, @userId, 'pending')`,
            { 
                type: resource_type, 
                name: resource_name, 
                config: JSON.stringify(configuration),
                userId: req.user.user_id 
            }
        );
        
        res.status(201).json({ message: 'Resource created', resource: result.recordset[0] });
    } catch (err) {
        logger.error('Create resource error:', err);
        res.status(500).json({ error: 'Failed to create resource' });
    }
});

module.exports = router;
