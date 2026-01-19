const mongoose = require('mongoose');
const { inMemoryDB, useInMemoryDB } = require('../services/database.service');

const userSchema = new mongoose.Schema({
  whatsappId: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  name: String,
  email: String,
  state: String,
  district: String,
  tahsil: String,
  village: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastInteraction: {
    type: Date,
    default: Date.now,
  },
});

// Create mongoose model
const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

// In-memory operations
const User = {
  async findOneAndUpdate(query, update, options = {}) {
    if (useInMemoryDB) {
      return inMemoryDB.upsertUser(query, update);
    }
    
    try {
      return await UserModel.findOneAndUpdate(query, update, {
        upsert: true,
        new: true,
        ...options,
      });
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory:', error.message);
      return inMemoryDB.upsertUser(query, update);
    }
  },

  async findOne(query) {
    if (useInMemoryDB) {
      if (query.whatsappId) {
        return inMemoryDB.findUserByWhatsappId(query.whatsappId);
      }
      return null;
    }
    
    try {
      return await UserModel.findOne(query);
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory:', error.message);
      if (query.whatsappId) {
        return inMemoryDB.findUserByWhatsappId(query.whatsappId);
      }
      return null;
    }
  },

  async create(data) {
    if (useInMemoryDB) {
      return inMemoryDB.createUser(data);
    }
    
    try {
      return await UserModel.create(data);
    } catch (error) {
      console.error('MongoDB error, falling back to in-memory:', error.message);
      return inMemoryDB.createUser(data);
    }
  },

  async updateOne(query, update) {
    if (useInMemoryDB) {
      if (query.whatsappId) {
        return inMemoryDB.updateUser(query.whatsappId, update);
      }
      return { nModified: 0 };
    }
    
    try {
      return await UserModel.updateOne(query, update);
    } catch (error) {
      console.error('MongoDB error:', error.message);
      return { nModified: 0 };
    }
  },
};

module.exports = User;
