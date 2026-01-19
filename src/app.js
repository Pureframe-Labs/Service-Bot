/**
 * ============================================================================
 * APP.JS - EXPRESS APPLICATION CONFIGURATION
 * ============================================================================
 *
 * PURPOSE:
 * This file configures the Express application with all middleware and routes.
 * It acts as the central hub connecting all route handlers.
 *
 * FLOW DIAGRAM:
 *
 *   server.js
 *       |
 *       v
 *   app.js (this file)
 *       |
 *       +---> /webhook routes --> webhook.routes.js --> webhook.controller.js
 *       |
 *       +---> /payment routes --> payment.routes.js --> payment.controller.js
 *       |
 *       +---> /health (inline handler)
 *       |
 *       +---> /test/* (inline handlers - dev only)
 *
 * MIDDLEWARE STACK:
 * 1. CORS - Allow cross-origin requests
 * 2. express.json() - Parse JSON request bodies
 * 3. express.urlencoded() - Parse URL-encoded request bodies
 *
 * ROUTES:
 * - /webhook/* -> Handles all WhatsApp webhook communication
 * - /payment/* -> Handles payment flow (checkout, success, failure)
 * - /health    -> Health check endpoint
 * - /test/*    -> Test endpoints (dev only)
 *
 * ============================================================================
 */

const express = require("express")
const cors = require("cors")

/**
 * Import route handlers
 *
 * FLOW: app.js -> routes -> controllers
 *
 * webhookRoutes handles:
 *   - GET /webhook  -> Verify webhook with Meta
 *   - POST /webhook -> Receive all WhatsApp messages
 *
 * paymentRoutes handles:
 *   - GET /payment/checkout -> Display payment page
 *   - GET /payment/success  -> Handle successful payment
 *   - GET /payment/failure  -> Handle failed payment
 */
const webhookRoutes = require("./routes/webhook.routes")
const paymentRoutes = require("./routes/payment.routes")

// Create Express application instance
const app = express()

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

/**
 * CORS Middleware
 *
 * PURPOSE: Allow cross-origin requests from browsers
 * NEEDED FOR: Payment page redirects, API calls from different domains
 *
 * In production, you may want to restrict this to specific origins:
 * app.use(cors({ origin: 'https://yourdomain.com' }))
 */
app.use(cors())

/**
 * JSON Body Parser
 *
 * PURPOSE: Parse incoming JSON request bodies
 * NEEDED FOR: WhatsApp webhook payloads (POST /webhook)
 *
 * The limit of 10mb allows for large payloads (e.g., messages with media info)
 *
 * After this middleware, req.body contains parsed JSON:
 * {
 *   "entry": [{
 *     "changes": [{
 *       "value": {
 *         "messages": [{ "from": "1234567890", "text": { "body": "hi" } }]
 *       }
 *     }]
 *   }]
 * }
 */
app.use(express.json({ limit: "10mb" }))

/**
 * URL-Encoded Body Parser
 *
 * PURPOSE: Parse form submissions (application/x-www-form-urlencoded)
 * NEEDED FOR: Payment form submissions
 */
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

/**
 * WEBHOOK ROUTES - /webhook
 *
 * FLOW:
 *   Request -> app.js -> webhook.routes.js -> webhook.controller.js
 *
 * Handles all WhatsApp communication:
 *
 * GET /webhook
 *   - Called by Meta when you configure webhook in dashboard
 *   - Verifies your server can receive messages
 *   - FLOW: webhook.routes.js -> webhookController.verify()
 *
 * POST /webhook
 *   - Called by Meta for every WhatsApp event (messages, status updates, etc.)
 *   - This is where all user messages arrive
 *   - FLOW: webhook.routes.js -> webhookController.handleWebhook()
 *           -> messageController.handleMessage() (for text/button messages)
 *           -> messageController.handleFlowCompletion() (for form submissions)
 */
app.use("/webhook", webhookRoutes)

/**
 * PAYMENT ROUTES - /payment
 *
 * FLOW:
 *   Request -> app.js -> payment.routes.js -> payment.controller.js
 *
 * Handles payment flow:
 *
 * GET /payment/checkout?orderId=XXX
 *   - Displays the payment page to the user
 *   - User clicks payment link in WhatsApp -> opens this page
 *   - FLOW: payment.routes.js -> inline handler (renders HTML form)
 *
 * GET /payment/success?orderId=XXX&paymentId=YYY
 *   - Called after successful payment
 *   - Updates order status and sends WhatsApp confirmation
 *   - FLOW: payment.routes.js -> paymentController.handleSuccess()
 *           -> database.updateOrder() -> whatsappService.sendTextMessage()
 *
 * GET /payment/failure?orderId=XXX
 *   - Called after failed payment
 *   - Updates order status and notifies user
 *   - FLOW: payment.routes.js -> paymentController.handleFailure()
 */
app.use("/payment", paymentRoutes)

// ============================================================================
// INLINE ROUTES
// ============================================================================

/**
 * HEALTH CHECK - GET /health
 *
 * PURPOSE: Quick endpoint to verify server is running
 * USED BY: Load balancers, monitoring tools, manual testing
 *
 * RESPONSE:
 * {
 *   "status": "OK",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "service": "WhatsApp Land Records Bot",
 *   "uptime": 3600
 * }
 */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "WhatsApp Land Records Bot",
    uptime: process.uptime(),
  })
})

/**
 * TEST DATA ENDPOINT - GET /test/data
 *
 * PURPOSE: View all stored data (users, orders, sessions)
 * SECURITY: Only available in non-production environments
 *
 * FLOW:
 *   GET /test/data -> database.service.js -> reads JSON files
 *
 * RESPONSE:
 * {
 *   "users": [...],
 *   "orders": [...],
 *   "sessions": [...],
 *   "stats": { "totalUsers": 5, "totalOrders": 10, ... }
 * }
 */
app.get("/test/data", (req, res) => {
  // Block in production for security
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" })
  }

  // Import database service to read data
  const db = require("./services/database.service")

  // Read all data from JSON files
  Promise.all([db.getUsers(), db.getOrders(), db.getSessions()]).then(([users, orders, sessions]) => {
    res.json({
      users,
      orders,
      sessions,
      stats: {
        totalUsers: users.length,
        totalOrders: orders.length,
        totalSessions: sessions.length,
        completedOrders: orders.filter((o) => o.status === "completed").length,
        pendingOrders: orders.filter((o) => o.status === "pending").length,
      },
    })
  })
})

/**
 * CLEAR TEST DATA - POST /test/clear
 *
 * PURPOSE: Clear all stored data (useful during development/testing)
 * SECURITY: Only available in non-production environments
 *
 * FLOW:
 *   POST /test/clear -> database.service.js -> clears JSON files
 */
app.post("/test/clear", (req, res) => {
  // Block in production for security
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" })
  }

  const db = require("./services/database.service")
  db.clearAll()

  res.json({
    message: "All test data cleared",
  })
})

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 NOT FOUND HANDLER
 *
 * PURPOSE: Handle requests to undefined routes
 * CALLED WHEN: User requests a route that doesn't exist
 *
 * Provides helpful information about available endpoints
 */
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.url}`,
    availableEndpoints: {
      webhook: {
        GET: "/webhook - Verification",
        POST: "/webhook - Receive messages",
      },
      payment: {
        GET: "/payment/checkout - Payment page",
        GET_success: "/payment/success - Success callback",
        GET_failure: "/payment/failure - Failure callback",
      },
      health: "GET /health",
      test: "GET /test/data, POST /test/clear (dev only)",
    },
  })
})

/**
 * GLOBAL ERROR HANDLER
 *
 * PURPOSE: Catch and handle all unhandled errors
 * CALLED WHEN: An error is thrown and not caught by route handlers
 *
 * In development, includes stack trace for debugging
 * In production, hides internal error details for security
 */
app.use((err, req, res, next) => {
  console.error("Server error:", err)
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    // Only include stack trace in development for debugging
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
})

// Export the configured Express application
// This is imported by server.js to start listening
module.exports = app
