// ISP Services Management Routes
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { logger } = require('../utils/logger');

// @route   GET /api/admin/isp-services
// @desc    Get all ISP services
// @access  Private (Admin)
router.get('/', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                scv_id,
                service_name,
                service_description,
                service_category,
                service_status,
                pricing_model,
                base_price,
                setup_fee,
                billing_cycle,
                contract_length,
                bandwidth_limit,
                storage_limit,
                user_limit,
                support_level,
                sla_uptime,
                features,
                restrictions,
                documentation_url,
                is_active,
                is_public,
                display_order,
                created_at,
                updated_at
            FROM isp_services
            ORDER BY display_order ASC, service_name ASC
        `);

        res.json(result.recordset);
    } catch (err) {
        logger.error('Error fetching ISP services:', err);
        res.status(500).json({ error: 'Failed to fetch ISP services' });
    }
});

// @route   GET /api/admin/isp-services/:scv_id
// @desc    Get single ISP service by ID
// @access  Private (Admin)
router.get('/:scv_id', async (req, res) => {
    try {
        const { scv_id } = req.params;

        const result = await executeQuery(
            `SELECT * FROM isp_services WHERE scv_id = @scvId`,
            { scvId: scv_id }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        logger.error('Error fetching ISP service:', err);
        res.status(500).json({ error: 'Failed to fetch service' });
    }
});

// @route   POST /api/admin/isp-services
// @desc    Create new ISP service
// @access  Private (Admin)
router.post('/', async (req, res) => {
    try {
        const {
            service_name,
            service_description,
            service_category,
            service_status,
            pricing_model,
            base_price,
            setup_fee,
            billing_cycle,
            contract_length,
            bandwidth_limit,
            storage_limit,
            user_limit,
            support_level,
            sla_uptime,
            features,
            restrictions,
            documentation_url,
            is_active,
            is_public,
            display_order
        } = req.body;

        // Validation
        if (!service_name) {
            return res.status(400).json({ error: 'Service name is required' });
        }

        // NEWID() generates new GUID automatically in SQL Server
        const result = await executeQuery(
            `INSERT INTO isp_services (
                service_name, service_description, service_category, service_status,
                pricing_model, base_price, setup_fee, billing_cycle, contract_length,
                bandwidth_limit, storage_limit, user_limit, support_level, sla_uptime,
                features, restrictions, documentation_url, is_active, is_public, display_order,
                created_by, created_at, updated_at
            )
            OUTPUT INSERTED.*
            VALUES (
                @serviceName, @serviceDescription, @serviceCategory, @serviceStatus,
                @pricingModel, @basePrice, @setupFee, @billingCycle, @contractLength,
                @bandwidthLimit, @storageLimit, @userLimit, @supportLevel, @slaUptime,
                @features, @restrictions, @documentationUrl, @isActive, @isPublic, @displayOrder,
                @createdBy, GETDATE(), GETDATE()
            )`,
            {
                serviceName: service_name,
                serviceDescription: service_description || null,
                serviceCategory: service_category || null,
                serviceStatus: service_status || 'Active',
                pricingModel: pricing_model || null,
                basePrice: base_price || null,
                setupFee: setup_fee || null,
                billingCycle: billing_cycle || null,
                contractLength: contract_length || null,
                bandwidthLimit: bandwidth_limit || null,
                storageLimit: storage_limit || null,
                userLimit: user_limit || null,
                supportLevel: support_level || null,
                slaUptime: sla_uptime || null,
                features: features || null,
                restrictions: restrictions || null,
                documentationUrl: documentation_url || null,
                isActive: is_active !== undefined ? is_active : true,
                isPublic: is_public !== undefined ? is_public : true,
                displayOrder: display_order || 0,
                createdBy: req.user.user_id
            }
        );

        const newService = result.recordset[0];

        // Log audit
        await executeQuery(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES (@userId, 'create', 'isp_service', @entityId, @details)`,
            {
                userId: req.user.user_id,
                entityId: newService.scv_id,
                details: JSON.stringify({ service_name })
            }
        );

        logger.info('ISP service created', {
            scv_id: newService.scv_id,
            service_name,
            created_by: req.user.user_id
        });

        res.status(201).json(newService);
    } catch (err) {
        logger.error('Error creating ISP service:', err);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// @route   PUT /api/admin/isp-services/:scv_id
// @desc    Update ISP service
// @access  Private (Admin)
router.put('/:scv_id', async (req, res) => {
    try {
        const { scv_id } = req.params;
        const {
            service_name,
            service_description,
            service_category,
            service_status,
            pricing_model,
            base_price,
            setup_fee,
            billing_cycle,
            contract_length,
            bandwidth_limit,
            storage_limit,
            user_limit,
            support_level,
            sla_uptime,
            features,
            restrictions,
            documentation_url,
            is_active,
            is_public,
            display_order
        } = req.body;

        // Validation
        if (!service_name) {
            return res.status(400).json({ error: 'Service name is required' });
        }

        // Check if service exists
        const checkResult = await executeQuery(
            `SELECT scv_id FROM isp_services WHERE scv_id = @scvId`,
            { scvId: scv_id }
        );

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        const result = await executeQuery(
            `UPDATE isp_services
            SET service_name = @serviceName,
                service_description = @serviceDescription,
                service_category = @serviceCategory,
                service_status = @serviceStatus,
                pricing_model = @pricingModel,
                base_price = @basePrice,
                setup_fee = @setupFee,
                billing_cycle = @billingCycle,
                contract_length = @contractLength,
                bandwidth_limit = @bandwidthLimit,
                storage_limit = @storageLimit,
                user_limit = @userLimit,
                support_level = @supportLevel,
                sla_uptime = @slaUptime,
                features = @features,
                restrictions = @restrictions,
                documentation_url = @documentationUrl,
                is_active = @isActive,
                is_public = @isPublic,
                display_order = @displayOrder,
                updated_by = @updatedBy,
                updated_at = GETDATE()
            OUTPUT INSERTED.*
            WHERE scv_id = @scvId`,
            {
                scvId: scv_id,
                serviceName: service_name,
                serviceDescription: service_description || null,
                serviceCategory: service_category || null,
                serviceStatus: service_status || 'Active',
                pricingModel: pricing_model || null,
                basePrice: base_price || null,
                setupFee: setup_fee || null,
                billingCycle: billing_cycle || null,
                contractLength: contract_length || null,
                bandwidthLimit: bandwidth_limit || null,
                storageLimit: storage_limit || null,
                userLimit: user_limit || null,
                supportLevel: support_level || null,
                slaUptime: sla_uptime || null,
                features: features || null,
                restrictions: restrictions || null,
                documentationUrl: documentation_url || null,
                isActive: is_active !== undefined ? is_active : true,
                isPublic: is_public !== undefined ? is_public : true,
                displayOrder: display_order || 0,
                updatedBy: req.user.user_id
            }
        );

        const updatedService = result.recordset[0];

        // Log audit
        await executeQuery(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES (@userId, 'update', 'isp_service', @entityId, @details)`,
            {
                userId: req.user.user_id,
                entityId: scv_id,
                details: JSON.stringify({ service_name })
            }
        );

        logger.info('ISP service updated', {
            scv_id,
            service_name,
            updated_by: req.user.user_id
        });

        res.json(updatedService);
    } catch (err) {
        logger.error('Error updating ISP service:', err);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

// @route   DELETE /api/admin/isp-services/:scv_id
// @desc    Delete ISP service
// @access  Private (Admin)
router.delete('/:scv_id', async (req, res) => {
    try {
        const { scv_id } = req.params;

        // Get service info before deleting
        const serviceResult = await executeQuery(
            `SELECT service_name FROM isp_services WHERE scv_id = @scvId`,
            { scvId: scv_id }
        );

        if (serviceResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        const serviceName = serviceResult.recordset[0].service_name;

        // Delete service
        await executeQuery(
            `DELETE FROM isp_services WHERE scv_id = @scvId`,
            { scvId: scv_id }
        );

        // Log audit
        await executeQuery(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES (@userId, 'delete', 'isp_service', @entityId, @details)`,
            {
                userId: req.user.user_id,
                entityId: scv_id,
                details: JSON.stringify({ service_name: serviceName })
            }
        );

        logger.info('ISP service deleted', {
            scv_id,
            service_name: serviceName,
            deleted_by: req.user.user_id
        });

        res.json({ message: 'Service deleted successfully' });
    } catch (err) {
        logger.error('Error deleting ISP service:', err);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

module.exports = router;
