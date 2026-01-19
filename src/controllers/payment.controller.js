/**
 * ============================================================================
 * PAYMENT.CONTROLLER.JS - PAYMENT PROCESSING LOGIC
 * ============================================================================
 *
 * PURPOSE:
 * Handle all payment-related operations including:
 * - Processing successful payments
 * - Handling failed payments
 * - Sending WhatsApp confirmations
 * - Verifying payment signatures (for Razorpay integration)
 *
 * FLOW DIAGRAM:
 *
 *   User clicks payment link in WhatsApp
 *         |
 *         v
 *   GET /payment/checkout?orderId=XXX (payment.routes.js)
 *         |
 *         v
 *   User fills payment form and submits
 *         |
 *         +---> Success ---> GET /payment/success?orderId=XXX&paymentId=YYY
 *         |                        |
 *         |                        v
 *         |                  paymentController.handleSuccess()  <-- THIS FILE
 *         |                        |
 *         |                        v
 *         |                  database.updateOrder({ status: "completed" })
 *         |                        |
 *         |                        v
 *         |                  sendPaymentConfirmation()
 *         |                        |
 *         |                        v
 *         |                  whatsappService.sendTextMessage("Payment Successful!")
 *         |                        |
 *         |                        v
 *         |                  User receives confirmation on WhatsApp
 *         |
 *         +---> Failure ---> GET /payment/failure?orderId=XXX
 *                                  |
 *                                  v
 *                            paymentController.handleFailure()
 *                                  |
 *                                  v
 *                            database.updateOrder({ status: "failed" })
 *                                  |
 *                                  v
 *                            whatsappService.sendTextMessage("Payment failed...")
 *
 * IMPORTED BY:
 * - payment.routes.js
 *
 * CALLS:
 * - database.service.js - Update order status
 * - whatsapp.service.js - Send confirmation messages
 *
 * ============================================================================
 */

/**
 * Import database service for order operations
 * FLOW: payment.controller -> database.service -> JSON files
 *
 * Used for:
 * - Finding orders by ID
 * - Updating order status (pending -> completed/failed)
 * - Updating session status
 */
const database = require("../services/database.service")

/**
 * Import WhatsApp service for sending confirmations
 * FLOW: payment.controller -> whatsapp.service -> Meta Graph API
 *
 * Used for:
 * - Sending payment success confirmation
 * - Sending payment failure notification
 */
const whatsappService = require("../services/whatsapp.service")

/**
 * Import logger for consistent logging
 */
const logger = require("../utils/logger")

/**
 * PaymentController Class
 *
 * Handles all payment-related operations:
 * - handleSuccess(): Process successful payments
 * - handleFailure(): Handle failed payments
 * - sendPaymentConfirmation(): Send WhatsApp confirmation
 * - verifyPaymentSignature(): Verify Razorpay signature
 * - createPaymentLink(): Generate payment URL
 */
class PaymentController {
  /**
   * handleSuccess() - Process successful payment
   *
   * CALLED BY: GET /payment/success (via payment.routes.js)
   *
   * WHEN CALLED:
   * 1. User completes payment on checkout page
   * 2. Payment form redirects to /payment/success with payment details
   *
   * FLOW:
   * 1. Extract orderId, paymentId, signature from query params
   * 2. Find order in database
   * 3. If mock payment: Skip signature verification
   * 4. If real payment: Verify Razorpay signature
   * 5. Update order status to "completed"
   * 6. Send WhatsApp confirmation to user
   * 7. Update session status to "completed"
   * 8. Display success HTML page
   *
   * @param {Request} req - Express request object
   * @param {string} req.query.orderId - The order ID
   * @param {string} req.query.paymentId - Payment gateway transaction ID
   * @param {string} req.query.signature - Payment gateway signature (for verification)
   * @param {string} req.query.mock - If "true", this is a test payment
   * @param {Response} res - Express response object
   * @returns {Response} HTML success page
   *
   * EXAMPLE REQUEST (mock):
   * GET /payment/success?orderId=ORD_123&paymentId=mock_456&mock=true
   *
   * EXAMPLE REQUEST (Razorpay):
   * GET /payment/success?orderId=ORD_123&paymentId=pay_789&signature=abc123
   */
  async handleSuccess(req, res) {
    try {
      // ======================================================================
      // STEP 1: EXTRACT PARAMETERS
      // ======================================================================
      const { orderId, paymentId, signature } = req.query
      const { mock } = req.body

      console.log("\n=== PAYMENT SUCCESS CALLBACK ===")
      console.log("Order ID:", orderId)
      console.log("Payment ID:", paymentId)
      console.log("Signature:", signature)
      console.log("Mock:", mock)

      // Validate required parameter
      if (!orderId) {
        return res.status(400).json({ error: "Missing orderId" })
      }

      // ======================================================================
      // STEP 2: FIND ORDER
      // ======================================================================
      /**
       * Find the order in database
       * FLOW: payment.controller -> database.findOrderByOrderId -> JSON file
       */
      const order = await database.findOrderByOrderId(orderId)

      if (!order) {
        console.error("Order not found:", orderId)
        return res.status(404).json({ error: "Order not found" })
      }

      console.log("Order found:", order.serviceType, "Amount:", order.amount)

      // ======================================================================
      // STEP 3: PROCESS MOCK PAYMENT
      // ======================================================================
      /**
       * Mock payment - used for testing without real payment gateway
       * Just update order status and send confirmation
       */
      if (mock === "true") {
        console.log("Processing mock payment...")

        // Update order status
        await database.updateOrder(orderId, {
          status: "completed",
          paymentStatus: "captured",
          paymentId: paymentId || `mock_${Date.now()}`,
          completedAt: new Date().toISOString(),
        })

        // Send WhatsApp confirmation
        await this.sendPaymentConfirmation(order.whatsappId, order)

        // Return success HTML page
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Successful</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
              .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
              .success { color: #27ae60; font-size: 32px; margin-bottom: 20px; }
              .check { font-size: 48px; }
              .message { margin: 15px 0; font-size: 16px; }
              .order-id { font-weight: bold; color: #2c3e50; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="check">&#10004;</div>
              <div class="success">Payment Successful!</div>
              <div class="message">Order ID: <span class="order-id">${orderId}</span></div>
              <div class="message">Amount: Rs.${order.amount}</div>
              <div class="message">Service: ${order.serviceType}</div>
              <div class="message" style="margin-top: 30px; color: #7f8c8d;">
                You will receive confirmation on WhatsApp shortly.
              </div>
              <div class="message">You can close this window.</div>
            </div>
          </body>
          </html>
        `)
      }

      // ======================================================================
      // STEP 4: VERIFY RAZORPAY SIGNATURE (Production)
      // ======================================================================
      /**
       * For real payments, verify the signature from Razorpay
       * This ensures the payment callback is authentic
       */
      if (paymentId && signature) {
        const verified = await this.verifyPaymentSignature(orderId, paymentId, signature)
        if (!verified) {
          return res.status(400).json({ error: "Payment verification failed" })
        }
      }

      // ======================================================================
      // STEP 5: UPDATE ORDER STATUS
      // ======================================================================
      /**
       * Update order in database
       * FLOW: payment.controller -> database.updateOrder -> JSON file
       */
      await database.updateOrder(orderId, {
        status: "completed",
        paymentStatus: "captured",
        paymentId: paymentId || "razorpay_payment_id",
        completedAt: new Date().toISOString(),
      })

      console.log("Order updated to completed")

      // ======================================================================
      // STEP 6: SEND WHATSAPP CONFIRMATION
      // ======================================================================
      /**
       * Send confirmation message to user's WhatsApp
       * FLOW: payment.controller -> sendPaymentConfirmation -> whatsapp.service
       */
      await this.sendPaymentConfirmation(order.whatsappId, order)

      // ======================================================================
      // STEP 7: UPDATE SESSION
      // ======================================================================
      /**
       * Update session to mark flow as completed
       * FLOW: payment.controller -> database.createOrUpdateSession -> JSON file
       */
      await database.createOrUpdateSession(order.whatsappId, {
        whatsappId: order.whatsappId,
        step: "completed",
        orderId: orderId,
        completedAt: new Date().toISOString(),
      })

      console.log("Session updated to completed")

      // ======================================================================
      // STEP 8: RETURN SUCCESS PAGE
      // ======================================================================
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            .success { color: #27ae60; font-size: 32px; margin-bottom: 20px; }
            .check { font-size: 48px; }
            .message { margin: 15px 0; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="check">&#10004;</div>
            <div class="success">Payment Successful!</div>
            <div class="message">Your application has been received.</div>
            <div class="message">Check WhatsApp for confirmation details.</div>
            <div class="message" style="margin-top: 30px; color: #7f8c8d;">You can close this window.</div>
          </div>
        </body>
        </html>
      `)
    } catch (error) {
      console.error("Payment success error:", error)
      // On error, redirect to failure handler
      return this.handleFailure(req, res)
    }
  }

  /**
   * handleFailure() - Handle failed payment
   *
   * CALLED BY: GET /payment/failure (via payment.routes.js)
   *
   * WHEN CALLED:
   * 1. User's payment is declined
   * 2. User cancels payment
   * 3. Payment gateway error occurs
   * 4. Error in handleSuccess()
   *
   * FLOW:
   * 1. Extract orderId from query params
   * 2. Update order status to "failed"
   * 3. Send WhatsApp notification to user
   * 4. Display failure HTML page
   *
   * @param {Request} req - Express request object
   * @param {string} req.query.orderId - The order ID that failed
   * @param {Response} res - Express response object
   * @returns {Response} HTML failure page
   */
  async handleFailure(req, res) {
    try {
      const { orderId } = req.query

      console.log("\n=== PAYMENT FAILURE ===")
      console.log("Order ID:", orderId)

      if (orderId) {
        // ====================================================================
        // UPDATE ORDER STATUS
        // ====================================================================
        /**
         * Update order to failed status
         * FLOW: payment.controller -> database.updateOrder -> JSON file
         */
        await database.updateOrder(orderId, {
          status: "failed",
          paymentStatus: "failed",
          failedAt: new Date().toISOString(),
        })

        // ====================================================================
        // SEND WHATSAPP NOTIFICATION
        // ====================================================================
        /**
         * Notify user on WhatsApp about failed payment
         * FLOW: payment.controller -> whatsapp.service -> Meta Graph API
         */
        const order = await database.findOrderByOrderId(orderId)
        if (order) {
          await whatsappService.sendTextMessage(
            order.whatsappId,
            `Payment failed for order ${orderId}. Please try again or contact support.`,
          )
        }
      }

      // ======================================================================
      // RETURN FAILURE PAGE
      // ======================================================================
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Failed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            .error { color: #e74c3c; font-size: 32px; margin-bottom: 20px; }
            .x { font-size: 48px; }
            .message { margin: 15px 0; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="x">&#10006;</div>
            <div class="error">Payment Failed</div>
            <div class="message">Your payment could not be processed.</div>
            <div class="message">Please try again or contact support.</div>
            <div class="message" style="margin-top: 30px; color: #7f8c8d;">You can close this window.</div>
          </div>
        </body>
        </html>
      `)
    } catch (error) {
      console.error("Payment failure handler error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }

  /**
   * sendPaymentConfirmation() - Send WhatsApp confirmation message
   *
   * CALLED BY: handleSuccess() after successful payment
   *
   * PURPOSE:
   * Send a detailed confirmation message to the user's WhatsApp
   * after their payment is successfully processed.
   *
   * @param {string} whatsappId - User's WhatsApp phone number
   * @param {Object} order - Order object with details
   * @param {string} order.orderId - Order ID
   * @param {string} order.serviceType - Service name
   * @param {number} order.amount - Payment amount
   *
   * FLOW:
   * sendPaymentConfirmation() -> whatsappService.sendTextMessage() -> Meta Graph API
   *
   * MESSAGE FORMAT:
   * "Payment Successful!
   *
   * Order ID: ORD_123
   * Service: 8A Form
   * Amount: Rs.500
   * Date: 15/01/2024
   *
   * Your application has been received. We'll process it within 24 hours."
   */
  async sendPaymentConfirmation(whatsappId, order) {
    try {
      const message =
        `Payment Successful!\n\n` +
        `Order ID: ${order.orderId}\n` +
        `Service: ${order.serviceType}\n` +
        `Amount: Rs.${order.amount}\n` +
        `Date: ${new Date().toLocaleDateString("en-IN")}\n\n` +
        `Your application has been received. We'll process it within 24 hours.`

      /**
       * Send confirmation message
       * FLOW: payment.controller -> whatsapp.service -> Meta Graph API
       */
      await whatsappService.sendTextMessage(whatsappId, message)

      console.log("Payment confirmation sent to:", whatsappId)
    } catch (error) {
      // Log error but don't throw - confirmation failure shouldn't break the flow
      logger.error("Error sending payment confirmation:", error)
    }
  }

  /**
   * verifyPaymentSignature() - Verify Razorpay payment signature
   *
   * CALLED BY: handleSuccess() for real payments
   *
   * PURPOSE:
   * Verify that the payment callback is authentic and came from Razorpay.
   * This prevents fake payment confirmations.
   *
   * @param {string} orderId - The order ID
   * @param {string} paymentId - Razorpay payment ID
   * @param {string} signature - Razorpay signature
   * @returns {boolean} True if signature is valid
   *
   * PRODUCTION IMPLEMENTATION:
   * In production, you would:
   * 1. Create expected signature: HMAC SHA256 of orderId|paymentId using Razorpay secret
   * 2. Compare with received signature
   * 3. Return true if match, false if not
   *
   * EXAMPLE (production):
   * const expectedSignature = crypto
   *   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
   *   .update(orderId + '|' + paymentId)
   *   .digest('hex');
   * return expectedSignature === signature;
   */
  async verifyPaymentSignature(orderId, paymentId, signature) {
    try {
      // TODO: Implement Razorpay signature verification in production
      // For now, accept all signatures (testing only)
      console.log("Verifying payment signature:", { orderId, paymentId })

      // In production, verify with Razorpay:
      // const crypto = require('crypto');
      // const generatedSignature = crypto
      //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      //   .update(orderId + '|' + paymentId)
      //   .digest('hex');
      // return generatedSignature === signature;

      return true // Accept all in test mode
    } catch (error) {
      logger.error("Error verifying payment:", error)
      return false
    }
  }

  /**
   * createPaymentLink() - Generate payment URL for an order
   *
   * PURPOSE:
   * Create a payment URL that the user can click to open the checkout page.
   *
   * @param {string} orderId - The order ID to generate link for
   * @returns {string} Payment URL
   * @throws {Error} If order not found
   *
   * URL FORMAT:
   * https://your-ngrok-url/payment/checkout?orderId=ORD_123
   *
   * FLOW:
   * createPaymentLink() -> database.findOrderByOrderId() -> generate URL
   */
  async createPaymentLink(orderId) {
    try {
      // Find order to validate it exists
      const order = await database.findOrderByOrderId(orderId)
      if (!order) {
        throw new Error("Order not found")
      }

      // Generate payment URL
      const baseUrl = process.env.BASE_URL || "http://localhost:3000"
      const paymentLink = `${baseUrl}/payment/checkout?orderId=${orderId}`

      console.log("Payment link created:", paymentLink)
      return paymentLink
    } catch (error) {
      logger.error("Error creating payment link:", error)
      throw error
    }
  }
}

// Export singleton instance of the controller
module.exports = new PaymentController()
