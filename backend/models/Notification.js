// backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'new_proposal',
      'proposal_accepted',
      'proposal_rejected',
      'order_created',
      'order_completed',
      'new_message',
      'payment_received',
      'review_received',
      'job_posted',
      'gig_purchased'
    ],
    required: true
  },
  title: String,
  message: String,
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Order', 'Proposal', 'Job', 'Gig', 'Message', 'Review', 'Conversation']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
