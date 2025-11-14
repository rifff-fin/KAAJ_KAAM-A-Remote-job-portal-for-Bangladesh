// backend/routes/gig.js
const express = require('express');
const { createGig, getMyGigs, getAllGigs, getGig } = require('../controllers/gigController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Gig = require('../models/Gig'); // <-- THIS WAS MISSING

const router = express.Router();

router.post('/', protect, upload.single('image'), createGig);
router.get('/my', protect, getMyGigs); // Keep for protected
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { user: userId } : {};
    const gigs = await Gig.find(filter).populate('user', 'name');
    res.json(gigs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/:id', getGig);

module.exports = router;