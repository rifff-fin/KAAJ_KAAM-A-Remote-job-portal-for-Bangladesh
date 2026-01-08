// backend/controllers/orderController.js
const Order = require('../models/Order');
const Conversation = require('../models/Conversation');
const Gig = require('../models/Gig');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/emailService');

// ────── Create Order from Gig ──────
const createOrderFromGig = async (req, res) => {
  try {
    const { gigId, priceId } = req.body;
    const buyerId = req.user.id;

    const gig = await Gig.findById(gigId).populate('seller');
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    if (gig.seller._id.toString() === buyerId) {
      return res.status(400).json({ message: 'Cannot order your own gig' });
    }

    // Get price tier or use base price
    let price = gig.basePrice;
    let deliveryDays = gig.deliveryDays;

    if (priceId && gig.priceTiers.length > 0) {
      const tier = gig.priceTiers[priceId];
      if (tier) {
        price = tier.price;
        deliveryDays = tier.deliveryDays;
      }
    }

    // Prevent duplicate in-process orders for the same gig by the same buyer
    const existingInProcess = await Order.findOne({
      buyer: buyerId,
      gig: gigId,
      status: { $in: ['pending', 'activated'] }
    });
    if (existingInProcess) {
      return res.status(409).json({ message: 'Order already in process' });
    }

    // Create conversation
    const conversation = await Conversation.create({
      participants: [buyerId, gig.seller._id],
      gigId
    });

    // Create order
    const order = await Order.create({
      buyer: buyerId,
      seller: gig.seller._id,
      gig: gigId,
      title: gig.title,
      description: gig.description,
      price,
      deliveryDays,
      dueDate: new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000),
      conversationId: conversation._id,
      status: 'pending'
    });

    // Create notification for seller
    const buyer = await User.findById(buyerId);
    const notification = await Notification.create({
      recipient: gig.seller._id,
      type: 'gig_purchased',
      title: `New order for "${gig.title}"`,
      message: `${buyer.name} ordered your gig`,
      relatedId: order._id,
      relatedModel: 'Order'
    });

    // Emit socket notification
    if (global.io) {
      global.io.to(`user_${gig.seller._id}`).emit('new_notification', notification);
    }

    // Update gig stats
    await Gig.findByIdAndUpdate(gigId, {
      $inc: { 'stats.orders': 1 }
    });

    // Update buyer's total orders
    await User.findByIdAndUpdate(buyerId, {
      $inc: { 'stats.totalOrders': 1 }
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('Error in createOrderFromGig:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Create Order from Job Proposal ──────
const createOrderFromProposal = async (req, res) => {
  try {
    const { proposalId } = req.body;
    const buyerId = req.user.id;

    const Proposal = require('../models/Proposal');
    const proposal = await Proposal.findById(proposalId)
      .populate('job')
      .populate('seller');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.job.postedBy.toString() !== buyerId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Prevent duplicate in-process orders for the same job/proposal by the same buyer and seller
    const existingJobOrder = await Order.findOne({
      buyer: buyerId,
      seller: proposal.seller._id,
      job: proposal.job._id,
      status: { $in: ['pending', 'activated'] }
    });
    if (existingJobOrder) {
      return res.status(409).json({ message: 'Order already in process' });
    }

    // Create conversation
    const conversation = await Conversation.create({
      participants: [buyerId, proposal.seller._id],
      jobId: proposal.job._id
    });

    // Create order
    const order = await Order.create({
      buyer: buyerId,
      seller: proposal.seller._id,
      job: proposal.job._id,
      title: proposal.job.title,
      description: proposal.job.description,
      price: proposal.proposedPrice,
      deliveryDays: proposal.deliveryDays,
      dueDate: new Date(Date.now() + proposal.deliveryDays * 24 * 60 * 60 * 1000),
      conversationId: conversation._id,
      status: 'activated', // Start as activated for job-based orders
      activatedAt: new Date(),
      paymentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days to complete payment
    });

    // Update proposal status
    await Proposal.findByIdAndUpdate(proposalId, { status: 'accepted' });

    // Update buyer's total orders
    await User.findByIdAndUpdate(buyerId, {
      $inc: { 'stats.totalOrders': 1 }
    });

    // Create notification
    await Notification.create({
      recipient: proposal.seller._id,
      type: 'proposal_accepted',
      title: 'Your proposal was accepted!',
      message: `Your proposal for "${proposal.job.title}" has been accepted`,
      relatedId: order._id,
      relatedModel: 'Order'
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('Error in createOrderFromProposal:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get Orders ──────
const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role = 'buyer', status, limit = 20, skip = 0 } = req.query;

    const query = role === 'buyer' ? { buyer: userId } : { seller: userId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('buyer', 'name email profile.avatar')
      .populate('seller', 'name email profile.avatar')
      .populate('gig', 'title')
      .populate('job', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      hasMore: skip + limit < total
    });
  } catch (err) {
    console.error('Error in getOrders:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get Order Details ──────
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('buyer', 'name email profile.avatar rating')
      .populate('seller', 'name email profile.avatar rating')
      .populate('gig')
      .populate('job')
      .populate('conversationId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (
      order.buyer._id.toString() !== userId &&
      order.seller._id.toString() !== userId
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(order);
  } catch (err) {
    console.error('Error in getOrderDetails:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Update Order Status ──────
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId).populate('job');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only seller can mark as completed
    if (status === 'completed' && order.seller.toString() !== userId) {
      return res.status(403).json({ message: 'Only seller can mark as completed' });
    }

    // Only buyer can approve completion
    if (status === 'approved' && order.buyer.toString() !== userId) {
      return res.status(403).json({ message: 'Only buyer can approve' });
    }

    // Validate status transitions
    if (status === 'in_progress' && order.status !== 'activated') {
      return res.status(400).json({ message: 'Order must be activated before starting work' });
    }

    if (status === 'completed' && order.status !== 'in_progress') {
      return res.status(400).json({ message: 'Order must be in progress before completion' });
    }

    const previousStatus = order.status;
    order.status = status;
    if (status === 'completed') {
      order.completionDate = new Date();
    }

    await order.save();

    // If order is being cancelled and is related to a job, unhire the freelancer
    if (status === 'cancelled' && order.job) {
      const Job = require('../models/Job');
      await Job.findByIdAndUpdate(order.job._id, {
        $set: {
          hiredFreelancer: null,
          status: 'open'
        }
      });
    }

    // Update user stats when order is completed
    if (status === 'completed') {
      // Update seller's completed orders and earnings
      await User.findByIdAndUpdate(order.seller, {
        $inc: {
          'stats.completedOrders': 1,
          'stats.totalEarnings': order.price
        }
      });

      // Update buyer's completed orders
      await User.findByIdAndUpdate(order.buyer, {
        $inc: { 'stats.completedOrders': 1 }
      });
    }

    // Update cancelled stats if order is cancelled
    if (status === 'cancelled') {
      await User.findByIdAndUpdate(order.seller, {
        $inc: { 'stats.cancelledOrders': 1 }
      });

      await User.findByIdAndUpdate(order.buyer, {
        $inc: { 'stats.cancelledOrders': 1 }
      });
    }

    // Create notification
    const recipient = status === 'completed' ? order.buyer : order.seller;
    await Notification.create({
      recipient,
      type: 'order_completed',
      title: `Order ${status}`,
      message: `Order "${order.title}" has been ${status}`,
      relatedId: order._id,
      relatedModel: 'Order'
    });

    res.json(order);
  } catch (err) {
    console.error('Error in updateOrderStatus:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Cancel Order ──────
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId).populate('job');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (
      order.buyer.toString() !== userId &&
      order.seller.toString() !== userId
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed order' });
    }

    order.status = 'cancelled';
    if (reason) {
      order.cancellationReason = reason;
    }
    await order.save();

    // If this order is related to a job, unhire the freelancer
    if (order.job) {
      const Job = require('../models/Job');
      await Job.findByIdAndUpdate(order.job._id, {
        $set: {
          hiredFreelancer: null,
          status: 'open'
        }
      });
    }

    // Update cancelled stats
    await User.findByIdAndUpdate(order.seller, {
      $inc: { 'stats.cancelledOrders': 1 }
    });

    await User.findByIdAndUpdate(order.buyer, {
      $inc: { 'stats.cancelledOrders': 1 }
    });

    res.json(order);
  } catch (err) {
    console.error('Error in cancelOrder:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Seller Accept Order ──────
const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only seller can accept
    if (order.seller._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only seller can accept order' });
    }

    // Can only accept pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is not in pending status' });
    }

    // Update order status to activated and set payment deadline (7 days)
    order.status = 'activated';
    order.activatedAt = new Date();
    order.paymentDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await order.save();

    // Create notification for buyer
    try {
      await Notification.create({
        recipient: order.buyer._id,
        type: 'order_activated',
        title: 'Order Accepted!',
        message: `${order.seller.name} has accepted your order "${order.title}". Please complete payment within 7 days.`,
        relatedId: order._id,
        relatedModel: 'Order'
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
      // Continue even if notification fails
    }

    // Emit socket notification
    try {
      if (global.io) {
        global.io.to(`user_${order.buyer._id}`).emit('order_activated', {
          orderId: order._id,
          title: order.title,
          paymentDeadline: order.paymentDeadline
        });
      }
    } catch (socketErr) {
      console.error('Error emitting socket notification:', socketErr);
      // Continue even if socket fails
    }

    // Send email notification to buyer
    try {
      const buyerUser = await User.findById(order.buyer._id).select('emailNotifications');
      if (buyerUser && buyerUser.emailNotifications) {
        await sendEmail(order.buyer.email, 'order_activated', {
          buyerName: order.buyer.name,
          gigTitle: order.title,
          price: order.price
        });
      }
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
      // Continue even if email fails
    }

    res.json(order);
  } catch (err) {
    console.error('Error in acceptOrder:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Seller Reject Order ──────
const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only seller can reject
    if (order.seller._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only seller can reject order' });
    }

    // Can only reject pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is not in pending status' });
    }

    order.status = 'cancelled';
    await order.save();

    // Update cancelled stats
    await User.findByIdAndUpdate(order.seller, {
      $inc: { 'stats.cancelledOrders': 1 }
    });

    await User.findByIdAndUpdate(order.buyer, {
      $inc: { 'stats.cancelledOrders': 1 }
    });

    // Create notification for buyer
    await Notification.create({
      recipient: order.buyer._id,
      type: 'order_rejected',
      title: 'Order Rejected',
      message: `${order.seller.name} has rejected your order "${order.title}". ${reason ? 'Reason: ' + reason : ''}`,
      relatedId: order._id,
      relatedModel: 'Order'
    });

    res.json({ message: 'Order rejected successfully', order });
  } catch (err) {
    console.error('Error in rejectOrder:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Complete Payment ──────
const completePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, transactionId } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('buyer', 'name email wallet')
      .populate('seller', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only buyer can complete payment
    if (order.buyer._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only buyer can complete payment' });
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

    // Check if buyer has sufficient balance
    const buyer = await User.findById(userId).select('wallet');
    if (!buyer || buyer.wallet.balance < order.price) {
      return res.status(400).json({ 
        message: 'Insufficient balance. Please add money to your wallet.',
        currentBalance: buyer?.wallet?.balance || 0,
        requiredAmount: order.price
      });
    }

    // Deduct amount from buyer's wallet
    await User.findByIdAndUpdate(userId, {
      $inc: { 'wallet.balance': -order.price }
    });

    // Update order status to in_progress
    order.status = 'in_progress';
    order.paymentStatus = 'completed';
    order.paymentCompletedAt = new Date();
    order.startDate = new Date();

    // Calculate commission (10%) and seller amount (90%)
    const totalAmount = order.price;
    order.totalAmount = totalAmount;
    order.commission = totalAmount * 0.10; // 10% commission
    order.sellerAmount = totalAmount * 0.90; // 90% for seller (pending until delivery)

    // Update the due date based on delivery days from payment completion
    order.dueDate = new Date(Date.now() + order.deliveryDays * 24 * 60 * 60 * 1000);

    await order.save();

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

    res.json(order);
  } catch (err) {
    console.error('Error in completePayment:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Deliver Order (Seller submits delivery) ──────
const deliverOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { description, notes, link } = req.body;

    const order = await Order.findById(orderId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only seller can deliver
    if (order.seller._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only seller can deliver order' });
    }

    // Can only deliver in_progress orders
    if (order.status !== 'in_progress') {
      return res.status(400).json({ 
        message: 'Order must be in progress to deliver',
        currentStatus: order.status
      });
    }

    // Payment must be completed
    if (order.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'Payment must be completed before delivery' });
    }

    // Handle file uploads
    const files = [];
    if (req.files && req.files.length > 0) {
      files.push(...req.files.map(file => file.path));
    }

    // Update order with delivery information
    order.delivery = {
      description: description || '',
      notes: notes || '',
      link: link || '',
      files: files,
      deliveredAt: new Date()
    };
    order.status = 'delivered';

    await order.save();

    // Create notification for buyer to review and tip
    try {
      await Notification.create({
        recipient: order.buyer._id,
        type: 'order_delivered',
        title: 'Order Delivered!',
        message: `${order.seller.name} has delivered your order "${order.title}". Please review the delivery and don't forget to leave a review and tip if you're satisfied!`,
        relatedId: order._id,
        relatedModel: 'Order'
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    // Emit socket notification
    try {
      if (global.io) {
        global.io.to(`user_${order.buyer._id}`).emit('order_delivered', {
          orderId: order._id,
          title: order.title,
          sellerName: order.seller.name
        });
      }
    } catch (socketErr) {
      console.error('Error emitting socket notification:', socketErr);
    }

    // Send email notification to buyer
    try {
      const buyerUser = await User.findById(order.buyer._id).select('emailNotifications');
      if (buyerUser && buyerUser.emailNotifications) {
        await sendEmail(order.buyer.email, 'order_delivered', {
          buyerName: order.buyer.name,
          gigTitle: order.title
        });
      }
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
    }

    res.json({ message: 'Order delivered successfully', order });
  } catch (err) {
    console.error('Error in deliverOrder:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Accept Delivery (Buyer) ──────
const acceptDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only buyer can accept delivery
    if (order.buyer._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only buyer can accept delivery' });
    }

    // Can only accept delivered orders
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Order must be delivered first' });
    }

    // Update delivery status
    order.delivery.status = 'accepted';
    // Note: Order remains in 'delivered' status until buyer leaves review, then becomes 'completed'

    await order.save();

    // Create notification for seller
    try {
      await Notification.create({
        recipient: order.seller._id,
        type: 'order_completed',
        title: 'Delivery Accepted!',
        message: `${order.buyer.name} has accepted your delivery for order "${order.title}". Awaiting review.`,
        relatedId: order._id,
        relatedModel: 'Order'
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    // Emit socket notification
    try {
      if (global.io) {
        global.io.to(`user_${order.seller._id}`).emit('delivery_accepted', {
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
        await sendEmail(order.seller.email, 'delivery_accepted', {
          sellerName: order.seller.name,
          gigTitle: order.title
        });
      }
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
    }

    res.json({ message: 'Delivery accepted successfully', order });
  } catch (err) {
    console.error('Error in acceptDelivery:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Reject Delivery (Buyer) ──────
const rejectDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, redeliveryDays } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only buyer can reject delivery
    if (order.buyer._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only buyer can reject delivery' });
    }

    // Can only reject delivered orders
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Order must be delivered first' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    // Update delivery status and set redelivery deadline
    order.delivery.status = 'rejected';
    order.delivery.rejectionReason = reason;
    if (redeliveryDays) {
      order.delivery.redeliveryDeadline = new Date(Date.now() + redeliveryDays * 24 * 60 * 60 * 1000);
    }
    order.status = 'in_progress'; // Back to in_progress for redelivery

    await order.save();

    // Create notification for seller
    try {
      await Notification.create({
        recipient: order.seller._id,
        type: 'order_delivered',
        title: 'Delivery Rejected',
        message: `${order.buyer.name} has rejected your delivery for order "${order.title}". Reason: ${reason}. Please redeliver${redeliveryDays ? ` within ${redeliveryDays} days` : ''}.`,
        relatedId: order._id,
        relatedModel: 'Order'
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    // Emit socket notification
    try {
      if (global.io) {
        global.io.to(`user_${order.seller._id}`).emit('delivery_rejected', {
          orderId: order._id,
          title: order.title,
          reason: reason
        });
      }
    } catch (socketErr) {
      console.error('Error emitting socket notification:', socketErr);
    }

    // Send email notification to seller
    try {
      const sellerUser = await User.findById(order.seller._id).select('emailNotifications');
      if (sellerUser && sellerUser.emailNotifications) {
        const redeliveryDate = new Date(redeliveryDeadline).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        await sendEmail(order.seller.email, 'delivery_rejected', {
          sellerName: order.seller.name,
          gigTitle: order.title,
          reason: reason,
          redeliveryDeadline: redeliveryDate
        });
      }
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
    }

    res.json({ message: 'Delivery rejected. Seller has been notified for redelivery.', order });
  } catch (err) {
    console.error('Error in rejectDelivery:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Request Extension ──────
const requestExtension = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, extensionDays } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    const isBuyer = order.buyer._id.toString() === userId;
    const isSeller = order.seller._id.toString() === userId;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!extensionDays || extensionDays < 1) {
      return res.status(400).json({ message: 'Extension days must be at least 1' });
    }

    // Add extension request
    const extensionRequest = {
      requestedBy: isBuyer ? 'buyer' : 'seller',
      reason,
      extensionDays,
      status: 'pending'
    };

    order.extensionRequests.push(extensionRequest);
    await order.save();

    // Determine recipient (opposite party)
    const recipient = isBuyer ? order.seller._id : order.buyer._id;
    const requesterName = isBuyer ? order.buyer.name : order.seller.name;

    // Create notification
    await Notification.create({
      recipient,
      type: 'extension_requested',
      title: 'Extension Request',
      message: `${requesterName} has requested a ${extensionDays} day extension for order "${order.title}". Reason: ${reason}`,
      relatedId: order._id,
      relatedModel: 'Order'
    });

    res.json({ message: 'Extension request submitted', order });
  } catch (err) {
    console.error('Error in requestExtension:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Respond to Extension Request ──────
const respondToExtension = async (req, res) => {
  try {
    const { orderId, extensionId } = req.params;
    const { approved } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find the extension request
    const extensionRequest = order.extensionRequests.id(extensionId);

    if (!extensionRequest) {
      return res.status(404).json({ message: 'Extension request not found' });
    }

    if (extensionRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Extension request already processed' });
    }

    // Check authorization (opposite party must respond)
    const isBuyer = order.buyer._id.toString() === userId;
    const isSeller = order.seller._id.toString() === userId;

    if (
      (extensionRequest.requestedBy === 'buyer' && !isSeller) ||
      (extensionRequest.requestedBy === 'seller' && !isBuyer)
    ) {
      return res.status(403).json({ message: 'Unauthorized to respond to this request' });
    }

    // Update extension request
    extensionRequest.status = approved ? 'approved' : 'rejected';
    extensionRequest.respondedAt = new Date();
    extensionRequest.respondedBy = userId;

    // If approved and order is activated, extend payment deadline
    if (approved && order.status === 'activated') {
      const currentDeadline = order.paymentDeadline || new Date();
      order.paymentDeadline = new Date(
        currentDeadline.getTime() + extensionRequest.extensionDays * 24 * 60 * 60 * 1000
      );
    }

    // If approved and order is in_progress, extend due date
    if (approved && order.status === 'in_progress') {
      const currentDue = order.dueDate || new Date();
      order.dueDate = new Date(
        currentDue.getTime() + extensionRequest.extensionDays * 24 * 60 * 60 * 1000
      );
    }

    await order.save();

    // Determine recipient (requester)
    const recipient = extensionRequest.requestedBy === 'buyer' ? order.buyer._id : order.seller._id;
    const responderName = isBuyer ? order.buyer.name : order.seller.name;

    // Create notification
    await Notification.create({
      recipient,
      type: approved ? 'extension_approved' : 'extension_rejected',
      title: approved ? 'Extension Approved' : 'Extension Rejected',
      message: `${responderName} has ${approved ? 'approved' : 'rejected'} your extension request for order "${order.title}".`,
      relatedId: order._id,
      relatedModel: 'Order'
    });

    res.json({
      message: `Extension request ${approved ? 'approved' : 'rejected'} successfully`,
      order
    });
  } catch (err) {
    console.error('Error in respondToExtension:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Seller Extend Payment Deadline (Direct) ──────
const extendPaymentDeadline = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { extensionDays } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only seller can extend deadline directly
    if (order.seller._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only seller can extend payment deadline' });
    }

    // Can only extend for activated orders
    if (order.status !== 'activated') {
      return res.status(400).json({ message: 'Order must be activated to extend payment deadline' });
    }

    if (!extensionDays || extensionDays < 1) {
      return res.status(400).json({ message: 'Extension days must be at least 1' });
    }

    // Extend payment deadline
    const currentDeadline = order.paymentDeadline || new Date();
    order.paymentDeadline = new Date(
      currentDeadline.getTime() + extensionDays * 24 * 60 * 60 * 1000
    );

    await order.save();

    // Create notification for buyer
    await Notification.create({
      recipient: order.buyer._id,
      type: 'deadline_extended',
      title: 'Payment Deadline Extended',
      message: `${order.seller.name} has extended the payment deadline for order "${order.title}" by ${extensionDays} days.`,
      relatedId: order._id,
      relatedModel: 'Order'
    });

    res.json({
      message: 'Payment deadline extended successfully',
      order,
      newDeadline: order.paymentDeadline
    });
  } catch (err) {
    console.error('Error in extendPaymentDeadline:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Check and Cancel Expired Orders (Cron Job Function) ──────
const cancelExpiredOrders = async () => {
  try {
    const now = new Date();

    // Find all activated orders with expired payment deadlines
    const expiredOrders = await Order.find({
      status: 'activated',
      paymentDeadline: { $lt: now }
    }).populate('buyer', 'name email').populate('seller', 'name email');

    for (const order of expiredOrders) {
      // Cancel the order
      order.status = 'cancelled';
      await order.save();

      // Update stats
      await User.findByIdAndUpdate(order.seller, {
        $inc: { 'stats.cancelledOrders': 1 }
      });

      await User.findByIdAndUpdate(order.buyer, {
        $inc: { 'stats.cancelledOrders': 1 }
      });

      // Create notifications for both parties
      await Notification.create({
        recipient: order.buyer._id,
        type: 'order_auto_cancelled',
        title: 'Order Auto-Cancelled',
        message: `Order "${order.title}" has been automatically cancelled due to non-payment within the deadline.`,
        relatedId: order._id,
        relatedModel: 'Order'
      });

      await Notification.create({
        recipient: order.seller._id,
        type: 'order_auto_cancelled',
        title: 'Order Auto-Cancelled',
        message: `Order "${order.title}" has been automatically cancelled due to non-payment by buyer.`,
        relatedId: order._id,
        relatedModel: 'Order'
      });

      console.log(`Auto-cancelled order ${order._id} due to payment deadline expiry`);
    }

    return expiredOrders.length;
  } catch (err) {
    console.error('Error in cancelExpiredOrders:', err);
    throw err;
  }
};

module.exports = {
  createOrderFromGig,
  createOrderFromProposal,
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  cancelOrder,
  acceptOrder,
  rejectOrder,
  completePayment,
  deliverOrder,
  acceptDelivery,
  rejectDelivery,
  requestExtension,
  respondToExtension,
  extendPaymentDeadline,
  cancelExpiredOrders
};
