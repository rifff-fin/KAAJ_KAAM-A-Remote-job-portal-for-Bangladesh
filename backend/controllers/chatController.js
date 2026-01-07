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

    console.log('Creating conversation:', {
      userId,
      participantId,
      orderId,
      gigId,
      jobId
    });

    // Validate participants
    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID required' });
    }

    // Check if user is trying to message themselves
    if (userId === participantId) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    // Verify participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Check if conversation already exists (regardless of order/gig/job)
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] }
    }).populate('participants', 'name email profile.avatar rating');

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [userId, participantId],
        ...(orderId && { orderId }),
        ...(gigId && { gigId }),
        ...(jobId && { jobId })
      });

      conversation = await conversation.populate('participants', 'name email profile.avatar rating');
      console.log('Created new conversation:', conversation._id);
    } else {
      console.log('Found existing conversation:', conversation._id);
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

    console.log('Fetching conversations for user:', userId);

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
      .populate('participants', 'name email profile.avatar rating')
      .populate('lastMessage.sender', 'name profile.avatar')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    console.log(`Found ${conversations.length} conversations`);

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
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get Single Conversation by ID ──────
const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email profile.avatar rating')
      .populate('lastMessage.sender', 'name profile.avatar');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user is participant
    if (!conversation.participants.some(p => p._id.toString() === userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(conversation);
  } catch (err) {
    console.error('Error in getConversationById:', err);
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
    const { conversationId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    
    // Handle file attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      const cloudinary = require('../config/cloudinary');
      const fs = require('fs');
      
      for (const file of req.files) {
        try {
          // Determine resource type and file type
          let resourceType = 'raw';
          let fileType = 'file';
          
          if (file.mimetype.startsWith('image/')) {
            resourceType = 'image';
            fileType = 'image';
          } else if (file.mimetype.startsWith('video/')) {
            resourceType = 'video';
            fileType = 'video';
          } else if (file.mimetype === 'application/pdf') {
            fileType = 'pdf';
          } else if (file.mimetype.includes('word') || file.originalname.match(/\.(doc|docx)$/i)) {
            fileType = 'doc';
          } else if (file.mimetype.includes('powerpoint') || file.originalname.match(/\.(ppt|pptx)$/i)) {
            fileType = 'ppt';
          } else if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet') || file.originalname.match(/\.(xls|xlsx)$/i)) {
            fileType = 'xls';
          } else if (file.mimetype === 'text/plain' || file.originalname.match(/\.txt$/i)) {
            fileType = 'txt';
          } else if (file.mimetype === 'text/csv' || file.originalname.match(/\.csv$/i)) {
            fileType = 'csv';
          } else if (file.mimetype.includes('zip') || file.mimetype.includes('rar')) {
            fileType = 'zip';
          }
          
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'kaaj-kaam/chat-attachments',
            resource_type: resourceType
          });
          
          attachments.push({
            url: result.secure_url,
            type: fileType,
            name: file.originalname,
            size: file.size
          });
          
          // Delete local file
          fs.unlink(file.path, () => {});
        } catch (uploadErr) {
          console.error('Error uploading file:', uploadErr);
        }
      }
    }

    // Trim text and check if we have content
    const trimmedText = text?.trim();
    
    if (!trimmedText && attachments.length === 0) {
      return res.status(400).json({ message: 'Message text or attachments required' });
    }

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    if (!conversation.participants.some(p => p.toString() === userId)) {
      return res.status(403).json({ message: 'Unauthorized - You are not a participant in this conversation' });
    }

    // Create message - only include text if it's not empty
    const messageData = {
      conversationId,
      sender: userId,
      attachments: attachments.length > 0 ? attachments : []
    };
    
    // Add text only if it exists and is not empty
    if (trimmedText) {
      messageData.text = trimmedText;
    } else if (attachments.length > 0) {
      // If we have attachments but no text, provide a default message
      messageData.text = '';
    }

    // Debug logging
    console.log('Creating message with data:', JSON.stringify(messageData, null, 2));
    console.log('Attachments type:', typeof messageData.attachments);
    console.log('Attachments is array:', Array.isArray(messageData.attachments));

    const message = await Message.create(messageData);

    // Update conversation - use appropriate text for last message
    const lastMessageText = trimmedText || (attachments.length > 0 ? '📎 Attachment' : '');
    
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: {
          text: lastMessageText,
          sender: userId,
          timestamp: new Date()
        },
        updatedAt: new Date()
      }
    );

    // Populate sender info
    await message.populate('sender', 'name profile.avatar');

    // Emit to all participants in conversation via socket
    const io = req.app.get('io');
    if (io) {
      const messageData = {
        _id: message._id,
        conversationId,
        sender: message.sender,
        text: message.text || '',
        attachments: message.attachments || [],
        createdAt: message.createdAt
      };

      // Emit to conversation room
      io.to(`conversation_${conversationId}`).emit('receive_message', messageData);

      // Also emit to other participant's personal room
      const otherParticipant = conversation.participants.find(
        p => p.toString() !== userId
      );

      if (otherParticipant) {
        io.to(`user_${otherParticipant}`).emit('receive_message', messageData);

        try {
          const Notification = require('../models/Notification');
          const notificationMessage = trimmedText 
            ? `You have a new message: "${trimmedText.substring(0, 50)}..."` 
            : attachments.length > 0 
              ? `You have a new message with ${attachments.length} attachment(s)`
              : 'You have a new message';
          
          await Notification.create({
            recipient: otherParticipant,
            type: 'new_message',
            title: 'New message',
            message: notificationMessage,
            relatedId: conversationId,
            relatedModel: 'Conversation'
          });

          io.to(`user_${otherParticipant}`).emit('new_notification', {
            type: 'new_message',
            conversationId
          });
        } catch (notifErr) {
          console.error('Error creating notification:', notifErr);
          // Don't fail the message send if notification fails
        }
      }
    }

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

// ────── Save Call Record ──────
const saveCallRecord = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { callType, duration, status } = req.body;
    const userId = req.user.id;

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Create call record message
    const message = await Message.create({
      conversationId,
      sender: userId,
      text: '', // Empty text for call messages
      messageType: 'call',
      callInfo: {
        callType,
        duration,
        status,
        initiatedBy: userId
      }
    });

    // Update conversation
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: {
          text: `${callType === 'video' ? 'Video' : 'Voice'} call`,
          sender: userId,
          timestamp: new Date()
        },
        updatedAt: new Date()
      }
    );

    // Populate sender info
    await message.populate('sender', 'name profile.avatar');

    // Emit to conversation via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('receive_message', {
        _id: message._id,
        conversationId,
        sender: message.sender,
        messageType: 'call',
        callInfo: message.callInfo,
        createdAt: message.createdAt
      });
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('Error in saveCallRecord:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getConversationById,
  getMessages,
  sendMessage,
  saveCallRecord,
  markAsRead,
  deleteConversation,
  getUnreadCount
};
