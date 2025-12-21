// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_CONN) {
      throw new Error('MONGO_CONN environment variable is not set');
    }
    
    // Remove deprecated options
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('✓ MongoDB Connected Successfully');
  } catch (err) {
    console.error('✗ DB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;