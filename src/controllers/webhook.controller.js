/**
 * ============================================================================
 * WEBHOOK.CONTROLLER.JS - WHATSAPP WEBHOOK HANDLER
 * ============================================================================
 *
 * PURPOSE:
 * Handle all incoming WhatsApp webhook events including:
 * - Webhook verification requests from Meta
 * - Incoming text messages from users
 * - Button click events (interactive messages)
 * - WhatsApp Flow form submissions
 * - Message status updates (sent, delivered, read)
 * - Error notifications
 *
 * FLOW DIAGRAM:
 *
 *   Meta WhatsApp Server
 *         |
 *         v
 *   POST /webhook (via webhook.routes.js)
 *         |
 *         v
 *   webhookController.handleWebhook() (this file)
 *         |
 *         +---> Text Message ("hi")
 *         |         |
 *         |         v
 *         |     messageController.handleMessage(from, "hi")
 *         |         |
 *         |         v
 *         |     whatsappService.sendMessage() -> User receives welcome
 *         |
 *         +---> Button Click (e.g., "8A Form")
 *         |         |
 *         |         v
 *         |     messageController.handleMessage(from, "8a_service")
 *         |         |
 *         |         v
 *         |     Triggers WhatsApp Flow -> User sees form
 *         |
 *         +---> Form Submission (WhatsApp Flow)
 *         |         |
 *         |         v
 *         |     messageController.handleFlowCompletion(from, token, data)
 *         |         |
 *         |         v
 *         |     Creates order -> Sends payment link
 *         |
 *         +---> Status Update (sent/delivered/read)
 *                   |
 *                   v
 *               Log status (no action needed)
 *
 * IMPORTED BY:
 * - webhook.routes.js
 *
 * CALLS:
 * - messageController.handleMessage() - Process text and button messages
 * - messageController.handleFlowCompletion() - Process form submissions
 * - whatsappService.sendTextMessage() - Send fallback messages
 *
 * ============================================================================
 */

// Note: handleMessage is imported but we use messageController directly below
const { handleMessage } = require("./message.controller")

/**
 * Import WhatsApp service for sending messages
 * FLOW: webhook.controller.js -> whatsapp.service.js -> Meta Graph API
 */
const whatsappService = require("../services/whatsapp.service")

/**
 * Import message controller for processing messages
 * FLOW: webhook.controller.js -> message.controller.js -> whatsapp.service.js
 */
const messageController = require("./message.controller")

/**
 * Import database service for data operations
 * FLOW: webhook.controller.js -> database.service.js -> JSON files
 */
const database = require("../services/database.service")

/**
 * WebhookController Class
 *
 * Handles all webhook-related operations:
 * - verify(): Webhook verification with Meta
 * - handleWebhook(): Main entry point for all WhatsApp events
 * - handleIncomingMessages(): Process user messages
 * - handleStatusUpdates(): Log message status changes
 * - handleErrors(): Log and handle errors
 */
class WebhookController {
  /**
   * Constructor
   *
   * Binds methods to this instance to ensure 'this' context is preserved
   * when methods are called as route handlers
   */
  constructor() {
    this.handleWebhook = this.handleWebhook.bind(this)
    this.verify = this.verify.bind(this)
  }

  // ==========================================================================
  // WEBHOOK VERIFICATION
  // ==========================================================================

  /**
   * verify() - Handle webhook verification request from Meta
   *
   * CALLED BY: GET /webhook (via webhook.routes.js)
   *
   * WHEN CALLED:
   * When you configure your webhook URL in Meta Dashboard, Meta sends
   * a GET request to verify your server can receive messages.
   *
   * FLOW:
   * 1. Meta Dashboard -> You enter webhook URL + verify token
   * 2. Meta sends: GET /webhook?hub.mode=subscribe&hub.verify_token=XXX&hub.challenge=YYY
   * 3. This function checks if hub.verify_token matches VERIFY_TOKEN env var
   * 4. If match: Returns hub.challenge (webhook verified)
   * 5. If no match: Returns 403 (verification failed)
   *
   * @param {Request} req - Express request object
   * @param {string} req.query['hub.mode'] - Should be "subscribe"
   * @param {string} req.query['hub.verify_token'] - Token to verify
   * @param {string} req.query['hub.challenge'] - Challenge to return
   * @param {Response} res - Express response object
   * @returns {Response} Challenge string on success, 403 on failure
   *
   * EXAMPLE SUCCESS:
   * Request: GET /webhook?hub.mode=subscribe&hub.verify_token=my_token&hub.challenge=123
   * Response: 200 "123"
   *
   * EXAMPLE FAILURE:
   * Request: GET /webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=123
   * Response: 403
   */
  async verify(req, res) {
    // Extract query parameters from Meta's verification request
    const mode = req.query["hub.mode"]
    const token = req.query["hub.verify_token"]
    const challenge = req.query["hub.challenge"]

    // Log verification attempt for debugging
    console.log("Webhook verification attempt:")
    console.log(`Mode: ${mode}`)
    console.log(`Token received: ${token}`)
    console.log(`Token expected: ${process.env.VERIFY_TOKEN}`)

    // Check if mode is "subscribe" and token matches our VERIFY_TOKEN
    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      console.log("Webhook verified successfully!")
      // Return the challenge to confirm verification
      return res.status(200).send(challenge)
    }

    // Verification failed - token mismatch or wrong mode
    console.log("Webhook verification failed - token mismatch")
    return res.sendStatus(403)
  }

  // ==========================================================================
  // MAIN WEBHOOK HANDLER
  // ==========================================================================

  /**
   * handleWebhook() - Main entry point for all WhatsApp events
   *
   * CALLED BY: POST /webhook (via webhook.routes.js)
   *
   * WHEN CALLED:
   * Every time something happens on WhatsApp:
   * - User sends a message
   * - User clicks a button
   * - User submits a form
   * - Message status changes (sent, delivered, read)
   * - An error occurs
   *
   * FLOW:
   * 1. Meta sends POST /webhook with event payload
   * 2. This function extracts the entry array
   * 3. For each entry, checks the changes array
   * 4. Routes to appropriate handler based on event type:
   *    - messages[] -> handleIncomingMessages()
   *    - statuses[] -> handleStatusUpdates()
   *    - errors -> handleErrors()
   * 5. ALWAYS returns 200 (even on errors - to prevent Meta retries)
   *
   * @param {Request} req - Express request object
   * @param {Object} req.body - WhatsApp webhook payload
   * @param {Response} res - Express response object
   * @returns {Response} Always returns 200 "EVENT_RECEIVED"
   *
   * REQUEST BODY STRUCTURE:
   * {
   *   "object": "whatsapp_business_account",
   *   "entry": [{
   *     "id": "BUSINESS_ACCOUNT_ID",
   *     "changes": [{
   *       "value": {
   *         "messaging_product": "whatsapp",
   *         "metadata": { "phone_number_id": "945940578601053" },
   *         "messages": [{ ... }],     // OR
   *         "statuses": [{ ... }],     // OR
   *         "errors": [{ ... }]
   *       }
   *     }]
   *   }]
   * }
   *
   * IMPORTANT:
   * ALWAYS return 200, even on errors!
   * Non-200 responses cause Meta to retry, which can lead to:
   * - Duplicate message processing
   * - Infinite retry loops
   * - Rate limiting issues
   */
  async handleWebhook(req, res) {
    try {
      // Log raw payload for debugging
      console.log("RAW WEBHOOK RECEIVED:", JSON.stringify(req.body, null, 2))

      // Extract entry array from payload
      const entryList = req.body?.entry

      // If no entry array, this is not a valid WhatsApp webhook
      if (!Array.isArray(entryList)) {
        console.log("No entry array in payload - not a valid webhook")
        return res.status(200).send("EVENT_RECEIVED")
      }

      // Process each entry (usually just one)
      for (const entry of entryList) {
        // Extract changes array from entry
        const changes = entry?.changes
        if (!Array.isArray(changes)) continue

        // Process each change
        for (const change of changes) {
          // Extract the value object containing the actual event data
          const value = change?.value
          if (!value) continue

          // Route to appropriate handler based on event type
          if (Array.isArray(value.messages)) {
            // User sent a message (text, button click, form submission)
            await this.handleIncomingMessages(value)
          } else if (Array.isArray(value.statuses)) {
            // Message status update (sent, delivered, read)
            await this.handleStatusUpdates(value)
          } else if (value.errors) {
            // Error occurred
            await this.handleErrors(value)
          } else {
            // Unknown event type - log for debugging
            console.log("Unknown webhook payload type:", Object.keys(value))
          }
        }
      }

      // ALWAYS return 200 to acknowledge receipt
      res.status(200).send("EVENT_RECEIVED")
    } catch (error) {
      // Log error but STILL return 200 to prevent Meta retries
      console.error("Webhook processing error:", error)
      res.status(200).send("EVENT_RECEIVED")
    }
  }

  // ==========================================================================
  // INCOMING MESSAGES HANDLER
  // ==========================================================================

  /**
   * handleIncomingMessages() - Process incoming user messages
   *
   * CALLED BY: handleWebhook() when value.messages exists
   *
   * HANDLES:
   * - Text messages ("hi", "hello", etc.)
   * - Interactive messages (button clicks)
   * - WhatsApp Flow submissions (form data)
   * - Button messages (older format)
   *
   * FLOW FOR TEXT MESSAGE:
   * 1. Extract message from value.messages[]
   * 2. Detect type = "text"
   * 3. Call messageController.handleMessage(from, text.body)
   * 4. messageController processes and sends response
   *
   * FLOW FOR BUTTON CLICK:
   * 1. Extract message from value.messages[]
   * 2. Detect type = "interactive"
   * 3. Extract button_reply.id (e.g., "8a_service")
   * 4. Call messageController.handleMessage(from, buttonId)
   * 5. messageController triggers WhatsApp Flow
   *
   * FLOW FOR FORM SUBMISSION:
   * 1. Extract message from value.messages[]
   * 2. Detect type = "interactive" with nfm_reply (native flow message reply)
   * 3. Parse form data from response_json
   * 4. Call messageController.handleFlowCompletion(from, token, formData)
   * 5. messageController creates order and sends payment link
   *
   * @param {Object} value - The value object from webhook payload
   * @param {Array} value.messages - Array of message objects
   *
   * MESSAGE OBJECT STRUCTURE (text):
   * {
   *   "from": "919876543210",
   *   "id": "wamid.XXX",
   *   "timestamp": "1705312800",
   *   "type": "text",
   *   "text": { "body": "hi" }
   * }
   *
   * MESSAGE OBJECT STRUCTURE (button click):
   * {
   *   "from": "919876543210",
   *   "id": "wamid.XXX",
   *   "type": "interactive",
   *   "interactive": {
   *     "type": "button_reply",
   *     "button_reply": { "id": "8a_service", "title": "8A Form" }
   *   }
   * }
   *
   * MESSAGE OBJECT STRUCTURE (form submission):
   * {
   *   "from": "919876543210",
   *   "id": "wamid.XXX",
   *   "type": "interactive",
   *   "interactive": {
   *     "type": "nfm_reply",
   *     "nfm_reply": {
   *       "response_json": "{\"name\":\"John\",\"district\":\"Mumbai\"}"
   *     }
   *   }
   * }
   */
  async handleIncomingMessages(value) {
    // Extract messages array
    const messages = value.messages || []
    console.log(`\nReceived ${messages.length} message(s)`)

    // Process each message
    for (const message of messages) {
      // Log message details for debugging
      console.log("\n--- Message Details ---")
      console.log(`From: ${message.from}`)
      console.log(`Type: ${message.type}`)
      console.log(`ID: ${message.id}`)
      console.log(`Timestamp: ${message.timestamp}`)

      try {
        // Handle based on message type
        if (message.type === "text") {
          // ----------------------------------------------------------------
          // TEXT MESSAGE
          // User typed and sent a text message
          // Examples: "hi", "hello", "help", etc.
          // ----------------------------------------------------------------
          console.log(`Text content: ${message.text.body}`)

          // FLOW: webhook.controller -> message.controller -> whatsapp.service
          await messageController.handleMessage(message.from, message.text.body)
        } else if (message.type === "interactive") {
          // ----------------------------------------------------------------
          // INTERACTIVE MESSAGE
          // User clicked a button OR submitted a WhatsApp Flow form
          // ----------------------------------------------------------------
          const interactive = message.interactive || {}

          // Check for button click (button_reply or list_reply)
          const replyId = interactive.button_reply?.id || interactive.list_reply?.id

          // Check for form submission (nfm_reply = native flow message reply)
          const flowResponse = interactive.nfm_reply?.response_json

          if (flowResponse) {
            // --------------------------------------------------------------
            // WHATSAPP FLOW FORM SUBMISSION
            // User filled and submitted a form in WhatsApp Flow
            // --------------------------------------------------------------
            console.log("WhatsApp Flow form submitted!")
            console.log("Raw response:", flowResponse)

            // Parse the JSON string into an object
            const flowData = this.parseFlowResponse(flowResponse)
            console.log("Parsed form data:", flowData)

            // FLOW: webhook.controller -> message.controller.handleFlowCompletion
            //       -> database.createOrder -> whatsapp.sendPaymentLink
            await messageController.handleFlowCompletion(message.from, flowResponse, flowData)
          } else if (replyId) {
            // --------------------------------------------------------------
            // BUTTON CLICK
            // User clicked one of the service buttons
            // Examples: "8a_service", "712_service", "ferfar_service"
            // --------------------------------------------------------------
            console.log(`Button clicked: ${replyId}`)

            // FLOW: webhook.controller -> message.controller.handleMessage
            //       -> triggerServiceFlow -> whatsapp.sendMessage (Flow trigger)
            await messageController.handleMessage(message.from, replyId)
          }
        } else if (message.type === "button") {
          // ----------------------------------------------------------------
          // BUTTON MESSAGE (older format)
          // Some older integrations use this format
          // ----------------------------------------------------------------
          console.log(`Button (old format): ${message.button.text}`)
          await messageController.handleMessage(message.from, message.button.text)
        } else {
          // ----------------------------------------------------------------
          // UNSUPPORTED MESSAGE TYPE
          // Examples: image, video, audio, document, location, etc.
          // ----------------------------------------------------------------
          console.log(`Unsupported message type: ${message.type}`)

          // Send a helpful response to the user
          await whatsappService.sendTextMessage(
            message.from,
            'I can only process text messages and forms right now. Please send "hi" to start.',
          )
        }
      } catch (err) {
        // Log error but continue processing other messages
        console.error("Error processing message:", err.message)
      }
    }
  }

  /**
   * parseFlowResponse() - Parse WhatsApp Flow form data
   *
   * CALLED BY: handleIncomingMessages() when processing form submissions
   *
   * PURPOSE:
   * WhatsApp Flow returns form data as a JSON string.
   * This function parses it into a JavaScript object.
   *
   * @param {string|Object} responseJson - The response_json from nfm_reply
   * @returns {Object} Parsed form data object
   *
   * EXAMPLE INPUT:
   * '{"name":"John Doe","district":"Mumbai","village":"Andheri"}'
   *
   * EXAMPLE OUTPUT:
   * { name: "John Doe", district: "Mumbai", village: "Andheri" }
   */
  parseFlowResponse(responseJson) {
    try {
      // If already an object, return as-is
      if (typeof responseJson === "string") {
        return JSON.parse(responseJson)
      }
      return responseJson
    } catch (error) {
      console.error("Error parsing flow response:", error)
      return {}
    }
  }

  // ==========================================================================
  // STATUS UPDATES HANDLER
  // ==========================================================================

  /**
   * handleStatusUpdates() - Process message status updates
   *
   * CALLED BY: handleWebhook() when value.statuses exists
   *
   * WHEN CALLED:
   * When a message you sent changes status:
   * - "sent": Message sent to WhatsApp servers
   * - "delivered": Message delivered to user's phone
   * - "read": User opened and read the message
   * - "failed": Message failed to send
   *
   * CURRENT BEHAVIOR:
   * Just logs the status for debugging.
   * You could extend this to:
   * - Track read receipts
   * - Retry failed messages
   * - Update order status based on message delivery
   *
   * @param {Object} value - The value object from webhook payload
   * @param {Array} value.statuses - Array of status update objects
   *
   * STATUS OBJECT STRUCTURE:
   * {
   *   "id": "wamid.XXX",
   *   "status": "delivered",
   *   "timestamp": "1705312800",
   *   "recipient_id": "919876543210"
   * }
   */
  async handleStatusUpdates(value) {
    const statuses = value.statuses || []
    console.log(`\nStatus updates received: ${statuses.length}`)

    for (const status of statuses) {
      console.log(`Message ${status.id}: ${status.status}`)
      // You could add logic here to:
      // - Track delivery rates
      // - Retry failed messages
      // - Update UI or notify admin
    }
  }

  // ==========================================================================
  // ERROR HANDLER
  // ==========================================================================

  /**
   * handleErrors() - Process error notifications from WhatsApp
   *
   * CALLED BY: handleWebhook() when value.errors exists
   *
   * WHEN CALLED:
   * When WhatsApp encounters an error, such as:
   * - Invalid phone number format
   * - Rate limiting
   * - Template not approved
   * - Access token issues
   *
   * CURRENT BEHAVIOR:
   * Logs errors for debugging and monitoring.
   * You could extend this to:
   * - Send alerts to admin
   * - Retry failed operations
   * - Update order status
   *
   * @param {Object} value - The value object from webhook payload
   * @param {Array|Object} value.errors - Error object(s)
   *
   * ERROR OBJECT STRUCTURE:
   * {
   *   "code": 131047,
   *   "title": "Re-engagement message",
   *   "message": "More than 24 hours have passed since the last message",
   *   "error_data": { ... }
   * }
   */
  async handleErrors(value) {
    // Normalize to array (errors can be array or single object)
    const errors = Array.isArray(value.errors) ? value.errors : [value.errors]

    console.log(`\nErrors received: ${errors.length}`)

    for (const error of errors) {
      console.log(`Error Code: ${error.code}`)
      console.log(`Error Title: ${error.title}`)
      console.log(`Error Message: ${error.message}`)
      // You could add alerting logic here
    }
  }
}

// Export singleton instance of the controller
// This ensures consistent state across all route handlers
module.exports = new WebhookController()
