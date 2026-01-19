class PaymentService {
  constructor() {
    this.testMode = true; // Always test mode for now
  }

  async createOrder(amount, serviceType, customerInfo) {
    // Generate mock payment link
    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const paymentLink = `${process.env.BASE_URL}/payment/success?order_id=${orderId}&mock=true`;
    
    console.log('💰 TEST MODE - Payment Order Created:');
    console.log(`Order ID: ${orderId}`);
    console.log(`Amount: ₹${amount}`);
    console.log(`Service: ${serviceType}`);
    console.log(`Payment Link: ${paymentLink}`);
    console.log('='.repeat(50));
    
    return {
      success: true,
      orderId,
      amount,
      service: serviceType,
      paymentLink,
      customerInfo
    };
  }

  async verifyPayment(orderId, paymentId, signature) {
    // Mock verification - always successful in test mode
    console.log(`✅ Payment verified for order: ${orderId}`);
    
    return {
      success: true,
      orderId,
      paymentId: paymentId || `mock_pay_${Date.now()}`,
      amount: 100, // Mock amount
      status: 'captured'
    };
  }

  async generatePaymentLink(orderId, amount, serviceType) {
    const paymentLink = `${process.env.BASE_URL}/payment/success?order_id=${orderId}&amount=${amount}&service=${encodeURIComponent(serviceType)}&mock=true`;
    
    return {
      success: true,
      paymentLink,
      orderId
    };
  }
}

module.exports = new PaymentService();
