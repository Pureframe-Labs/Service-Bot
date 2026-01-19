require('dotenv').config();

module.exports = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v19.0',
  verifyToken: process.env.VERIFY_TOKEN,
  baseUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v19.0'}`,
};
