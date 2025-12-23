// backend/controllers/reviewController.js
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ────── Create Review ──────
const createReview = async (req, res) => {
  try {
    const { orderId, rating, comment, categories, isAnonymous, recommendation } = req.body;
    const reviewerId = req.user.id;

    // Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Order must be completed to review' });
    }

    // Determine reviewee based on reviewer role
    let reviewee;
    let isFreelancerReview = false;
    if (order.buyer.toString() === reviewerId) {
      // Buyer reviewing seller
      reviewee = order.seller;
      isFreelancerReview = false;
    } else if (order.seller.toString() === reviewerId) {
      // Seller reviewing buyer
      reviewee = order.buyer;
      isFreelancerReview = true;
    } else {
      return res.status(403).json({ message: 'You are not part of this order' });
    }

    // Check if already reviewed
    const existing = await Review.findOne({ order: orderId, reviewer: reviewerId });
    if (existing) {
      return res.status(400).json({ message: 'You already reviewed this order' });
    }

    // Create review with recommendation if freelancer is reviewing
    const reviewData = {
      order: orderId,
      reviewer: reviewerId,
      reviewee: reviewee,
      rating,
      comment,
      categories: categories || {},
      isAnonymous: isAnonymous || false
    };

    if (isFreelancerReview && recommendation !== undefined) {
      reviewData.recommendation = recommendation;
    }

    const review = await Review.create(reviewData);

    // Update reviewee rating
    const reviews = await Review.find({ reviewee: reviewee });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    // Calculate average categories based on review type
    let avgCategories = {};
    
    if (isFreelancerReview) {
      // For freelancer reviews, calculate client-specific metrics
      avgCategories = {
        clientBehavior: reviews.filter(r => r.categories?.clientBehavior).reduce((sum, r) => sum + (r.categories?.clientBehavior || 0), 0) / Math.max(reviews.filter(r => r.categories?.clientBehavior).length, 1),
        clearInstructions: reviews.filter(r => r.categories?.clearInstructions).reduce((sum, r) => sum + (r.categories?.clearInstructions || 0), 0) / Math.max(reviews.filter(r => r.categories?.clearInstructions).length, 1),
        communication: reviews.filter(r => r.categories?.communication).reduce((sum, r) => sum + (r.categories?.communication || 0), 0) / Math.max(reviews.filter(r => r.categories?.communication).length, 1),
        paymentOnTime: reviews.filter(r => r.categories?.paymentOnTime).reduce((sum, r) => sum + (r.categories?.paymentOnTime || 0), 0) / Math.max(reviews.filter(r => r.categories?.paymentOnTime).length, 1)
      };
    } else {
      // For buyer reviews, calculate freelancer metrics
      avgCategories = {
        communication: reviews.filter(r => r.categories?.communication).reduce((sum, r) => sum + (r.categories?.communication || 0), 0) / Math.max(reviews.filter(r => r.categories?.communication).length, 1),
        quality: reviews.filter(r => r.categories?.quality).reduce((sum, r) => sum + (r.categories?.quality || 0), 0) / Math.max(reviews.filter(r => r.categories?.quality).length, 1),
        timeliness: reviews.filter(r => r.categories?.timeliness).reduce((sum, r) => sum + (r.categories?.timeliness || 0), 0) / Math.max(reviews.filter(r => r.categories?.timeliness).length, 1),
        professionalism: reviews.filter(r => r.categories?.professionalism).reduce((sum, r) => sum + (r.categories?.professionalism || 0), 0) / Math.max(reviews.filter(r => r.categories?.professionalism).length, 1)
      };
    }

    await User.findByIdAndUpdate(reviewee, {
      'rating.average': avgRating,
      'rating.count': reviews.length,
      'rating.breakdown': avgCategories
    });

    // Create notification
    const notification = await Notification.create({
      recipient: reviewee,
      type: 'review_received',
      title: `New ${rating}-star review`,
      message: `You received a review: "${comment.substring(0, 50)}..."`,
      relatedId: review._id,
      relatedModel: 'Review'
    });

    // Emit socket notification
    if (global.io) {
      global.io.to(`user_${reviewee}`).emit('new_notification', notification);
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
