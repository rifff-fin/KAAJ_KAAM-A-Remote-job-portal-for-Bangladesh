const express = require('express');
const { postJob, getJobs, applyToJob } = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, postJob);
router.get('/', getJobs);
router.post('/apply', protect, applyToJob);

module.exports = router;