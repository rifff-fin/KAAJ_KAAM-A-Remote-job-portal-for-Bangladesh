// backend/routes/payment.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  requestPayment,
  verifyPayment,
  getPaymentHistory
} = require('../controllers/paymentController');

// All routes require authentication
router.use(protect);

// Request payment with OTP
router.post('/request', requestPayment);

// Verify OTP and complete payment
router.post('/verify', verifyPayment);

// Get payment history
router.get('/history', getPaymentHistory);

module.exports = router;
