// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: function() {
      return this.messageType !== 'call';
    }
  },
  messageType: {
    type: String,
    enum: ['text', 'call'],
    default: 'text'
  },
  callInfo: {
    callType: {
      type: String,
      enum: ['audio', 'video']
    },
    duration: Number, // in seconds
    status: {
      type: String,
      enum: ['completed', 'missed', 'declined', 'failed']
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  attachments: [
    {
      url: String,
      type: String, // 'image', 'file', 'video'
      name: String
    }
  ],
  readBy: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: Date
    }
  ],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);