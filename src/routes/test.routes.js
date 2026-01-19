const express = require('express');
const router = express.Router();
const WhatsAppService = require('../services/whatsapp.service');
const MessageController = require('../controllers/message.controller');

// Test endpoint to simulate incoming messages
router.post('/simulate', async (req, res) => {
  try {
    const { phone, message, type = 'text' } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Create mock webhook payload
    const mockPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test-simulation',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '1234567890',
              phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || 'test',
            },
            contacts: [{
              profile: { name: 'Test User' },
              wa_id: phone,
            }],
            messages: [{
              from: phone,
              id: `sim-${Date.now()}`,
              timestamp: Date.now().toString(),
              type: type,
              ...(type === 'text' ? { text: { body: message } } : {}),
              ...(type === 'interactive' ? {
                interactive: {
                  type: 'button_reply',
                  button_reply: {
                    id: message,
                    title: message.replace('_', ' '),
                  },
                },
              } : {}),
            }],
          },
        }],
      }],
    };

    // Process the message
    const webhookValue = mockPayload.entry[0].changes[0].value;
    const messageData = webhookValue.messages[0];
    
    await MessageController.handleIncomingMessage(messageData, webhookValue);

    res.json({
      success: true,
      message: 'Simulation sent successfully',
      mode: WhatsAppService.isTestMode() ? 'test' : 'production',
      data: {
        phone,
        message,
        type,
      },
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Test WhatsApp API connection
router.get('/whatsapp-status', async (req, res) => {
  try {
    const status = {
      mode: WhatsAppService.isTestMode() ? 'test' : 'production',
      configured: !WhatsAppService.isTestMode(),
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN && 
                    !process.env.WHATSAPP_ACCESS_TOKEN.includes('test') &&
                    process.env.WHATSAPP_ACCESS_TOKEN !== 'your_whatsapp_access_token_here',
    };
    
    res.json({
      success: true,
      status,
      instructions: status.configured 
        ? 'WhatsApp API is configured. Use /test/simulate to test.'
        : 'WhatsApp API is in test mode. Update .env with real credentials for production.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Clear test data
router.post('/clear-data', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only allowed in development mode' });
  }
  
  try {
    const { inMemoryDB } = require('../services/database.service');
    inMemoryDB.clear();
    
    res.json({
      success: true,
      message: 'Test data cleared',
      stats: inMemoryDB.getStats(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get test data stats
router.get('/stats', async (req, res) => {
  try {
    const { inMemoryDB } = require('../services/database.service');
    
    res.json({
      success: true,
      stats: inMemoryDB.getStats(),
      mode: process.env.NODE_ENV,
      whatsappMode: WhatsAppService.isTestMode() ? 'test' : 'production',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
