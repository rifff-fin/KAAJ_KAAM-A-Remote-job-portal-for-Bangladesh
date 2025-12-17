const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  updateAvatar,
  updateSellerProfile,
  updateBuyerProfile,
  getPublicProfile,
  searchSellers
} = require('../controllers/profileController');

// Get current user's profile
router.get('/me', protect, getProfile);

// Update profile (general fields)
router.put('/update', protect, updateProfile);

// Update profile avatar
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

// Seller-specific profile update
router.put('/seller', protect, updateSellerProfile);

// Buyer-specific profile update
router.put('/buyer', protect, updateBuyerProfile);

// Search sellers
router.get('/sellers/search', searchSellers);

// Get public profile of any user
router.get('/:userId', getPublicProfile);

module.exports = router;
