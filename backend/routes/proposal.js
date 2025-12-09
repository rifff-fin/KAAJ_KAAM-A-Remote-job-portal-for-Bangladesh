// backend/routes/proposal.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const proposalController = require('../controllers/proposalController');

// Middleware to verify authentication
router.use(protect);

// Create proposal
router.post('/', proposalController.createProposal);

// Get proposals for a job (buyer only)
router.get('/job/:jobId', proposalController.getJobProposals);

// Get seller's proposals
router.get('/seller/all', proposalController.getSellerProposals);

// Accept proposal
router.put('/:proposalId/accept', proposalController.acceptProposal);

// Reject proposal
router.put('/:proposalId/reject', proposalController.rejectProposal);

// Withdraw proposal
router.put('/:proposalId/withdraw', proposalController.withdrawProposal);

module.exports = router;
