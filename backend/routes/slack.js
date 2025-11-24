// Slack Integration Routes
const express = require('express');
const router = express.Router();
const { WebClient } = require('@slack/web-api');
const { logger } = require('../utils/logger');

const slackEnabled = process.env.SLACK_ENABLED === 'true';
const slackClient = slackEnabled ? new WebClient(process.env.SLACK_BOT_TOKEN) : null;

// @route   POST /api/slack/notify
// @desc    Send Slack notification
// @access  Private
router.post('/notify', async (req, res) => {
    try {
        if (!slackEnabled) {
            return res.status(400).json({ error: 'Slack integration is not enabled' });
        }
        
        const { channel, message, blocks } = req.body;
        const targetChannel = channel || process.env.SLACK_DEFAULT_CHANNEL;
        
        const result = await slackClient.chat.postMessage({
            channel: targetChannel,
            text: message,
            blocks: blocks || undefined
        });
        
        logger.info(`Slack message sent to ${targetChannel}`);
        res.json({ message: 'Notification sent', ts: result.ts });
    } catch (err) {
        logger.error('Slack notification error:', err);
        res.status(500).json({ error: 'Failed to send Slack notification' });
    }
});

// @route   GET /api/slack/status
// @desc    Check Slack integration status
// @access  Private
router.get('/status', (req, res) => {
    res.json({ 
        enabled: slackEnabled,
        configured: !!process.env.SLACK_BOT_TOKEN
    });
});

module.exports = router;
