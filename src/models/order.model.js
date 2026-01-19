const mongoose = require('mongoose');
const { inMemoryDB, useInMemoryDB } = require('../services/database.service');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  razorpayOrderId: {
    type: String,
    required: true,
  },
  whatsappId: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
    enum: ['8A', '7/12', 'Ferfar', 'Property Card'],
    required: true,
  },
  userData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  paymentId: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'captured', 'failed', 'refunded'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
});

// Create mongoose model
const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);

// In-memory operations
const Order = {
  async findOneAndUpdate(query, update, options = {}) {
    if (useInMemoryDB) {
      if (query.razorpayOrderId) {
        const order = await inMemoryDB.findOrderByRazorpayOrderId(query.razorpayOrderId);
        if (order) {
          return inMemoryDB.updateOrder(order.orderId, update);
        }
      }
      // Create new order if not found
      const newOrder = { ...query, ...update };
      return inMemoryDB.createOrder(newOrder);
    }
    
    try {
      return await OrderModel.findOneAndUpdate(query, update, {
        new: true,
        ...options,
      });
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory:', error.message);
      if (query.razorpayOrderId) {
        const order = await inMemoryDB.findOrderByRazorpayOrderId(query.razorpayOrderId);
        if (order) {
          return inMemoryDB.updateOrder(order.orderId, update);
        }
      }
      const newOrder = { ...query, ...update };
      return inMemoryDB.createOrder(newOrder);
    }
  },

  async findOne(query) {
    if (useInMemoryDB) {
      if (query.razorpayOrderId) {
        return inMemoryDB.findOrderByRazorpayOrderId(query.razorpayOrderId);
      }
      if (query.orderId) {
        return inMemoryDB.findOrderByOrderId(query.orderId);
      }
      return null;
    }
    
    try {
      return await OrderModel.findOne(query);
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory:', error.message);
      if (query.razorpayOrderId) {
        return inMemoryDB.findOrderByRazorpayOrderId(query.razorpayOrderId);
      }
      if (query.orderId) {
        return inMemoryDB.findOrderByOrderId(query.orderId);
      }
      return null;
    }
  },

  async create(data) {
    if (useInMemoryDB) {
      return inMemoryDB.createOrder(data);
    }
    
    try {
      return await OrderModel.create(data);
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory:', error.message);
      return inMemoryDB.createOrder(data);
    }
  },

  async find(query) {
    if (useInMemoryDB) {
      if (query.whatsappId) {
        return inMemoryDB.findOrdersByWhatsappId(query.whatsappId);
      }
      return Array.from(inMemoryDB.orders.values()).filter(order => 
        !order.id.includes('session') // Filter out session entries
      );
    }
    
    try {
      return await OrderModel.find(query);
    } catch (error) {
      console.error('MongoDB error:', error.message);
      if (query.whatsappId) {
        return inMemoryDB.findOrdersByWhatsappId(query.whatsappId);
      }
      return [];
    }
  },
};

module.exports = Order;
