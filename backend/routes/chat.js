// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Test endpoint (no auth required)
router.get('/test', (req, res) => {
  res.json({ message: 'Chat routes are working!' });
});

// Middleware to verify authentication
router.use(protect);

// Conversation routes
router.post('/conversations', chatController.getOrCreateConversation);
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId', chatController.getConversationById);
router.delete('/conversations/:conversationId', chatController.deleteConversation);

// Message routes
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.post('/conversations/:conversationId/call-record', chatController.saveCallRecord);
router.put('/conversations/:conversationId/read', chatController.markAsRead);

// Unread count
router.get('/unread-count', chatController.getUnreadCount);

module.exports = router;
