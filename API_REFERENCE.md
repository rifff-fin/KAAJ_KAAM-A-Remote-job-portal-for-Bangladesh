# KAAJ KAAM - API Reference

## Base URL
```
Development: http://localhost:8080/api
Production: https://kaajkaam.onrender.com/api
```

## Authentication
All protected endpoints require:
```
Header: x-auth-token: <JWT_TOKEN>
```

---

## Authentication Endpoints

### Register
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "seller" | "buyer"
}

Response: 201
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "seller"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "seller"
  }
}
```

### Get Current User
```
GET /auth/me
Headers: x-auth-token: <TOKEN>

Response: 200
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "seller",
  "profile": {
    "name": "John",
    "bio": "Expert developer",
    "avatar": "https://...",
    "skills": ["React", "Node.js"],
    "level": 1,
    "earnings": 5000
  },
  "rating": {
    "average": 4.8,
    "count": 25,
    "breakdown": {
      "communication": 4.9,
      "quality": 4.8,
      "timeliness": 4.7,
      "professionalism": 4.8
    }
  },
  "stats": {
    "totalOrders": 25,
    "completedOrders": 24,
    "cancelledOrders": 1,
    "totalEarnings": 5000,
    "xp": 250
  }
}
```

### Update Profile
```
PUT /auth/profile
Headers: x-auth-token: <TOKEN>
Content-Type: multipart/form-data

{
  "name": "John Doe",
  "bio": "Expert developer",
  "skills": "React,Node.js,MongoDB",
  "avatar": <FILE>
}

Response: 200
{
  "id": "507f1f77bcf86cd799439011",
  "profile": {
    "name": "John Doe",
    "bio": "Expert developer",
    "avatar": "https://res.cloudinary.com/...",
    "skills": ["React", "Node.js", "MongoDB"]
  }
}
```

---

## Gig Endpoints

### List Gigs
```
GET /gigs?category=web&minPrice=100&maxPrice=1000&limit=20&skip=0

Query Parameters:
- category: String (optional)
- minPrice: Number (optional)
- maxPrice: Number (optional)
- limit: Number (default: 20)
- skip: Number (default: 0)
- search: String (optional)

Response: 200
{
  "gigs": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Build React App",
      "description": "I will build a React app",
      "category": "web",
      "tags": ["react", "frontend"],
      "seller": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "profile": { "avatar": "https://..." }
      },
      "basePrice": 500,
      "deliveryDays": 5,
      "priceTiers": [
        {
          "name": "Basic",
          "price": 500,
          "deliveryDays": 5,
          "revisions": 2
        }
      ],
      "images": ["https://..."],
      "status": "active",
      "stats": {
        "views": 150,
        "orders": 10,
        "rating": 4.8,
        "reviews": 8
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "hasMore": true
}
```

### Create Gig
```
POST /gigs
Headers: x-auth-token: <TOKEN>
Content-Type: multipart/form-data

{
  "title": "Build React App",
  "description": "I will build a React app",
  "category": "web",
  "tags": ["react", "frontend"],
  "basePrice": 500,
  "deliveryDays": 5,
  "priceTiers": [
    {
      "name": "Basic",
      "price": 500,
      "deliveryDays": 5,
      "revisions": 2,
      "description": "Basic package"
    }
  ],
  "images": [<FILE>, <FILE>]
}

Response: 201
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Build React App",
  "seller": "507f1f77bcf86cd799439012",
  "status": "active"
}
```

### Get Gig Details
```
GET /gigs/:id
Headers: x-auth-token: <TOKEN> (optional)

Response: 200
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Build React App",
  "description": "I will build a React app",
  "category": "web",
  "tags": ["react", "frontend"],
  "seller": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {
      "avatar": "https://...",
      "bio": "Expert developer",
      "skills": ["React", "Node.js"]
    },
    "rating": {
      "average": 4.8,
      "count": 25
    }
  },
  "basePrice": 500,
  "deliveryDays": 5,
  "priceTiers": [...],
  "images": ["https://..."],
  "status": "active",
  "stats": {
    "views": 150,
    "orders": 10,
    "rating": 4.8,
    "reviews": 8
  }
}
```

### Update Gig
```
PUT /gigs/:id
Headers: x-auth-token: <TOKEN>
Content-Type: multipart/form-data

{
  "title": "Build React App",
  "description": "Updated description",
  "category": "web",
  "basePrice": 600,
  "deliveryDays": 7,
  "images": [<FILE>]
}

Response: 200
{ ... updated gig ... }
```

### Delete Gig
```
DELETE /gigs/:id
Headers: x-auth-token: <TOKEN>

Response: 200
{ "message": "Gig deleted" }
```

---

## Job Endpoints

### List Jobs
```
GET /jobs?category=web&minBudget=100&maxBudget=5000&limit=20&skip=0

Query Parameters:
- category: String (optional)
- minBudget: Number (optional)
- maxBudget: Number (optional)
- status: String (optional)
- limit: Number (default: 20)
- skip: Number (default: 0)

Response: 200
{
  "jobs": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Build React App",
      "description": "Need a React app",
      "category": "web",
      "budget": 1000,
      "budgetType": "fixed",
      "deadline": "2024-02-15T00:00:00Z",
      "skills": ["React", "Node.js"],
      "tags": ["urgent"],
      "postedBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Buyer"
      },
      "status": "open",
      "stats": {
        "views": 50,
        "proposals": 5
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 50,
  "hasMore": true
}
```

### Create Job
```
POST /jobs
Headers: x-auth-token: <TOKEN>
Content-Type: application/json

{
  "title": "Build React App",
  "description": "Need a React app for my business",
  "category": "web",
  "budget": 1000,
  "budgetType": "fixed",
  "deadline": "2024-02-15T00:00:00Z",
  "skills": ["React", "Node.js"],
  "tags": ["urgent"]
}

Response: 201
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Build React App",
  "postedBy": "507f1f77bcf86cd799439012",
  "status": "open"
}
```

### Get Job Details
```
GET /jobs/:id
Headers: x-auth-token: <TOKEN> (optional)

Response: 200
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Build React App",
  "description": "Need a React app",
  "category": "web",
  "budget": 1000,
  "budgetType": "fixed",
  "deadline": "2024-02-15T00:00:00Z",
  "skills": ["React", "Node.js"],
  "postedBy": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Jane Buyer",
    "email": "jane@example.com"
  },
  "hiredSeller": null,
  "status": "open",
  "proposals": ["507f1f77bcf86cd799439013"],
  "stats": {
    "views": 50,
    "proposals": 5
  }
}
```

---

## Proposal Endpoints

### Create Proposal
```
POST /proposals
Headers: x-auth-token: <TOKEN>
Content-Type: application/json

{
  "jobId": "507f1f77bcf86cd799439011",
  "coverLetter": "I can build this app in 5 days",
  "proposedPrice": 900,
  "deliveryDays": 5
}

Response: 201
{
  "_id": "507f1f77bcf86cd799439013",
  "job": "507f1f77bcf86cd799439011",
  "seller": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Seller"
  },
  "coverLetter": "I can build this app in 5 days",
  "proposedPrice": 900,
  "deliveryDays": 5,
  "status": "pending",
  "appliedAt": "2024-01-15T10:30:00Z"
}
```

### Get Job Proposals
```
GET /proposals/job/:jobId
Headers: x-auth-token: <TOKEN>

Response: 200
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "seller": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Seller",
      "profile": { "avatar": "https://..." },
      "rating": { "average": 4.8, "count": 25 }
    },
    "coverLetter": "I can build this app",
    "proposedPrice": 900,
    "deliveryDays": 5,
    "status": "pending",
    "appliedAt": "2024-01-15T10:30:00Z"
  }
]
```

### Accept Proposal
```
PUT /proposals/:proposalId/accept
Headers: x-auth-token: <TOKEN>

Response: 200
{
  "_id": "507f1f77bcf86cd799439013",
  "status": "accepted",
  "respondedAt": "2024-01-15T11:00:00Z"
}
```

### Reject Proposal
```
PUT /proposals/:proposalId/reject
Headers: x-auth-token: <TOKEN>

Response: 200
{
  "_id": "507f1f77bcf86cd799439013",
  "status": "rejected",
  "respondedAt": "2024-01-15T11:00:00Z"
}
```

---

## Order Endpoints

### Create Order from Gig
```
POST /orders/from-gig
Headers: x-auth-token: <TOKEN>
Content-Type: application/json

{
  "gigId": "507f1f77bcf86cd799439011",
  "priceId": 0
}

Response: 201
{
  "_id": "507f1f77bcf86cd799439014",
  "buyer": "507f1f77bcf86cd799439015",
  "seller": "507f1f77bcf86cd799439012",
  "gig": "507f1f77bcf86cd799439011",
  "title": "Build React App",
  "price": 500,
  "deliveryDays": 5,
  "status": "pending",
  "dueDate": "2024-01-20T10:30:00Z",
  "conversationId": "507f1f77bcf86cd799439016"
}
```

### Create Order from Proposal
```
POST /orders/from-proposal
Headers: x-auth-token: <TOKEN>
Content-Type: application/json

{
  "proposalId": "507f1f77bcf86cd799439013"
}

Response: 201
{
  "_id": "507f1f77bcf86cd799439014",
  "buyer": "507f1f77bcf86cd799439015",
  "seller": "507f1f77bcf86cd799439012",
  "job": "507f1f77bcf86cd799439011",
  "title": "Build React App",
  "price": 900,
  "deliveryDays": 5,
  "status": "active",
  "dueDate": "2024-01-20T10:30:00Z"
}
```

### Get Orders
```
GET /orders?role=buyer&status=active&limit=20&skip=0
Headers: x-auth-token: <TOKEN>

Query Parameters:
- role: "buyer" | "seller"
- status: "pending" | "active" | "completed" | "cancelled"
- limit: Number (default: 20)
- skip: Number (default: 0)

Response: 200
{
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "buyer": { "_id": "...", "name": "Jane" },
      "seller": { "_id": "...", "name": "John" },
      "title": "Build React App",
      "price": 500,
      "deliveryDays": 5,
      "status": "active",
      "dueDate": "2024-01-20T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 10,
  "hasMore": false
}
```

### Update Order Status
```
PUT /orders/:orderId/status
Headers: x-auth-token: <TOKEN>
Content-Type: application/json

{
  "status": "completed"
}

Response: 200
{
  "_id": "507f1f77bcf86cd799439014",
  "status": "completed",
  "completionDate": "2024-01-20T10:30:00Z"
}
```

---

## Chat Endpoints

### Get or Create Conversation
```
POST /chat/conversations
Headers: x-auth-token: <TOKEN>
Content-Type: application/json

{
  "participantId": "507f1f77bcf86cd799439012",
  "orderId": "507f1f77bcf86cd799439014"
}

Response: 200
{
  "_id": "507f1f77bcf86cd799439016",
  "participants": [
    { "_id": "...", "name": "Jane", "email": "jane@..." },
    { "_id": "...", "name": "John", "email": "john@..." }
  ],
  "orderId": "507f1f77bcf86cd799439014",
  "lastMessage": {
    "text": "When can you start?",
    "sender": "507f1f77bcf86cd799439012",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### Get Conversations
```
GET /chat/conversations?limit=20&skip=0
Headers: x-auth-token: <TOKEN>

Response: 200
{
  "conversations": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "participants": [...],
      "lastMessage": {...},
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5,
  "hasMore": false
}
```

### Get Messages
```
GET /chat/conversations/:conversationId/messages?limit=50&skip=0
Headers: x-auth-token: <TOKEN>

Response: 200
{
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "conversationId": "507f1f77bcf86cd799439016",
      "sender": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John",
        "profile": { "avatar": "https://..." }
      },
      "text": "When can you start?",
      "attachments": [],
      "readBy": [
        { "userId": "507f1f77bcf86cd799439015", "readAt": "2024-01-15T10:31:00Z" }
      ],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 25,
  "hasMore": true
}
```

### Send Message
```
POST /chat/conversations/:conversationId/messages
Headers: x-auth-token: <TOKEN>
Content-Type: application/json

{
  "text": "When can you start?",
  "attachments": []
}

Response: 201
{
  "_id": "507f1f77bcf86cd799439017",
  "conversationId": "507f1f77bcf86cd799439016",
  "sender": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John"
  },
  "text": "When can you start?",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## Review Endpoints

### Create Review
```
POST /reviews
Headers: x-auth-token: <TOKEN>
Content-Type: application/json

{
  "orderId": "507f1f77bcf86cd799439014",
  "rating": 5,
  "comment": "Great work!",
  "categories": {
    "communication": 5,
    "quality": 5,
    "timeliness": 5,
    "professionalism": 5
  },
  "isAnonymous": false
}

Response: 201
{
  "_id": "507f1f77bcf86cd799439018",
  "order": "507f1f77bcf86cd799439014",
  "reviewer": "507f1f77bcf86cd799439015",
  "reviewee": "507f1f77bcf86cd799439012",
  "rating": 5,
  "comment": "Great work!",
  "categories": {...},
  "createdAt": "2024-01-20T10:30:00Z"
}
```

### Get User Reviews
```
GET /reviews/user/:userId?limit=20&skip=0

Response: 200
{
  "reviews": [
    {
      "_id": "507f1f77bcf86cd799439018",
      "reviewer": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Jane"
      },
      "rating": 5,
      "comment": "Great work!",
      "createdAt": "2024-01-20T10:30:00Z"
    }
  ],
  "total": 25,
  "hasMore": false
}
```

---

## Notification Endpoints

### Get Notifications
```
GET /notifications?limit=20&skip=0&unreadOnly=false
Headers: x-auth-token: <TOKEN>

Response: 200
{
  "notifications": [
    {
      "_id": "507f1f77bcf86cd799439019",
      "recipient": "507f1f77bcf86cd799439015",
      "type": "new_proposal",
      "title": "New proposal received",
      "message": "John submitted a proposal",
      "relatedId": "507f1f77bcf86cd799439013",
      "relatedModel": "Proposal",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15,
  "unreadCount": 3,
  "hasMore": false
}
```

### Mark as Read
```
PUT /notifications/:notificationId/read
Headers: x-auth-token: <TOKEN>

Response: 200
{
  "_id": "507f1f77bcf86cd799439019",
  "isRead": true,
  "readAt": "2024-01-15T10:31:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "All fields required"
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Socket.IO Events

### Client → Server
```javascript
socket.emit('join_conversation', conversationId)
socket.emit('send_message', { conversationId, text, attachments })
socket.emit('typing', conversationId)
socket.emit('stop_typing', conversationId)
socket.emit('mark_read', conversationId)
socket.emit('leave_conversation', conversationId)
```

### Server → Client
```javascript
socket.on('receive_message', message)
socket.on('user_online', { userId })
socket.on('user_offline', { userId })
socket.on('user_typing', { userId })
socket.on('user_stop_typing', { userId })
socket.on('messages_read', { userId, conversationId })
socket.on('new_notification', notification)
```

---

**Last Updated**: 2024
**Version**: 1.0.0
