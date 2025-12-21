// backend/controllers/orderController.js
const Order = require('../models/Order');
const Conversation = require('../models/Conversation');
const Gig = require('../models/Gig');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');

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
      status: 'active'
    });

    // Update proposal status
    await Proposal.findByIdAndUpdate(proposalId, { status: 'accepted' });

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

    const order = await Order.findById(orderId);
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

    order.status = status;
    if (status === 'completed') {
      order.completionDate = new Date();
    }

    await order.save();

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
    const userId = req.user.id;

    const order = await Order.findById(orderId);
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
    await order.save();

    res.json(order);
  } catch (err) {
    console.error('Error in cancelOrder:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createOrderFromGig,
  createOrderFromProposal,
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  cancelOrder
};
