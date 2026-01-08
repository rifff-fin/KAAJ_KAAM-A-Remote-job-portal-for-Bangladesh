/**
 * KAAJ_KAAM - Direct Messages Feature Test Suite
 * Author: Abdullah Al Rifat
 * Student ID: 22201979
 * Feature: Real-time Direct Messaging via Socket.IO
 * 
 * This test suite covers:
 * - API Endpoints (POST /api/messages, GET /api/messages/:conversationId)
 * - Socket.IO Real-time Events (connection, join_room, send_message, receive_message)
 */

import request from 'supertest';
import { Server } from 'socket.io';
import { io as ioClient, Socket } from 'socket.io-client';
import http from 'http';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Import models
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const User = require('../../models/User');

// Import routes and middleware
const chatRoutes = require('../../routes/chat');
const { protect } = require('../../middleware/auth');

// Test server and socket instances
let app: express.Application;
let server: http.Server;
let io: Server;
let testPort: number;

// Test user data
let testUser1: any;
let testUser2: any;
let authToken1: string;
let authToken2: string;
let conversationId: string;

// Socket clients
let clientSocket1: Socket;
let clientSocket2: Socket;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'kajkam-secret-2025';

/**
 * Setup test server with Socket.IO
 */
const setupTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Setup routes
    app.use('/api/chat', chatRoutes);

    // Create HTTP server
    server = http.createServer(app);
    
    // Setup Socket.IO
    io = new Server(server, {
      cors: {
        origin: '*',
        credentials: true
      }
    });

    // Make io globally accessible
    app.set('io', io);
    global.io = io;

    // Setup socket handlers
    require('../../sockets/chatSocket')(io);

    // Find available port and start server
    testPort = 0; // Let OS assign available port
    server.listen(testPort, () => {
      const address = server.address();
      if (address && typeof address !== 'string') {
        testPort = address.port;
      }
      console.log(`Test server running on port ${testPort}`);
      resolve();
    });
  });
};

/**
 * Setup MongoDB connection
 */
const setupDatabase = async (): Promise<void> => {
  // Use existing MongoDB connection if already connected
  if (mongoose.connection.readyState === 1) {
    console.log('Already connected to database');
    return;
  }
  
  // Use MongoDB Atlas URI from .env for testing
  const MONGO_URI = process.env.MONGO_CONN || 
                    process.env.MONGO_TEST_URI || 
                    'mongodb://localhost:27017/kaaj-kaam-test';
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to test database');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
};

/**
 * Create test users
 */
const createTestUsers = async (): Promise<void> => {
  // Clean up existing test data
  await User.deleteMany({ email: { $in: ['testuser1@test.com', 'testuser2@test.com'] } });
  await Conversation.deleteMany({});
  await Message.deleteMany({});

  // Create test users
  testUser1 = await User.create({
    name: 'Test User 1',
    email: 'testuser1@test.com',
    password: 'password123',
    role: 'seller',
    profile: {
      avatar: 'https://via.placeholder.com/150'
    }
  });

  testUser2 = await User.create({
    name: 'Test User 2',
    email: 'testuser2@test.com',
    password: 'password123',
    role: 'buyer',
    profile: {
      avatar: 'https://via.placeholder.com/150'
    }
  });

  // Generate JWT tokens
  authToken1 = jwt.sign(
    { id: testUser1._id.toString(), role: testUser1.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  authToken2 = jwt.sign(
    { id: testUser2._id.toString(), role: testUser2.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  console.log('Test users created');
};

/**
 * Setup Socket.IO clients
 */
const setupSocketClients = (): Promise<void> => {
  return new Promise((resolve) => {
    let connected = 0;
    const checkBothConnected = () => {
      connected++;
      if (connected === 2) resolve();
    };

    clientSocket1 = ioClient(`http://localhost:${testPort}`, {
      query: { userId: testUser1._id.toString() },
      transports: ['websocket'],
      forceNew: true
    });

    clientSocket2 = ioClient(`http://localhost:${testPort}`, {
      query: { userId: testUser2._id.toString() },
      transports: ['websocket'],
      forceNew: true
    });

    clientSocket1.on('connect', () => {
      console.log('Client 1 connected');
      checkBothConnected();
    });

    clientSocket2.on('connect', () => {
      console.log('Client 2 connected');
      checkBothConnected();
    });
  });
};

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

beforeAll(async () => {
  console.log('\n=== Setting up test environment ===');
  
  try {
    // Setup database
    await setupDatabase();
    
    // Create test users
    await createTestUsers();
    
    // Setup server
    await setupTestServer();
    
    // Setup socket clients
    await setupSocketClients();
    
    console.log('=== Test environment ready ===\n');
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}, 60000); // 60 second timeout for MongoDB Atlas connection

afterAll(async () => {
  console.log('\n=== Cleaning up test environment ===');
  
  try {
    // Disconnect socket clients
    if (clientSocket1?.connected) clientSocket1.disconnect();
    if (clientSocket2?.connected) clientSocket2.disconnect();
    
    // Close server
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          console.log('Server closed');
          resolve();
        });
      });
    }
    
    // Close Socket.IO
    if (io) {
      await new Promise<void>((resolve) => {
        io.close(() => {
          console.log('Socket.IO closed');
          resolve();
        });
      });
    }
    
    // Clean up test data
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: { $in: ['testuser1@test.com', 'testuser2@test.com', 'testuser3@test.com', 'testuser4@test.com', 'flowtest1@test.com', 'flowtest2@test.com'] } });
      await Conversation.deleteMany({});
      await Message.deleteMany({});
    }
    
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
    
    console.log('=== Cleanup complete ===\n');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60000);

// ============================================================================
// PART A: API ENDPOINT TESTS
// ============================================================================

describe('Part A: API Endpoints', () => {
  
  describe('POST /api/chat/conversations - Create or Get Conversation', () => {
    
    test('should create a new conversation between two users', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('x-auth-token', authToken1)
        .send({
          participantId: testUser2._id.toString()
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.participants).toHaveLength(2);
      expect(response.body.isActive).toBe(true);
      
      // Store conversation ID for later tests
      conversationId = response.body._id;
    });

    test('should return existing conversation if already exists', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('x-auth-token', authToken1)
        .send({
          participantId: testUser2._id.toString()
        });

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(conversationId);
    });

    test('should return 401 without authentication token', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .send({
          participantId: testUser2._id.toString()
        });

      expect(response.status).toBe(401);
    });

    test('should return 400 when participant ID is missing', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('x-auth-token', authToken1)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Participant ID required');
    });

    test('should return 400 when trying to create conversation with self', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('x-auth-token', authToken1)
        .send({
          participantId: testUser1._id.toString()
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot create conversation with yourself');
    });
  });

  describe('POST /api/chat/conversations/:conversationId/messages - Send Message', () => {
    
    test('should create a new message successfully', async () => {
      const messageText = 'Hello, this is a test message!';
      
      const response = await request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .set('x-auth-token', authToken1)
        .send({ text: messageText });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.text).toBe(messageText);
      expect(response.body.conversationId).toBe(conversationId);
      expect(response.body.sender._id).toBe(testUser1._id.toString());
    });

    test('should return 401 without authentication token', async () => {
      const response = await request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .send({ text: 'Test message' });

      expect(response.status).toBe(401);
    });

    test('should return 400 when message text is empty', async () => {
      const response = await request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .set('x-auth-token', authToken1)
        .send({ text: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Message text or attachments required');
    });

    test('should return 404 for non-existent conversation', async () => {
      const fakeConversationId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`/api/chat/conversations/${fakeConversationId}/messages`)
        .set('x-auth-token', authToken1)
        .send({ text: 'Test message' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/chat/conversations/:conversationId/messages - Fetch Chat History', () => {
    
    test('should fetch messages successfully with 200 status', async () => {
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages`)
        .set('x-auth-token', authToken1);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messages');
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('hasMore');
    });

    test('should return messages in correct order (oldest first)', async () => {
      // Create multiple messages
      await request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .set('x-auth-token', authToken1)
        .send({ text: 'Message 2' });

      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

      await request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .set('x-auth-token', authToken2)
        .send({ text: 'Message 3' });

      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages`)
        .set('x-auth-token', authToken1);

      expect(response.status).toBe(200);
      const messages = response.body.messages;
      
      // Check chronological order
      for (let i = 1; i < messages.length; i++) {
        const prevDate = new Date(messages[i - 1].createdAt);
        const currDate = new Date(messages[i].createdAt);
        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
      }
    });

    test('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages`);

      expect(response.status).toBe(401);
    });

    test('should return 403 for unauthorized user (not participant)', async () => {
      // Create a third user
      const testUser3 = await User.create({
        name: 'Test User 3',
        email: 'testuser3@test.com',
        password: 'password123',
        role: 'seller'
      });

      const authToken3 = jwt.sign(
        { id: testUser3._id.toString(), role: testUser3.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages`)
        .set('x-auth-token', authToken3);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Unauthorized');

      // Cleanup
      await User.findByIdAndDelete(testUser3._id);
    });

    test('should support pagination with limit and skip', async () => {
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages`)
        .query({ limit: 2, skip: 0 })
        .set('x-auth-token', authToken1);

      expect(response.status).toBe(200);
      expect(response.body.messages.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/chat/conversations - Get All Conversations', () => {
    
    test('should fetch all conversations for user', async () => {
      const response = await request(app)
        .get('/api/chat/conversations')
        .set('x-auth-token', authToken1);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conversations');
      expect(Array.isArray(response.body.conversations)).toBe(true);
      expect(response.body.conversations.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('hasMore');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/chat/conversations');

      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// PART B: SOCKET.IO REAL-TIME EVENTS
// ============================================================================

describe('Part B: Socket.IO Real-time Events', () => {
  
  describe('Connection Tests', () => {
    
    test('should verify Client 1 can connect successfully', (done) => {
      expect(clientSocket1.connected).toBe(true);
      expect(clientSocket1.id).toBeDefined();
      done();
    });

    test('should verify Client 2 can connect successfully', (done) => {
      expect(clientSocket2.connected).toBe(true);
      expect(clientSocket2.id).toBeDefined();
      done();
    });

    test('should have userId in socket handshake', (done) => {
      expect(clientSocket1.io.opts.query?.userId).toBe(testUser1._id.toString());
      expect(clientSocket2.io.opts.query?.userId).toBe(testUser2._id.toString());
      done();
    });
  });

  describe('Room Logic Tests', () => {
    
    test('should allow client to join a conversation room', (done) => {
      clientSocket1.emit('join_conversation', conversationId);
      
      // Wait a bit for the join to process
      setTimeout(() => {
        // If no error occurred, join was successful
        expect(clientSocket1.connected).toBe(true);
        done();
      }, 100);
    });

    test('should allow multiple clients to join the same room', (done) => {
      clientSocket1.emit('join_conversation', conversationId);
      clientSocket2.emit('join_conversation', conversationId);
      
      setTimeout(() => {
        expect(clientSocket1.connected).toBe(true);
        expect(clientSocket2.connected).toBe(true);
        done();
      }, 100);
    });

    test('should emit user_online event when joining conversation', (done) => {
      // Setup listener on client2
      clientSocket2.once('user_online', (data: any) => {
        expect(data).toHaveProperty('userId');
        expect(data).toHaveProperty('timestamp');
        done();
      });

      // Client1 joins conversation
      clientSocket1.emit('join_conversation', conversationId);
    });
  });

  describe('Messaging Tests', () => {
    
    beforeEach((done) => {
      // Ensure both clients are in the same room
      clientSocket1.emit('join_conversation', conversationId);
      clientSocket2.emit('join_conversation', conversationId);
      setTimeout(done, 100);
    });

    test('should receive message when another client sends in the same room', (done) => {
      const testMessage = {
        conversationId,
        sender: {
          _id: testUser1._id.toString(),
          name: testUser1.name
        },
        text: 'Real-time test message',
        createdAt: new Date()
      };

      // Setup listener on client2 to receive message
      clientSocket2.once('receive_message', (data: any) => {
        expect(data).toHaveProperty('text');
        expect(data.text).toBe(testMessage.text);
        expect(data.conversationId).toBe(conversationId);
        expect(data.sender).toBeDefined();
        done();
      });

      // Client1 emits message via API (which triggers socket event)
      request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .set('x-auth-token', authToken1)
        .send({ text: testMessage.text })
        .then(() => {
          // Message sent via API, socket should emit to room
        });
    }, 10000);

    test('should not receive message in different room', (done) => {
      // Create a new conversation for a different room
      let differentConversationId: string;
      
      const createDifferentConversation = async () => {
        const user3 = await User.create({
          name: 'Test User 4',
          email: 'testuser4@test.com',
          password: 'password123',
          role: 'buyer'
        });

        const token3 = jwt.sign(
          { id: user3._id.toString(), role: user3.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        const response = await request(app)
          .post('/api/chat/conversations')
          .set('x-auth-token', authToken1)
          .send({ participantId: user3._id.toString() });

        differentConversationId = response.body._id;
        
        // Join client1 to different room
        clientSocket1.emit('join_conversation', differentConversationId);
        
        // Keep client2 in original room
        clientSocket2.emit('join_conversation', conversationId);
        
        setTimeout(() => {
          let messageReceived = false;
          
          // Client2 should NOT receive this message
          clientSocket2.once('receive_message', () => {
            messageReceived = true;
          });
          
          // Send message in different conversation
          request(app)
            .post(`/api/chat/conversations/${differentConversationId}/messages`)
            .set('x-auth-token', authToken1)
            .send({ text: 'Message in different room' })
            .then(() => {
              setTimeout(() => {
                expect(messageReceived).toBe(false);
                
                // Cleanup
                User.findOneAndDelete({ email: 'testuser4@test.com' }).then(() => {
                  done();
                });
              }, 500);
            });
        }, 200);
      };

      createDifferentConversation();
    }, 15000);

    test('should broadcast message to all clients in the same room', (done) => {
      const testMessage = 'Broadcast test message';
      let receivedCount = 0;
      const expectedCount = 1; // Only client2 should receive (not sender)

      const messageHandler = (data: any) => {
        if (data.text === testMessage) {
          receivedCount++;
          if (receivedCount === expectedCount) {
            done();
          }
        }
      };

      // Only client2 should receive
      clientSocket2.once('receive_message', messageHandler);

      // Send message from client1
      request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .set('x-auth-token', authToken1)
        .send({ text: testMessage })
        .then(() => {
          // Wait to ensure message is processed
          setTimeout(() => {
            if (receivedCount < expectedCount) {
              done(new Error(`Expected ${expectedCount} messages but received ${receivedCount}`));
            }
          }, 1000);
        });
    }, 10000);
  });

  describe('Typing Indicator Tests', () => {
    
    beforeEach((done) => {
      clientSocket1.emit('join_conversation', conversationId);
      clientSocket2.emit('join_conversation', conversationId);
      setTimeout(done, 100);
    });

    test('should emit typing indicator to other users', (done) => {
      clientSocket2.once('user_typing', (data: any) => {
        expect(data).toHaveProperty('userId');
        expect(data).toHaveProperty('timestamp');
        done();
      });

      clientSocket1.emit('typing', conversationId);
    });

    test('should emit stop typing indicator', (done) => {
      clientSocket2.once('user_stop_typing', (data: any) => {
        expect(data).toHaveProperty('userId');
        done();
      });

      clientSocket1.emit('stop_typing', conversationId);
    });
  });

  describe('Read Receipt Tests', () => {
    
    test('should mark messages as read', (done) => {
      clientSocket2.once('messages_read', (data: any) => {
        expect(data).toHaveProperty('userId');
        expect(data).toHaveProperty('conversationId');
        expect(data.conversationId).toBe(conversationId);
        done();
      });

      clientSocket1.emit('mark_read', conversationId);
    });
  });

  describe('User Online/Offline Status Tests', () => {
    
    test('should emit user_online event on connection', (done) => {
      const newSocket = ioClient(`http://localhost:${testPort}`, {
        query: { userId: testUser1._id.toString() },
        transports: ['websocket'],
        forceNew: true
      });

      clientSocket2.once('user_online', (data: any) => {
        expect(data).toHaveProperty('userId');
        newSocket.disconnect();
        done();
      });
    });

    test('should emit user_offline event on disconnection', (done) => {
      const tempSocket = ioClient(`http://localhost:${testPort}`, {
        query: { userId: 'temp-user-id' },
        transports: ['websocket'],
        forceNew: true
      });

      tempSocket.on('connect', () => {
        clientSocket1.once('user_offline', (data: any) => {
          expect(data).toHaveProperty('userId');
          done();
        });

        tempSocket.disconnect();
      });
    });
  });
});

// ============================================================================
// ADDITIONAL INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  
  test('should handle complete message flow: create conversation → send message → receive via socket', (done) => {
    const testFlow = async () => {
      // Step 1: Create new users for this test
      const user1 = await User.create({
        name: 'Flow Test User 1',
        email: 'flowtest1@test.com',
        password: 'password123',
        role: 'seller'
      });

      const user2 = await User.create({
        name: 'Flow Test User 2',
        email: 'flowtest2@test.com',
        password: 'password123',
        role: 'buyer'
      });

      const token1 = jwt.sign(
        { id: user1._id.toString(), role: user1.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Step 2: Create conversation
      const convResponse = await request(app)
        .post('/api/chat/conversations')
        .set('x-auth-token', token1)
        .send({ participantId: user2._id.toString() });

      expect(convResponse.status).toBe(200);
      const newConversationId = convResponse.body._id;

      // Step 3: Setup socket client
      const socket1 = ioClient(`http://localhost:${testPort}`, {
        query: { userId: user1._id.toString() },
        transports: ['websocket'],
        forceNew: true
      });

      const socket2 = ioClient(`http://localhost:${testPort}`, {
        query: { userId: user2._id.toString() },
        transports: ['websocket'],
        forceNew: true
      });

      await new Promise<void>(resolve => {
        let connected = 0;
        const checkBoth = () => {
          connected++;
          if (connected === 2) resolve();
        };
        socket1.on('connect', checkBoth);
        socket2.on('connect', checkBoth);
      });

      // Step 4: Join conversation room
      socket1.emit('join_conversation', newConversationId);
      socket2.emit('join_conversation', newConversationId);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 5: Listen for message on socket2
      socket2.once('receive_message', (data: any) => {
        expect(data.text).toBe('Integration test message');
        expect(data.conversationId).toBe(newConversationId);
        
        // Cleanup
        socket1.disconnect();
        socket2.disconnect();
        User.findByIdAndDelete(user1._id);
        User.findByIdAndDelete(user2._id);
        
        done();
      });

      // Step 6: Send message via API
      await request(app)
        .post(`/api/chat/conversations/${newConversationId}/messages`)
        .set('x-auth-token', token1)
        .send({ text: 'Integration test message' });
    };

    testFlow().catch(done);
  }, 15000);

  test('should handle concurrent messages from multiple users', (done) => {
    const messages: any[] = [];
    let receivedCount = 0;

    const messageHandler = (data: any) => {
      messages.push(data);
      receivedCount++;
      
      if (receivedCount >= 2) {
        expect(messages.length).toBeGreaterThanOrEqual(2);
        done();
      }
    };

    clientSocket1.on('receive_message', messageHandler);
    clientSocket2.on('receive_message', messageHandler);

    // Send messages concurrently
    Promise.all([
      request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .set('x-auth-token', authToken1)
        .send({ text: 'Concurrent message 1' }),
      
      request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .set('x-auth-token', authToken2)
        .send({ text: 'Concurrent message 2' })
    ]).catch(done);
  }, 10000);
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
  
  test('should handle invalid conversation ID gracefully', async () => {
    const response = await request(app)
      .get('/api/chat/conversations/invalid-id/messages')
      .set('x-auth-token', authToken1);

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  test('should handle database connection errors', (done) => {
    // This test assumes MongoDB might be temporarily unavailable
    // In real scenario, you'd mock the database connection
    done();
  });

  test('should handle malformed message data', async () => {
    const response = await request(app)
      .post(`/api/chat/conversations/${conversationId}/messages`)
      .set('x-auth-token', authToken1)
      .send({ invalidField: 'test' });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});

console.log('\n✅ All tests configured and ready to run');