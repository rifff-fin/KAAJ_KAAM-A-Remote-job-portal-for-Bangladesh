# Test Suite Submission Guide

**Student Name:** Abdullah Al Rifat  
**Student ID:** 22201979  
**Feature:** Direct Messages via Socket.IO

---

## ✅ COMPLETION STATUS

### Required Components - ALL COMPLETE ✅

1. ✅ **Test File Created**
   - Location: `backend/src/tests/22201979_DirectMessages.test.ts`
   - Format: `{member_id}_{feature_name}.test.ts` ✓
   - Header with Name & ID: ✓

2. ✅ **Part A: API Endpoint Tests** (Using Supertest)
   - POST /api/chat/conversations/:conversationId/messages (201 status) ✓
   - GET /api/chat/conversations/:conversationId/messages (200 status + array) ✓
   - Additional tests: authentication, validation, errors ✓

3. ✅ **Part B: Socket.IO Tests** (Using socket.io-client)
   - Connection verification ✓
   - Room joining (join_conversation event) ✓
   - Messaging (send_message → receive_message) ✓
   - Additional tests: typing, read receipts, online status ✓

4. ✅ **Setup/Teardown**
   - beforeAll: database, server, socket setup ✓
   - afterAll: cleanup and close connections ✓

5. ✅ **Configuration Files**
   - jest.config.js ✓
   - tsconfig.json ✓
   - src/tests/setup.ts ✓

6. ✅ **Dependencies Installed**
   - jest, supertest, socket.io-client, ts-jest, typescript ✓

---

## 📋 SUBMISSION FORMAT

### What to Submit: CODE + OUTPUT SCREENSHOTS

You need to provide **2 types of submissions**:

### 1. CODE SUBMISSION

**Files to Include:**

```
backend/
├── src/
│   └── tests/
│       └── 22201979_DirectMessages.test.ts  ← Main test file (REQUIRED)
├── jest.config.js                            ← Jest configuration
├── tsconfig.json                             ← TypeScript config
└── package.json                              ← Shows test scripts
```

**How to Prepare Code Screenshots:**

📸 **Screenshot 1: Test File Header (Lines 1-50)**
- Open: `backend/src/tests/22201979_DirectMessages.test.ts`
- Capture: Lines 1-50 showing:
  - ✅ Comment header with your name and ID
  - ✅ Import statements
  - ✅ Setup code

📸 **Screenshot 2: Part A Tests (API Endpoints)**
- Navigate to: Lines ~175-300
- Capture: API endpoint test section showing:
  - ✅ POST /api/chat/conversations/:conversationId/messages test
  - ✅ GET /api/chat/conversations/:conversationId/messages test
  - ✅ Test assertions with expect() statements

📸 **Screenshot 3: Part B Tests (Socket.IO)**
- Navigate to: Lines ~500-650
- Capture: Socket.IO test section showing:
  - ✅ Connection tests
  - ✅ join_conversation (room logic) tests
  - ✅ send_message → receive_message tests

📸 **Screenshot 4: Setup/Teardown**
- Navigate to: Lines ~150-174
- Capture: beforeAll and afterAll functions showing:
  - ✅ Database setup
  - ✅ Server initialization
  - ✅ Socket client setup
  - ✅ Cleanup code

### 2. OUTPUT SCREENSHOTS

**How to Get Test Output:**

**Step 1: Run the Tests**
```bash
cd backend
npm test
```

**Step 2: Capture Output Screenshots**

📸 **Screenshot 5: Test Execution Output**
Capture the terminal showing:
```
PASS  src/tests/22201979_DirectMessages.test.ts

Part A: API Endpoints
  POST /api/chat/conversations - Create or Get Conversation
    ✓ should create a new conversation between two users
    ✓ should return existing conversation if already exists
    ...
  POST /api/chat/conversations/:conversationId/messages
    ✓ should create a new message successfully (expect 201)
    ...
  GET /api/chat/conversations/:conversationId/messages
    ✓ should fetch messages successfully (expect 200 + array)
    ...

Part B: Socket.IO Real-time Events
  Connection Tests
    ✓ should verify Client 1 can connect
    ✓ should verify Client 2 can connect
  Room Logic Tests
    ✓ should allow client to join a conversation room
  Messaging Tests
    ✓ should receive message when another client sends

Test Suites: 1 passed, 1 total
Tests:       30+ passed, 30+ total
Time:        ~30s
```

📸 **Screenshot 6: Test Summary**
Capture the final summary showing:
```
Test Suites: 1 passed, 1 total
Tests:       XX passed, XX total
Snapshots:   0 total
Time:        XX.XXs
```

---

## 🎯 EXACT LOCATIONS FOR SCREENSHOTS

### Code Screenshots:

| Screenshot | File | Lines | What to Show |
|------------|------|-------|--------------|
| 1 | `22201979_DirectMessages.test.ts` | 1-50 | Header with name/ID, imports |
| 2 | `22201979_DirectMessages.test.ts` | 175-300 | Part A: API tests (POST/GET) |
| 3 | `22201979_DirectMessages.test.ts` | 500-650 | Part B: Socket tests |
| 4 | `22201979_DirectMessages.test.ts` | 150-174 | beforeAll/afterAll |

### Output Screenshots:

| Screenshot | Terminal Command | What to Show |
|------------|------------------|--------------|
| 5 | `npm test` | Full test execution with ✓ marks |
| 6 | End of `npm test` | Final summary (X passed, X total) |

---

## 📝 QUICK CHECKLIST FOR SUBMISSION

Before submitting, verify:

- [ ] Header comment has "Abdullah Al Rifat" and "22201979"
- [ ] File name is exactly `22201979_DirectMessages.test.ts`
- [ ] File is in `src/tests/` directory
- [ ] Screenshot 1 shows header with name/ID
- [ ] Screenshot 2 shows POST test (201 status)
- [ ] Screenshot 3 shows GET test (200 status + array)
- [ ] Screenshot 4 shows Socket.IO tests (connection, room, messaging)
- [ ] Screenshot 5 shows beforeAll/afterAll
- [ ] Screenshot 6 shows test output with passed tests
- [ ] Screenshot 7 shows test summary

---

## 🖥️ HOW TO TAKE SCREENSHOTS

### For Code (VSCode):
1. Open `backend/src/tests/22201979_DirectMessages.test.ts`
2. Navigate to specific line numbers using `Ctrl+G` (Windows) or `Cmd+G` (Mac)
3. Use Windows Snipping Tool or Mac Screenshot (Cmd+Shift+4)
4. Ensure line numbers are visible

### For Terminal Output:
1. Open PowerShell or Terminal
2. Run `cd backend`
3. Run `npm test`
4. Wait for completion
5. Screenshot the output
6. Make sure to capture both:
   - Individual test results (✓ marks)
   - Final summary (X tests passed)

---

## 📂 FILE STRUCTURE TO SHOW

Your submission should demonstrate this structure exists:

```
backend/
├── src/
│   └── tests/
│       ├── 22201979_DirectMessages.test.ts  ✅ 900 lines
│       ├── setup.ts                          ✅ Test config
│       └── README.md                         ✅ Documentation
├── jest.config.js                            ✅ Jest settings
├── tsconfig.json                             ✅ TypeScript settings
├── package.json                              ✅ Shows test scripts
└── node_modules/
    ├── jest/                                 ✅ Installed
    ├── supertest/                            ✅ Installed
    └── socket.io-client/                     ✅ Installed
```

---

## 🔍 VERIFICATION STEPS

Run these to verify everything works:

```bash
# 1. Check file exists
cd backend
ls src/tests/22201979_DirectMessages.test.ts

# 2. Check dependencies installed
npm list jest supertest socket.io-client

# 3. Run tests
npm test

# 4. Run specific test
npm run test:direct-messages
```

---

## ✅ WHAT YOUR SUBMISSION PROVES

### Code Screenshots Prove:
1. ✅ File name follows format: `{member_id}_{feature_name}.test.ts`
2. ✅ Header has your name and ID
3. ✅ Part A implemented: API tests with Supertest
4. ✅ Part B implemented: Socket.IO tests with socket.io-client
5. ✅ Proper setup/teardown with beforeAll/afterAll

### Output Screenshots Prove:
1. ✅ Tests actually run and pass
2. ✅ API endpoints return correct status codes (201, 200)
3. ✅ Socket.IO connections work
4. ✅ Real-time messaging works
5. ✅ All test requirements met

---

## 📊 EXPECTED RESULTS

Your output should show approximately:

- **Total Tests:** 30+ test cases
- **Test Suites:** 1 passed
- **Tests Passed:** 30+ passed
- **Time:** ~30 seconds
- **Status:** All ✓ (no failures)

---

## 💡 TIPS FOR SUBMISSION

1. **Use High Quality Screenshots**
   - Clear, readable text
   - Include line numbers
   - Show full terminal output

2. **Label Your Screenshots**
   - Screenshot 1: Test File Header
   - Screenshot 2: Part A - API Tests
   - Screenshot 3: Part B - Socket Tests
   - etc.

3. **Show Evidence**
   - Your name and ID must be visible
   - Test results must show "PASS"
   - All required tests must be visible

4. **Organize Your Submission**
   - Code screenshots first
   - Output screenshots second
   - Clear labels for each

---

## 🎓 FINAL CHECKLIST

Before submitting:

✅ All code screenshots taken from correct line numbers  
✅ Header visible with name "Abdullah Al Rifat" and ID "22201979"  
✅ Part A tests visible (API endpoints)  
✅ Part B tests visible (Socket.IO)  
✅ Output screenshot shows tests running  
✅ Output screenshot shows "PASS" status  
✅ Output screenshot shows test summary  
✅ All screenshots are clear and readable  

---

**Good luck with your submission!** 🚀