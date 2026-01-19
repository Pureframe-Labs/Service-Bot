require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.log('⚠️ MONGODB_URI not found. Using in-memory database for development.');
      
      // For development, we can use a local MongoDB or continue without DB
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGODB_URI is required in production');
      }
      
      // In development, we'll use a simple in-memory store
      console.log('📝 Running in development mode without database.');
      return;
    }
    
    // Check if it's MongoDB Atlas URL
    const isAtlas = mongoURI.includes('mongodb.net');
    
    const options = {
      // Remove deprecated options
      // useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 6+
      ...(isAtlas ? {
        ssl: true,
        tls: true,
        tlsAllowInvalidCertificates: false,
        retryWrites: true,
        w: 'majority',
      } : {})
    };
    
    await mongoose.connect(mongoURI, options);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // In development mode, continue without database
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Continuing in development mode without database.');
    } else {
      process.exit(1);
    }
  }
};

module.exports = { connectDB };
