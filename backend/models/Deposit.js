// backend/models/Deposit.js
const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100
  },
  method: {
    type: String,
    enum: ['bank', 'card', 'bkash', 'nagad'],
    required: true
  },
  details: {
    // For bKash/Nagad
    phoneNumber: String,
    transactionId: String,
    // For Card
    lastFourDigits: String,
    // For Bank Transfer
    accountNumber: String
  },
  otp: {
    type: String,
    required: true
  },
  otpExpiry: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending_otp', 'completed', 'failed', 'expired', 'cancelled'],
    default: 'pending_otp'
  },
  completedAt: Date,
  failureReason: String
}, { timestamps: true });

// Index for user and status queries
depositSchema.index({ user: 1, createdAt: -1 });
depositSchema.index({ status: 1 });

module.exports = mongoose.model('Deposit', depositSchema);
