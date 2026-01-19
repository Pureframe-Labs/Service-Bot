/**
 * ============================================================================
 * WELCOME.TEMPLATE.JS - MESSAGE TEMPLATES
 * ============================================================================
 *
 * PURPOSE:
 * Define message templates for WhatsApp messages.
 * Separates message structure from business logic.
 *
 * TEMPLATES:
 * - welcomeMessage(): Welcome message with 4 service buttons
 * - serviceFlowResponse(): WhatsApp Flow trigger message for each service
 *
 * IMPORTED BY:
 * - message.controller.js
 *
 * ============================================================================
 */

/**
 * welcomeMessage() - Generate welcome message with service buttons
 *
 * CALLED BY: message.controller.js -> handleMessage() when user sends "hi"
 *
 * PURPOSE:
 * Create the interactive button message that shows all 4 land record services.
 *
 * @returns {Object} WhatsApp interactive button message structure
 *
 * MESSAGE STRUCTURE:
 * {
 *   type: "interactive",
 *   interactive: {
 *     type: "button",
 *     header: { type: "text", text: "Welcome to Land Record Services" },
 *     body: { text: "Hello! I'm here to help you..." },
 *     action: {
 *       buttons: [
 *         { type: "reply", reply: { id: "8a_service", title: "8A Form" } },
 *         { type: "reply", reply: { id: "712_service", title: "7/12 Form" } },
 *         { type: "reply", reply: { id: "ferfar_service", title: "Ferfar" } },
 *         { type: "reply", reply: { id: "property_card_service", title: "Property Card" } }
 *       ]
 *     }
 *   }
 * }
 *
 * BUTTON IDS:
 * When user clicks a button, the button's ID is sent back:
 * - "8a_service" -> User clicked "8A Form"
 * - "712_service" -> User clicked "7/12 Form"
 * - "ferfar_service" -> User clicked "Ferfar"
 * - "property_card_service" -> User clicked "Property Card"
 *
 * These IDs are handled in message.controller.js -> handleMessage()
 *
 * NOTE ON BUTTON LIMITS:
 * WhatsApp officially supports 3 buttons per message, but some accounts
 * support 4 buttons. If you see an error, reduce to 3 buttons and use
 * a list message for more options.
 *
 * FLOW:
 * User sends "hi"
 *   -> message.controller.handleMessage()
 *   -> whatsappService.sendMessage(from, welcomeMessage())
 *   -> User sees message with 4 buttons
 */
const welcomeMessage = () => {
  return {
    type: "interactive",
    interactive: {
      type: "button",
      // Header section (optional)
      header: {
        type: "text",
        text: "Welcome to Land Record Services",
      },
      // Body section (required)
      body: {
        text: "Hello! I'm here to help you with land record services. Please choose the service you need from the options below:",
      },
      // Action section with buttons
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "8a_service", // This ID is sent back when clicked
              title: "8A Form", // Button text (max 20 chars)
            },
          },
          {
            type: "reply",
            reply: {
              id: "712_service",
              title: "7/12 Form",
            },
          },
          {
            type: "reply",
            reply: {
              id: "ferfar_service",
              title: "Ferfar",
            },
          },
          {
            type: "reply",
            reply: {
              id: "property_card_service",
              title: "Property Card",
            },
          },
        ],
      },
    },
  }
}

/**
 * serviceFlowResponse() - Generate WhatsApp Flow trigger message
 *
 * CALLED BY: Can be used as alternative to buildFlowMessage() in message.controller
 *
 * PURPOSE:
 * Create the message that triggers a WhatsApp Flow for the selected service.
 * WhatsApp Flows are interactive forms that users can fill out.
 *
 * @param {string} serviceType - Service ID (e.g., "8a_service")
 * @returns {Object} WhatsApp Flow message structure
 *
 * MESSAGE STRUCTURE:
 * {
 *   type: "interactive",
 *   interactive: {
 *     type: "flow",
 *     header: { type: "text", text: "8A Form Application" },
 *     body: { text: "Please fill out the 8A form to proceed." },
 *     action: {
 *       name: "flow",
 *       parameters: {
 *         flow_message_version: "3",
 *         flow_action: "navigate",
 *         flow_id: "1234567890",      // Your Flow ID from Meta Dashboard
 *         flow_cta: "Start Form",
 *         flow_token: "8a_flow_token"
 *       }
 *     }
 *   }
 * }
 *
 * FLOW IDS:
 * These are placeholder IDs. Replace with your actual Flow IDs from Meta Dashboard:
 * 1. Go to Meta Business Suite -> WhatsApp -> Flows
 * 2. Create a new Flow for each service
 * 3. Copy the Flow ID
 * 4. Replace the placeholder IDs below or in .env file
 *
 * FLOW TOKENS:
 * The flow_token is a custom string you create. It's returned when the user
 * submits the form, allowing you to identify which flow was completed.
 */
const serviceFlowResponse = (serviceType) => {
  /**
   * Service-specific flow data
   * Contains header text, body text, and flow token for each service
   */
  const flowData = {
    "8a_service": {
      header: "8A Form Application",
      body: "Please fill out the 8A form to proceed.",
      flowToken: "8a_flow_token",
    },
    "712_service": {
      header: "7/12 Form Application",
      body: "Please fill out the 7/12 form to proceed.",
      flowToken: "712_flow_token",
    },
    ferfar_service: {
      header: "Ferfar Application",
      body: "Please fill out the Ferfar form to proceed.",
      flowToken: "ferfar_flow_token",
    },
    property_card_service: {
      header: "Property Card Application",
      body: "Please fill out the Property Card form to proceed.",
      flowToken: "property_card_flow_token",
    },
  }

  // Get flow data for the selected service
  const service = flowData[serviceType]

  /**
   * Build and return the Flow message structure
   *
   * When sent via WhatsApp API, this will display a message with a
   * "Start Form" button that opens the WhatsApp Flow (interactive form)
   */
  return {
    type: "interactive",
    interactive: {
      type: "flow", // Indicates this is a Flow message
      // Header section
      header: {
        type: "text",
        text: service.header,
      },
      // Body section
      body: {
        text: service.body,
      },
      // Action section with Flow parameters
      action: {
        name: "flow",
        parameters: {
          flow_message_version: "3", // WhatsApp Flow API version
          flow_action: "navigate", // Opens the flow
          // Flow IDs - REPLACE THESE with your actual Flow IDs from Meta Dashboard
          flow_id:
            serviceType === "8a_service"
              ? "1234567890"
              : serviceType === "712_service"
                ? "1234567891"
                : serviceType === "ferfar_service"
                  ? "1234567892"
                  : "1234567893",
          flow_cta: "Start Form", // Button text
          flow_token: service.flowToken, // Token returned on form submission
        },
      },
    },
  }
}

// Export templates for use in controllers
module.exports = { welcomeMessage, serviceFlowResponse }
