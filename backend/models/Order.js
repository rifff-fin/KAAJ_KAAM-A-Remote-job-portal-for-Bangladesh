// backend/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig'
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  deliveryDays: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'activated', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  milestones: [
    {
      title: String,
      amount: Number,
      dueDate: Date,
      status: {
        type: String,
        enum: ['pending', 'completed', 'approved'],
        default: 'pending'
      },
      completedAt: Date,
      approvedAt: Date
    }
  ],
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'refunded'],
    default: 'pending'
  },
  paymentDeadline: {
    type: Date
  },
  paymentCompletedAt: {
    type: Date
  },
  totalAmount: {
    type: Number
  },
  commission: {
    type: Number, // 10% of totalAmount
    default: 0
  },
  sellerAmount: {
    type: Number // 90% of totalAmount
  },
  // Delivery fields
  delivery: {
    description: String,
    notes: String,
    link: String,
    files: [String], // Array of file URLs
    deliveredAt: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    rejectionReason: String,
    redeliveryDeadline: Date
  },
  activatedAt: {
    type: Date
  },
  extensionRequests: [
    {
      requestedBy: {
        type: String,
        enum: ['buyer', 'seller']
      },
      requestedAt: {
        type: Date,
        default: Date.now
      },
      reason: String,
      extensionDays: Number,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  startDate: Date,
  completionDate: Date,
  dueDate: Date,
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
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

// Index for faster queries
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
