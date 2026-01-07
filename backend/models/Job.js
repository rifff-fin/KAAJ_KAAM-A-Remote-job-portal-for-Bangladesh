// backend/models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
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
  budget: {
    type: Number,
    required: [true, 'Budget is required']
  },
  budgetType: {
    type: String,
    enum: ['fixed', 'hourly'],
    default: 'fixed'
  },
  deadline: Date,
  skills: [String],
  tags: [String],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interests: [{
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  hiredFreelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  proposals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal'
  }],
  stats: {
    views: { type: Number, default: 0 },
    proposals: { type: Number, default: 0 }
  },
  lastEditedAt: {
    type: Date
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
jobSchema.index({ title: 'text', description: 'text', tags: 'text' });
jobSchema.index({ postedBy: 1, status: 1 });
jobSchema.index({ category: 1 });

module.exports = mongoose.model('Job', jobSchema);