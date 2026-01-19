const paymentSuccessTemplate = (orderDetails) => {
  return {
    type: 'template',
    template: {
      name: 'payment_success',
      language: {
        code: 'en',
      },
      components: [
        {
          type: 'header',
          parameters: [
            {
              type: 'text',
              text: '✅ Payment Successful',
            },
          ],
        },
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: orderDetails.orderId,
            },
            {
              type: 'text',
              text: orderDetails.serviceType,
            },
            {
              type: 'text',
              text: `₹${orderDetails.amount / 100}`,
            },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 0,
          parameters: [
            {
              type: 'text',
              text: orderDetails.receiptUrl || 'https://your-domain.com/receipt',
            },
          ],
        },
      ],
    },
  };
};

const paymentFailureTemplate = () => {
  return {
    type: 'text',
    text: {
      body: '❌ Payment failed. Please try again or contact support for assistance.',
    },
  };
};

const applicationSubmittedTemplate = () => {
  return {
    type: 'text',
    text: {
      body: '✅ Your application has been submitted successfully! Our team will process it shortly. You will receive updates on WhatsApp.',
    },
  };
};

module.exports = {
  paymentSuccessTemplate,
  paymentFailureTemplate,
  applicationSubmittedTemplate,
};
