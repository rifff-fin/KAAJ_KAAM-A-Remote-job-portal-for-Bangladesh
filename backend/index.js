const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const gigRoutes = require('./routes/gig');
const jobRoutes = require('./routes/job');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/jobs', jobRoutes);

app.get('/', (req, res) => {
  res.send('KAJKAM API Running');
});

// Create HTTP + Socket.IO Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://kaajkaam.vercel.app'  // Your Vercel URL
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Socket.IO Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a chat room (orderId)
  socket.on('join_room', (orderId) => {
    socket.join(orderId);
    console.log(`User ${socket.id} joined room: ${orderId}`);
  });

  // Leave a chat room
  socket.on('leave_room', (orderId) => {
    socket.leave(orderId);
    console.log(`User ${socket.id} left room: ${orderId}`);
  });

  // Send message
  socket.on('send_message', (data) => {
    io.to(data.orderId).emit('receive_message', {
      ...data,
      time: new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`ServerWorking ${PORT} এ`);
  console.log(`Socket.IO Ready on ws://localhost:${PORT}`);
});