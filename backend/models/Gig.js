const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  tags: [String],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  priceTiers: [
    {
      name: String,
      price: Number,
      deliveryDays: Number,
      revisions: Number,
      description: String
    }
  ],
  basePrice: {
    type: Number,
    required: true
  },
  deliveryDays: {
    type: Number,
    required: true
  },
  images: [String],
  thumbnail: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'paused'],
    default: 'active'
  },
  stats: {
    views: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Text index for search
gigSchema.index({ title: 'text', description: 'text', tags: 'text' });
gigSchema.index({ seller: 1, status: 1 });
gigSchema.index({ category: 1 });

module.exports = mongoose.model('Gig', gigSchema);