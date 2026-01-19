require('dotenv').config();

module.exports = {
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  currency: 'INR',
  successUrl: `${process.env.BASE_URL}/payment/success`,
  failureUrl: `${process.env.BASE_URL}/payment/failure`
};
