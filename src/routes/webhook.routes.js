/**
 * ============================================================================
 * WEBHOOK.ROUTES.JS - WHATSAPP WEBHOOK ROUTE DEFINITIONS
 * ============================================================================
 *
 * PURPOSE:
 * Define routes for WhatsApp webhook communication.
 * This file connects HTTP endpoints to their controller functions.
 *
 * FLOW DIAGRAM:
 *
 *   Meta WhatsApp Server
 *         |
 *         v
 *   ngrok (https://abc123.ngrok.io/webhook)
 *         |
 *         v
 *   app.js (app.use("/webhook", webhookRoutes))
 *         |
 *         v
 *   webhook.routes.js (this file)
 *         |
 *         +---> GET / ---> webhookController.verify()
 *         |
 *         +---> POST / ---> webhookController.handleWebhook()
 *                               |
 *                               v
 *                         messageController.handleMessage()
 *                               |
 *                               v
 *                         whatsappService.sendMessage()
 *
 * ROUTES DEFINED:
 *
 * GET /webhook
 *   - Purpose: Webhook verification by Meta
 *   - When called: When you configure webhook URL in Meta Dashboard
 *   - Controller: webhookController.verify()
 *   - Expected query params: hub.mode, hub.verify_token, hub.challenge
 *
 * POST /webhook
 *   - Purpose: Receive all WhatsApp events (messages, status updates, errors)
 *   - When called: Every time a user sends a message or interacts with the bot
 *   - Controller: webhookController.handleWebhook()
 *   - Request body: WhatsApp webhook payload (JSON)
 *
 * ============================================================================
 */

const express = require("express")

// Create a new router instance
// This allows us to define routes that will be mounted at /webhook
const router = express.Router()

/**
 * Import the webhook controller
 *
 * FLOW: webhook.routes.js -> webhook.controller.js
 *
 * The controller contains the actual logic for:
 * - Verifying webhook tokens
 * - Processing incoming messages
 * - Routing messages to appropriate handlers
 */
const webhookController = require("../controllers/webhook.controller")

/**
 * ============================================================================
 * GET /webhook - WEBHOOK VERIFICATION
 * ============================================================================
 *
 * PURPOSE:
 * Verify the webhook with Meta (Facebook) when you first configure it.
 *
 * WHEN CALLED:
 * 1. You go to Meta Dashboard -> WhatsApp -> Configuration
 * 2. You enter your webhook URL: https://your-ngrok-url/webhook
 * 3. You enter your verify token (same as VERIFY_TOKEN in .env)
 * 4. Meta sends a GET request to verify your server
 *
 * FLOW:
 *   Meta Dashboard
 *       -> GET https://your-ngrok-url/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=RANDOM
 *       -> webhook.routes.js (this route)
 *       -> webhookController.verify()
 *       -> Checks if hub.verify_token matches VERIFY_TOKEN env var
 *       -> Returns hub.challenge if valid (Meta considers webhook verified)
 *       -> Returns 403 if invalid
 *
 * QUERY PARAMETERS (sent by Meta):
 * - hub.mode: Should be "subscribe"
 * - hub.verify_token: The token you configured in Meta Dashboard
 * - hub.challenge: Random string that must be returned to confirm verification
 *
 * EXAMPLE REQUEST:
 * GET /webhook?hub.mode=subscribe&hub.verify_token=my_secret_token&hub.challenge=1234567890
 *
 * EXAMPLE RESPONSE (success):
 * Status: 200
 * Body: 1234567890
 *
 * EXAMPLE RESPONSE (failure):
 * Status: 403
 */
router.get("/", webhookController.verify)

/**
 * ============================================================================
 * POST /webhook - RECEIVE WHATSAPP MESSAGES
 * ============================================================================
 *
 * PURPOSE:
 * Receive all WhatsApp events including messages, button clicks,
 * form submissions, status updates, and errors.
 *
 * WHEN CALLED:
 * - Every time a user sends a text message
 * - Every time a user clicks a button
 * - Every time a user submits a WhatsApp Flow form
 * - Every time a message status changes (sent, delivered, read)
 *
 * FLOW FOR TEXT MESSAGE ("hi"):
 *   User sends "hi" on WhatsApp
 *       -> Meta WhatsApp Server receives message
 *       -> Meta sends POST to your webhook URL
 *       -> webhook.routes.js (this route)
 *       -> webhookController.handleWebhook()
 *       -> Extracts message from payload
 *       -> messageController.handleMessage(from, "hi")
 *       -> Detects "hi" keyword
 *       -> whatsappService.sendMessage(from, welcomeMessage)
 *       -> User receives welcome message with 4 buttons
 *
 * FLOW FOR BUTTON CLICK (e.g., "8A Form"):
 *   User clicks "8A Form" button
 *       -> Meta sends POST to webhook
 *       -> webhookController.handleWebhook()
 *       -> Detects interactive message with button_reply.id = "8a_service"
 *       -> messageController.handleMessage(from, "8a_service")
 *       -> Triggers WhatsApp Flow for 8A form
 *       -> User sees form to fill
 *
 * FLOW FOR FORM SUBMISSION:
 *   User submits form in WhatsApp Flow
 *       -> Meta sends POST to webhook with nfm_reply data
 *       -> webhookController.handleWebhook()
 *       -> Detects nfm_reply (form data)
 *       -> messageController.handleFlowCompletion(from, flowToken, formData)
 *       -> Creates order in database
 *       -> Sends payment link to user
 *
 * REQUEST BODY STRUCTURE:
 * {
 *   "object": "whatsapp_business_account",
 *   "entry": [{
 *     "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
 *     "changes": [{
 *       "value": {
 *         "messaging_product": "whatsapp",
 *         "metadata": {
 *           "display_phone_number": "15551234567",
 *           "phone_number_id": "945940578601053"
 *         },
 *         "messages": [{
 *           "from": "USER_PHONE_NUMBER",
 *           "id": "wamid.XXX",
 *           "timestamp": "1234567890",
 *           "type": "text",
 *           "text": { "body": "hi" }
 *         }]
 *       },
 *       "field": "messages"
 *     }]
 *   }]
 * }
 *
 * IMPORTANT:
 * - ALWAYS return 200 status, even on errors
 * - If you return non-200, Meta will retry the request
 * - This can cause duplicate message processing
 *
 * EXAMPLE RESPONSE:
 * Status: 200
 * Body: "EVENT_RECEIVED"
 */
router.post("/", webhookController.handleWebhook)

// Export the router to be used in app.js
// app.use("/webhook", webhookRoutes) mounts these routes at /webhook
module.exports = router
