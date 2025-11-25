// PSS Request API Proxy Routes
const express = require('express');
const router = express.Router();
const https = require('https');
const { logger } = require('../utils/logger');
const { executeQuery } = require('../config/database');

// @route   POST /api/pss-request/deploy
// @desc    Submit deployment request to PSS API
// @access  Private
router.post('/deploy', async (req, res) => {
    try {
        const { tdbuildJSON } = req.body;
        
        // Validate request
        if (!tdbuildJSON) {
            return res.status(400).json({ error: 'Missing request data' });
        }
        
        // Create request envelope
        const requestEnvelope = {
            request_key: "MU*@e7y8y3umho8urh3788n@MH8eh82oeuMH28uemhuhmO8M!EY27MOHUE!2817EM712==",
            request_type: "Deploy_ePOD_Template",
            request_body: tdbuildJSON
        };
        
        // Log the request (without sensitive data)
        logger.info('Submitting PSS deployment request', {
            user: req.user.username,
            tenant_name: tdbuildJSON.tenant_name,
            template_id: tdbuildJSON.id
        });
        
        // Prepare request options
        const postData = JSON.stringify(requestEnvelope);
        const options = {
            hostname: 'pssrequest.cyberarklab.com',
            port: 443,
            path: '/PSSAPI/API/PSSRequest',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 60000 // 60 second timeout
        };
        
        // Make the API call
        const apiRequest = https.request(options, (apiResponse) => {
            let responseData = '';
            
            apiResponse.on('data', (chunk) => {
                responseData += chunk;
            });
            
            apiResponse.on('end', async () => {
                try {
                    const parsedResponse = JSON.parse(responseData);
                    
                    // Log the request in audit_logs
                    await executeQuery(
                        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
                         VALUES (@userId, 'deploy_testdrive', 'testdrive', @tenantName, @details, @ip)`,
                        {
                            userId: req.user.user_id,
                            tenantName: tdbuildJSON.tenant_name,
                            details: JSON.stringify({
                                template_id: tdbuildJSON.id,
                                company: tdbuildJSON.company_name,
                                customer_type: tdbuildJSON.customer_type,
                                status: parsedResponse.status || 'submitted'
                            }),
                            ip: req.ip
                        }
                    );
                    
                    logger.info('PSS deployment request successful', {
                        user: req.user.username,
                        tenant_name: tdbuildJSON.tenant_name,
                        response_status: apiResponse.statusCode
                    });
                    
                    res.json({
                        success: true,
                        response: parsedResponse,
                        statusCode: apiResponse.statusCode
                    });
                    
                } catch (parseErr) {
                    logger.error('Failed to parse PSS API response:', parseErr);
                    res.status(500).json({
                        success: false,
                        error: 'Invalid response from PSS API',
                        rawResponse: responseData
                    });
                }
            });
        });
        
        // Handle request errors
        apiRequest.on('error', (error) => {
            logger.error('PSS API request failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to connect to PSS API',
                details: error.message
            });
        });
        
        apiRequest.on('timeout', () => {
            logger.error('PSS API request timeout');
            apiRequest.destroy();
            res.status(504).json({
                success: false,
                error: 'PSS API request timeout',
                details: 'Request took longer than 60 seconds'
            });
        });
        
        // Send the request
        apiRequest.write(postData);
        apiRequest.end();
        
    } catch (err) {
        logger.error('Deploy request error:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to process deployment request',
            details: err.message
        });
    }
});

module.exports = router;
