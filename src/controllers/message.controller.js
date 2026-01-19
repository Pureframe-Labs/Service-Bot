/**
 * ============================================================================
 * MESSAGE.CONTROLLER.JS - MESSAGE PROCESSING LOGIC
 * ============================================================================
 *
 * PURPOSE:
 * Handle the business logic for processing user messages.
 * This is the "brain" of the bot that decides what to do based on user input.
 *
 * FLOW DIAGRAM:
 *
 *   User sends "hi"
 *         |
 *         v
 *   webhook.controller.js
 *         |
 *         v
 *   messageController.handleMessage(from, "hi")  <-- THIS FILE
 *         |
 *         v
 *   Detects "hi" keyword
 *         |
 *         v
 *   whatsappService.sendMessage(welcomeMessage)
 *         |
 *         v
 *   User receives 4 service buttons
 *
 *   -------------------------------------------
 *
 *   User clicks "8A Form" button
 *         |
 *         v
 *   messageController.handleMessage(from, "8a_service")
 *         |
 *         v
 *   triggerServiceFlow(from, "8a_service", "8A Form")
 *         |
 *         v
 *   database.createOrUpdateSession(from, {...})
 *         |
 *         v
 *   whatsappService.sendMessage(flowMessage)
 *         |
 *         v
 *   User sees WhatsApp Flow form
 *
 *   -------------------------------------------
 *
 *   User submits form
 *         |
 *         v
 *   messageController.handleFlowCompletion(from, token, formData)
 *         |
 *         v
 *   database.createOrder({...formData...})
 *         |
 *         v
 *   whatsappService.sendPaymentLink(paymentUrl)
 *         |
 *         v
 *   User receives payment link
 *
 * IMPORTED BY:
 * - webhook.controller.js
 *
 * CALLS:
 * - database.service.js - Store/retrieve user data, orders, sessions
 * - whatsapp.service.js - Send messages to users
 * - welcome.template.js - Get welcome message structure
 *
 * ============================================================================
 */

/**
 * Import database service for data operations
 * FLOW: message.controller -> database.service -> JSON files
 *
 * Used for:
 * - Creating/updating users
 * - Creating orders
 * - Managing sessions (tracking user's current step)
 */
const database = require("../services/database.service")

/**
 * Import WhatsApp service for sending messages
 * FLOW: message.controller -> whatsapp.service -> Meta Graph API
 *
 * Used for:
 * - Sending welcome message with buttons
 * - Triggering WhatsApp Flows
 * - Sending payment links
 * - Sending text messages
 */
const whatsappService = require("../services/whatsapp.service")

/**
 * Import welcome message template
 * This defines the structure of the welcome message with 4 service buttons
 */
const { welcomeMessage } = require("../templates/welcome.template")

/**
 * Import logger for consistent logging
 */
const logger = require("../utils/logger")

/**
 * MessageController Class
 *
 * Handles all message processing logic:
 * - handleMessage(): Process text and button messages
 * - triggerServiceFlow(): Open WhatsApp Flow for a service
 * - handleFlowCompletion(): Process submitted form data
 * - buildFlowMessage(): Build the Flow trigger message
 * - getServiceAmount(): Get price for each service
 */
class MessageController {
  /**
   * handleMessage() - Main message processing function
   *
   * CALLED BY: webhook.controller.js -> handleIncomingMessages()
   *
   * PURPOSE:
   * Determine what action to take based on user's message.
   * This is the main routing logic for the bot.
   *
   * SUPPORTED INPUTS:
   * - "hi", "hello", "start" -> Send welcome message with buttons
   * - "8a_service", "8a", "8a form" -> Trigger 8A form flow
   * - "712_service", "712", "7/12" -> Trigger 7/12 form flow
   * - "ferfar_service", "ferfar" -> Trigger Ferfar form flow
   * - "property_card_service", "property", "property card" -> Trigger Property Card flow
   * - Anything else -> Send "I didn't understand" message
   *
   * @param {string} from - User's WhatsApp phone number (e.g., "919876543210")
   * @param {string} messageText - The text content or button ID
   * @param {string} messageType - Message type (default: "text")
   *
   * FLOW FOR "hi":
   * 1. Log the message details
   * 2. Create/update user in database
   * 3. Detect "hi" keyword
   * 4. Call whatsappService.sendMessage(from, welcomeMessage())
   * 5. User receives welcome message with 4 buttons
   *
   * FLOW FOR "8a_service" (button click):
   * 1. Log the message details
   * 2. Create/update user in database
   * 3. Detect "8a_service" keyword
   * 4. Call triggerServiceFlow(from, "8a_service", "8A Form")
   * 5. User sees WhatsApp Flow form
   */
  async handleMessage(from, messageText, messageType = "text") {
    // Log message for debugging
    console.log(`\n=== PROCESSING MESSAGE ===`)
    console.log(`From: ${from}`)
    console.log(`Text: ${messageText}`)
    console.log(`Type: ${messageType}`)

    try {
      // ======================================================================
      // STEP 1: CREATE OR UPDATE USER
      // ======================================================================
      /**
       * Ensure user exists in database
       *
       * FLOW: message.controller -> database.upsertUser -> JSON file
       *
       * If user exists: Updates lastSeen and lastMessage
       * If user doesn't exist: Creates new user record
       */
      const user = await database.upsertUser(from, {
        whatsappId: from,
        phoneNumber: from,
        lastSeen: new Date().toISOString(),
        lastMessage: messageText,
      })

      console.log(`User: ${user.name || "New user"} (${from})`)

      // Normalize text for comparison (lowercase, trimmed)
      const text = messageText.toLowerCase().trim()

      // ======================================================================
      // STEP 2: ROUTE BASED ON MESSAGE CONTENT
      // ======================================================================

      // --------------------------------------------------------------------
      // GREETING MESSAGES -> SEND WELCOME WITH SERVICE BUTTONS
      // --------------------------------------------------------------------
      if (text === "hi" || text === "hello" || text === "start") {
        /**
         * User sent a greeting - send welcome message
         *
         * FLOW:
         * 1. Call whatsappService.sendMessage(from, welcomeMessage())
         * 2. welcomeMessage() returns interactive button message structure
         * 3. whatsappService posts to Meta Graph API
         * 4. User receives message with 4 buttons:
         *    - 8A Form
         *    - 7/12 Form
         *    - Ferfar
         *    - Property Card
         */
        console.log("Detected greeting -> Sending welcome message with service buttons")
        await whatsappService.sendMessage(from, welcomeMessage())
        return
      }

      // --------------------------------------------------------------------
      // 8A SERVICE SELECTION
      // --------------------------------------------------------------------
      if (text === "8a_service" || text === "8a" || text === "8a form") {
        /**
         * User selected 8A Form service
         *
         * FLOW:
         * 1. triggerServiceFlow(from, "8a_service", "8A Form")
         * 2. Creates session with selectedService = "8a_service"
         * 3. Sends WhatsApp Flow message
         * 4. User sees form to fill out
         */
        console.log("User selected: 8A Form -> Triggering WhatsApp Flow")
        await this.triggerServiceFlow(from, "8a_service", "8A Form")
        return
      }

      // --------------------------------------------------------------------
      // 7/12 SERVICE SELECTION
      // --------------------------------------------------------------------
      if (text === "712_service" || text === "712" || text === "7/12") {
        console.log("User selected: 7/12 Form -> Triggering WhatsApp Flow")
        await this.triggerServiceFlow(from, "712_service", "7/12 Form")
        return
      }

      // --------------------------------------------------------------------
      // FERFAR SERVICE SELECTION
      // --------------------------------------------------------------------
      if (text === "ferfar_service" || text === "ferfar") {
        console.log("User selected: Ferfar -> Triggering WhatsApp Flow")
        await this.triggerServiceFlow(from, "ferfar_service", "Ferfar")
        return
      }

      // --------------------------------------------------------------------
      // PROPERTY CARD SERVICE SELECTION
      // --------------------------------------------------------------------
      if (text === "property_card_service" || text === "property" || text === "property card") {
        console.log("User selected: Property Card -> Triggering WhatsApp Flow")
        await this.triggerServiceFlow(from, "property_card_service", "Property Card")
        return
      }

      // --------------------------------------------------------------------
      // UNRECOGNIZED MESSAGE -> SEND HELP TEXT
      // --------------------------------------------------------------------
      /**
       * Message didn't match any known command
       * Send a helpful response directing user to send "hi"
       */
      console.log("Unrecognized message -> Sending help text")
      await whatsappService.sendTextMessage(from, 'I didn\'t understand that. Type "hi" to see available services.')
    } catch (error) {
      // Log error and send user-friendly error message
      console.error("Error processing message:", error)
      await whatsappService.sendTextMessage(
        from,
        'Sorry, I encountered an error. Please try again or send "hi" to restart.',
      )
    }
  }

  /**
   * triggerServiceFlow() - Open WhatsApp Flow for selected service
   *
   * CALLED BY: handleMessage() when user selects a service
   *
   * PURPOSE:
   * Send a WhatsApp Flow message that opens an interactive form
   * for the user to fill out their details.
   *
   * @param {string} whatsappId - User's WhatsApp phone number
   * @param {string} serviceId - Service identifier (e.g., "8a_service")
   * @param {string} serviceName - Human-readable service name (e.g., "8A Form")
   *
   * FLOW:
   * 1. Create/update session with:
   *    - step: "awaiting_flow_completion"
   *    - selectedService: serviceId
   *    - serviceName: serviceName
   * 2. Build flow message using buildFlowMessage()
   * 3. Send via whatsappService.sendMessage()
   * 4. User sees WhatsApp Flow form
   *
   * SESSION TRACKING:
   * We store the selected service in the session so that when
   * the user submits the form, we know which service they selected.
   */
  async triggerServiceFlow(whatsappId, serviceId, serviceName) {
    try {
      // ======================================================================
      // STEP 1: CREATE/UPDATE SESSION
      // ======================================================================
      /**
       * Store the user's current step and selected service
       *
       * FLOW: message.controller -> database.createOrUpdateSession -> JSON file
       *
       * This session data is used when the form is submitted to:
       * - Know which service the user selected
       * - Calculate the correct price
       * - Track the user's progress through the flow
       */
      await database.createOrUpdateSession(whatsappId, {
        whatsappId,
        step: "awaiting_flow_completion", // User is now filling the form
        selectedService: serviceId, // e.g., "8a_service"
        serviceName: serviceName, // e.g., "8A Form"
        createdAt: new Date().toISOString(),
      })

      console.log(`Session created for ${whatsappId}: ${serviceName}`)

      // ======================================================================
      // STEP 2: BUILD AND SEND FLOW MESSAGE
      // ======================================================================
      /**
       * Build the WhatsApp Flow message structure
       * This message will open an interactive form in WhatsApp
       */
      const flowMessage = this.buildFlowMessage(serviceId, serviceName)

      /**
       * Send the flow message
       * FLOW: message.controller -> whatsapp.service -> Meta Graph API
       */
      await whatsappService.sendMessage(whatsappId, flowMessage)

      console.log(`Flow triggered for ${serviceName}`)
    } catch (error) {
      logger.error("Error triggering service flow:", error)
      throw error
    }
  }

  /**
   * buildFlowMessage() - Build WhatsApp Flow message structure
   *
   * CALLED BY: triggerServiceFlow()
   *
   * PURPOSE:
   * Create the message payload that triggers a WhatsApp Flow.
   * WhatsApp Flows are interactive forms that users can fill out.
   *
   * @param {string} serviceId - Service identifier (e.g., "8a_service")
   * @param {string} serviceName - Human-readable service name (e.g., "8A Form")
   * @returns {Object} WhatsApp Flow message structure
   *
   * FLOW IDS:
   * Each service has a unique Flow ID that you create in Meta Business Suite:
   * 1. Go to Meta Business Suite -> WhatsApp -> Flows
   * 2. Create a new flow with form fields
   * 3. Copy the Flow ID
   * 4. Add to .env file (e.g., WHATSAPP_FLOW_ID_8A=1234567890)
   *
   * MESSAGE STRUCTURE:
   * {
   *   type: "interactive",
   *   interactive: {
   *     type: "flow",
   *     header: { type: "text", text: "8A Form" },
   *     body: { text: "Please fill out the 8A Form..." },
   *     footer: { text: "Your data is secure..." },
   *     action: {
   *       name: "flow",
   *       parameters: {
   *         flow_message_version: "3",
   *         flow_action: "navigate",
   *         flow_id: "1234567890",
   *         flow_cta: "Start Form",
   *         flow_token: "token_timestamp_serviceId"
   *       }
   *     }
   *   }
   * }
   */
  buildFlowMessage(serviceId, serviceName) {
    /**
     * Map service IDs to Flow IDs
     *
     * IMPORTANT: Replace these with your actual Flow IDs from Meta Dashboard
     * Get Flow IDs from: Meta Business Suite -> WhatsApp -> Flows
     *
     * Store in .env file:
     * WHATSAPP_FLOW_ID_8A=your_actual_flow_id
     * WHATSAPP_FLOW_ID_712=your_actual_flow_id
     * etc.
     */
    const flowIds = {
      "8a_service": process.env.WHATSAPP_FLOW_ID_8A || "1234567890",
      "712_service": process.env.WHATSAPP_FLOW_ID_712 || "1234567891",
      ferfar_service: process.env.WHATSAPP_FLOW_ID_FERFAR || "1234567892",
      property_card_service: process.env.WHATSAPP_FLOW_ID_PROPERTY || "1234567893",
    }

    /**
     * Build the WhatsApp Flow message structure
     * This follows the Meta WhatsApp Business API format
     */
    return {
      type: "interactive",
      interactive: {
        type: "flow", // Indicates this is a Flow message
        header: {
          type: "text",
          text: serviceName, // e.g., "8A Form"
        },
        body: {
          text: `Please fill out the ${serviceName} form to proceed with your application.`,
        },
        footer: {
          text: "Your data is secure and encrypted.",
        },
        action: {
          name: "flow",
          parameters: {
            flow_message_version: "3", // WhatsApp Flow API version
            flow_action: "navigate", // Opens the flow
            flow_id: flowIds[serviceId], // Your Flow ID from Meta Dashboard
            flow_cta: "Start Form", // Button text shown to user
            flow_token: `token_${Date.now()}_${serviceId}`, // Unique token for tracking
          },
        },
      },
    }
  }

  /**
   * handleFlowCompletion() - Process submitted form data
   *
   * CALLED BY: webhook.controller.js when user submits a WhatsApp Flow form
   *
   * PURPOSE:
   * After user fills out and submits the form:
   * 1. Retrieve their session to get selected service
   * 2. Create an order with form data
   * 3. Generate payment link
   * 4. Send payment link via WhatsApp
   *
   * @param {string} whatsappId - User's WhatsApp phone number
   * @param {string} flowToken - Token from the flow submission
   * @param {Object} flowData - Parsed form data (name, district, village, etc.)
   *
   * FLOW:
   * 1. Get session to find which service user selected
   * 2. Create order with form data and calculated price
   * 3. Update session to "awaiting_payment" step
   * 4. Generate payment URL with orderId
   * 5. Send payment link message to user
   *
   * EXAMPLE flowData:
   * {
   *   name: "John Doe",
   *   email: "john@example.com",
   *   state: "Maharashtra",
   *   district: "Mumbai",
   *   tahsil: "Andheri",
   *   village: "Versova"
   * }
   */
  async handleFlowCompletion(whatsappId, flowToken, flowData) {
    try {
      console.log("\n=== FLOW COMPLETION ===")
      console.log("User:", whatsappId)
      console.log("Form Data:", JSON.stringify(flowData, null, 2))

      // ======================================================================
      // STEP 1: GET USER SESSION
      // ======================================================================
      /**
       * Retrieve the session to get the selected service
       * Session was created in triggerServiceFlow()
       *
       * FLOW: message.controller -> database.findSessionByWhatsappId -> JSON file
       */
      const session = await database.findSessionByWhatsappId(whatsappId)

      if (!session) {
        // Session expired or not found - user needs to start over
        console.log("Session not found for user:", whatsappId)
        await whatsappService.sendTextMessage(whatsappId, 'Session expired. Please start over by sending "hi".')
        return
      }

      console.log("Session found:", session.serviceName)

      // ======================================================================
      // STEP 2: CREATE ORDER
      // ======================================================================
      /**
       * Create a new order with:
       * - Generated order ID
       * - User's WhatsApp ID
       * - Selected service type
       * - Form data (name, district, etc.)
       * - Calculated amount
       * - Status: pending
       *
       * FLOW: message.controller -> database.createOrder -> JSON file
       */
      const order = await database.createOrder({
        orderId: `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        whatsappId,
        serviceType: session.serviceName,
        userData: flowData,
        amount: this.getServiceAmount(session.serviceName),
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
      })

      console.log("Order created:", order.orderId)
      console.log("Amount:", order.amount)

      // ======================================================================
      // STEP 3: UPDATE SESSION
      // ======================================================================
      /**
       * Update session to track that user is now awaiting payment
       *
       * FLOW: message.controller -> database.createOrUpdateSession -> JSON file
       */
      await database.createOrUpdateSession(whatsappId, {
        ...session,
        step: "awaiting_payment",
        orderId: order.orderId,
      })

      // ======================================================================
      // STEP 4: GENERATE PAYMENT LINK
      // ======================================================================
      /**
       * Create the payment URL
       * User will click this to open the checkout page
       *
       * URL format: https://your-ngrok-url/payment/checkout?orderId=XXX&whatsappId=YYY
       */
      const baseUrl = process.env.BASE_URL || "http://localhost:3000"
      const paymentLink = `${baseUrl}/payment/checkout?orderId=${order.orderId}&whatsappId=${whatsappId}`

      console.log("Payment link generated:", paymentLink)

      // ======================================================================
      // STEP 5: SEND PAYMENT MESSAGE
      // ======================================================================
      /**
       * Send order details and payment link to user
       *
       * FLOW: message.controller -> whatsapp.service -> Meta Graph API
       */
      const paymentMessage =
        `Thank you for filling the form!\n\n` +
        `Order ID: ${order.orderId}\n` +
        `Service: ${session.serviceName}\n` +
        `Amount: Rs.${order.amount}\n\n` +
        `Click below to proceed with payment:`

      // Send text message with order details
      await whatsappService.sendTextMessage(whatsappId, paymentMessage)

      // Send payment link using the payment link format
      await whatsappService.sendPaymentLink(whatsappId, {
        orderId: order.orderId,
        service: session.serviceName,
        amount: order.amount,
        paymentLink: paymentLink,
      })

      console.log("Payment link sent to user")
    } catch (error) {
      logger.error("Error handling flow completion:", error)
      await whatsappService.sendTextMessage(
        whatsappId,
        "An error occurred while processing your form. Please try again.",
      )
    }
  }

  /**
   * getServiceAmount() - Get price for a service
   *
   * CALLED BY: handleFlowCompletion()
   *
   * PURPOSE:
   * Return the price in INR for each service type.
   *
   * @param {string} serviceName - Human-readable service name
   * @returns {number} Price in INR
   *
   * PRICING:
   * - 8A Form: Rs.500
   * - 7/12 Form: Rs.300
   * - Ferfar: Rs.400
   * - Property Card: Rs.250
   * - Default: Rs.100
   */
  getServiceAmount(serviceName) {
    const amounts = {
      "8A Form": 500,
      "7/12 Form": 300,
      Ferfar: 400,
      "Property Card": 250,
    }
    return amounts[serviceName] || 100
  }
}

// Export singleton instance of the controller
module.exports = new MessageController()
