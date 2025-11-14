// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONN); // ← NO OPTIONS!
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('DB Connection Error:', err.message);
    throw err; // ← important for .catch() in index.js
  }
};

module.exports = connectDB;