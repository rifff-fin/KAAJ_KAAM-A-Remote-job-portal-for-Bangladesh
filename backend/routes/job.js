// backend/routes/job.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createJob,
  getJobs,
  showInterest,
  hireFreelancer,
  unhireFreelancer,
} = require('../controllers/jobController');

// ------------------------------------------------------------------
// 1. POST /api/jobs   → client posts a new job
// ------------------------------------------------------------------
router.post('/', protect, createJob);

// ------------------------------------------------------------------
// 2. GET  /api/jobs   → get all posted jobs (public)
// ------------------------------------------------------------------
router.get('/', getJobs);

// ------------------------------------------------------------------
// 3. POST /api/jobs/:id/interest   → freelancer shows interest
// ------------------------------------------------------------------
router.post('/:id/interest', protect, showInterest);

// ------------------------------------------------------------------
// 4. POST /api/jobs/:id/hire   → client hires a freelancer
// ------------------------------------------------------------------
router.post('/:id/hire', protect, hireFreelancer);

// ------------------------------------------------------------------
// 5. POST /api/jobs/:id/unhire → client unhires a freelancer
// ------------------------------------------------------------------
router.post('/:id/unhire', protect, unhireFreelancer);

module.exports = router;