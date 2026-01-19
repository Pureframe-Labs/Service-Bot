const whatsappService = require('./whatsapp.service');
const database = require('./database.service');

class NotificationService {
  async sendWelcomeMessage(phone) {
    const message = `🏡 *Welcome to Land Record Services!*\n\n` +
      `I'm here to help you with:\n` +
      `• 8A Form Application\n` +
      `• 7/12 Form Extract\n` +
      `• Ferfar Mutation\n` +
      `• Property Card\n\n` +
      `Please select a service from the buttons below.`;
    
    await whatsappService.sendTextMessage(phone, message);
    
    // Send service buttons
    setTimeout(() => {
      whatsappService.sendServiceButtons(phone);
    }, 1000);
  }

  async sendServiceDescription(phone, serviceType) {
    const descriptions = {
      'service_8a': `📝 *8A Form Service*\n\n` +
        `The 8A form is used for land record applications.\n\n` +
        `*Fee: ₹100*\n` +
        `*Processing: 24-48 hours*\n\n` +
        `Would you like to proceed? (Reply YES/NO)`,
      
      'service_712': `📄 *7/12 Form Service*\n\n` +
        `Extract of land records showing ownership details.\n\n` +
        `*Fee: ₹50*\n` +
        `*Processing: 24 hours*\n\n` +
        `Would you like to proceed? (Reply YES/NO)`,
      
      'service_ferfar': `🔄 *Ferfar Service*\n\n` +
        `Mutation application for property transfer.\n\n` +
        `*Fee: ₹200*\n` +
        `*Processing: 48-72 hours*\n\n` +
        `Would you like to proceed? (Reply YES/NO)`,
      
      'service_property': `🏠 *Property Card Service*\n\n` +
        `Complete property details and records.\n\n` +
        `*Fee: ₹75*\n` +
        `*Processing: 24 hours*\n\n` +
        `Would you like to proceed? (Reply YES/NO)`
    };

    const message = descriptions[serviceType] || 'Service description not available.';
    await whatsappService.sendTextMessage(phone, message);
    
    // Save user's service selection
    await database.updateSession(phone, {
      selectedService: serviceType,
      step: 'awaiting_confirmation'
    });
  }

  async requestUserInfo(phone) {
    const message = `📋 *Please provide your details:*\n\n` +
      `1. Full Name\n` +
      `2. Email Address\n` +
      `3. State\n` +
      `4. District\n` +
      `5. Village\n` +
      `6. Survey Number\n\n` +
      `Please send all details in one message, separated by commas.`;
    
    await whatsappService.sendTextMessage(phone, message);
    
    await database.updateSession(phone, {
      step: 'awaiting_user_info'
    });
  }

  async confirmUserInfo(phone, userInfo) {
    const message = `✅ *Details Received:*\n\n` +
      `Name: ${userInfo.name}\n` +
      `Email: ${userInfo.email}\n` +
      `State: ${userInfo.state}\n` +
      `District: ${userInfo.district}\n` +
      `Village: ${userInfo.village}\n` +
      `Survey No: ${userInfo.surveyNumber}\n\n` +
      `Is this correct? (Reply YES/NO)`;
    
    await whatsappService.sendTextMessage(phone, message);
    
    await database.updateSession(phone, {
      userInfo,
      step: 'confirming_info'
    });
  }

  async sendPaymentRequest(phone, orderDetails) {
    await whatsappService.sendPaymentLink(phone, orderDetails);
    
    await database.updateSession(phone, {
      step: 'awaiting_payment',
      currentOrder: orderDetails.orderId
    });
  }

  async sendPaymentConfirmation(phone, orderDetails) {
    await whatsappService.sendConfirmation(phone, orderDetails);
    
    // Update session
    await database.updateSession(phone, {
      step: 'completed',
      lastOrder: orderDetails.orderId
    });
  }

  async sendHelpMessage(phone) {
    const message = `🆘 *Help & Support*\n\n` +
      `*Available Services:*\n` +
      `• 8A Form\n` +
      `• 7/12 Form\n` +
      `• Ferfar\n` +
      `• Property Card\n\n` +
      `*How to use:*\n` +
      `1. Send "hi" to start\n` +
      `2. Select a service\n` +
      `3. Provide your details\n` +
      `4. Make payment\n` +
      `5. Get confirmation\n\n` +
      `*Commands:*\n` +
      `• hi - Start over\n` +
      `• help - Show this message\n` +
      `• status - Check your orders\n` +
      `• cancel - Cancel current process\n\n` +
      `Need assistance? Contact support@example.com`;
    
    await whatsappService.sendTextMessage(phone, message);
  }

  async sendOrderStatus(phone) {
    const orders = await database.findOrdersByWhatsappId(phone);
    
    if (orders.length === 0) {
      await whatsappService.sendTextMessage(phone, '📭 You have no orders yet.');
      return;
    }
    
    let message = `📋 *Your Orders:*\n\n`;
    
    orders.forEach((order, index) => {
      message += `*Order ${index + 1}:*\n` +
        `ID: ${order.orderId}\n` +
        `Service: ${order.service}\n` +
        `Amount: ₹${order.amount}\n` +
        `Status: ${order.status}\n` +
        `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}\n\n`;
    });
    
    await whatsappService.sendTextMessage(phone, message);
  }
}

module.exports = new NotificationService();
