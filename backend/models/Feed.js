const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  body: {
    type: String,
    required: [true, 'Comment body is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const feedSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  body: {
    type: String,
    required: [true, 'Post body is required'],
    trim: true
  },
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video', 'document'],
      default: 'image'
    }
  }],
  upvote: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvote: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comment: [commentSchema],
  share: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for upvote count
feedSchema.virtual('upvoteCount').get(function() {
  return this.upvote.length;
});

// Virtual for downvote count
feedSchema.virtual('downvoteCount').get(function() {
  return this.downvote.length;
});

// Virtual for comment count
feedSchema.virtual('commentCount').get(function() {
  return this.comment.length;
});

// Ensure virtuals are included in JSON
feedSchema.set('toJSON', { virtuals: true });
feedSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Feed', feedSchema);
