// backend/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'kajkam-secret-2025';

// ────── Signup ──────
const signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    
    if (!role || !['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ message: "Valid role required (buyer/seller)" });
    }

    // Check if email exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password and create user
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ 
      name, 
      email, 
      password: hashed, 
      role 
    });

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: err.message || "Server error during signup" });
  }
};

// ────── Login ──────
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user - explicitly select password since it's set to select: false in schema
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || "Server error during login" });
  }
};

// ────── Get Me (now includes profile) ──────
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

// ────── NEW: Update Profile ──────
const updateProfile = async (req, res) => {
  try {
    const { name, bio, skills } = req.body;
    const updateData = {};

    if (name) updateData['profile.name'] = name;
    if (bio !== undefined) updateData['profile.bio'] = bio;
    if (skills) updateData['profile.skills'] = skills.split(',').map(s => s.trim());

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'kaaj-kaam/avatars'
      });
      updateData['profile.avatar'] = result.secure_url;
      fs.unlink(req.file.path, () => {});
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ────── NEW: Change Password (optional) ──────
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Old password incorrect' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { signup, login, getMe, updateProfile, changePassword };