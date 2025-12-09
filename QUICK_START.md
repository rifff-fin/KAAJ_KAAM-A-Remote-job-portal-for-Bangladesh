# KAAJ KAAM - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Environment Setup

**Backend (.env)**
```
PORT=8080
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/kaaj-kaam
JWT_SECRET=your-secret-key-2024
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=development
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8080/api
VITE_SOCKET_URL=http://localhost:8080
```

### Step 3: Start Servers

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
# Server running on http://localhost:8080
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

### Step 4: Test the App

1. Open http://localhost:5173
2. Sign up as a seller or buyer
3. Create a gig (seller) or post a job (buyer)
4. Browse and interact

---

## 📋 Key Features

### For Sellers
- ✅ Create gigs with multiple price tiers
- ✅ Upload images to Cloudinary
- ✅ Receive and manage proposals
- ✅ Track orders and earnings
- ✅ Chat with buyers
- ✅ Get reviews and ratings

### For Buyers
- ✅ Post jobs with budget
- ✅ Browse gigs and sellers
- ✅ Send proposals to sellers
- ✅ Hire and manage orders
- ✅ Chat with sellers
- ✅ Leave reviews

### For Both
- ✅ Real-time 1-on-1 chat
- ✅ Order tracking
- ✅ Notifications
- ✅ Profile management
- ✅ Rating system

---

## 🔑 Test Accounts

### Seller Account
```
Email: seller@test.com
Password: password123
Role: Seller
```

### Buyer Account
```
Email: buyer@test.com
Password: password123
Role: Buyer
```

---

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
```

### Gigs
```
GET    /api/gigs
POST   /api/gigs
GET    /api/gigs/:id
PUT    /api/gigs/:id
DELETE /api/gigs/:id
```

### Jobs
```
GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/:id
PUT    /api/jobs/:id
DELETE /api/jobs/:id
```

### Orders
```
GET    /api/orders
POST   /api/orders/from-gig
POST   /api/orders/from-proposal
GET    /api/orders/:id
PUT    /api/orders/:id/status
```

### Chat
```
GET    /api/chat/conversations
POST   /api/chat/conversations
GET    /api/chat/conversations/:id/messages
POST   /api/chat/conversations/:id/messages
```

### Reviews
```
POST   /api/reviews
GET    /api/reviews/user/:userId
GET    /api/reviews/given/all
```

### Notifications
```
GET    /api/notifications
PUT    /api/notifications/:id/read
```

---

## 🛠️ Troubleshooting

### MongoDB Connection Error
- Check MONGODB_URI in .env
- Ensure IP whitelist includes your IP
- Verify credentials

### Cloudinary Upload Error
- Check CLOUDINARY_NAME, API_KEY, API_SECRET
- Ensure folder exists in Cloudinary

### Socket.IO Connection Error
- Check VITE_SOCKET_URL matches backend URL
- Ensure backend is running
- Check CORS configuration

### Token Not Sending
- Verify token in localStorage
- Check API interceptor
- Ensure x-auth-token header is set

---

## 📦 Dependencies

### Backend
- express
- mongoose
- socket.io
- jsonwebtoken
- bcryptjs
- cloudinary
- multer
- dotenv

### Frontend
- react
- react-router-dom
- axios
- socket.io-client
- react-icons
- date-fns
- tailwindcss

---

## 🚢 Deployment

### Backend (Render)
1. Push to GitHub
2. Connect Render to repo
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Push to GitHub
2. Connect Vercel to repo
3. Set environment variables
4. Deploy

---

## 📞 Support

For issues:
1. Check logs in terminal
2. Review error messages
3. Check MongoDB connection
4. Verify environment variables
5. Check API endpoints

---

## 🎯 Next Steps

1. **Customize**: Update colors, fonts, branding
2. **Add Features**: Implement Phase 2 features
3. **Test**: Run through all user flows
4. **Deploy**: Push to production
5. **Monitor**: Track errors and performance

---

**Happy Coding! 🎉**
