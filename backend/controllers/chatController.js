// backend/controllers/chatController.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Order = require('../models/Order');

// ────── Get or Create Conversation ──────
const getOrCreateConversation = async (req, res) => {
  try {
    const { participantId, orderId, gigId, jobId } = req.body;
    const userId = req.user.id;

    // Validate participants
    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID required' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] },
      ...(orderId && { orderId }),
      ...(gigId && { gigId }),
      ...(jobId && { jobId })
    }).populate('participants', 'name email profile.avatar');

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [userId, participantId],
        ...(orderId && { orderId }),
        ...(gigId && { gigId }),
        ...(jobId && { jobId })
      });

      conversation = await conversation.populate('participants', 'name email profile.avatar');
    }

    res.json(conversation);
  } catch (err) {
    console.error('Error in getOrCreateConversation:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get All Conversations for User ──────
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0 } = req.query;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
      .populate('participants', 'name email profile.avatar')
      .populate('lastMessage.sender', 'name profile.avatar')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Conversation.countDocuments({
      participants: userId,
      isActive: true
    });

    res.json({
      conversations,
      total,
      hasMore: skip + limit < total
    });
  } catch (err) {
    console.error('Error in getConversations:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get Messages in Conversation ──────
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    const userId = req.user.id;

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name profile.avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Message.countDocuments({ conversationId });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      messages: messages.reverse(),
      total,
      hasMore: skip + limit < total
    });
  } catch (err) {
    console.error('Error in getMessages:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Send Message ──────
const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, attachments } = req.body;
    const userId = req.user.id;

    if (!text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message text or attachments required' });
    }

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      sender: userId,
      text,
      attachments: attachments || []
    });

    // Update conversation
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: {
          text,
          sender: userId,
          timestamp: new Date()
        },
        updatedAt: new Date()
      }
    );

    // Populate sender info
    await message.populate('sender', 'name profile.avatar');

    res.status(201).json(message);
  } catch (err) {
    console.error('Error in sendMessage:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Mark Messages as Read ──────
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      {
        conversationId,
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error('Error in markAsRead:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Delete Conversation ──────
const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Soft delete
    await Conversation.findByIdAndUpdate(conversationId, { isActive: false });

    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    console.error('Error in deleteConversation:', err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get Unread Count ──────
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.countDocuments({
      'readBy.userId': { $ne: userId }
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error('Error in getUnreadCount:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteConversation,
  getUnreadCount
};
