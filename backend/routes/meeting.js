// backend/routes/meeting.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const meetingController = require('../controllers/meetingController');

// All routes require authentication
router.use(protect);

// Meeting routes for a conversation
router.post('/conversations/:conversationId/meetings', meetingController.createMeeting);
router.get('/conversations/:conversationId/meetings', meetingController.getMeetings);

// User's upcoming meetings
router.get('/upcoming', meetingController.getUpcomingMeetings);

// Meeting actions
router.put('/:meetingId/accept', meetingController.acceptMeeting);
router.put('/:meetingId/decline', meetingController.declineMeeting);
router.put('/:meetingId/propose-time', meetingController.proposeNewTime);
router.put('/:meetingId/start', meetingController.startMeeting);
router.put('/:meetingId/end', meetingController.endMeeting);
router.put('/:meetingId/cancel', meetingController.cancelMeeting);

module.exports = router;