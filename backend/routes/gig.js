const express = require('express');
const { createGig, getMyGigs, getAllGigs, getGig } = require('../controllers/gigController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', protect, upload.single('image'), createGig);
router.get('/my', protect, getMyGigs);
router.get('/', getAllGigs);
router.get('/:id', getGig);  // NOW WORKS

module.exports = router;