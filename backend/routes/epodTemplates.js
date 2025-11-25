// ePOD Templates Routes
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');

// @route   GET /api/epod-templates
// @desc    Get visible ePOD templates
// @access  Private
router.get('/', async (req, res) => {
    try {
        const result = await executeQuery(
            `SELECT template_id, template_name, template_description
             FROM automation_epod_templates
             WHERE template_visible = 1
             ORDER BY template_name ASC`
        );
        
        res.json({ templates: result.recordset });
    } catch (err) {
        logger.error('Get ePOD templates error:', err);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// @route   GET /api/epod-templates/:templateId
// @desc    Get specific template details
// @access  Private
router.get('/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        
        const result = await executeQuery(
            `SELECT template_id, template_name, template_description, template_config
             FROM automation_epod_templates
             WHERE template_id = @templateId AND template_visible = 1`,
            { templateId }
        );
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        res.json({ template: result.recordset[0] });
    } catch (err) {
        logger.error('Get template details error:', err);
        res.status(500).json({ error: 'Failed to fetch template details' });
    }
});

module.exports = router;
