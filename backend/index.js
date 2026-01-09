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
const PORT = process.env.PORT || 8080;

// CORS Configuration (fixed to allow multiple origins)
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'x-auth-token']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => res.json({ message: 'KAAJ KAAM API Running' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/profile', require('./routes/profile'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/proposals', require('./routes/proposal'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/meetings', require('./routes/meeting'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/search', require('./routes/search'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/withdrawals', require('./routes/withdrawal'));
app.use('/api/deposits', require('./routes/deposit'));
app.use('/api/payments', require('./routes/payment'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Make io globally accessible
global.io = io;
app.set('io', io);
require('./sockets/chatSocket')(io);

// Initialize meeting reminders
const { initializeMeetingReminders } = require('./utils/meetingReminders');
const { initOrderCronJobs } = require('./utils/orderCronJobs');

// Export app and server for testing
module.exports = app;
module.exports.server = server;

// Start Server (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    try {
      await connectDB();
      server.listen(PORT, () => {
        console.log(`✓ Server running on http://localhost:${PORT}`);
        // Initialize meeting reminders after server starts
        initializeMeetingReminders(io);
        // Initialize order cron jobs
        initOrderCronJobs();
      });
    } catch (err) {
      console.error('✗ Failed to start server:', err.message);
      process.exit(1);
    }
  };

  startServer();
}
