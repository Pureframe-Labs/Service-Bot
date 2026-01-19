/**
 * ============================================================================
 * PAYMENT.ROUTES.JS - PAYMENT FLOW ROUTE DEFINITIONS
 * ============================================================================
 *
 * PURPOSE:
 * Define routes for the payment flow including checkout page,
 * success callback, and failure callback.
 *
 * FLOW DIAGRAM:
 *
 *   User clicks payment link in WhatsApp
 *         |
 *         v
 *   GET /payment/checkout?orderId=XXX
 *         |
 *         v
 *   User fills payment form and submits
 *         |
 *         +---> Payment Success ---> GET /payment/success?orderId=XXX&paymentId=YYY
 *         |                                |
 *         |                                v
 *         |                          paymentController.handleSuccess()
 *         |                                |
 *         |                                v
 *         |                          Update order status + Send WhatsApp confirmation
 *         |
 *         +---> Payment Failed ---> GET /payment/failure?orderId=XXX
 *                                         |
 *                                         v
 *                                   paymentController.handleFailure()
 *                                         |
 *                                         v
 *                                   Update order status + Notify user
 *
 * ROUTES DEFINED:
 *
 * GET /payment/checkout
 *   - Purpose: Display payment page to user
 *   - Query params: orderId (required), whatsappId (optional)
 *   - Returns: HTML payment form
 *
 * GET /payment/success
 *   - Purpose: Handle successful payment callback
 *   - Query params: orderId, paymentId, signature (for Razorpay)
 *   - Controller: paymentController.handleSuccess()
 *
 * GET /payment/failure
 *   - Purpose: Handle failed payment callback
 *   - Query params: orderId
 *   - Controller: paymentController.handleFailure()
 *
 * ============================================================================
 */

const express = require("express")

// Create a new router instance
// Routes defined here will be mounted at /payment
const router = express.Router()

/**
 * Import the payment controller
 *
 * FLOW: payment.routes.js -> payment.controller.js
 *
 * The controller contains logic for:
 * - Processing successful payments
 * - Handling payment failures
 * - Sending confirmations via WhatsApp
 */
const paymentController = require("../controllers/payment.controller")

/**
 * ============================================================================
 * GET /payment/success - PAYMENT SUCCESS CALLBACK
 * ============================================================================
 *
 * PURPOSE:
 * Handle the callback when a payment is completed successfully.
 *
 * WHEN CALLED:
 * 1. User completes payment on checkout page
 * 2. Payment form redirects to this URL with payment details
 *
 * FLOW:
 *   User completes payment
 *       -> Redirect to /payment/success?orderId=XXX&paymentId=YYY&mock=true
 *       -> payment.routes.js (this route)
 *       -> paymentController.handleSuccess()
 *       -> database.updateOrder(orderId, { status: "completed" })
 *       -> whatsappService.sendTextMessage(whatsappId, "Payment Successful!")
 *       -> Display success HTML page
 *
 * QUERY PARAMETERS:
 * - orderId (required): The order ID to mark as paid
 * - paymentId (optional): Payment gateway transaction ID
 * - signature (optional): Payment gateway signature for verification
 * - mock (optional): If "true", simulate payment without real gateway
 *
 * EXAMPLE REQUEST:
 * GET /payment/success?orderId=ORD_1705312800_abc123&paymentId=pay_123&mock=true
 *
 * EXAMPLE RESPONSE:
 * Status: 200
 * Body: HTML success page with order details
 *
 * WHAT HAPPENS AFTER:
 * 1. Order status updated to "completed" in database
 * 2. Payment status updated to "captured"
 * 3. User receives WhatsApp confirmation message
 * 4. Session status updated to "completed"
 */
router.get("/success", paymentController.handleSuccess.bind(paymentController))

/**
 * ============================================================================
 * GET /payment/failure - PAYMENT FAILURE CALLBACK
 * ============================================================================
 *
 * PURPOSE:
 * Handle the callback when a payment fails.
 *
 * WHEN CALLED:
 * 1. User's payment is declined
 * 2. User cancels payment
 * 3. Payment gateway error occurs
 *
 * FLOW:
 *   Payment fails
 *       -> Redirect to /payment/failure?orderId=XXX
 *       -> payment.routes.js (this route)
 *       -> paymentController.handleFailure()
 *       -> database.updateOrder(orderId, { status: "failed" })
 *       -> whatsappService.sendTextMessage(whatsappId, "Payment failed...")
 *       -> Display failure HTML page
 *
 * QUERY PARAMETERS:
 * - orderId (required): The order ID that failed payment
 *
 * EXAMPLE REQUEST:
 * GET /payment/failure?orderId=ORD_1705312800_abc123
 *
 * EXAMPLE RESPONSE:
 * Status: 200
 * Body: HTML failure page with retry instructions
 */
router.get("/failure", paymentController.handleFailure.bind(paymentController))

/**
 * ============================================================================
 * GET /payment/checkout - CHECKOUT PAGE
 * ============================================================================
 *
 * PURPOSE:
 * Display the payment checkout page where users enter payment details.
 *
 * WHEN CALLED:
 * 1. User clicks payment link received in WhatsApp message
 *
 * FLOW:
 *   User receives payment link in WhatsApp
 *       -> Clicks link: https://your-ngrok-url/payment/checkout?orderId=XXX
 *       -> payment.routes.js (this route)
 *       -> Renders HTML payment form
 *       -> User fills form and submits
 *       -> Form submits to /payment/success (mock) or Razorpay (production)
 *
 * QUERY PARAMETERS:
 * - orderId (required): The order to pay for
 * - whatsappId (optional): User's WhatsApp ID for reference
 *
 * EXAMPLE REQUEST:
 * GET /payment/checkout?orderId=ORD_1705312800_abc123&whatsappId=919876543210
 *
 * EXAMPLE RESPONSE:
 * Status: 200
 * Body: HTML checkout page with:
 *   - Order details (ID, amount, service)
 *   - Payment form (email, card number - for testing)
 *   - Pay Now button (submits to /payment/success in mock mode)
 *
 * MOCK vs PRODUCTION:
 * - Mock: Form submits to /payment/success?mock=true (for testing)
 * - Production: Integrate Razorpay SDK to process real payments
 */
router.get("/checkout", (req, res) => {
  // Extract query parameters
  const { orderId, whatsappId } = req.query

  // Validate required parameter
  if (!orderId) {
    return res.status(400).send("Missing orderId parameter")
  }

  /**
   * RENDER CHECKOUT PAGE
   *
   * This is a mock payment page for testing.
   * In production, you would:
   * 1. Fetch order details from database
   * 2. Initialize Razorpay with order amount
   * 3. Render Razorpay payment button
   *
   * FORM FLOW:
   * 1. User enters email and test card number
   * 2. Form submits via GET to /payment/success
   * 3. Hidden fields pass orderId, mock=true, paymentId
   * 4. paymentController.handleSuccess() processes the payment
   */
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Checkout - Payment</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 30px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; margin-top: 0; }
        .order-info { background: #ecf0f1; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .order-info p { margin: 10px 0; }
        .form-group { margin: 20px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #2c3e50; }
        input { width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 4px; box-sizing: border-box; }
        button { background: #27ae60; color: white; padding: 12px 30px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; }
        button:hover { background: #229954; }
        .test-info { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Secure Checkout</h1>
        
        <!-- Order Details Section -->
        <div class="order-info">
          <p><strong>Order ID:</strong> ${orderId}</p>
        </div>
        
        <!-- Test Mode Notice -->
        <div class="test-info">
          <strong>Test Mode:</strong> Click "Pay Now" to simulate a successful payment.
          <br>In production, this would connect to Razorpay.
        </div>

        <!-- 
          PAYMENT FORM
          
          FLOW:
          1. User fills email and card (test values)
          2. Form submits via GET method
          3. Action URL: /payment/success
          4. Hidden fields: orderId, mock=true, paymentId
          5. paymentController.handleSuccess() receives these as req.query
          6. Updates order and sends WhatsApp confirmation
        -->
        <form method="GET" action="/payment/success">
          <!-- Hidden fields for payment processing -->
          <input type="hidden" name="orderId" value="${orderId}">
          <input type="hidden" name="mock" value="true">
          <input type="hidden" name="paymentId" value="mock_payment_${Date.now()}">
          
          <!-- Email field -->
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" required placeholder="your@email.com">
          </div>
          
          <!-- Card number field (test only) -->
          <div class="form-group">
            <label>Card Number (test: 4111111111111111)</label>
            <input type="text" name="card" placeholder="4111111111111111" required>
          </div>
          
          <!-- Submit button -->
          <button type="submit">Pay Now</button>
        </form>
      </div>
    </body>
    </html>
  `)
})

// Export the router to be used in app.js
// app.use("/payment", paymentRoutes) mounts these routes at /payment
module.exports = router
