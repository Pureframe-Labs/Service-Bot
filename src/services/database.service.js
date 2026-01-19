/**
 * ============================================================================
 * DATABASE.SERVICE.JS - JSON FILE-BASED DATABASE
 * ============================================================================
 *
 * PURPOSE:
 * Provide a simple file-based database using JSON files.
 * Stores users, orders, and sessions in the /data folder.
 *
 * DATA STRUCTURE:
 *
 *   /data
 *     |-- users.json      -> Array of user objects
 *     |-- orders.json     -> Array of order objects
 *     |-- sessions.json   -> Array of session objects
 *
 * FLOW DIAGRAM:
 *
 *   Any Controller
 *         |
 *         v
 *   database.createUser() / database.createOrder() / etc.  <-- THIS FILE
 *         |
 *         v
 *   fs.readFile() / fs.writeFile()
 *         |
 *         v
 *   /data/*.json files
 *
 * USAGE:
 * const database = require('./services/database.service');
 * await database.createUser({ whatsappId: "919876543210", name: "John" });
 * await database.createOrder({ orderId: "ORD_123", amount: 500 });
 *
 * IMPORTED BY:
 * - message.controller.js
 * - payment.controller.js
 * - webhook.controller.js
 * - app.js (test endpoints)
 *
 * NOTE: For production, consider using a real database like:
 * - MongoDB (for flexibility)
 * - PostgreSQL (for ACID compliance)
 * - Firebase Firestore (for real-time sync)
 *
 * ============================================================================
 */

const fs = require("fs").promises
const path = require("path")

/**
 * DatabaseService Class
 *
 * Provides CRUD operations for:
 * - Users: People who interact with the bot
 * - Orders: Service requests with payment status
 * - Sessions: Track user's current step in the flow
 */
class DatabaseService {
  /**
   * Constructor - Initialize database paths and create files
   *
   * CONFIGURATION:
   * - DATA_DIR: Directory for JSON files (default: ./data)
   *
   * FILES CREATED:
   * - users.json: Stores user information
   * - orders.json: Stores order/payment information
   * - sessions.json: Stores user session state
   */
  constructor() {
    // Get data directory from environment or use default
    this.dataDir = process.env.DATA_DIR || "./data"

    // Define file paths
    this.usersFile = path.join(this.dataDir, "users.json")
    this.ordersFile = path.join(this.dataDir, "orders.json")
    this.sessionsFile = path.join(this.dataDir, "sessions.json")

    // Initialize data directory and files
    this.init()
  }

  /**
   * init() - Initialize database directory and files
   *
   * CALLED BY: Constructor on startup
   *
   * FLOW:
   * 1. Create /data directory if it doesn't exist
   * 2. For each file (users, orders, sessions):
   *    - Check if file exists
   *    - If not, create with empty array []
   */
  async init() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true })

      // Define files to initialize
      const files = [
        { path: this.usersFile, default: [] },
        { path: this.ordersFile, default: [] },
        { path: this.sessionsFile, default: [] },
      ]

      // Create each file if it doesn't exist
      for (const file of files) {
        try {
          await fs.access(file.path) // Check if file exists
        } catch {
          // File doesn't exist - create it with default value
          await fs.writeFile(file.path, JSON.stringify(file.default, null, 2))
        }
      }

      console.log("Database initialized successfully")
      console.log(`   Data directory: ${this.dataDir}`)
    } catch (error) {
      console.error("Database initialization failed:", error)
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * readFile() - Read and parse JSON file
   *
   * @param {string} filePath - Path to JSON file
   * @returns {Array} Parsed array from file, or empty array on error
   *
   * FLOW:
   * readFile() -> fs.readFile() -> JSON.parse() -> return array
   */
  async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, "utf8")
      return JSON.parse(data)
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error)
      return []
    }
  }

  /**
   * writeFile() - Write array to JSON file
   *
   * @param {string} filePath - Path to JSON file
   * @param {Array} data - Array to write
   * @returns {boolean} True on success, false on error
   *
   * FLOW:
   * writeFile() -> JSON.stringify() -> fs.writeFile() -> return success
   */
  async writeFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2))
      return true
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error)
      return false
    }
  }

  // ==========================================================================
  // USER OPERATIONS
  // ==========================================================================

  /**
   * createUser() - Create a new user
   *
   * CALLED BY: upsertUser() when user doesn't exist
   *
   * @param {Object} userData - User data to create
   * @param {string} userData.whatsappId - User's WhatsApp phone number
   * @param {string} userData.name - User's name (optional)
   * @returns {Object} Created user object
   *
   * USER OBJECT STRUCTURE:
   * {
   *   id: "user_1705312800_abc123",
   *   whatsappId: "919876543210",
   *   phoneNumber: "919876543210",
   *   name: "John Doe",
   *   createdAt: "2024-01-15T10:00:00.000Z",
   *   updatedAt: "2024-01-15T10:00:00.000Z"
   * }
   *
   * FLOW:
   * createUser() -> readFile() -> add user -> writeFile()
   */
  async createUser(userData) {
    const users = await this.readFile(this.usersFile)

    // Create new user with generated ID and timestamps
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    users.push(newUser)
    await this.writeFile(this.usersFile, users)
    return newUser
  }

  /**
   * findUserByWhatsappId() - Find user by WhatsApp phone number
   *
   * CALLED BY: upsertUser(), controllers
   *
   * @param {string} whatsappId - User's WhatsApp phone number
   * @returns {Object|undefined} User object or undefined if not found
   *
   * FLOW:
   * findUserByWhatsappId() -> readFile() -> find() -> return user
   */
  async findUserByWhatsappId(whatsappId) {
    const users = await this.readFile(this.usersFile)
    return users.find((user) => user.whatsappId === whatsappId)
  }

  /**
   * findUserById() - Find user by internal ID
   *
   * @param {string} id - User's internal ID
   * @returns {Object|undefined} User object or undefined if not found
   */
  async findUserById(id) {
    const users = await this.readFile(this.usersFile)
    return users.find((user) => user.id === id)
  }

  /**
   * updateUser() - Update existing user
   *
   * CALLED BY: upsertUser() when user exists
   *
   * @param {string} whatsappId - User's WhatsApp phone number
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated user or null if not found
   *
   * FLOW:
   * updateUser() -> readFile() -> find user -> merge updates -> writeFile()
   */
  async updateUser(whatsappId, updates) {
    const users = await this.readFile(this.usersFile)
    const userIndex = users.findIndex((user) => user.whatsappId === whatsappId)

    if (userIndex === -1) {
      return null
    }

    // Merge updates with existing user data
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await this.writeFile(this.usersFile, users)
    return users[userIndex]
  }

  /**
   * upsertUser() - Create or update user
   *
   * CALLED BY: message.controller.js -> handleMessage()
   *
   * PURPOSE:
   * If user exists: Update their data
   * If user doesn't exist: Create new user
   *
   * @param {string} whatsappId - User's WhatsApp phone number
   * @param {Object} userData - User data to create/update
   * @returns {Object} Created or updated user
   *
   * FLOW:
   * upsertUser() -> findUserByWhatsappId()
   *   -> If exists: updateUser()
   *   -> If not: createUser()
   */
  async upsertUser(whatsappId, userData) {
    const existingUser = await this.findUserByWhatsappId(whatsappId)

    if (existingUser) {
      return this.updateUser(whatsappId, userData)
    } else {
      return this.createUser({ whatsappId, ...userData })
    }
  }

  // ==========================================================================
  // ORDER OPERATIONS
  // ==========================================================================

  /**
   * createOrder() - Create a new order
   *
   * CALLED BY: message.controller.js -> handleFlowCompletion()
   *
   * @param {Object} orderData - Order data to create
   * @param {string} orderData.orderId - Order ID (can be provided or generated)
   * @param {string} orderData.whatsappId - User's WhatsApp phone number
   * @param {string} orderData.serviceType - Service name (e.g., "8A Form")
   * @param {Object} orderData.userData - Form data from user
   * @param {number} orderData.amount - Payment amount
   * @returns {Object} Created order object
   *
   * ORDER OBJECT STRUCTURE:
   * {
   *   id: "order_1705312800_abc123",
   *   orderId: "ORD1705312800123",
   *   whatsappId: "919876543210",
   *   serviceType: "8A Form",
   *   userData: { name: "John", district: "Mumbai" },
   *   amount: 500,
   *   status: "pending",           // pending -> completed/failed
   *   paymentStatus: "pending",    // pending -> captured/failed
   *   createdAt: "2024-01-15T10:00:00.000Z",
   *   updatedAt: "2024-01-15T10:00:00.000Z"
   * }
   *
   * FLOW:
   * createOrder() -> readFile() -> add order -> writeFile()
   */
  async createOrder(orderData) {
    const orders = await this.readFile(this.ordersFile)

    // Create new order with generated IDs and timestamps
    const newOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      orderId: orderData.orderId || `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`,
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "pending",
      paymentStatus: "pending",
    }

    orders.push(newOrder)
    await this.writeFile(this.ordersFile, orders)
    return newOrder
  }

  /**
   * findOrderById() - Find order by internal ID
   *
   * @param {string} id - Order's internal ID
   * @returns {Object|undefined} Order object or undefined if not found
   */
  async findOrderById(id) {
    const orders = await this.readFile(this.ordersFile)
    return orders.find((order) => order.id === id)
  }

  /**
   * findOrderByOrderId() - Find order by order ID (e.g., ORD_123)
   *
   * CALLED BY: payment.controller.js -> handleSuccess(), handleFailure()
   *
   * @param {string} orderId - Order ID (e.g., "ORD_1705312800_abc123")
   * @returns {Object|undefined} Order object or undefined if not found
   *
   * FLOW:
   * findOrderByOrderId() -> readFile() -> find() -> return order
   */
  async findOrderByOrderId(orderId) {
    const orders = await this.readFile(this.ordersFile)
    return orders.find((order) => order.orderId === orderId)
  }

  /**
   * findOrdersByWhatsappId() - Find all orders for a user
   *
   * @param {string} whatsappId - User's WhatsApp phone number
   * @returns {Array} Array of order objects
   */
  async findOrdersByWhatsappId(whatsappId) {
    const orders = await this.readFile(this.ordersFile)
    return orders.filter((order) => order.whatsappId === whatsappId)
  }

  /**
   * updateOrder() - Update existing order
   *
   * CALLED BY: payment.controller.js -> handleSuccess(), handleFailure()
   *
   * @param {string} orderId - Order ID to update
   * @param {Object} updates - Fields to update (status, paymentStatus, etc.)
   * @returns {Object|null} Updated order or null if not found
   *
   * COMMON UPDATES:
   * - { status: "completed", paymentStatus: "captured" } - Payment successful
   * - { status: "failed", paymentStatus: "failed" } - Payment failed
   *
   * FLOW:
   * updateOrder() -> readFile() -> find order -> merge updates -> writeFile()
   */
  async updateOrder(orderId, updates) {
    const orders = await this.readFile(this.ordersFile)
    const orderIndex = orders.findIndex((order) => order.orderId === orderId)

    if (orderIndex === -1) {
      return null
    }

    // Merge updates with existing order data
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await this.writeFile(this.ordersFile, orders)
    return orders[orderIndex]
  }

  // ==========================================================================
  // SESSION OPERATIONS
  // ==========================================================================

  /**
   * createSession() - Create a new session
   *
   * CALLED BY: createOrUpdateSession() when session doesn't exist
   *
   * @param {Object} sessionData - Session data to create
   * @param {string} sessionData.whatsappId - User's WhatsApp phone number
   * @param {string} sessionData.step - Current step in flow
   * @param {string} sessionData.selectedService - Selected service ID
   * @returns {Object} Created session object
   *
   * SESSION OBJECT STRUCTURE:
   * {
   *   id: "session_1705312800_abc123",
   *   whatsappId: "919876543210",
   *   step: "awaiting_flow_completion",  // or "awaiting_payment", "completed"
   *   selectedService: "8a_service",
   *   serviceName: "8A Form",
   *   orderId: "ORD_123",  // Added after order creation
   *   createdAt: "2024-01-15T10:00:00.000Z",
   *   updatedAt: "2024-01-15T10:00:00.000Z"
   * }
   *
   * FLOW:
   * createSession() -> readFile() -> add session -> writeFile()
   */
  async createSession(sessionData) {
    const sessions = await this.readFile(this.sessionsFile)

    // Create new session with generated ID and timestamps
    const newSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...sessionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    sessions.push(newSession)
    await this.writeFile(this.sessionsFile, sessions)
    return newSession
  }

  /**
   * findSessionByWhatsappId() - Find session by user's WhatsApp ID
   *
   * CALLED BY: message.controller.js -> handleFlowCompletion()
   *
   * @param {string} whatsappId - User's WhatsApp phone number
   * @returns {Object|undefined} Session object or undefined if not found
   *
   * FLOW:
   * findSessionByWhatsappId() -> readFile() -> find() -> return session
   */
  async findSessionByWhatsappId(whatsappId) {
    const sessions = await this.readFile(this.sessionsFile)
    return sessions.find((session) => session.whatsappId === whatsappId)
  }

  /**
   * updateSession() - Update existing session
   *
   * CALLED BY: createOrUpdateSession() when session exists
   *
   * @param {string} whatsappId - User's WhatsApp phone number
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated session or null if not found
   *
   * FLOW:
   * updateSession() -> readFile() -> find session -> merge updates -> writeFile()
   */
  async updateSession(whatsappId, updates) {
    const sessions = await this.readFile(this.sessionsFile)
    const sessionIndex = sessions.findIndex((session) => session.whatsappId === whatsappId)

    if (sessionIndex === -1) {
      return null
    }

    // Merge updates with existing session data
    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await this.writeFile(this.sessionsFile, sessions)
    return sessions[sessionIndex]
  }

  /**
   * createOrUpdateSession() - Create or update session
   *
   * CALLED BY:
   * - message.controller.js -> triggerServiceFlow()
   * - message.controller.js -> handleFlowCompletion()
   * - payment.controller.js -> handleSuccess()
   *
   * PURPOSE:
   * If session exists: Update it
   * If session doesn't exist: Create it
   *
   * @param {string} whatsappId - User's WhatsApp phone number
   * @param {Object} sessionData - Session data to create/update
   * @returns {Object} Created or updated session
   *
   * FLOW:
   * createOrUpdateSession() -> findSessionByWhatsappId()
   *   -> If exists: updateSession()
   *   -> If not: createSession()
   */
  async createOrUpdateSession(whatsappId, sessionData) {
    const existingSession = await this.findSessionByWhatsappId(whatsappId)

    if (existingSession) {
      return this.updateSession(whatsappId, sessionData)
    } else {
      return this.createSession(sessionData)
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * getUsers() - Get all users
   *
   * CALLED BY: app.js -> GET /test/data
   *
   * @returns {Array} All user objects
   */
  async getUsers() {
    return await this.readFile(this.usersFile)
  }

  /**
   * getOrders() - Get all orders
   *
   * CALLED BY: app.js -> GET /test/data
   *
   * @returns {Array} All order objects
   */
  async getOrders() {
    return await this.readFile(this.ordersFile)
  }

  /**
   * getSessions() - Get all sessions
   *
   * CALLED BY: app.js -> GET /test/data
   *
   * @returns {Array} All session objects
   */
  async getSessions() {
    return await this.readFile(this.sessionsFile)
  }

  /**
   * getStats() - Get database statistics
   *
   * @returns {Object} Statistics object with counts
   */
  getStats() {
    return {
      usersCount: this.getUsers().then((users) => users.length),
      ordersCount: this.getOrders().then((orders) => orders.length),
      sessionsCount: this.getSessions().then((sessions) => sessions.length),
    }
  }

  /**
   * clearAll() - Clear all data (for testing)
   *
   * CALLED BY: app.js -> POST /test/clear
   *
   * WARNING: This deletes all data permanently!
   * Only available in development mode.
   *
   * FLOW:
   * clearAll() -> writeFile([], [], [])
   */
  async clearAll() {
    await this.writeFile(this.usersFile, [])
    await this.writeFile(this.ordersFile, [])
    await this.writeFile(this.sessionsFile, [])
    console.log("All data cleared")
  }
}

// Create and export singleton instance
// This ensures all parts of the app use the same database instance
const databaseService = new DatabaseService()

module.exports = databaseService
