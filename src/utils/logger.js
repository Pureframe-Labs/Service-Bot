/**
 * ============================================================================
 * LOGGER.JS - SIMPLE LOGGING UTILITY
 * ============================================================================
 *
 * PURPOSE:
 * Provide consistent logging across the application.
 * Prefixes messages with log level for easy filtering.
 *
 * LOG LEVELS:
 * - INFO: General information about application flow
 * - ERROR: Error conditions that need attention
 * - WARN: Warning conditions that might cause issues
 *
 * USAGE:
 * const logger = require('./utils/logger');
 * logger.info('User created', { userId: '123' });
 * logger.error('Failed to send message', error);
 * logger.warn('Rate limit approaching', { remaining: 10 });
 *
 * IMPORTED BY:
 * - message.controller.js
 * - payment.controller.js
 * - flow.controller.js
 *
 * NOTE: For production, consider using a more robust logging library like:
 * - Winston (for file logging, log rotation)
 * - Pino (for high-performance JSON logging)
 * - Morgan (for HTTP request logging)
 *
 * ============================================================================
 */

/**
 * Logger object with methods for each log level
 *
 * Each method:
 * 1. Prefixes message with [LEVEL]
 * 2. Logs to console
 * 3. Optionally includes data object
 */
const logger = {
  /**
   * info() - Log informational message
   *
   * USAGE:
   * logger.info('User created');
   * logger.info('Order placed', { orderId: 'ORD_123', amount: 500 });
   *
   * OUTPUT:
   * [INFO] User created
   * [INFO] Order placed { orderId: 'ORD_123', amount: 500 }
   *
   * @param {string} message - Log message
   * @param {Object} data - Optional data object to include
   */
  info: (message, data = {}) => {
    console.log(`[INFO] ${message}`, Object.keys(data).length ? data : "")
  },

  /**
   * error() - Log error message
   *
   * USAGE:
   * logger.error('Failed to send message');
   * logger.error('Database connection failed', error);
   * logger.error('API call failed', { status: 500, message: 'Server error' });
   *
   * OUTPUT:
   * [ERROR] Failed to send message
   * [ERROR] Database connection failed Error: Connection refused
   * [ERROR] API call failed { status: 500, message: 'Server error' }
   *
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or data
   */
  error: (message, error = {}) => {
    console.error(`[ERROR] ${message}`, error.message || error)
  },

  /**
   * warn() - Log warning message
   *
   * USAGE:
   * logger.warn('Rate limit approaching');
   * logger.warn('Deprecated function used', { function: 'oldMethod' });
   *
   * OUTPUT:
   * [WARN] Rate limit approaching
   * [WARN] Deprecated function used { function: 'oldMethod' }
   *
   * @param {string} message - Warning message
   * @param {Object} data - Optional data object to include
   */
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${message}`, data)
  },
}

// Export the logger for use throughout the application
module.exports = logger
