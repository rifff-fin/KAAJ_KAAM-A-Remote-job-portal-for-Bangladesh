// backend/controllers/reviewController.js
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ────── Create Review ──────
const createReview = async (req, res) => {
  try {
    const { orderId, rating, comment, categories, isAnonymous } = req.body;
    const reviewerId = req.user.id;

    // Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only buyer can review seller
    if (order.buyer.toString() !== reviewerId) {
      return res.status(403).json({ message: 'Only buyer can review' });
    }

    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Order must be completed to review' });
    }

    // Check if already reviewed
    const existing = await Review.findOne({ order: orderId, reviewer: reviewerId });
    if (existing) {
      return res.status(400).json({ message: 'You already reviewed this order' });
    }

    // Create review
    const review = await Review.create({
      order: orderId,
      reviewer: reviewerId,
      reviewee: order.seller,
      rating,
      comment,
      categories: categories || {},
      isAnonymous: isAnonymous || false
    });

    // Update seller rating
    const reviews = await Review.find({ reviewee: order.seller });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const avgCategories = {
      communication: reviews.reduce((sum, r) => sum + (r.categories?.communication || 0), 0) / reviews.length,
      quality: reviews.reduce((sum, r) => sum + (r.categories?.quality || 0), 0) / reviews.length,
      timeliness: reviews.reduce((sum, r) => sum + (r.categories?.timeliness || 0), 0) / reviews.length,
      professionalism: reviews.reduce((sum, r) => sum + (r.categories?.professionalism || 0), 0) / reviews.length
    };

    await User.findByIdAndUpdate(order.seller, {
      'rating.average': avgRating,
      'rating.count': reviews.length,
      'rating.breakdown': avgCategories
    });

    // Create notification
    const notification = await Notification.create({
      recipient: order.seller,
      type: 'review_received',
      title: `New ${rating}-star review`,
      message: `You received a review: "${comment.substring(0, 50)}..."`,
      relatedId: review._id,
      relatedModel: 'Review'
    });

    // Emit socket notification
    if (global.io) {
      global.io.to(`user_${order.seller}`).emit('new_notification', notification);
    }

    await review.populate('reviewer', 'name profile.avatar');

    res.status(201).json(review);
  } catch (err) {
    console.error('Error in createReview:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get Reviews for User ──────
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const reviews = await Review.find({ reviewee: userId })
      .populate('reviewer', 'name profile.avatar')
      .populate('order', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Review.countDocuments({ reviewee: userId });

    res.json({
      reviews,
      total,
      hasMore: skip + limit < total
    });
  } catch (err) {
    console.error('Error in getUserReviews:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get User's Given Reviews ──────
const getGivenReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0 } = req.query;

    const reviews = await Review.find({ reviewer: userId })
      .populate('reviewee', 'name profile.avatar')
      .populate('order', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Review.countDocuments({ reviewer: userId });

    res.json({
      reviews,
      total,
      hasMore: skip + limit < total
    });
  } catch (err) {
    console.error('Error in getGivenReviews:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Update Review ──────
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, categories } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reviewer.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.categories = categories || review.categories;
    await review.save();

    // Recalculate seller rating
    const reviews = await Review.find({ reviewee: review.reviewee });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await User.findByIdAndUpdate(review.reviewee, {
      'rating.average': avgRating,
      'rating.count': reviews.length
    });

    res.json(review);
  } catch (err) {
    console.error('Error in updateReview:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Delete Review ──────
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reviewer.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Review.findByIdAndDelete(reviewId);

    // Recalculate seller rating
    const reviews = await Review.find({ reviewee: review.reviewee });
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await User.findByIdAndUpdate(review.reviewee, {
        'rating.average': avgRating,
        'rating.count': reviews.length
      });
    } else {
      await User.findByIdAndUpdate(review.reviewee, {
        'rating.average': 0,
        'rating.count': 0
      });
    }

    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('Error in deleteReview:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createReview,
  getUserReviews,
  getGivenReviews,
  updateReview,
  deleteReview
};
