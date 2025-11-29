// TM Services Management Routes
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');

// @route   GET /api/admin/tm-services
// @desc    Get all TM services
// @access  Private (Admin)
router.get('/', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                tms_id,
                tms_name,
                tms_jsonid,
                tms_makeavailable,
                CASE WHEN tms_icon IS NOT NULL THEN 1 ELSE 0 END as has_icon
            FROM tm_services
            ORDER BY tms_name
        `);

        res.json(result.recordset);
    } catch (err) {
        logger.error('Error fetching TM services:', err);
        res.status(500).json({ error: 'Failed to fetch TM services' });
    }
});

// @route   GET /api/admin/tm-services/:tms_id
// @desc    Get single TM service by ID
// @access  Private (Admin)
router.get('/:tms_id', async (req, res) => {
    try {
        const { tms_id } = req.params;

        const result = await executeQuery(
            `SELECT 
                tms_id,
                tms_name,
                tms_jsonid,
                tms_makeavailable,
                CASE WHEN tms_icon IS NOT NULL THEN 1 ELSE 0 END as has_icon
            FROM tm_services 
            WHERE tms_id = @tmsId`,
            { tmsId: tms_id }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'TM Service not found' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        logger.error('Error fetching TM service:', err);
        res.status(500).json({ error: 'Failed to fetch TM service' });
    }
});

// @route   GET /api/admin/tm-services/:tms_id/icon
// @desc    Get icon for TM service
// @access  Private (Admin)
router.get('/:tms_id/icon', async (req, res) => {
    try {
        const { tms_id } = req.params;

        const result = await executeQuery(
            `SELECT tms_icon FROM tm_services WHERE tms_id = @tmsId`,
            { tmsId: tms_id }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'TM Service not found' });
        }

        const icon = result.recordset[0].tms_icon;
        
        if (!icon) {
            return res.status(404).json({ error: 'No icon found' });
        }

        // Return binary data as image
        res.set('Content-Type', 'image/png'); // Default to PNG, adjust if needed
        res.send(icon);
        
    } catch (err) {
        logger.error('Error fetching TM service icon:', err);
        res.status(500).json({ error: 'Failed to fetch icon' });
    }
});

// @route   POST /api/admin/tm-services
// @desc    Create new TM service (GUID auto-generated for tms_id)
// @access  Private (Admin)
router.post('/', async (req, res) => {
    try {
        const { tms_name, tms_jsonid, tms_makeavailable, tms_icon } = req.body;

        // Validation
        if (!tms_name || !tms_jsonid) {
            return res.status(400).json({ error: 'tms_name and tms_jsonid are required' });
        }

        // Generate GUID for tms_id
        const sql = require('mssql');
        const guid = require('crypto').randomUUID();

        // Handle icon (base64 string to binary)
        let iconBinary = null;
        if (tms_icon) {
            // If icon is base64 string, convert to buffer
            const base64Data = tms_icon.replace(/^data:image\/\w+;base64,/, '');
            iconBinary = Buffer.from(base64Data, 'base64');
        }

        const result = await executeQuery(
            `INSERT INTO tm_services (tms_id, tms_name, tms_jsonid, tms_makeavailable, tms_icon)
             OUTPUT INSERTED.tms_id, INSERTED.tms_name, INSERTED.tms_jsonid, INSERTED.tms_makeavailable,
                    CASE WHEN INSERTED.tms_icon IS NOT NULL THEN 1 ELSE 0 END as has_icon
             VALUES (@tmsId, @tmsName, @tmsJsonId, @tmsMakeAvailable, @tmsIcon)`,
            {
                tmsId: guid,
                tmsName: tms_name,
                tmsJsonId: tms_jsonid,
                tmsMakeAvailable: tms_makeavailable !== undefined ? tms_makeavailable : false,
                tmsIcon: iconBinary
            }
        );

        const newService = result.recordset[0];

        // Log audit
        await executeQuery(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES (@userId, 'create', 'tm_service', @entityId, @details)`,
            {
                userId: req.user.user_id,
                entityId: newService.tms_id,
                details: JSON.stringify({ tms_name, tms_jsonid })
            }
        );

        logger.info('TM service created', {
            tms_id: newService.tms_id,
            tms_name,
            created_by: req.user.user_id
        });

        res.status(201).json(newService);
    } catch (err) {
        logger.error('Error creating TM service:', err);
        res.status(500).json({ error: 'Failed to create TM service', details: err.message });
    }
});

// @route   PUT /api/admin/tm-services/:tms_id
// @desc    Update TM service
// @access  Private (Admin)
router.put('/:tms_id', async (req, res) => {
    try {
        const { tms_id } = req.params;
        const { tms_name, tms_jsonid, tms_makeavailable, tms_icon } = req.body;

        // Validation
        if (!tms_name || !tms_jsonid) {
            return res.status(400).json({ error: 'tms_name and tms_jsonid are required' });
        }

        // Check if service exists
        const checkResult = await executeQuery(
            `SELECT tms_id FROM tm_services WHERE tms_id = @tmsId`,
            { tmsId: tms_id }
        );

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: 'TM Service not found' });
        }

        // Handle icon
        let iconBinary = null;
        let updateIcon = false;
        if (tms_icon) {
            const base64Data = tms_icon.replace(/^data:image\/\w+;base64,/, '');
            iconBinary = Buffer.from(base64Data, 'base64');
            updateIcon = true;
        }

        // Build update query
        let query, params;
        if (updateIcon) {
            query = `UPDATE tm_services
                    SET tms_name = @tmsName,
                        tms_jsonid = @tmsJsonId,
                        tms_makeavailable = @tmsMakeAvailable,
                        tms_icon = @tmsIcon
                    OUTPUT INSERTED.tms_id, INSERTED.tms_name, INSERTED.tms_jsonid, INSERTED.tms_makeavailable,
                           CASE WHEN INSERTED.tms_icon IS NOT NULL THEN 1 ELSE 0 END as has_icon
                    WHERE tms_id = @tmsId`;
            params = {
                tmsId: tms_id,
                tmsName: tms_name,
                tmsJsonId: tms_jsonid,
                tmsMakeAvailable: tms_makeavailable !== undefined ? tms_makeavailable : false,
                tmsIcon: iconBinary
            };
        } else {
            query = `UPDATE tm_services
                    SET tms_name = @tmsName,
                        tms_jsonid = @tmsJsonId,
                        tms_makeavailable = @tmsMakeAvailable
                    OUTPUT INSERTED.tms_id, INSERTED.tms_name, INSERTED.tms_jsonid, INSERTED.tms_makeavailable,
                           CASE WHEN INSERTED.tms_icon IS NOT NULL THEN 1 ELSE 0 END as has_icon
                    WHERE tms_id = @tmsId`;
            params = {
                tmsId: tms_id,
                tmsName: tms_name,
                tmsJsonId: tms_jsonid,
                tmsMakeAvailable: tms_makeavailable !== undefined ? tms_makeavailable : false
            };
        }

        const result = await executeQuery(query, params);
        const updatedService = result.recordset[0];

        // Log audit
        await executeQuery(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES (@userId, 'update', 'tm_service', @entityId, @details)`,
            {
                userId: req.user.user_id,
                entityId: tms_id,
                details: JSON.stringify({ tms_name, tms_jsonid })
            }
        );

        logger.info('TM service updated', {
            tms_id,
            tms_name,
            updated_by: req.user.user_id
        });

        res.json(updatedService);
    } catch (err) {
        logger.error('Error updating TM service:', err);
        res.status(500).json({ error: 'Failed to update TM service', details: err.message });
    }
});

// @route   DELETE /api/admin/tm-services/:tms_id
// @desc    Delete TM service
// @access  Private (Admin)
router.delete('/:tms_id', async (req, res) => {
    try {
        const { tms_id } = req.params;

        // Get service info before deleting
        const serviceResult = await executeQuery(
            `SELECT tms_name FROM tm_services WHERE tms_id = @tmsId`,
            { tmsId: tms_id }
        );

        if (serviceResult.recordset.length === 0) {
            return res.status(404).json({ error: 'TM Service not found' });
        }

        const serviceName = serviceResult.recordset[0].tms_name;

        // Delete service
        await executeQuery(
            `DELETE FROM tm_services WHERE tms_id = @tmsId`,
            { tmsId: tms_id }
        );

        // Log audit
        await executeQuery(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES (@userId, 'delete', 'tm_service', @entityId, @details)`,
            {
                userId: req.user.user_id,
                entityId: tms_id,
                details: JSON.stringify({ tms_name: serviceName })
            }
        );

        logger.info('TM service deleted', {
            tms_id,
            tms_name: serviceName,
            deleted_by: req.user.user_id
        });

        res.json({ message: 'TM Service deleted successfully' });
    } catch (err) {
        logger.error('Error deleting TM service:', err);
        res.status(500).json({ error: 'Failed to delete TM service' });
    }
});

module.exports = router;
