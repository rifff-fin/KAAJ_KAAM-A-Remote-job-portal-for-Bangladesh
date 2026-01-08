// backend/controllers/withdrawalController.js
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/emailService');

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request withdrawal
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, details } = req.body;
    const userId = req.user.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    // Validate method
    const validMethods = ['bank', 'card', 'bkash', 'nagad'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ message: 'Invalid withdrawal method' });
    }

    // Get user wallet balance
    const user = await User.findById(userId).select('wallet');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has sufficient balance
    if (user.wallet.balance < amount) {
      return res.status(400).json({ 
        message: 'Insufficient balance',
        available: user.wallet.balance
      });
    }

    // Minimum withdrawal amount
    if (amount < 100) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is ৳100' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      user: userId,
      amount,
      method,
      details,
      otp,
      otpExpiry,
      status: 'pending_otp'
    });

    // Send OTP via email
    try {
      const userDetails = await User.findById(userId).select('name email emailNotifications');
      if (userDetails) {
        await sendEmail(userDetails.email, 'withdrawal_otp', {
          userName: userDetails.name,
          otp: otp,
          amount: amount,
          method: method.toUpperCase()
        });
      }
    } catch (emailErr) {
      console.error('Error sending OTP email:', emailErr);
      // Continue even if email fails
    }

    res.status(200).json({
      message: 'OTP sent to your registered email',
      withdrawalId: withdrawal._id
    });
  } catch (error) {
    console.error('Error in requestWithdrawal:', error);
    res.status(500).json({ message: 'Failed to process withdrawal request' });
  }
};

// Verify OTP and complete withdrawal
exports.verifyWithdrawal = async (req, res) => {
  try {
    const { withdrawalId, otp } = req.body;
    const userId = req.user.id;

    const withdrawal = await Withdrawal.findById(withdrawalId).populate('user', 'name email wallet');

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    // Check if withdrawal belongs to user
    if (withdrawal.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if already processed
    if (withdrawal.status !== 'pending_otp') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }

    // Check OTP expiry
    if (new Date() > withdrawal.otpExpiry) {
      withdrawal.status = 'expired';
      await withdrawal.save();
      return res.status(400).json({ message: 'OTP expired. Please request a new withdrawal.' });
    }

    // Verify OTP
    if (withdrawal.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Deduct from wallet
    const user = await User.findById(userId);
    if (user.wallet.balance < withdrawal.amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.wallet.balance -= withdrawal.amount;
    user.wallet.totalWithdrawn = (user.wallet.totalWithdrawn || 0) + withdrawal.amount;
    await user.save();

    // Update withdrawal status
    withdrawal.status = 'completed';
    withdrawal.completedAt = new Date();
    await withdrawal.save();

    // Create notification
    try {
      await Notification.create({
        recipient: userId,
        type: 'withdrawal_completed',
        title: 'Withdrawal Successful',
        message: `Your withdrawal of ৳${withdrawal.amount} has been processed successfully.`,
        relatedId: withdrawal._id,
        relatedModel: 'Withdrawal'
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    res.status(200).json({
      message: 'Withdrawal completed successfully',
      withdrawal,
      newBalance: user.wallet.balance
    });
  } catch (error) {
    console.error('Error in verifyWithdrawal:', error);
    res.status(500).json({ message: 'Failed to verify withdrawal' });
  }
};

// Get user withdrawal history
exports.getWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0 } = req.query;

    const withdrawals = await Withdrawal.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-otp');

    const total = await Withdrawal.countDocuments({ user: userId });

    res.status(200).json({
      withdrawals,
      total,
      hasMore: total > parseInt(skip) + withdrawals.length
    });
  } catch (error) {
    console.error('Error in getWithdrawalHistory:', error);
    res.status(500).json({ message: 'Failed to fetch withdrawal history' });
  }
};

// Get earnings and spending summary
exports.getFinancialSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('wallet stats role');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate total earnings and spending from orders
    const Order = require('../models/Order');

    let totalEarnings = 0;
    let totalSpending = 0;

    if (user.role === 'seller') {
      // Seller earnings from completed orders
      const sellerOrders = await Order.find({ 
        seller: userId, 
        status: 'completed',
        paymentStatus: 'completed'
      });
      totalEarnings = sellerOrders.reduce((sum, order) => sum + (order.sellerAmount || 0), 0);
    }

    if (user.role === 'buyer' || user.role === 'client') {
      // Buyer spending on completed and in-progress orders
      const buyerOrders = await Order.find({ 
        buyer: userId, 
        status: { $in: ['in_progress', 'delivered', 'completed'] },
        paymentStatus: 'completed'
      });
      totalSpending = buyerOrders.reduce((sum, order) => sum + order.price, 0);
    }

    // Get withdrawal stats
    const withdrawals = await Withdrawal.find({ 
      user: userId, 
      status: 'completed' 
    });
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    res.status(200).json({
      currentBalance: user.wallet.balance,
      totalEarnings,
      totalSpending,
      totalWithdrawn,
      pendingClearance: user.wallet.pendingClearance || 0,
      currency: user.wallet.currency || 'BDT'
    });
  } catch (error) {
    console.error('Error in getFinancialSummary:', error);
    res.status(500).json({ message: 'Failed to fetch financial summary' });
  }
};
