/**
 * ============================================================================
 * SERVER.JS - MAIN ENTRY POINT
 * ============================================================================
 *
 * PURPOSE:
 * This is the main entry point for the WhatsApp Land Records Bot.
 * It initializes the Express server and starts listening for incoming requests.
 *
 * FLOW:
 * 1. Load environment variables from .env file
 * 2. Import the Express app from src/app.js
 * 3. Start the server on configured PORT
 * 4. Handle graceful shutdown and errors
 *
 * ROUTES SERVED (via src/app.js):
 * - GET  /health              -> Health check endpoint
 * - GET  /webhook             -> WhatsApp webhook verification
 * - POST /webhook             -> Receive WhatsApp messages (main entry)
 * - GET  /payment/checkout    -> Display payment page
 * - GET  /payment/success     -> Handle successful payment callback
 * - GET  /payment/failure     -> Handle failed payment callback
 * - GET  /test/data           -> View all stored data (dev only)
 * - POST /test/clear          -> Clear all data (dev only)
 *
 * DEPENDENCIES:
 * - dotenv: Load environment variables
 * - src/app.js: Express application with all routes configured
 *
 * ENVIRONMENT VARIABLES REQUIRED:
 * - PORT: Server port (default: 3000)
 * - WHATSAPP_ACCESS_TOKEN: Meta Graph API access token
 * - WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp Business phone number ID
 * - VERIFY_TOKEN: Custom token for webhook verification
 * - BASE_URL: Your ngrok URL (e.g., https://abc123.ngrok.io)
 *
 * ============================================================================
 */

// Load environment variables from .env file into process.env
// This MUST be the first line before importing any other modules
require("dotenv").config()

/**
 * Import the Express application
 *
 * FLOW: server.js -> src/app.js
 * The app.js file configures all middleware and routes
 */
const app = require("./src/app")

// Get port from environment or use default 3000
const PORT = process.env.PORT || 3000

// ============================================================================
// STARTUP LOGGING
// ============================================================================

console.log("\n" + "=".repeat(60))
console.log("WhatsApp Land Records Bot - Starting...")
console.log("=".repeat(60))
console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
console.log(`Port: ${PORT}`)
console.log(`Base URL: ${process.env.BASE_URL || "http://localhost:" + PORT}`)
console.log("=".repeat(60))

// ============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================================================

/**
 * Check for required environment variables
 * These are essential for the bot to function properly:
 *
 * - WHATSAPP_ACCESS_TOKEN: Used to authenticate API calls to Meta Graph API
 *   Get this from: https://developers.facebook.com/apps/ -> Your App -> WhatsApp -> API Setup
 *
 * - WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp Business phone number ID (e.g., 945940578601053)
 *   Get this from: Meta Business Suite -> WhatsApp -> Phone Numbers
 *
 * - VERIFY_TOKEN: Custom string you create for webhook verification
 *   Set this same value in Meta Dashboard when configuring webhook
 */
const requiredEnvVars = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "VERIFY_TOKEN"]

const missingVars = requiredEnvVars.filter((env) => !process.env[env])
if (missingVars.length > 0) {
  console.warn(`\nWARNING: Missing environment variables: ${missingVars.join(", ")}`)
  console.warn("   Configure them in .env file or they will be required for full functionality\n")
}

// ============================================================================
// START SERVER
// ============================================================================

/**
 * Start the Express server
 *
 * Once started, the server listens for:
 * 1. Webhook verification (GET /webhook) - Meta sends this when you configure webhook
 * 2. Incoming messages (POST /webhook) - All WhatsApp messages arrive here
 * 3. Payment callbacks (GET /payment/success, /payment/failure)
 */
const server = app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`)
  console.log("\nAvailable Endpoints:")
  console.log("   GET  /health                    - Health check")
  console.log("   GET  /webhook                   - Webhook verification")
  console.log("   POST /webhook                   - Receive messages & forms")
  console.log("   GET  /payment/checkout          - Checkout page")
  console.log("   GET  /payment/success           - Payment success callback")
  console.log("   GET  /payment/failure           - Payment failure callback")
  console.log("   GET  /test/data                 - View all data (dev only)")
  console.log("   POST /test/clear                - Clear data (dev only)")
  console.log("\nngrok Setup (for local testing):")
  console.log("   1. Run: ngrok http " + PORT)
  console.log("   2. Copy ngrok URL (e.g., https://abc123.ngrok.io)")
  console.log("   3. Set Webhook URL in Meta Dashboard: <ngrok-url>/webhook")
  console.log("   4. Test by sending 'hi' on WhatsApp")
  console.log("\nBot Status: Ready!")
  console.log("=".repeat(60) + "\n")
})

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Handle server errors
 *
 * EADDRINUSE: Port is already in use
 * This happens when:
 * - Another instance of the bot is running
 * - Another application is using the same port
 *
 * Solutions:
 * 1. Kill the process using the port
 * 2. Use a different port: PORT=3001 npm run dev
 */
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nPort ${PORT} is already in use!`)
    console.log("\nQuick Fix Options:")
    console.log(`   Option 1: Kill process on port ${PORT}`)
    console.log(`      Windows: netstat -ano | findstr :${PORT}`)
    console.log(`      Then: taskkill /PID <PID> /F`)
    console.log(`      Mac/Linux: lsof -ti:${PORT} | xargs kill -9`)
    console.log(`   Option 2: Use a different port`)
    console.log(`      Set: PORT=3001 npm run dev`)
    console.log("")
    process.exit(1)
  } else {
    throw err
  }
})

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Handle SIGTERM signal (sent by process managers like PM2, Docker, Heroku)
 * Allows the server to finish processing current requests before shutting down
 */
process.on("SIGTERM", () => {
  console.log("\nSIGTERM received, shutting down gracefully...")
  server.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})

/**
 * Handle SIGINT signal (Ctrl+C in terminal)
 * Same graceful shutdown behavior
 */
process.on("SIGINT", () => {
  console.log("\nSIGINT received, shutting down gracefully...")
  server.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})

/**
 * Handle uncaught exceptions
 * These are programming errors that should be fixed
 * Log the error and exit to prevent undefined behavior
 */
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  process.exit(1)
})

/**
 * Handle unhandled promise rejections
 * These are async errors that weren't caught
 * Log and exit to prevent undefined behavior
 */
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})
