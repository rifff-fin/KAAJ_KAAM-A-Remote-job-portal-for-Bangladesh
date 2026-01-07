// backend/controllers/depositController.js
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const { sendEmail } = require('../services/emailService');

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request deposit (generates OTP)
exports.requestDeposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, method, details } = req.body;

    // Validate amount
    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'Minimum deposit amount is ৳100' });
    }

    if (amount > 100000) {
      return res.status(400).json({ message: 'Maximum deposit amount is ৳100,000' });
    }

    // Validate method
    if (!['bank', 'card', 'bkash', 'nagad'].includes(method)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create deposit request
    const deposit = await Deposit.create({
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
      const userDetails = await User.findById(userId).select('name email');
      if (userDetails) {
        await sendEmail(userDetails.email, 'deposit_otp', {
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
      depositId: deposit._id
    });
  } catch (error) {
    console.error('Error in requestDeposit:', error);
    res.status(500).json({ message: 'Failed to process deposit request' });
  }
};

// Verify OTP and complete deposit
exports.verifyDeposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { depositId, otp } = req.body;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ message: 'Please provide a valid 6-digit OTP' });
    }

    // Find deposit
    const deposit = await Deposit.findOne({
      _id: depositId,
      user: userId,
      status: 'pending_otp'
    });

    if (!deposit) {
      return res.status(404).json({ message: 'Deposit request not found or already processed' });
    }

    // Check OTP expiry
    if (new Date() > deposit.otpExpiry) {
      deposit.status = 'expired';
      deposit.failureReason = 'OTP expired';
      await deposit.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new deposit.' });
    }

    // Verify OTP
    if (deposit.otp !== otp) {
      // Mark as failed after wrong OTP
      deposit.status = 'failed';
      deposit.failureReason = 'Invalid OTP';
      await deposit.save();
      return res.status(400).json({ message: 'Invalid OTP. Transaction failed.' });
    }

    // Update user wallet balance
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { 'wallet.balance': deposit.amount }
      },
      { new: true }
    );

    // Update deposit status
    deposit.status = 'completed';
    deposit.completedAt = new Date();
    await deposit.save();

    // Create notification
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: userId,
        type: 'deposit_completed',
        title: 'Money Added Successfully',
        message: `৳${deposit.amount} has been added to your wallet.`,
        relatedId: deposit._id,
        relatedModel: 'Deposit'
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    res.status(200).json({
      message: 'Money added successfully',
      newBalance: user.wallet.balance,
      amount: deposit.amount
    });
  } catch (error) {
    console.error('Error in verifyDeposit:', error);
    
    // Mark transaction as failed on error
    try {
      if (req.body.depositId) {
        await Deposit.findByIdAndUpdate(req.body.depositId, {
          status: 'failed',
          failureReason: error.message || 'System error'
        });
      }
    } catch (updateErr) {
      console.error('Error updating failed deposit:', updateErr);
    }
    
    res.status(500).json({ message: 'Failed to verify deposit' });
  }
};

// Get deposit history
exports.getDepositHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0 } = req.query;

    const deposits = await Deposit.find({ 
      user: userId,
      status: { $in: ['completed', 'failed', 'cancelled'] }
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-otp'); // Don't send OTP in response

    const total = await Deposit.countDocuments({ user: userId });

    res.status(200).json({
      deposits,
      total,
      hasMore: total > parseInt(skip) + deposits.length
    });
  } catch (error) {
    console.error('Error in getDepositHistory:', error);
    res.status(500).json({ message: 'Failed to fetch deposit history' });
  }
};
