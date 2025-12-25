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
      // Text is required only for text messages without attachments
      return this.messageType !== 'call' && (!this.attachments || this.attachments.length === 0);
    },
    default: ''
  },
  messageType: {
    type: String,
    enum: ['text', 'call', 'meeting', 'system'],
    default: 'text'
  },
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
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
  attachments: {
    type: [{
      url: { type: String, required: true },
      type: { type: String, required: true }, // 'image', 'video', 'pdf', 'doc', 'ppt', 'xls', 'txt', 'csv', 'zip', 'file'
      name: { type: String, required: true },
      size: { type: Number },
      _id: false
    }],
    default: []
  },
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