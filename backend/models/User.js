
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
    }
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    breakdown: {
      communication: { type: Number, default: 0 },
      quality: { type: Number, default: 0 },
      timeliness: { type: Number, default: 0 },
      professionalism: { type: Number, default: 0 }
    }
  },
  stats: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    xp: { type: Number, default: 0 }
  },
  wallet: {
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'BDT' }
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
  lastLogin: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Index for faster lookups
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.skills': 1 });

module.exports = mongoose.model('User', userSchema);