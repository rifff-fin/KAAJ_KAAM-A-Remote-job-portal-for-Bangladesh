// backend/routes/settings.js
const express = require('express');
const router = express.Router();
const { getSettings, updateEmailNotifications } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getSettings);
router.put('/email-notifications', protect, updateEmailNotifications);

module.exports = router;
