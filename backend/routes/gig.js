// backend/routes/gig.js
const express = require('express');
const { createGig, getMyGigs, getAllGigs, getGig, updateGig, deleteGig } = require('../controllers/gigController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Create a new gig (protected - sellers only)
router.post('/', protect, upload.single('image'), createGig);

// Get all gigs (public)
router.get('/', getAllGigs);

// Get my gigs (protected)
router.get('/my', protect, getMyGigs);

// Get single gig by ID (public)
router.get('/:id', getGig);

// Update gig (protected - seller only)
router.put('/:id', protect, upload.single('image'), updateGig);

// Delete gig (protected - seller only)
router.delete('/:id', protect, deleteGig);

module.exports = router;