// backend/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  categories: {
    // For buyer reviews (freelancer being reviewed)
    communication: { type: Number, min: 1, max: 5 },
    quality: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 },
    // For freelancer reviews (client being reviewed)
    clientBehavior: { type: Number, min: 1, max: 5 },
    clearInstructions: { type: Number, min: 1, max: 5 },
    paymentOnTime: { type: Number, min: 1, max: 5 }
  },
  recommendation: {
    // Only for freelancer reviews of clients (true/false)
    type: Boolean
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ order: 1 });

module.exports = mongoose.model('Review', reviewSchema);
