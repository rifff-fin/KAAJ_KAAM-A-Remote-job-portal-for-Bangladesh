// backend/routes/deposit.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  requestDeposit,
  verifyDeposit,
  getDepositHistory
} = require('../controllers/depositController');

// All routes require authentication
router.use(protect);

// Request deposit with OTP
router.post('/request', requestDeposit);

// Verify OTP and complete deposit
router.post('/verify', verifyDeposit);

// Get deposit history
router.get('/history', getDepositHistory);

module.exports = router;
