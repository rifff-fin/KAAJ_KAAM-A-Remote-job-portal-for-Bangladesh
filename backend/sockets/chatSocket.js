// backend/sockets/chatSocket.js
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined personal room`);
    }

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${userId} joined conversation: ${conversationId}`);
      
      // Notify others that user is online
      socket.to(`conversation_${conversationId}`).emit('user_online', {
        userId,
        timestamp: new Date()
      });
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      socket.to(`conversation_${conversationId}`).emit('user_offline', {
        userId,
        timestamp: new Date()
      });
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, text, attachments } = data;

        // Save message to DB
        const message = await Message.create({
          conversationId,
          sender: userId,
          text,
          attachments: attachments || []
        });

        // Populate sender info
        await message.populate('sender', 'name profile.avatar');

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

        // Emit to all participants in conversation
        io.to(`conversation_${conversationId}`).emit('receive_message', {
          _id: message._id,
          conversationId,
          sender: message.sender,
          text,
          attachments,
          createdAt: message.createdAt
        });

        // Notify other participant
        const conversation = await Conversation.findById(conversationId);
        const otherParticipant = conversation.participants.find(
          p => p.toString() !== userId
        );

        if (otherParticipant) {
          await Notification.create({
            recipient: otherParticipant,
            type: 'new_message',
            title: 'New message',
            message: `You have a new message: "${text.substring(0, 50)}..."`,
            relatedId: conversationId,
            relatedModel: 'Conversation'
          });

          io.to(`user_${otherParticipant}`).emit('new_notification', {
            type: 'new_message',
            conversationId
          });
        }
      } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (conversationId) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId,
        timestamp: new Date()
      });
    });

    socket.on('stop_typing', (conversationId) => {
      socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
        userId
      });
    });

    // Mark messages as read
    socket.on('mark_read', async (conversationId) => {
      try {
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

        io.to(`conversation_${conversationId}`).emit('messages_read', {
          userId,
          conversationId
        });
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      socket.broadcast.emit('user_offline', { userId });
    });
  });
};