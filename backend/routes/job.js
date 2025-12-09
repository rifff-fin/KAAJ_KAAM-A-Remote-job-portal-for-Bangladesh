// backend/routes/job.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createJob,
  getJobs,
  getMyJobs,
  getJob,
  showInterest,
  hireFreelancer,
  unhireFreelancer,
  completeJob
} = require('../controllers/jobController');

// Create a new job (buyer only)
router.post('/', protect, createJob);

// Get all jobs (public)
router.get('/', getJobs);

// Get my jobs (buyer only)
router.get('/my', protect, getMyJobs);

// Get single job
router.get('/:id', getJob);

// Show interest in a job (seller only)
router.post('/:id/interest', protect, showInterest);

// Hire a freelancer (buyer only)
router.post('/:id/hire', protect, hireFreelancer);

// Unhire a freelancer (buyer only)
router.post('/:id/unhire', protect, unhireFreelancer);

// Complete a job (buyer only)
router.post('/:id/complete', protect, completeJob);

module.exports = router;