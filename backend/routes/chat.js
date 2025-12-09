// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Middleware to verify authentication
router.use(protect);

// Conversation routes
router.post('/conversations', chatController.getOrCreateConversation);
router.get('/conversations', chatController.getConversations);
router.delete('/conversations/:conversationId', chatController.deleteConversation);

// Message routes
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.put('/conversations/:conversationId/read', chatController.markAsRead);

// Unread count
router.get('/unread-count', chatController.getUnreadCount);

module.exports = router;
