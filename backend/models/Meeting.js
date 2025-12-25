// backend/models/Meeting.js
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  title: {
    type: String,
    required: true,
    trim: true
  },
  agenda: {
    type: String,
    trim: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    enum: [15, 30, 60, 90, 120]
  },
  meetingType: {
    type: String,
    enum: ['audio', 'video'],
    default: 'video'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed', 'missed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  responses: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['accepted', 'declined', 'tentative']
      },
      respondedAt: Date,
      proposedTime: Date, // For "propose new time" feature
      reason: String
    }
  ],
  startedAt: Date,
  endedAt: Date,
  actualDuration: Number, // in seconds
  joinedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date
  }],
  noShowUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  remindersSent: {
    twentyFourHours: { type: Boolean, default: false },
    oneHour: { type: Boolean, default: false },
    tenMinutes: { type: Boolean, default: false }
  },
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String
}, { 
  timestamps: true 
});

// Index for faster queries
meetingSchema.index({ conversationId: 1, scheduledDate: -1 });
meetingSchema.index({ participants: 1, scheduledDate: 1 });
meetingSchema.index({ status: 1, scheduledDate: 1 });

// Virtual to check if meeting is upcoming
meetingSchema.virtual('isUpcoming').get(function() {
  return this.scheduledDate > new Date() && ['pending', 'accepted'].includes(this.status);
});

// Virtual to check if meeting can be started (10 minutes before)
meetingSchema.virtual('canStart').get(function() {
  const now = new Date();
  const tenMinutesBefore = new Date(this.scheduledDate.getTime() - 10 * 60 * 1000);
  const oneHourAfter = new Date(this.scheduledDate.getTime() + 60 * 60 * 1000);
  return now >= tenMinutesBefore && now <= oneHourAfter && this.status === 'accepted';
});

// Method to check if user has responded
meetingSchema.methods.hasUserResponded = function(userId) {
  return this.responses.some(r => r.userId.toString() === userId.toString());
};

// Method to get user's response
meetingSchema.methods.getUserResponse = function(userId) {
  return this.responses.find(r => r.userId.toString() === userId.toString());
};

// Method to check if all participants accepted
meetingSchema.methods.allParticipantsAccepted = function() {
  return this.participants.every(participantId => {
    const response = this.responses.find(r => r.userId.toString() === participantId.toString());
    return response && response.status === 'accepted';
  });
};

module.exports = mongoose.model('Meeting', meetingSchema);