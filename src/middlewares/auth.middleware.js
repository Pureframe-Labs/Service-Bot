const crypto = require('crypto');
const paymentConfig = require('../config/payment.config');

const verifyRazorpayWebhook = (req, res, next) => {
  try {
    const razorpaySignature = req.headers['x-razorpay-signature'];
    
    if (!razorpaySignature) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', paymentConfig.webhookSecret)
      .update(body)
      .digest('hex');

    if (razorpaySignature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { verifyRazorpayWebhook };
