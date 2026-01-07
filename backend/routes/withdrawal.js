// backend/routes/withdrawal.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  requestWithdrawal,
  verifyWithdrawal,
  getWithdrawalHistory,
  getFinancialSummary
} = require('../controllers/withdrawalController');

// All routes require authentication
router.post('/request', protect, requestWithdrawal);
router.post('/verify', protect, verifyWithdrawal);
router.get('/history', protect, getWithdrawalHistory);
router.get('/summary', protect, getFinancialSummary);

module.exports = router;
