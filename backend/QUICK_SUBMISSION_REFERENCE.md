# 📸 QUICK SUBMISSION REFERENCE

**Student:** Abdullah Al Rifat | **ID:** 22201979  
**File:** `backend/src/tests/22201979_DirectMessages.test.ts`

---

## ✅ STATUS: **COMPLETE AND READY TO SUBMIT**

---

## 📋 WHAT TO SUBMIT

### **CODE + OUTPUT SCREENSHOTS**

---

## 🎯 SCREENSHOT CHECKLIST

### PART 1: CODE (7 Screenshots from Test File)

| # | Go to Line | What to Capture | Must Show |
|---|------------|-----------------|-----------|
| 1️⃣ | Lines 1-80 | **Header & Imports** | ✅ "Abdullah Al Rifat"<br>✅ "22201979"<br>✅ Import supertest, socket.io-client |
| 2️⃣ | Lines 175-280 | **Part A: POST Message** | ✅ `POST /api/messages`<br>✅ `expect(status).toBe(201)` |
| 3️⃣ | Lines 305-380 | **Part A: GET Messages** | ✅ `GET /api/messages/:id`<br>✅ `expect(status).toBe(200)`<br>✅ `Array.isArray(messages)` |
| 4️⃣ | Lines 465-510 | **Part B: Connection** | ✅ Client connection tests<br>✅ `expect(connected).toBe(true)` |
| 5️⃣ | Lines 512-550 | **Part B: Room Logic** | ✅ `join_conversation` event<br>✅ Room joining tests |
| 6️⃣ | Lines 560-630 | **Part B: Messaging** | ✅ `send_message` emit<br>✅ `receive_message` listener |
| 7️⃣ | Lines 143-174 | **Setup/Teardown** | ✅ `beforeAll` function<br>✅ `afterAll` function |

### PART 2: OUTPUT (4 Screenshots from Terminal)

| # | Command | What to Capture | Must Show |
|---|---------|-----------------|-----------|
| 8️⃣ | `npm test` | **Test Start** | ✅ "Setting up test environment"<br>✅ "Test server running" |
| 9️⃣ | (continue) | **Part A Results** | ✅ All Part A tests with ✓<br>✅ Status codes 200, 201 |
| 🔟 | (continue) | **Part B Results** | ✅ All Part B tests with ✓<br>✅ Connection, Room, Messaging |
| 1️⃣1️⃣ | (end) | **Final Summary** | ✅ "Test Suites: 1 passed"<br>✅ "Tests: XX passed"<br>✅ PASS status |

---

## 🚀 QUICK STEPS TO GET SCREENSHOTS

### FOR CODE (7 screenshots):

```bash
# Open the file
code backend/src/tests/22201979_DirectMessages.test.ts

# For each screenshot:
# 1. Press Ctrl+G (Go to line)
# 2. Enter line number from table above
# 3. Take screenshot with line numbers visible
# 4. Move to next screenshot
```

### FOR OUTPUT (4 screenshots):

```bash
# Run test once
cd backend
npm test

# Take 4 screenshots:
# - Start of output
# - Part A results (with ✓ marks)
# - Part B results (with ✓ marks)  
# - Final summary
```

---

## ✅ FINAL VERIFICATION

Before submitting, check:

**Code Screenshots:**
- [ ] Screenshot 1 has "Abdullah Al Rifat" and "22201979" visible
- [ ] Screenshot 2 shows POST test expecting 201 status
- [ ] Screenshot 3 shows GET test expecting 200 status + array
- [ ] Screenshots 4-6 show Socket.IO tests (connection, room, messaging)
- [ ] Screenshot 7 shows beforeAll/afterAll

**Output Screenshots:**
- [ ] Tests are running (not errors)
- [ ] All tests show ✓ (passed)
- [ ] Final summary shows "1 passed" and "XX passed"
- [ ] No test failures visible

---

## 📁 FILE LOCATIONS

```
backend/
└── src/
    └── tests/
        └── 22201979_DirectMessages.test.ts  ← THE TEST FILE (900 lines)
```

---

## 🎓 GRADING CRITERIA MET

| Requirement | Status | Evidence |
|-------------|--------|----------|
| File name format `{id}_{feature}.test.ts` | ✅ | Screenshot 1 |
| Header with name and ID | ✅ | Screenshot 1 |
| Part A: POST /api/messages (201) | ✅ | Screenshot 2 + Output |
| Part A: GET /api/messages/:id (200 + array) | ✅ | Screenshot 3 + Output |
| Part B: Connection test | ✅ | Screenshot 4 + Output |
| Part B: Room joining | ✅ | Screenshot 5 + Output |
| Part B: send_message → receive_message | ✅ | Screenshot 6 + Output |
| beforeAll/afterAll setup | ✅ | Screenshot 7 |
| Tests run and pass | ✅ | Output Screenshots |

---

## 💡 TIPS

1. **Use Snipping Tool** (Windows) or **Screenshot** (Mac) for clean captures
2. **Ensure line numbers are visible** in code screenshots
3. **Capture full terminal width** for output screenshots
4. **Label each screenshot** clearly (Screenshot 1, Screenshot 2, etc.)
5. **Save in high quality** (PNG recommended)

---

## 📞 FILES TO REFERENCE

- **Full Details:** `SUBMISSION_GUIDE.md`
- **Screenshot Guide:** `SCREENSHOT_GUIDE.md`  
- **Test Documentation:** `src/tests/README.md`
- **Quick Start:** `TEST_GUIDE.md`

---

**You're all set! Just take 11 screenshots and submit!** 🎉