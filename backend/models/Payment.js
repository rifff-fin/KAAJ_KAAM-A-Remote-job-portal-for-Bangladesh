// backend/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  amount: {
    type: Number,
    required: true
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
paymentSchema.index({ user: 1, order: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
