# Quick Test Guide - Direct Messages Feature

**Student ID:** 22201979  
**Author:** Abdullah Al Rifat  
**Test File:** `src/tests/22201979_DirectMessages.test.ts`

## Quick Start

### 1. Ensure MongoDB is Running

**Option A - Local MongoDB:**
```bash
# Check if MongoDB is running
mongosh

# If not running, start it:
# Windows: Start MongoDB service from Services
# Mac/Linux: sudo systemctl start mongod
```

**Option B - Use MongoDB Atlas (recommended):**
No setup needed - tests will use the connection string from `.env`

### 2. Run the Tests

```bash
cd backend
npm test
```

That's it! The tests will:
- ✅ Automatically set up test environment
- ✅ Create test database and users
- ✅ Run all 30+ test cases
- ✅ Clean up after completion

## What Gets Tested

### Part A: API Endpoints (HTTP/REST)
- Creating conversations between users
- Sending messages via POST request
- Fetching message history via GET request
- Authentication and authorization
- Input validation and error handling

### Part B: Socket.IO Events (Real-time)
- WebSocket connections
- Joining conversation rooms
- Real-time message delivery
- Typing indicators
- Read receipts
- User online/offline status

## Test Results

You'll see output like:
```
✓ should create a new conversation between two users
✓ should send message successfully (expect 201 status)
✓ should fetch messages successfully with 200 status
✓ should receive message when another client sends in same room
...

Test Suites: 1 passed
Tests:       30+ passed
Time:        ~30 seconds
```

## Other Test Commands

```bash
# Run only Direct Messages test
npm run test:direct-messages

# Run with coverage report
npm run test:coverage

# Watch mode (auto-rerun on changes)
npm run test:watch

# Verbose output
npm run test:verbose
```

## File Locations

- **Test Suite:** `backend/src/tests/22201979_DirectMessages.test.ts`
- **Test Config:** `backend/jest.config.js`
- **Test Setup:** `backend/src/tests/setup.ts`
- **Full Documentation:** `backend/src/tests/README.md`

## Common Issues

**MongoDB Connection Error:**
- Make sure MongoDB is running
- Or update `MONGO_TEST_URI` in test setup

**Port Already in Use:**
- Tests auto-assign available ports
- Close other services if needed

**Tests Timeout:**
- Normal first run takes ~30 seconds
- Subsequent runs are faster

## Success Criteria

All tests should pass with:
- ✅ 200/201 status codes for successful API calls
- ✅ 400/401/403/404 for error cases
- ✅ Real-time message delivery via Socket.IO
- ✅ Proper room isolation
- ✅ Clean database after tests

---

**For detailed documentation, see:** `backend/src/tests/README.md`