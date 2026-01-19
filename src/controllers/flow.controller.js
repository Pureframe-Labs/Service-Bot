const PaymentController = require('./payment.controller');
const Order = require('../models/order.model');
const { getServiceAmount } = require('../utils/helpers');
const logger = require('../utils/logger');

class FlowController {
  async handleFlowCompletion(from, flowToken) {
    try {
      // In a real implementation, you would:
      // 1. Parse the flowToken to get the submitted data
      // 2. Extract the form data
      // 3. Determine the service type from the flow
      // 4. Create an order
      
      // For now, we'll simulate extracting data from flowToken
      const flowData = this.parseFlowToken(flowToken);
      const serviceType = flowData.serviceType || '8A';
      
      // Create order
      const order = await this.createOrder(from, serviceType, flowData);
      
      // Initiate payment
      await PaymentController.initiatePayment(from, order);
      
    } catch (error) {
      logger.error('Error handling flow completion:', error);
      throw error;
    }
  }

  parseFlowToken(flowToken) {
    // In reality, you would decode or look up the flow token
    // to get the submitted form data
    // This is a simplified version
    const serviceMap = {
      '8a_flow_token': '8A',
      '712_flow_token': '7/12',
      'ferfar_flow_token': 'Ferfar',
      'property_card_flow_token': 'Property Card',
    };
    
    return {
      serviceType: serviceMap[flowToken] || '8A',
      userData: {
        name: 'Sample User',
        email: 'user@example.com',
        state: 'Maharashtra',
        district: 'Sample District',
        tahsil: 'Sample Tahsil',
        village: 'Sample Village',
        // Add other form fields as needed
      },
    };
  }

  async createOrder(whatsappId, serviceType, flowData) {
    try {
      const amount = getServiceAmount(serviceType);
      
      const order = new Order({
        orderId: `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        razorpayOrderId: `rzp_${Date.now()}`,
        whatsappId,
        serviceType,
        userData: flowData.userData,
        amount,
        status: 'pending',
        paymentStatus: 'pending',
      });
      
      await order.save();
      logger.info('Order created', { orderId: order.orderId, serviceType, amount });
      
      return order;
    } catch (error) {
      logger.error('Error creating order:', error);
      throw error;
    }
  }
}

module.exports = new FlowController();
