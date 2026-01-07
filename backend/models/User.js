const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: { 
    type: String, 
    enum: ['buyer', 'seller', 'admin'], 
    default: 'seller'
  },
  profile: {
    name: String,
    bio: String,
    avatar: String,
    skills: [String],
    level: { type: Number, default: 1 },
    earnings: { type: Number, default: 0 },
    location: String,
    phone: String,
    website: String,
    hourlyRate: Number,
    availability: {
      type: String,
      enum: ['available', 'unavailable', 'part-time'],
      default: 'available'
    },
    // New fields for enhanced profiles
    languages: [{
      name: String,
      proficiency: {
        type: String,
        enum: ['native', 'fluent', 'conversational', 'basic']
      }
    }],
    experience: [{
      title: String,
      company: String,
      type: {
        type: String,
        enum: ['freelance', 'company']
      },
      startDate: Date,
      endDate: Date,
      current: Boolean,
      description: String
    }],
    education: [{
      degree: String,
      institute: String,
      year: Number
    }],
    responseTime: {
      type: String,
      default: 'Within 24 hours'
    },
    // Client-specific fields
    companyName: String,
    industry: String,
    projectPreferences: {
      budgetRange: String,
      projectSize: {
        type: String,
        enum: ['small', 'medium', 'large', 'long-term']
      }
    }
  },
  badges: [{
    type: {
      type: String,
      enum: ['top_rated', 'on_time_delivery', 'great_communicator', 'payment_verified', 'fast_responder', 'repeat_client']
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    breakdown: {
      communication: { type: Number, default: 0 },
      quality: { type: Number, default: 0 },
      timeliness: { type: Number, default: 0 },
      professionalism: { type: Number, default: 0 },
      // Client-specific breakdown
      clientBehavior: { type: Number, default: 0 },
      clearInstructions: { type: Number, default: 0 },
      paymentOnTime: { type: Number, default: 0 }
    }
  },
  stats: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    // New stats
    avgDeliveryTime: { type: Number, default: 0 }, // in hours
    repeatClients: { type: Number, default: 0 },
    totalFreelancersHired: { type: Number, default: 0 },
    repeatHires: { type: Number, default: 0 },
    avgPaymentTime: { type: Number, default: 0 } // in hours
  },
  wallet: {
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'BDT' }
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpiry: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: String,
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastLogin: Date,
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Index for faster lookups
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.skills': 1 });

// Method to update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);