// backend/sockets/chatSocket.js
const Message = require('../models/Message');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) socket.join(`user_${userId}`);

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    socket.on('send_message', async (data) => {
      const time = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const msg = new Message({
        roomId: data.roomId,
        sender: data.sender,
        message: data.message,
        time
      });
      await msg.save();

      io.to(data.roomId).emit('receive_message', {
        ...data,
        time,
        _id: msg._id
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};