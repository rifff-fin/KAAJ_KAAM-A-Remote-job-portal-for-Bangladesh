// backend/routes/review.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// Create review (authenticated)
router.post('/', protect, reviewController.createReview);

// Get reviews for a user (public)
router.get('/user/:userId', reviewController.getUserReviews);

// Get user's given reviews (authenticated)
router.get('/given/all', protect, reviewController.getGivenReviews);

// Update review (authenticated)
router.put('/:reviewId', protect, reviewController.updateReview);

// Delete review (authenticated)
router.delete('/:reviewId', protect, reviewController.deleteReview);

module.exports = router;
