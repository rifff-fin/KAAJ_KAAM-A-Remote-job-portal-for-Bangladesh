# 🚀 KAAJ KAAM - Job Posting Feature Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Job Posting Flow](#job-posting-flow)
4. [Buyer Workflow](#buyer-workflow)
5. [Database Models](#database-models)
6. [API Endpoints](#api-endpoints)
7. [Authorization & Permissions](#authorization--permissions)
8. [Key Features](#key-features)

---

## 🎯 System Overview

The **Job Posting Feature** is a comprehensive system that allows **buyers/clients** to post job listings and manage freelancer applications. This is the core marketplace feature that connects buyers with sellers.

**Key Components:**
- **Frontend**: React component for job posting/management
- **Backend**: Node.js + Express with REST API
- **Database**: MongoDB with Mongoose models
- **Authorization**: Role-based access control (Buyer/Seller)

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │ JobPosting Form  │    │ JobCard.jsx      │                  │
│  │                  │    │                  │                  │
│  │ • Title          │◄──►│ • Display jobs   │                  │
│  │ • Description    │    │ • Applications   │                  │
│  │ • Budget         │    │ • Actions        │                  │
│  │ • Deadline       │    │                  │                  │
│  │ • Skills         │    └──────────────────┘                  │
│  └──────────────────┘                                           │
│         │                                                        │
│         │ POST /api/jobs (Create)                               │
│         │ GET /api/jobs/my (List)                               │
│         │ PUT /api/jobs/:id (Update)                            │
│         │ DELETE /api/jobs/:id (Delete)                         │
│         │                                                        │
└─────────┼────────────────────────────────────────────────────────┘
          │
          │ HTTPS REST API
          │
┌─────────┼────────────────────────────────────────────────────────┐
│         ▼                                                         │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │  /routes/job.js  │◄────►│  /middleware/    │                │
│  │                  │      │  auth.js         │                │
│  │ • POST /         │      │                  │                │
│  │ • GET /          │      │ • protect()      │                │
│  │ • GET /my        │      │ • Role check     │                │
│  │ • GET /:id       │      └──────────────────┘                │
│  │ • POST /:id/*    │                                           │
│  │ • PUT /:id       │      ┌──────────────────┐                │
│  │ • DELETE /:id    │◄────►│ jobController.js │                │
│  └──────────────────┘      │                  │                │
│                             │ • createJob()    │                │
│                             │ • getJobs()      │                │
│                             │ • updateJob()    │                │
│                             │ • deleteJob()    │                │
│                             │ • acceptApp()    │                │
│                             │ • rejectApp()    │                │
│                             │ • completeJob()  │                │
│                             └──────────────────┘                │
│         │                                                       │
├─────────┴───────────────────────────────────────────────────────┤
│                         BACKEND (Node.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    MongoDB Database                         │ │
│  │                                                             │ │
│  │  ┌─────────────────┐    ┌──────────────────┐              │ │
│  │  │ Job Model       │◄──►│ User Model       │              │ │
│  │  │                 │    │ (postedBy)       │              │ │
│  │  │ • title         │    │ (hired)          │              │ │
│  │  │ • description   │    │                  │              │ │
│  │  │ • budget        │    └──────────────────┘              │ │
│  │  │ • skills        │                                       │ │
│  │  │ • interests[]   │    ┌──────────────────┐              │ │
│  │  │ • postedBy      │◄──►│ Order Model      │              │ │
│  │  │ • status        │    │                  │              │ │
│  │  │ • proposals[]   │    │ • price          │              │ │
│  │  │ • createdAt     │    │ • status         │              │ │
│  │  └─────────────────┘    │ • job            │              │ │
│  │                         └──────────────────┘              │ │
│  │  ┌─────────────────┐    ┌──────────────────┐              │ │
│  │  │ Proposal Model  │◄──►│ Notification     │              │ │
│  │  │                 │    │ Model            │              │ │
│  │  │ • job           │    │                  │              │ │
│  │  │ • seller        │    │ • type           │              │ │
│  │  │ • status        │    │ • message        │              │ │
│  │  │ • proposedPrice │    │ • relatedId      │              │ │
│  │  └─────────────────┘    └──────────────────┘              │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 💼 Job Posting Flow

### Complete Job Lifecycle

```
BUYER PERSPECTIVE                                  FREELANCER PERSPECTIVE
     │                                                      │
     │ 1. Creates job post                                │
     ├──────────────────────────────────────────────────┤ │
     │ POST /api/jobs                                     │ │
     │ Title, Description, Budget, etc.                  │ │
     │                                                   │ │
     ▼ 2. Job visible publicly                           │ │
     │ GET /api/jobs (public)                            │ │
     │                                                   │ │
     │                              ◄────────────────────┼─── 3. Sees job
     │                              │ GET /api/jobs/:id
     │                              │
     │                              ◄────────────────────┼─── 4. Shows interest
     │ 5. Receives notification     │ POST /api/jobs/:id/interest
     │ (applicationAccepted event)  │ Message, Budget, Days
     │                              │
     ├──────────────────────────────► Creates Order (pending)
     │                              │ Creates Proposal
     │ 6. Reviews applications      │
     │ GET /api/jobs/my             │
     │                              │
     │ 7a. Accepts application      │
     │ POST /api/jobs/:id/accept-application
     ├──────────────────────────────►
     │                              6. Notification: Accepted!
     │                              │ Status: waiting for payment
     │ 8. Pays for order             │
     │ POST /api/payment            │
     │                              │ 7. Starts work after payment
     │                              │ Order status: in-progress
     │ 9. Reviews & accepts work    │
     │ POST /api/orders/:id/deliver │ 8. Submits work
     │                              │
     │ 10. Mark job complete        │
     │ POST /api/jobs/:id/complete  │
     │                              │
     ▼ Job status: completed        ▼ Receive payment

OR: REJECTION PATH
     │ 7b. Rejects application
     │ POST /api/jobs/:id/reject-application
     ├──────────────────────────────►
     │                              6. Notification: Not selected
     │                              │ Can apply to other jobs
```

---

## 👤 Buyer Workflow

### Step 1: Create Job Post

```javascript
// POST /api/jobs
{
  "title": "Build a React Dashboard",
  "description": "Need a professional dashboard...",
  "category": "web-development",
  "budget": 5000,
  "budgetType": "fixed",
  "deadline": "2026-02-01",
  "skills": ["React", "Node.js", "MongoDB"]
}

// Response:
{
  "success": true,
  "message": "Job posted successfully",
  "job": {
    "_id": "job123",
    "title": "Build a React Dashboard",
    "status": "open",
    "postedBy": { "_id": "buyer456", "name": "John Doe" },
    "createdAt": "2026-01-09T..."
  }
}
```

### Step 2: View My Posted Jobs

```javascript
// GET /api/jobs/my
// Returns array of jobs posted by current user
[
  {
    "_id": "job123",
    "title": "Build a React Dashboard",
    "status": "open",
    "interests": [
      {
        "freelancer": { "_id": "seller1", "name": "Alice", "rating": 4.8 },
        "message": "I can do this...",
        "status": "pending",
        "appliedAt": "2026-01-09T..."
      },
      { ... }
    ],
    "stats": { "views": 45, "proposals": 8 }
  }
]
```

### Step 3: Accept/Reject Freelancer Applications

```javascript
// Accept Application
// POST /api/jobs/:jobId/accept-application
{
  "freelancerId": "seller1"
}

// Response creates Order with status "activated"
// Freelancer gets notification
// Buyer now needs to pay

// OR Reject Application
// POST /api/jobs/:jobId/reject-application
{
  "freelancerId": "seller1"
}
// Freelancer can still apply to other jobs
```

### Step 4: Update Job (Limited)

```javascript
// PUT /api/jobs/:jobId
// Can only edit once per week
{
  "description": "Updated requirements...",
  "budget": 5500,
  "deadline": "2026-02-15",
  "skills": ["React", "Node.js", "MongoDB", "AWS"]
}

// Note: Title CANNOT be edited
// Response includes nextEditDate if already edited
```

### Step 5: Complete Job

```javascript
// POST /api/jobs/:jobId/complete
// After work is delivered and accepted

// Response:
{
  "success": true,
  "message": "Job marked as completed",
  "job": { ..., "status": "completed" }
}
```

### Step 6: Delete Job (if needed)

```javascript
// DELETE /api/jobs/:jobId
// Only allowed if no freelancer hired

// Fails if hiredFreelancer is set
// Error: "Cannot delete a job with a hired freelancer"
```

---

## 🗄️ Database Models

### **Job Model**

```javascript
{
  // Basic Information
  title: String,                    // Required, unique in proposal context
  description: String,              // Required, detailed job description
  category: String,                 // Required, e.g., "web-development"
  
  // Budget Information
  budget: Number,                   // Required, e.g., 5000
  budgetType: 'fixed' | 'hourly',  // Default: 'fixed'
  
  // Timeline
  deadline: Date,                   // Expected completion date
  
  // Requirements
  skills: [String],                 // e.g., ["React", "Node.js"]
  tags: [String],                   // Additional tags for search
  
  // Relationships
  postedBy: ObjectId,               // Ref to User (Buyer)
  hiredFreelancer: ObjectId,        // Ref to User (Seller) - assigned later
  proposals: [ObjectId],            // Ref to Proposal
  
  // Freelancer Applications
  interests: [{
    freelancer: ObjectId,           // Ref to User
    message: String,                // Cover letter / proposal message
    status: 'pending'|'accepted'|'rejected',
    appliedAt: Date
  }],
  
  // Job Status
  status: 'open'|'in-progress'|'completed'|'cancelled',
  
  // Statistics
  stats: {
    views: Number,                  // How many views
    proposals: Number               // How many applications
  },
  
  // Edit Tracking
  lastEditedAt: Date,               // Restricted to once per week
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### **Order Model** (Created when freelancer applies)

```javascript
{
  buyer: ObjectId,                  // Ref to User
  seller: ObjectId,                 // Ref to User (Freelancer)
  
  job: ObjectId,                    // Ref to Job
  gig: ObjectId,                    // Optional: Ref to Gig
  
  title: String,                    // Job/Gig title
  description: String,              // Order details
  
  price: Number,                    // Negotiated price
  deliveryDays: Number,             // Timeline
  
  status: 'pending'|'activated'|'in-progress'|'completed'|'cancelled',
  // pending: waiting for buyer acceptance
  // activated: waiting for payment
  // in-progress: payment done, work in progress
  // completed: work delivered and accepted
  // cancelled: rejected or cancelled
  
  paymentDeadline: Date,            // 7 days to pay after acceptance
  
  deliveryDate: Date,               // Actual delivery date
  deliveredFiles: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }],
  
  review: {
    rating: Number,                 // 1-5 stars
    comment: String,
    reviledAt: Date
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### **Proposal Model**

```javascript
{
  job: ObjectId,                    // Ref to Job
  seller: ObjectId,                 // Ref to User
  
  coverLetter: String,              // Initial proposal message
  proposedPrice: Number,            // Freelancer's quoted price
  deliveryDays: Number,             // Estimated delivery time
  
  status: 'pending'|'accepted'|'rejected'|'in-progress'|'completed',
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔗 API Endpoints

### **Job CRUD Operations**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/api/jobs` | ✅ | Create new job (Buyer only) |
| **GET** | `/api/jobs` | ❌ | Get all jobs (public) |
| **GET** | `/api/jobs/my` | ✅ | Get my posted jobs (Buyer) |
| **GET** | `/api/jobs/:id` | ❌ | Get single job details |
| **PUT** | `/api/jobs/:id` | ✅ | Update job (Buyer only) |
| **DELETE** | `/api/jobs/:id` | ✅ | Delete job (Buyer only) |

### **Application Management**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/api/jobs/:id/interest` | ✅ | Apply/Show interest (Seller) |
| **POST** | `/api/jobs/:id/accept-application` | ✅ | Accept application (Buyer) |
| **POST** | `/api/jobs/:id/reject-application` | ✅ | Reject application (Buyer) |
| **POST** | `/api/jobs/:id/hire` | ✅ | Hire freelancer (legacy) |

### **Job Completion**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | `/api/jobs/:id/complete` | ✅ | Mark job complete (Buyer) |
| **POST** | `/api/jobs/:id/unhire` | ✅ | Unhire freelancer (Buyer) |

---

## 🔐 Authorization & Permissions

### **Role-Based Access Control**

```typescript
// Only Buyers can:
✅ POST /api/jobs - Create jobs
✅ GET /api/jobs/my - View their posted jobs
✅ PUT /api/jobs/:id - Update their jobs
✅ DELETE /api/jobs/:id - Delete their jobs
✅ POST /api/jobs/:id/accept-application - Accept applications
✅ POST /api/jobs/:id/reject-application - Reject applications
✅ POST /api/jobs/:id/complete - Complete jobs
✅ POST /api/jobs/:id/unhire - Unhire freelancers

// Only Sellers can:
✅ POST /api/jobs/:id/interest - Apply to jobs

// Anyone (Public):
✅ GET /api/jobs - View all jobs
✅ GET /api/jobs/:id - View job details

// Owner-Only Operations:
✅ POST /api/jobs/:id/accept-application - Job owner only
✅ POST /api/jobs/:id/reject-application - Job owner only
✅ PUT /api/jobs/:id - Job owner only
✅ DELETE /api/jobs/:id - Job owner only
```

### **Authentication Header**

```javascript
// All protected endpoints require:
Authorization: Bearer <JWT_TOKEN>

// Example:
GET /api/jobs/my
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚡ Key Features

### **1. Job Posting**
- ✅ Title, description, budget, deadline
- ✅ Category and skills tagging
- ✅ Support for fixed or hourly budget
- ✅ Buyer profile displayed to freelancers

### **2. Application Management**
- ✅ Freelancers can apply with proposals
- ✅ Buyers can accept/reject applications
- ✅ Automatic Order creation on application
- ✅ Automatic Proposal creation
- ✅ Notifications sent on actions

### **3. Job Editing**
- ✅ Edit description, budget, deadline, skills
- ✅ Title cannot be changed (once posted)
- ✅ Restricted to once per 7 days
- ✅ Returns next edit date if restricted

### **4. Search & Filter**
```javascript
// GET /api/jobs?search=React&category=web-development&status=open
```

### **5. Statistics**
```javascript
// Job includes:
{
  "stats": {
    "views": 45,        // How many users viewed
    "proposals": 8      // How many applied
  }
}
```

### **6. Notifications**
Automated notifications sent to freelancers:
- ✅ `application_accepted` - When application is accepted
- ✅ `application_rejected` - When application is rejected

### **7. Email Notifications**
- ✅ Sent when application is accepted
- ✅ Alert freelancer to pay invoice
- ✅ Respects user's email notification preferences

### **8. Job Status Flow**
```
open → in-progress → completed
  ↓
cancelled
```

---

## 🔄 Integration Points

### **With Order System**
- Job posting creates Order when freelancer applies
- Order status: `pending` → `activated` (after acceptance)
- Buyer pays through Payment system

### **With Proposal System**
- Proposal created automatically when freelancer applies
- Proposal status synced with application status
- Tracks freelancer's cover letter and proposed price

### **With Notification System**
- Notifications sent on acceptance/rejection
- Email notifications integrated
- Real-time updates on application changes

### **With User System**
- User role validation (Buyer vs Seller)
- Profile information displayed with jobs
- Rating/stats shown on applications

---

## 📊 Common Workflows

### **Complete Hiring Workflow**

```
1. Buyer posts job
   POST /api/jobs
   Status: open

2. Seller applies
   POST /api/jobs/:id/interest
   Order created: pending
   Proposal created: pending

3. Buyer accepts
   POST /api/jobs/:id/accept-application
   Order updated: activated
   Proposal updated: accepted
   Notification sent to seller

4. Buyer pays
   POST /api/payment
   Order status: in-progress

5. Seller delivers
   POST /api/orders/:id/delivery
   Files uploaded

6. Buyer reviews & accepts
   PUT /api/orders/:id
   Status: completed

7. Mark job complete
   POST /api/jobs/:id/complete
   Job status: completed
```

### **Rejection Workflow**

```
1. Seller applies
   POST /api/jobs/:id/interest
   Order: pending
   Proposal: pending

2. Buyer rejects
   POST /api/jobs/:id/reject-application
   Order: cancelled
   Proposal: rejected
   Notification sent to seller

3. Seller can apply to other jobs
```

---

## 🛠️ Error Handling

| Status | Scenario | Response |
|--------|----------|----------|
| 400 | Missing required fields | Missing required field: title |
| 400 | Duplicate application | You have already applied to this job |
| 400 | Cannot edit too soon | You can only edit your job once per week |
| 400 | Cannot delete with hired freelancer | Cannot delete a job with a hired freelancer |
| 401 | Not authenticated | Unauthorized |
| 403 | Wrong role (seller posting job) | Only buyers can post jobs |
| 403 | Non-owner trying to edit | Not authorized |
| 404 | Job not found | Job not found |
| 500 | Server error | Failed to create job |

---

## 🎯 Best Practices

### **For Buyers**
- ✅ Write clear, detailed job descriptions
- ✅ Set realistic budgets and deadlines
- ✅ Review all applications thoroughly
- ✅ Respond promptly to freelancer proposals
- ✅ Make decisions before application deadline

### **For Freelancers**
- ✅ Customize proposal for each job
- ✅ Include relevant experience
- ✅ Be realistic about timeline
- ✅ Propose competitive pricing
- ✅ Start work immediately after payment

### **For Notifications**
- ✅ Enable email notifications
- ✅ Check dashboard regularly
- ✅ Respond to important messages
- ✅ Track delivery dates

---

## 📝 Summary

The Job Posting feature is the **heart of KAAJ KAAM marketplace**:

1. **For Buyers**: Post jobs, review applications, hire freelancers, manage orders
2. **For Sellers**: Browse jobs, apply with proposals, deliver work, earn money
3. **For Platform**: Track activities, notifications, payments, reviews

**Key Database Tables Involved:**
- Jobs (main listings)
- Orders (agreements between buyer-seller)
- Proposals (freelancer applications)
- Notifications (alerts)
- Users (profiles)

**Payment Integration:** Happens through separate Payment system after job acceptance

**Timeline:** Buyer has 7 days to pay after accepting application

---

**Created by:** KAAJ KAAM Development Team  
**Last Updated:** 2026-01-09
