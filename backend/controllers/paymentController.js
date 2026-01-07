// backend/controllers/paymentController.js
const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/emailService');

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request payment (generates OTP)
exports.requestPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, method, details } = req.body;

    // Get order
    const order = await Order.findById(orderId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only buyer can make payment
    if (order.buyer._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only buyer can make payment' });
    }

    // Can only pay for activated orders
    if (order.status !== 'activated') {
      return res.status(400).json({ message: 'Order must be activated before payment' });
    }

    // Check if payment deadline has passed
    if (new Date() > order.paymentDeadline) {
      return res.status(400).json({
        message: 'Payment deadline has passed. Please request an extension from the seller.'
      });
    }

    // Validate method
    if (!['bank', 'card', 'bkash', 'nagad'].includes(method)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create payment request
    const payment = await Payment.create({
      user: userId,
      order: orderId,
      amount: order.price,
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
        await sendEmail(userDetails.email, 'payment_otp', {
          userName: userDetails.name,
          otp: otp,
          amount: order.price,
          method: method.toUpperCase(),
          orderTitle: order.title
        });
      }
    } catch (emailErr) {
      console.error('Error sending OTP email:', emailErr);
      // Continue even if email fails
    }

    res.status(200).json({
      message: 'OTP sent to your registered email',
      paymentId: payment._id,
      amount: order.price
    });
  } catch (error) {
    console.error('Error in requestPayment:', error);
    res.status(500).json({ message: 'Failed to process payment request' });
  }
};

// Verify OTP and complete payment
exports.verifyPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentId, otp } = req.body;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ message: 'Please provide a valid 6-digit OTP' });
    }

    // Find payment
    const payment = await Payment.findOne({
      _id: paymentId,
      user: userId,
      status: 'pending_otp'
    }).populate({
      path: 'order',
      populate: [
        { path: 'buyer', select: 'name email' },
        { path: 'seller', select: 'name email' }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment request not found or already processed' });
    }

    // Check OTP expiry
    if (new Date() > payment.otpExpiry) {
      payment.status = 'expired';
      payment.failureReason = 'OTP expired';
      await payment.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new payment.' });
    }

    // Verify OTP
    if (payment.otp !== otp) {
      payment.status = 'failed';
      payment.failureReason = 'Invalid OTP';
      await payment.save();
      return res.status(400).json({ message: 'Invalid OTP. Payment failed.' });
    }

    const order = payment.order;

    // Update order status to in_progress
    order.status = 'in_progress';
    order.paymentStatus = 'completed';
    order.paymentCompletedAt = new Date();
    order.startDate = new Date();

    // Calculate commission (10%) and seller amount (90%)
    const totalAmount = order.price;
    order.totalAmount = totalAmount;
    order.commission = totalAmount * 0.10;
    order.sellerAmount = totalAmount * 0.90;

    // Update the due date based on delivery days from payment completion
    order.dueDate = new Date(Date.now() + order.deliveryDays * 24 * 60 * 60 * 1000);

    await order.save();

    // Update payment status
    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save();

    // Create notification for seller
    try {
      await Notification.create({
        recipient: order.seller._id,
        type: 'payment_received',
        title: 'Payment Received!',
        message: `${order.buyer.name} has completed payment for order "${order.title}". You can now start working.`,
        relatedId: order._id,
        relatedModel: 'Order'
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    // Emit socket notification
    try {
      if (global.io) {
        global.io.to(`user_${order.seller._id}`).emit('payment_completed', {
          orderId: order._id,
          title: order.title
        });
      }
    } catch (socketErr) {
      console.error('Error emitting socket notification:', socketErr);
    }

    // Send email notification to seller
    try {
      const sellerUser = await User.findById(order.seller._id).select('emailNotifications');
      if (sellerUser && sellerUser.emailNotifications) {
        const sellerAmount = order.price * 0.90;
        await sendEmail(order.seller.email, 'payment_completed', {
          sellerName: order.seller.name,
          gigTitle: order.title,
          sellerAmount: sellerAmount.toFixed(2)
        });
      }
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
    }

    res.status(200).json({
      message: 'Payment completed successfully',
      order
    });
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    
    // Mark transaction as failed on error
    try {
      if (req.body.paymentId) {
        await Payment.findByIdAndUpdate(req.body.paymentId, {
          status: 'failed',
          failureReason: error.message || 'System error'
        });
      }
    } catch (updateErr) {
      console.error('Error updating failed payment:', updateErr);
    }
    
    res.status(500).json({ message: 'Failed to verify payment' });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0 } = req.query;

    const payments = await Payment.find({ 
      user: userId,
      status: { $in: ['completed', 'failed', 'cancelled'] }
    })
      .populate('order', 'title price')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-otp');

    const total = await Payment.countDocuments({ user: userId });

    res.status(200).json({
      payments,
      total,
      hasMore: total > parseInt(skip) + payments.length
    });
  } catch (error) {
    console.error('Error in getPaymentHistory:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
};
