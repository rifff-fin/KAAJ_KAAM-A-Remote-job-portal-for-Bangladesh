
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'seller' },
  createdAt: { type: Date, default: Date.now },
  profile: {
    name: String,
    bio: String,
    avatar: String,
    skills: [String],
    level: { type: Number, default: 1 },
    earnings: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('User', userSchema);