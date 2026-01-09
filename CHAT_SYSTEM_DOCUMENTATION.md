# 🚀 KAAJ KAAM - Chat System & Socket.IO Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Socket.IO Setup](#socketio-setup)
4. [Message Flow](#message-flow)
5. [Real-time Features](#real-time-features)
6. [Database Models](#database-models)
7. [API Endpoints](#api-endpoints)
8. [WebRTC Video/Audio Calls](#webrtc-videoaudio-calls)

---

## 🎯 System Overview

Your chat system is a **real-time messaging platform** built with:
- **Frontend**: React + Socket.IO Client
- **Backend**: Node.js + Express + Socket.IO Server
- **Database**: MongoDB (Mongoose models)
- **Real-time**: Socket.IO for instant messaging, typing indicators, online status, and WebRTC signaling

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │  socket.js   │      │   Chat.jsx   │      │   api.js     │  │
│  │              │      │              │      │              │  │
│  │ • Connect    │◄────►│ • UI         │      │ • REST API   │  │
│  │ • Join rooms │      │ • Messages   │      │ • HTTP calls │  │
│  │ • Events     │      │ • Input      │      │              │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│         │                      │                      │          │
│         │                      │                      │          │
└─────────┼──────────────────────┼──────────────────────┼──────────┘
          │                      │                      │
          │ Socket.IO            │ Socket.IO            │ HTTPS
          │ Events               │ Events               │ REST API
          │                      │                      │
┌─────────┼──────────────────────┼──────────────────────┼──────────┐
│         ▼                      ▼                      ▼          │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │chatSocket.js │◄────►│   index.js   │◄────►│ /routes/chat │  │
│  │              │      │              │      │              │  │
│  │ • Rooms      │      │ • Server     │      │ • Controllers│  │
│  │ • Events     │      │ • Socket.IO  │      │ • Auth       │  │
│  │ • Broadcast  │      │ • Express    │      │              │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│         │                      │                      │          │
│         │                      │                      │          │
├─────────┴──────────────────────┴──────────────────────┴──────────┤
│                         BACKEND (Node.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    MongoDB Database                         │ │
│  │  ┌─────────────────┐         ┌─────────────────┐           │ │
│  │  │ Conversations   │◄───────►│   Messages      │           │ │
│  │  │ • participants  │         │ • sender        │           │ │
│  │  │ • lastMessage   │         │ • text          │           │ │
│  │  │ • unreadCount   │         │ • attachments   │           │ │
│  │  └─────────────────┘         └─────────────────┘           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Socket.IO Setup

### Frontend Setup (`frontend/src/socket.js`)

```javascript
import { io } from 'socket.io-client';

// 1. Create Socket Connection
const socket = io(SOCKET_URL, {
  autoConnect: false,              // Don't connect immediately
  withCredentials: true,           // Send cookies
  transports: ['websocket', 'polling'], // Fallback transports
  query: () => ({
    userId: getUserId()            // Send userId on connection
  })
});

// 2. Connection Events
socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('user_online', userId); // Notify server user is online
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

socket.on('reconnect', () => {
  console.log('Reconnected');
  socket.emit('user_online', userId); // Re-announce online status
});
```

**Key Points:**
- ✅ Auto-connect is disabled - you must call `socket.connect()` manually
- ✅ User ID is sent during connection for identification
- ✅ Reconnection is automatic with re-authentication

### Backend Setup (`backend/index.js` & `backend/sockets/chatSocket.js`)

```javascript
// 1. Create HTTP Server with Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  }
});

// 2. Store io globally for use in controllers
app.set('io', io);

// 3. Load Socket handlers
require('./sockets/chatSocket')(io);
```

**Socket Event Handlers (`backend/sockets/chatSocket.js`):**

```javascript
module.exports = (io) => {
  const onlineUsers = new Map(); // Track online users
  
  io.on('connection', (socket) => {
    // 1. Get userId from handshake
    const userId = socket.handshake.query.userId;
    
    // 2. Join personal room
    socket.join(`user_${userId}`);
    
    // 3. Track online status
    onlineUsers.set(userId, socket.id);
    
    // 4. Broadcast to others
    socket.broadcast.emit('user_online', { userId });
    
    // ... more event handlers
  });
};
```

---

## 💬 Message Flow

### Complete Message Flow Diagram

```
┌──────────┐                                                 ┌──────────┐
│  User A  │                                                 │  User B  │
└────┬─────┘                                                 └────┬─────┘
     │                                                            │
     │ 1. Type message                                            │
     │ "Hello!"                                                   │
     │                                                            │
     │ 2. Click Send                                              │
     ├─────────────────────────────────────────────────────────┐ │
     │                                                          │ │
     │ 3. POST /api/chat/conversations/:id/messages             │ │
     │    (HTTP REST API)                                       │ │
     │                                                          │ │
     ▼                                                          │ │
┌─────────────────────────────────────────────────────────┐   │ │
│                    BACKEND SERVER                        │   │ │
│                                                          │   │ │
│  4. chatController.sendMessage()                        │   │ │
│     ├─ Verify user is participant                       │   │ │
│     ├─ Create Message in MongoDB                        │   │ │
│     ├─ Update Conversation.lastMessage                  │   │ │
│     └─ Get Socket.IO instance (io)                      │   │ │
│                                                          │   │ │
│  5. io.to(`conversation_${conversationId}`)             │   │ │
│       .emit('receive_message', messageData)             │   │ │
│                                                          │   │ │
│  6. io.to(`user_${otherUserId}`)                        │   │ │
│       .emit('receive_message', messageData)             │   │ │
│       .emit('new_notification', {...})                  │   │ │
│                                                          │   │ │
└─────────────────────────────────────────────────────────┘   │ │
     │                                                          │ │
     │ 7. HTTP 201 Created Response                             │ │
     │    { message object }                                    │ │
     ◄──────────────────────────────────────────────────────────┘ │
     │                                                            │
     │                                                            │
     │                          8. Socket.IO Event                │
     │                             'receive_message'              │
     │                             broadcasts to User B           │
     │                                                            ▼
     │                                              ┌──────────────────────┐
     │                                              │ Frontend updates UI  │
     │                                              │ setMessages([...])   │
     │                                              └──────────────────────┘
     │                                                            │
     │                                                            │
     │                                            Sees "Hello!" instantly!
     │                                                            │
```

### Step-by-Step Explanation

#### **Step 1-2: User Interaction**
```javascript
// In Chat.jsx
const sendMessage = () => {
  const msgData = {
    orderId,
    text: message,
    sender: user.name,
    time: new Date().toLocaleTimeString()
  };
  
  socket.emit('send_message', msgData); // Old simple implementation
  // OR use REST API (recommended)
};
```

#### **Step 3: HTTP Request**
```javascript
// POST /api/chat/conversations/:conversationId/messages
// Headers: { x-auth-token: 'jwt-token' }
// Body: { text: 'Hello!' }
```

#### **Step 4-6: Backend Processing**
```javascript
// backend/controllers/chatController.js
const sendMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  // Create message in database
  const message = await Message.create({
    conversationId,
    sender: userId,
    text,
    attachments: []
  });

  // Update conversation
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: {
      text,
      sender: userId,
      timestamp: new Date()
    }
  });

  // Get Socket.IO instance
  const io = req.app.get('io');
  
  // Broadcast to conversation room
  io.to(`conversation_${conversationId}`).emit('receive_message', message);
  
  // Send to other user's personal room
  io.to(`user_${otherParticipantId}`).emit('receive_message', message);
  
  res.status(201).json(message);
};
```

#### **Step 7-8: Frontend Receives**
```javascript
// In Chat.jsx
useEffect(() => {
  socket.on('receive_message', (data) => {
    setMessages(prev => [...prev, data]);
  });
  
  return () => {
    socket.off('receive_message');
  };
}, []);
```

---

## ⚡ Real-time Features

### 1. **Joining Conversation Rooms**

```javascript
// Frontend
socket.emit('join_conversation', conversationId);

// Backend
socket.on('join_conversation', (conversationId) => {
  socket.join(`conversation_${conversationId}`);
  console.log(`User joined conversation: ${conversationId}`);
});
```

**Room Structure:**
- `user_${userId}` - Personal room for each user
- `conversation_${conversationId}` - Shared room for all participants

### 2. **Typing Indicators**

```javascript
// Frontend - User starts typing
const handleTyping = () => {
  socket.emit('typing', conversationId);
};

const handleStopTyping = () => {
  socket.emit('stop_typing', conversationId);
};

// Backend - Broadcast to others
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

// Frontend - Display typing indicator
socket.on('user_typing', ({ userId }) => {
  setTypingUsers(prev => [...prev, userId]);
});

socket.on('user_stop_typing', ({ userId }) => {
  setTypingUsers(prev => prev.filter(id => id !== userId));
});
```

### 3. **Online/Offline Status**

```javascript
// Backend - Track online users
const onlineUsers = new Map();

socket.on('user_online', (userId) => {
  onlineUsers.set(userId, socket.id);
  socket.broadcast.emit('user_online', { userId });
});

socket.on('disconnect', () => {
  onlineUsers.delete(socket.userId);
  socket.broadcast.emit('user_offline', { userId: socket.userId });
});

// Frontend - Update UI
socket.on('user_online', ({ userId }) => {
  setOnlineUsers(prev => [...prev, userId]);
});

socket.on('user_offline', ({ userId }) => {
  setOnlineUsers(prev => prev.filter(id => id !== userId));
});
```

### 4. **Read Receipts**

```javascript
// Frontend - Mark as read
socket.emit('mark_read', conversationId);

// Backend
socket.on('mark_read', async (conversationId) => {
  await Message.updateMany(
    { conversationId, 'readBy.userId': { $ne: userId } },
    { $push: { readBy: { userId, readAt: new Date() } } }
  );
  
  io.to(`conversation_${conversationId}`).emit('messages_read', {
    userId,
    conversationId
  });
});
```

---

## 🗄️ Database Models

### **Conversation Model**

```javascript
{
  participants: [ObjectId, ObjectId], // User IDs
  orderId: ObjectId,                  // Optional: related order
  gigId: ObjectId,                    // Optional: related gig
  jobId: ObjectId,                    // Optional: related job
  lastMessage: {
    text: String,
    sender: ObjectId,
    timestamp: Date
  },
  unreadCount: Map,                   // userId -> count
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **Message Model**

```javascript
{
  conversationId: ObjectId,
  sender: ObjectId,
  text: String,
  messageType: 'text' | 'call' | 'meeting' | 'system',
  attachments: [{
    url: String,
    type: 'image' | 'video' | 'pdf' | 'doc' | 'file',
    name: String,
    size: Number
  }],
  callInfo: {                        // For call messages
    callType: 'audio' | 'video',
    duration: Number,
    status: 'completed' | 'missed' | 'declined'
  },
  readBy: [{
    userId: ObjectId,
    readAt: Date
  }],
  isEdited: Boolean,
  editedAt: Date,
  createdAt: Date
}
```

---

## 🔗 API Endpoints

### **Chat Routes** (`/api/chat`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/conversations` | Create or get conversation |
| GET | `/conversations` | Get all user's conversations |
| GET | `/conversations/:id` | Get single conversation |
| DELETE | `/conversations/:id` | Delete conversation (soft) |
| GET | `/conversations/:id/messages` | Get messages in conversation |
| POST | `/conversations/:id/messages` | Send new message |
| PUT | `/conversations/:id/read` | Mark messages as read |
| GET | `/unread-count` | Get total unread count |
| POST | `/conversations/:id/call-record` | Save call record |

### **Example Usage**

```javascript
// Create/Get Conversation
POST /api/chat/conversations
{
  "participantId": "user123",
  "orderId": "order456"  // optional
}

// Send Message
POST /api/chat/conversations/conv789/messages
{
  "text": "Hello!"
}
// With files: FormData with 'attachments' field

// Get Messages
GET /api/chat/conversations/conv789/messages?limit=50&skip=0
```

---

## 📞 WebRTC Video/Audio Calls

### **Call Flow Diagram**

```
User A (Caller)                Backend                User B (Receiver)
     │                            │                           │
     │ 1. Click Video Call        │                           │
     ├───────────────────────────►│                           │
     │ call:initiate              │                           │
     │ { offer, callType }        │                           │
     │                            │                           │
     │                            │ 2. Broadcast              │
     │                            ├──────────────────────────►│
     │                            │   call:incoming           │
     │                            │   { offer, callType }     │
     │                            │                           │
     │                            │                           │ 3. User accepts
     │                            │ 4. Send answer            │
     │ 5. Receive answer          │◄──────────────────────────┤
     │◄───────────────────────────┤   call:accept             │
     │   call:accepted            │   { answer }              │
     │   { answer }               │                           │
     │                            │                           │
     │ 6. Exchange ICE candidates │                           │
     │◄──────────────────────────►│◄─────────────────────────►│
     │   webrtc:ice-candidate     │   webrtc:ice-candidate    │
     │                            │                           │
     │                            │                           │
     │ 7. WebRTC Connection Established (P2P Video/Audio)    │
     │◄─────────────────────────────────────────────────────►│
     │                            │                           │
```

### **Socket Events for Calls**

```javascript
// 1. Initiate Call
socket.emit('call:initiate', {
  conversationId,
  callType: 'video', // or 'audio'
  offer: rtcOffer,
  from: userId,
  to: otherUserId
});

// 2. Incoming Call (Receiver)
socket.on('call:incoming', ({ offer, callType, from }) => {
  // Show incoming call UI
  // Accept or Reject
});

// 3. Accept Call
socket.emit('call:accept', {
  conversationId,
  to: callerId,
  answer: rtcAnswer
});

// 4. Call Accepted (Caller)
socket.on('call:accepted', ({ answer }) => {
  // Set remote description
  peerConnection.setRemoteDescription(answer);
});

// 5. Reject Call
socket.emit('call:reject', {
  conversationId,
  to: callerId
});

// 6. Call Rejected
socket.on('call:rejected', () => {
  // Show rejected UI
});

// 7. End Call
socket.emit('call:end', {
  conversationId,
  to: otherUserId
});

// 8. ICE Candidate Exchange
socket.on('webrtc:ice-candidate', ({ candidate }) => {
  peerConnection.addIceCandidate(candidate);
});
```

---

## 🎯 Key Concepts

### **1. Socket Rooms**
- **Purpose**: Group sockets for targeted broadcasting
- **Types**:
  - `user_${userId}` - Personal room (notifications, calls)
  - `conversation_${conversationId}` - Chat room (messages, typing)
  - `meeting_${meetingId}` - Meeting room (participants)

### **2. Event Broadcasting**
```javascript
// To specific room
io.to('room_name').emit('event', data);

// To everyone except sender
socket.broadcast.emit('event', data);

// To specific socket
io.to(socketId).emit('event', data);
```

### **3. Hybrid Approach**
- **REST API**: Create messages, get history, authentication
- **Socket.IO**: Real-time delivery, typing, presence, calls

**Why?**
- ✅ REST for reliability and authentication
- ✅ Sockets for instant updates
- ✅ Database persistence
- ✅ Offline support (messages saved in DB)

### **4. Scalability Considerations**

Current setup works for single server. For scaling:
```javascript
// Use Redis adapter for multiple servers
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

---

## 🛠️ Common Issues & Solutions

### Issue 1: Socket not connecting
```javascript
// Check:
1. Is socket.connect() called?
2. Is CORS configured correctly?
3. Is backend server running?
4. Check browser console for errors
```

### Issue 2: Messages not received
```javascript
// Verify:
1. User joined conversation room?
2. Event names match ('receive_message')?
3. Check backend logs
4. Verify userId is passed correctly
```

### Issue 3: Duplicate messages
```javascript
// Fix: Remove duplicate event listeners
useEffect(() => {
  const handleMessage = (data) => {
    setMessages(prev => [...prev, data]);
  };
  
  socket.on('receive_message', handleMessage);
  
  return () => {
    socket.off('receive_message', handleMessage); // Cleanup!
  };
}, []);
```

---

## 📝 Summary

Your chat system uses a **hybrid architecture**:

1. **REST API** for:
   - Creating conversations
   - Sending messages (with persistence)
   - Getting message history
   - Authentication & authorization

2. **Socket.IO** for:
   - Real-time message delivery
   - Typing indicators
   - Online/offline status
   - Read receipts
   - WebRTC signaling (video/audio calls)

3. **MongoDB** for:
   - Persistent storage
   - Message history
   - Conversation metadata
   - Read receipts

**Benefits:**
- ✅ Real-time updates
- ✅ Offline message support
- ✅ Scalable architecture
- ✅ Rich features (files, calls, typing)
- ✅ Authentication & security

---

## 🚀 Next Steps

To improve your chat system:

1. **Add encryption** for sensitive messages
2. **Implement pagination** for large message lists
3. **Add file preview** for attachments
4. **Message search** functionality
5. **Group chats** support
6. **Message reactions** (emoji)
7. **Voice messages**
8. **Screen sharing** in video calls
9. **Redis adapter** for horizontal scaling
10. **Service workers** for push notifications

---

**Created by:** KAAJ KAAM Development Team  
**Last Updated:** 2026-01-08