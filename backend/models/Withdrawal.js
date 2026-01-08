// backend/models/Withdrawal.js
const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['bank', 'card', 'bkash', 'nagad'],
    required: true
  },
  details: {
    // Bank details
    bankName: String,
    accountNumber: String,
    accountHolderName: String,
    branchName: String,
    routingNumber: String,
    
    // Card details
    cardNumber: String,
    cardHolderName: String,
    
    // Mobile banking details
    phoneNumber: String,
    accountType: String
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
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
withdrawalSchema.index({ user: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1 });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
