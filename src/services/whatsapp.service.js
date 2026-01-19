/**
 * ============================================================================
 * WHATSAPP.SERVICE.JS - WHATSAPP API INTEGRATION
 * ============================================================================
 *
 * PURPOSE:
 * Handle all communication with Meta's WhatsApp Business API.
 * This service is responsible for sending messages to users.
 *
 * FLOW DIAGRAM:
 *
 *   Any Controller (message, payment, webhook)
 *         |
 *         v
 *   whatsappService.sendMessage(to, message)  <-- THIS FILE
 *         |
 *         v
 *   axios.post(Meta Graph API URL)
 *         |
 *         v
 *   https://graph.facebook.com/v22.0/{phone_number_id}/messages
 *         |
 *         v
 *   Meta WhatsApp Server
 *         |
 *         v
 *   User receives message on WhatsApp
 *
 * API ENDPOINT:
 * POST https://graph.facebook.com/v22.0/{WHATSAPP_PHONE_NUMBER_ID}/messages
 *
 * REQUIRED HEADERS:
 * - Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
 * - Content-Type: application/json
 *
 * REQUEST BODY:
 * {
 *   "messaging_product": "whatsapp",
 *   "recipient_type": "individual",
 *   "to": "919876543210",
 *   "type": "text",           // or "interactive"
 *   "text": { "body": "Hello!" }  // or "interactive": { ... }
 * }
 *
 * IMPORTED BY:
 * - message.controller.js
 * - payment.controller.js
 * - webhook.controller.js
 *
 * ============================================================================
 */

const axios = require("axios")

/**
 * WhatsAppService Class
 *
 * Handles all WhatsApp API operations:
 * - sendMessage(): Main function to send any message type
 * - sendTextMessage(): Send plain text message
 * - sendInteractiveMessage(): Send message with buttons
 * - sendServiceButtons(): Send the 4 service buttons
 * - sendPaymentLink(): Send payment link message
 * - sendConfirmation(): Send payment confirmation
 */
class WhatsAppService {
  /**
   * Constructor - Initialize WhatsApp API configuration
   *
   * CONFIGURATION:
   * All configuration is loaded from environment variables:
   * - WHATSAPP_ACCESS_TOKEN: Your Meta Graph API access token
   *   Get from: Meta Business Suite -> WhatsApp -> API Setup -> Temporary Access Token
   *   Or create a permanent token: Meta Business Suite -> System Users -> Generate Token
   *
   * - WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp Business phone number ID
   *   Get from: Meta Business Suite -> WhatsApp -> Phone Numbers -> Phone Number ID
   *   Example: 945940578601053
   *
   * - WHATSAPP_API_VERSION: API version (default: v22.0)
   *   Use the latest version for new features
   */
  constructor() {
    // Load configuration from environment
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    this.apiVersion = process.env.WHATSAPP_API_VERSION || "v22.0"

    // Build base URL for Meta Graph API
    // Format: https://graph.facebook.com/v22.0
    this.baseURL = `https://graph.facebook.com/${this.apiVersion}`

    /**
     * Check if we have real credentials
     * This helps determine if we should actually send messages or just log
     *
     * Test credentials often contain "test" or are placeholder values
     */
    this.hasRealCredentials =
      this.accessToken && !this.accessToken.includes("test") && this.accessToken !== "your_whatsapp_access_token_here"

    // Log configuration (without exposing full token)
    console.log("WhatsApp Service Configuration:")
    console.log(`   Has Token: ${!!this.accessToken}`)
    console.log(`   Phone Number ID: ${this.phoneNumberId}`)
    console.log(`   API Version: ${this.apiVersion}`)
    console.log(`   Mode: ${this.hasRealCredentials ? "PRODUCTION" : "TEST (no real token)"}`)
  }

  /**
   * sendMessage() - Main function to send any type of message
   *
   * CALLED BY: All other send* methods in this service
   *
   * PURPOSE:
   * Send a message to a WhatsApp user via Meta Graph API.
   * Handles all message types: text, interactive (buttons/flows), etc.
   *
   * @param {string} to - Recipient's WhatsApp phone number (e.g., "919876543210")
   * @param {Object} message - Message object with type and content
   * @returns {Object} API response or error object
   *
   * MESSAGE OBJECT STRUCTURE (text):
   * {
   *   type: "text",
   *   text: { body: "Hello, World!" }
   * }
   *
   * MESSAGE OBJECT STRUCTURE (interactive buttons):
   * {
   *   type: "interactive",
   *   interactive: {
   *     type: "button",
   *     body: { text: "Please select:" },
   *     action: { buttons: [...] }
   *   }
   * }
   *
   * API CALL:
   * POST https://graph.facebook.com/v22.0/{phone_number_id}/messages
   * Headers:
   *   Authorization: Bearer {access_token}
   *   Content-Type: application/json
   * Body:
   *   {
   *     messaging_product: "whatsapp",
   *     recipient_type: "individual",
   *     to: "919876543210",
   *     type: "text",
   *     text: { body: "Hello!" }
   *   }
   *
   * FLOW:
   * 1. Check if we have real credentials
   * 2. If not, log the message and return mock response
   * 3. If yes, build API URL and payload
   * 4. Send POST request to Meta Graph API
   * 5. Return response or handle error
   */
  async sendMessage(to, message) {
    try {
      console.log("\n=== SENDING WHATSAPP MESSAGE ===")
      console.log(`To: ${to}`)
      console.log(`Message Type: ${message.type}`)

      // ======================================================================
      // CHECK CREDENTIALS
      // ======================================================================
      /**
       * If we don't have real credentials, don't attempt to send
       * This prevents errors during development/testing
       */
      if (!this.hasRealCredentials) {
        console.log("CANNOT SEND - Missing real WhatsApp credentials")
        console.log("   Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env")
        console.log("   Get them from: https://developers.facebook.com/apps/")
        return {
          error: "Missing WhatsApp credentials",
          test_mode: true,
          would_send: message,
        }
      }

      // Additional validation
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error("WhatsApp credentials not configured")
      }

      // ======================================================================
      // BUILD API REQUEST
      // ======================================================================
      /**
       * Build the API URL
       * Format: https://graph.facebook.com/v22.0/{phone_number_id}/messages
       */
      const url = `${this.baseURL}/${this.phoneNumberId}/messages`

      /**
       * Build the request payload
       * Meta requires specific structure for WhatsApp messages
       */
      const payload = {
        messaging_product: "whatsapp", // Required: always "whatsapp"
        recipient_type: "individual", // Required: always "individual"
        to, // Recipient phone number
        ...message, // Spread message object (type, text/interactive, etc.)
      }

      console.log(`API URL: ${url}`)
      console.log("Request Payload:", JSON.stringify(payload, null, 2))

      // ======================================================================
      // SEND API REQUEST
      // ======================================================================
      /**
       * Send POST request to Meta Graph API
       *
       * Headers:
       * - Authorization: Bearer token for authentication
       * - Content-Type: JSON for request body
       *
       * Timeout: 10 seconds to handle slow responses
       */
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      })

      console.log("WhatsApp API Response:", JSON.stringify(response.data, null, 2))
      return response.data
    } catch (error) {
      // ======================================================================
      // ERROR HANDLING
      // ======================================================================
      console.error("WhatsApp API Error:")
      console.error("Status:", error.response?.status)
      console.error("Error Data:", JSON.stringify(error.response?.data, null, 2))
      console.error("Message:", error.message)

      /**
       * Return mock response for development
       * This allows the flow to continue even if API fails
       */
      return {
        error: error.response?.data || error.message,
        test_fallback: true,
        mock_id: `mock_${Date.now()}`,
      }
    }
  }

  /**
   * sendTextMessage() - Send a plain text message
   *
   * CALLED BY: Controllers when sending simple text messages
   *
   * @param {string} to - Recipient's WhatsApp phone number
   * @param {string} text - Message text content
   * @returns {Object} API response
   *
   * EXAMPLE:
   * await whatsappService.sendTextMessage("919876543210", "Hello, World!")
   *
   * FLOW:
   * sendTextMessage() -> sendMessage() -> Meta Graph API
   */
  async sendTextMessage(to, text) {
    const message = {
      type: "text",
      text: { body: text },
    }
    return this.sendMessage(to, message)
  }

  /**
   * sendInteractiveMessage() - Send a message with buttons
   *
   * CALLED BY: Controllers when sending button options
   *
   * @param {string} to - Recipient's WhatsApp phone number
   * @param {Array} buttons - Array of button objects
   * @param {string} buttons[].id - Button ID (sent back when clicked)
   * @param {string} buttons[].title - Button text (max 20 characters)
   * @returns {Object} API response
   *
   * EXAMPLE:
   * await whatsappService.sendInteractiveMessage("919876543210", [
   *   { id: "btn_yes", title: "Yes" },
   *   { id: "btn_no", title: "No" }
   * ])
   *
   * BUTTON LIMITS:
   * - Maximum 3 buttons per message
   * - Button title max 20 characters
   * - Button ID max 256 characters
   *
   * FLOW:
   * sendInteractiveMessage() -> sendMessage() -> Meta Graph API
   */
  async sendInteractiveMessage(to, buttons) {
    const message = {
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: "Please select a service:",
        },
        action: {
          buttons: buttons.map((btn, index) => ({
            type: "reply",
            reply: {
              id: btn.id,
              title: btn.title,
            },
          })),
        },
      },
    }

    return this.sendMessage(to, message)
  }

  /**
   * sendServiceButtons() - Send the 4 land record service buttons
   *
   * CALLED BY: For direct button sending (alternative to welcome template)
   *
   * @param {string} to - Recipient's WhatsApp phone number
   * @returns {Object} API response
   *
   * BUTTONS:
   * 1. 8A Form (service_8a)
   * 2. 7/12 Form (service_712)
   * 3. Ferfar (service_ferfar)
   * 4. Property Card (service_property)
   *
   * NOTE: WhatsApp allows maximum 3 buttons per message
   * For 4 buttons, use welcome.template.js which creates 4 buttons
   *
   * FLOW:
   * sendServiceButtons() -> sendInteractiveMessage() -> sendMessage() -> Meta Graph API
   */
  async sendServiceButtons(to) {
    const buttons = [
      { id: "service_8a", title: "8A Form" },
      { id: "service_712", title: "7/12 Form" },
      { id: "service_ferfar", title: "Ferfar" },
      { id: "service_property", title: "Property Card" },
    ]

    return this.sendInteractiveMessage(to, buttons)
  }

  /**
   * sendPaymentLink() - Send payment link message
   *
   * CALLED BY: message.controller.js -> handleFlowCompletion()
   *
   * PURPOSE:
   * Send a formatted message with order details and payment link.
   *
   * @param {string} to - Recipient's WhatsApp phone number
   * @param {Object} orderDetails - Order information
   * @param {string} orderDetails.orderId - Order ID
   * @param {string} orderDetails.service - Service name
   * @param {number} orderDetails.amount - Payment amount
   * @param {string} orderDetails.paymentLink - Payment URL
   * @returns {Object} API response
   *
   * MESSAGE FORMAT:
   * "Payment Required
   *
   * Service: 8A Form
   * Amount: Rs.500
   * Order ID: ORD_123
   *
   * Please pay using this link:
   * https://your-url/payment/checkout?orderId=ORD_123
   *
   * After payment, you'll receive confirmation here."
   *
   * FLOW:
   * sendPaymentLink() -> sendTextMessage() -> sendMessage() -> Meta Graph API
   */
  async sendPaymentLink(to, orderDetails) {
    const message =
      `Payment Required\n\n` +
      `Service: ${orderDetails.service}\n` +
      `Amount: Rs.${orderDetails.amount}\n` +
      `Order ID: ${orderDetails.orderId}\n\n` +
      `Please pay using this link:\n` +
      `${orderDetails.paymentLink}\n\n` +
      `After payment, you'll receive confirmation here.`

    return this.sendTextMessage(to, message)
  }

  /**
   * sendConfirmation() - Send payment confirmation message
   *
   * CALLED BY: payment.controller.js -> sendPaymentConfirmation()
   *
   * PURPOSE:
   * Send a confirmation message after successful payment.
   *
   * @param {string} to - Recipient's WhatsApp phone number
   * @param {Object} orderDetails - Order information
   * @returns {Object} API response
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
   *
   * FLOW:
   * sendConfirmation() -> sendTextMessage() -> sendMessage() -> Meta Graph API
   */
  async sendConfirmation(to, orderDetails) {
    const message =
      `Payment Successful!\n\n` +
      `Order ID: ${orderDetails.orderId}\n` +
      `Service: ${orderDetails.service}\n` +
      `Amount: Rs.${orderDetails.amount}\n` +
      `Date: ${new Date().toLocaleDateString("en-IN")}\n\n` +
      `Your application has been received. We'll process it within 24 hours.`

    return this.sendTextMessage(to, message)
  }

  /**
   * isTestMode() - Check if service is in test mode
   *
   * @returns {boolean} True if in test mode (no real credentials)
   */
  isTestMode() {
    return !this.hasRealCredentials
  }
}

// Export singleton instance of the service
// This ensures consistent state across all controllers
module.exports = new WhatsAppService()
