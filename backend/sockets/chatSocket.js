// backend/sockets/chatSocket.js
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

module.exports = (io) => {
  // Store io instance globally for use in controllers
  global.io = io;
  
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    const userId = socket.handshake.query.userId;
    if (userId && userId !== 'undefined' && userId !== 'null') {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined personal room`);
      
      // Broadcast user online status
      socket.broadcast.emit('user_online', { userId });
    } else {
      console.log('User connected without valid userId');
    }

    // Handle explicit user_online event
    socket.on('user_online', (id) => {
      const userIdToUse = id || userId;
      if (userIdToUse && userIdToUse !== 'undefined' && userIdToUse !== 'null') {
        socket.join(`user_${userIdToUse}`);
        socket.broadcast.emit('user_online', { userId: userIdToUse });
        console.log(`User ${userIdToUse} is now online`);
      }
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      if (!conversationId) {
        console.error('No conversationId provided');
        return;
      }
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${userId || 'unknown'} joined conversation: ${conversationId}`);
      
      // Notify others that user is online
      if (userId) {
        socket.to(`conversation_${conversationId}`).emit('user_online', {
          userId,
          timestamp: new Date()
        });
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      socket.to(`conversation_${conversationId}`).emit('user_offline', {
        userId,
        timestamp: new Date()
      });
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

    // ────── Video/Audio Calling ──────
    
    // Initiate call
    socket.on('call:initiate', ({ conversationId, callType, offer, from, to }) => {
      console.log(`Call initiated: ${callType} from ${from} to ${to}`);
      io.to(`user_${to}`).emit('call:incoming', {
        conversationId,
        callType,
        offer,
        from,
        fromUser: userId
      });
    });

    // Accept call
    socket.on('call:accept', ({ conversationId, to, answer }) => {
      console.log('Call accepted, sending answer to:', to);
      io.to(`user_${to}`).emit('call:accepted', {
        conversationId,
        answer
      });
    });

    // Reject call
    socket.on('call:reject', ({ conversationId, to }) => {
      io.to(`user_${to}`).emit('call:rejected', {
        conversationId
      });
    });

    // End call
    socket.on('call:end', ({ conversationId, to }) => {
      io.to(`user_${to}`).emit('call:ended', {
        conversationId
      });
    });

    // WebRTC signaling
    socket.on('webrtc:offer', ({ conversationId, offer, to }) => {
      console.log('Relaying WebRTC offer to:', to);
      if (to) {
        io.to(`user_${to}`).emit('webrtc:offer', { offer, conversationId });
      } else {
        socket.to(`conversation_${conversationId}`).emit('webrtc:offer', { offer });
      }
    });

    socket.on('webrtc:answer', ({ conversationId, answer, to }) => {
      console.log('Relaying WebRTC answer to:', to);
      if (to) {
        io.to(`user_${to}`).emit('webrtc:answer', { answer, conversationId });
      } else {
        socket.to(`conversation_${conversationId}`).emit('webrtc:answer', { answer });
      }
    });

    socket.on('webrtc:ice-candidate', ({ conversationId, candidate, to }) => {
      console.log('Relaying ICE candidate to:', to);
      if (to) {
        io.to(`user_${to}`).emit('webrtc:ice-candidate', { candidate, conversationId });
      } else {
        socket.to(`conversation_${conversationId}`).emit('webrtc:ice-candidate', { candidate });
      }
    });

    // ────── Meeting Events ──────
    
    // Join meeting room
    socket.on('meeting:join-room', (meetingId) => {
      socket.join(`meeting_${meetingId}`);
      console.log(`User ${userId} joined meeting room: ${meetingId}`);
    });

    // Leave meeting room
    socket.on('meeting:leave-room', (meetingId) => {
      socket.leave(`meeting_${meetingId}`);
      console.log(`User ${userId} left meeting room: ${meetingId}`);
    });

    // Meeting participant joined
    socket.on('meeting:participant-joined', ({ meetingId, participantId }) => {
      io.to(`meeting_${meetingId}`).emit('meeting:participant-joined', {
        participantId,
        timestamp: new Date()
      });
    });

    // Meeting participant left
    socket.on('meeting:participant-left', ({ meetingId, participantId }) => {
      io.to(`meeting_${meetingId}`).emit('meeting:participant-left', {
        participantId,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      socket.broadcast.emit('user_offline', { userId });
    });
  });
};