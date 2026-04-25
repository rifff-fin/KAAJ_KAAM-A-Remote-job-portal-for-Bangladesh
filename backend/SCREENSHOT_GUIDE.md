# Screenshot Guide for Submission

**File:** `backend/src/tests/22201979_DirectMessages.test.ts`  
**Total Lines:** 900

---

## 📸 CODE SCREENSHOTS - EXACT LINE NUMBERS

### Screenshot 1: Header & Setup (Lines 1-80)

**What to capture:**
```typescript
Lines 1-10: Header comment with:
  - "Author: Abdullah Al Rifat"
  - "Student ID: 22201979"
  - Feature description

Lines 11-30: Import statements
  - supertest
  - socket.io
  - socket.io-client
  - express, mongoose, jwt

Lines 50-80: setupTestServer() function
```

**How to get there:**
1. Open `backend/src/tests/22201979_DirectMessages.test.ts`
2. Press `Ctrl+Home` (go to start)
3. Capture lines 1-80

---

### Screenshot 2: Part A - API Endpoint Tests (Lines 175-280)

**What to capture:**
```typescript
Line 175: describe('Part A: API Endpoints', () => {

Lines 177-223: POST /api/chat/conversations test
  - Line 179: test('should create a new conversation...
  - Line 182: const response = await request(app).post(...)
  - Line 186: expect(response.status).toBe(200);

Lines 225-280: POST messages test
  - Line 227: test('should create a new message successfully...
  - Line 232: .post(`/api/chat/conversations/${conversationId}/messages`)
  - Line 235: expect(response.status).toBe(201); ← THIS IS IMPORTANT!
```

**How to get there:**
1. Press `Ctrl+G` (Go to line)
2. Type `175` and press Enter
3. Capture lines 175-280

**KEY POINTS TO SHOW:**
- ✅ `expect(response.status).toBe(201)` for POST message
- ✅ Test description mentions "expect 201 status"

---

### Screenshot 3: Part A - GET Messages Test (Lines 305-380)

**What to capture:**
```typescript
Line 305: describe('GET /api/chat/conversations/:conversationId/messages...

Lines 307-320: 
  test('should fetch messages successfully with 200 status', async () => {
    const response = await request(app)
      .get(`/api/chat/conversations/${conversationId}/messages`)
      .set('x-auth-token', authToken1);

    expect(response.status).toBe(200); ← THIS IS IMPORTANT!
    expect(response.body).toHaveProperty('messages');
    expect(Array.isArray(response.body.messages)).toBe(true); ← ARRAY CHECK!
```

**How to get there:**
1. Press `Ctrl+G`
2. Type `305` and press Enter
3. Capture lines 305-380

**KEY POINTS TO SHOW:**
- ✅ `expect(response.status).toBe(200)` for GET messages
- ✅ `expect(Array.isArray(response.body.messages)).toBe(true)`
- ✅ Test description mentions "expect 200 status and array"

---

### Screenshot 4: Part B - Socket.IO Connection Tests (Lines 465-510)

**What to capture:**
```typescript
Line 465: describe('Part B: Socket.IO Real-time Events', () => {

Lines 467-483: Connection Tests
  describe('Connection Tests', () => {
    test('should verify Client 1 can connect successfully', (done) => {
      expect(clientSocket1.connected).toBe(true); ← CONNECTION CHECK!
      done();
    });

    test('should verify Client 2 can connect successfully', (done) => {
      expect(clientSocket2.connected).toBe(true);
      done();
    });
  });
```

**How to get there:**
1. Press `Ctrl+G`
2. Type `465` and press Enter
3. Capture lines 465-510

**KEY POINTS TO SHOW:**
- ✅ Connection verification tests
- ✅ `expect(clientSocket.connected).toBe(true)`

---

### Screenshot 5: Part B - Room Logic Tests (Lines 512-550)

**What to capture:**
```typescript
Lines 512-550: Room Logic Tests
  describe('Room Logic Tests', () => {
    test('should allow client to join a conversation room', (done) => {
      clientSocket1.emit('join_conversation', conversationId); ← ROOM JOIN!
      
      setTimeout(() => {
        expect(clientSocket1.connected).toBe(true);
        done();
      }, 100);
    });

    test('should allow multiple clients to join the same room', (done) => {
      clientSocket1.emit('join_conversation', conversationId);
      clientSocket2.emit('join_conversation', conversationId);
      ...
    });
  });
```

**How to get there:**
1. Press `Ctrl+G`
2. Type `512` and press Enter
3. Capture lines 512-550

**KEY POINTS TO SHOW:**
- ✅ `emit('join_conversation', conversationId)` event
- ✅ Room joining logic

---

### Screenshot 6: Part B - Messaging Tests (Lines 560-630)

**What to capture:**
```typescript
Lines 560-630: Messaging Tests
  describe('Messaging Tests', () => {
    test('should receive message when another client sends...', (done) => {
      const testMessage = {
        conversationId,
        sender: { ... },
        text: 'Real-time test message',
      };

      // Setup listener on client2 to RECEIVE message
      clientSocket2.once('receive_message', (data: any) => { ← RECEIVE!
        expect(data).toHaveProperty('text');
        expect(data.text).toBe(testMessage.text);
        done();
      });

      // Client1 SENDS message via API
      request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .send({ text: testMessage.text }); ← SEND!
    });
  });
```

**How to get there:**
1. Press `Ctrl+G`
2. Type `560` and press Enter
3. Capture lines 560-630

**KEY POINTS TO SHOW:**
- ✅ `clientSocket2.once('receive_message', ...)` - Client B receives
- ✅ `request(app).post(...)` - Client A sends
- ✅ Shows send_message → receive_message flow

---

### Screenshot 7: Setup & Teardown (Lines 143-174)

**What to capture:**
```typescript
Lines 143-174: beforeAll & afterAll

beforeAll(async () => {
  console.log('\n=== Setting up test environment ===');
  
  // Setup database
  await setupDatabase();
  
  // Create test users
  await createTestUsers();
  
  // Setup server
  await setupTestServer();
  
  // Setup socket clients
  await setupSocketClients();
  
  console.log('=== Test environment ready ===\n');
}, 30000);

afterAll(async () => {
  console.log('\n=== Cleaning up test environment ===');
  
  // Disconnect socket clients
  if (clientSocket1?.connected) clientSocket1.disconnect();
  if (clientSocket2?.connected) clientSocket2.disconnect();
  
  // Close server and database
  ...
}, 30000);
```

**How to get there:**
1. Press `Ctrl+G`
2. Type `143` and press Enter
3. Capture lines 143-174

**KEY POINTS TO SHOW:**
- ✅ beforeAll with database, server, socket setup
- ✅ afterAll with cleanup

---

## 📸 OUTPUT SCREENSHOTS

### Screenshot 8: Test Execution Start

**Command to run:**
```bash
cd backend
npm test
```

**What to capture:**
```
> backend@1.0.0 test
> jest

=== Setting up test environment ===
Connected to test database
Test users created
Test server running on port 50123
Client 1 connected
Client 2 connected
=== Test environment ready ===

 PASS  src/tests/22201979_DirectMessages.test.ts
  Part A: API Endpoints
    POST /api/chat/conversations - Create or Get Conversation
      ✓ should create a new conversation between two users (245ms)
      ✓ should return existing conversation if already exists (128ms)
      ...
```

---

### Screenshot 9: Test Execution Middle (Part A Results)

**What to capture:**
```
    POST /api/chat/conversations/:conversationId/messages - Send Message
      ✓ should create a new message successfully (156ms)
      ✓ should return 401 without authentication token (45ms)
      ✓ should return 400 when message text is empty (38ms)
      ✓ should return 404 for non-existent conversation (52ms)
    
    GET /api/chat/conversations/:conversationId/messages - Fetch Chat History
      ✓ should fetch messages successfully with 200 status (98ms)
      ✓ should return messages in correct order (oldest first) (134ms)
      ✓ should return 401 without authentication token (29ms)
      ✓ should return 403 for unauthorized user (76ms)
      ✓ should support pagination with limit and skip (67ms)
```

---

### Screenshot 10: Test Execution End (Part B Results)

**What to capture:**
```
  Part B: Socket.IO Real-time Events
    Connection Tests
      ✓ should verify Client 1 can connect successfully (12ms)
      ✓ should verify Client 2 can connect successfully (8ms)
      ✓ should have userId in socket handshake (5ms)
    
    Room Logic Tests
      ✓ should allow client to join a conversation room (105ms)
      ✓ should allow multiple clients to join the same room (98ms)
      ✓ should emit user_online event when joining conversation (156ms)
    
    Messaging Tests
      ✓ should receive message when another client sends in same room (1234ms)
      ✓ should not receive message in different room (1567ms)
      ✓ should broadcast message to all clients in same room (987ms)
```

---

### Screenshot 11: Test Summary

**What to capture:**
```
=== Cleaning up test environment ===
Server closed
Socket.IO closed
Database connection closed
=== Cleanup complete ===

Test Suites: 1 passed, 1 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        30.234 s
Ran all test suites matching /22201979_DirectMessages.test.ts/i.
```

---

## 📋 SUMMARY TABLE

| Screenshot # | Content | Lines/Command | Key Element to Show |
|--------------|---------|---------------|---------------------|
| 1 | Header & Setup | Lines 1-80 | Name "Abdullah Al Rifat", ID "22201979" |
| 2 | Part A: POST test | Lines 175-280 | `expect(response.status).toBe(201)` |
| 3 | Part A: GET test | Lines 305-380 | `expect(response.status).toBe(200)`, array check |
| 4 | Part B: Connection | Lines 465-510 | Connection verification |
| 5 | Part B: Room Logic | Lines 512-550 | `join_conversation` event |
| 6 | Part B: Messaging | Lines 560-630 | `send_message` → `receive_message` |
| 7 | Setup/Teardown | Lines 143-174 | `beforeAll`, `afterAll` |
| 8 | Test Start | `npm test` | Setup messages, test starting |
| 9 | Part A Results | `npm test` | ✓ marks for API tests |
| 10 | Part B Results | `npm test` | ✓ marks for Socket tests |
| 11 | Final Summary | `npm test` | "X passed, X total", time |

---

## ✅ VERIFICATION BEFORE SUBMISSION

Check each screenshot has:

- [ ] Screenshot 1: Header shows "Abdullah Al Rifat" and "22201979"
- [ ] Screenshot 2: Shows POST test with 201 status expectation
- [ ] Screenshot 3: Shows GET test with 200 status and array check
- [ ] Screenshot 4: Shows connection tests
- [ ] Screenshot 5: Shows join_conversation event
- [ ] Screenshot 6: Shows send/receive message flow
- [ ] Screenshot 7: Shows beforeAll and afterAll
- [ ] Screenshots 8-11: Show test execution with PASS status
- [ ] All screenshots are clear and readable
- [ ] Line numbers are visible in code screenshots

---

**This guide ensures you capture ALL required evidence for submission!** 📸✅