// backend/index.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const gigRoutes = require('./routes/gig');
const jobRoutes = require('./routes/job'); // ← Make sure this is imported

const app = express();

// CORS
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json());

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/jobs', jobRoutes); // ← MUST BE HERE

app.get('/', (req, res) => res.send('KAAJ KAAM API Running'));

// Socket.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins } });
app.set('io', io);
require('./sockets/chatSocket')(io);

// Start
connectDB().then(() => {
  server.listen(8080, () => {
    console.log('Server running on http://localhost:8080');
  });
});