# KAAJ KAAM - Commands Reference

## Installation Commands

### Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Install specific packages
npm install express mongoose socket.io jsonwebtoken bcryptjs cloudinary multer dotenv cors joi

# Install dev dependencies
npm install --save-dev nodemon
```

### Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Install specific packages
npm install react react-dom react-router-dom axios socket.io-client react-icons date-fns react-toastify

# Install dev dependencies
npm install --save-dev tailwindcss postcss autoprefixer vite @vitejs/plugin-react
```

---

## Development Commands

### Backend Development
```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Check for errors
npm run lint

# Run tests (if configured)
npm test
```

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for errors
npm run lint
```

---

## Database Commands

### MongoDB Connection
```bash
# Connect to MongoDB Atlas
mongo "mongodb+srv://username:password@cluster.mongodb.net/kaaj-kaam"

# List databases
show dbs

# Use specific database
use kaaj-kaam

# List collections
show collections
```

### Create Indexes
```javascript
// User indexes
db.users.createIndex({ email: 1 })
db.users.createIndex({ role: 1 })
db.users.createIndex({ 'profile.skills': 1 })

// Gig indexes
db.gigs.createIndex({ title: 'text', description: 'text', tags: 'text' })
db.gigs.createIndex({ seller: 1, status: 1 })
db.gigs.createIndex({ category: 1 })

// Job indexes
db.jobs.createIndex({ title: 'text', description: 'text', tags: 'text' })
db.jobs.createIndex({ postedBy: 1, status: 1 })
db.jobs.createIndex({ category: 1 })

// Order indexes
db.orders.createIndex({ buyer: 1, status: 1 })
db.orders.createIndex({ seller: 1, status: 1 })
db.orders.createIndex({ createdAt: -1 })

// Message indexes
db.messages.createIndex({ conversationId: 1, createdAt: -1 })
db.messages.createIndex({ sender: 1 })

// Conversation indexes
db.conversations.createIndex({ participants: 1 })
db.conversations.createIndex({ orderId: 1 })
db.conversations.createIndex({ updatedAt: -1 })

// Notification indexes
db.notifications.createIndex({ recipient: 1, isRead: 1, createdAt: -1 })
```

### Query Examples
```javascript
// Find user by email
db.users.findOne({ email: 'user@example.com' })

// Find all gigs by seller
db.gigs.find({ seller: ObjectId('...') })

// Find active jobs
db.jobs.find({ status: 'open' })

// Find messages in conversation
db.messages.find({ conversationId: ObjectId('...') }).sort({ createdAt: -1 })

// Count total orders
db.orders.countDocuments()

// Find unread notifications
db.notifications.find({ recipient: ObjectId('...'), isRead: false })
```

---

## Git Commands

### Clone Repository
```bash
# Clone the repository
git clone https://github.com/your-repo/kaaj-kaam.git

# Navigate to project
cd kaaj-kaam
```

### Commit & Push
```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Feature: Add chat system"

# Push to remote
git push origin main

# Pull latest changes
git pull origin main
```

### Branching
```bash
# Create new branch
git checkout -b feature/chat-system

# Switch branch
git checkout main

# Merge branch
git merge feature/chat-system

# Delete branch
git branch -d feature/chat-system
```

---

## Docker Commands (Optional)

### Build Docker Image
```bash
# Build backend image
docker build -t kaaj-kaam-backend:1.0 ./backend

# Build frontend image
docker build -t kaaj-kaam-frontend:1.0 ./frontend
```

### Run Docker Container
```bash
# Run backend container
docker run -p 8080:8080 --env-file .env kaaj-kaam-backend:1.0

# Run frontend container
docker run -p 3000:3000 kaaj-kaam-frontend:1.0

# Run with docker-compose
docker-compose up
```

---

## Testing Commands

### Manual Testing
```bash
# Test backend API
curl http://localhost:8080/api/auth/me \
  -H "x-auth-token: your-token"

# Test with POST
curl -X POST http://localhost:8080/api/gigs \
  -H "Content-Type: application/json" \
  -H "x-auth-token: your-token" \
  -d '{"title":"Test Gig"}'
```

### Automated Testing (if configured)
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

---

## Deployment Commands

### Build for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Deploy to Render (Backend)
```bash
# Push to GitHub (Render auto-deploys)
git push origin main

# View logs
# Go to Render dashboard → Logs
```

### Deploy to Vercel (Frontend)
```bash
# Push to GitHub (Vercel auto-deploys)
git push origin main

# View logs
# Go to Vercel dashboard → Deployments
```

---

## Environment Setup Commands

### Create .env Files
```bash
# Backend .env
cat > backend/.env << EOF
PORT=8080
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kaaj-kaam
JWT_SECRET=your-secret-key-2024
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=development
EOF

# Frontend .env
cat > frontend/.env << EOF
VITE_API_URL=http://localhost:8080/api
VITE_SOCKET_URL=http://localhost:8080
EOF
```

### Update .env Files
```bash
# Edit backend .env
nano backend/.env

# Edit frontend .env
nano frontend/.env
```

---

## Debugging Commands

### Backend Debugging
```bash
# Start with debug mode
DEBUG=* npm run dev

# Check logs
tail -f logs/app.log

# Monitor database
mongosh "mongodb+srv://..."
```

### Frontend Debugging
```bash
# Open browser DevTools
F12 or Ctrl+Shift+I

# Check console
console.log()

# Check network tab
Network tab in DevTools

# Check React DevTools
Install React DevTools extension
```

---

## Performance Commands

### Monitor Backend
```bash
# Check memory usage
node --max-old-space-size=4096 index.js

# Profile performance
node --prof index.js
node --prof-process isolate-*.log > profile.txt
```

### Monitor Frontend
```bash
# Build analysis
npm run build -- --analyze

# Check bundle size
npm run build
ls -lh dist/
```

---

## Cleanup Commands

### Remove Node Modules
```bash
# Backend
cd backend
rm -rf node_modules
npm install

# Frontend
cd frontend
rm -rf node_modules
npm install
```

### Clear Cache
```bash
# npm cache
npm cache clean --force

# Build cache
rm -rf dist/
rm -rf build/
```

### Remove Logs
```bash
# Remove log files
rm -rf logs/
rm -f *.log
```

---

## Useful Aliases

Add to `.bashrc` or `.zshrc`:

```bash
# Backend commands
alias backend-dev="cd backend && npm run dev"
alias backend-start="cd backend && npm start"
alias backend-install="cd backend && npm install"

# Frontend commands
alias frontend-dev="cd frontend && npm run dev"
alias frontend-build="cd frontend && npm run build"
alias frontend-install="cd frontend && npm install"

# Git commands
alias gs="git status"
alias ga="git add ."
alias gc="git commit -m"
alias gp="git push"
alias gl="git pull"

# Project commands
alias kaaj-dev="cd backend && npm run dev & cd ../frontend && npm run dev"
alias kaaj-build="cd backend && npm run build && cd ../frontend && npm run build"
```

---

## Troubleshooting Commands

### Check Port Usage
```bash
# Linux/Mac
lsof -i :8080
lsof -i :5173

# Windows
netstat -ano | findstr :8080
netstat -ano | findstr :5173
```

### Kill Process
```bash
# Linux/Mac
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

### Check Node Version
```bash
node --version
npm --version
```

### Update npm
```bash
npm install -g npm@latest
```

### Clear npm Cache
```bash
npm cache clean --force
```

---

## Useful Links

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Socket.IO Docs](https://socket.io/docs/)
- [React Docs](https://react.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Tools
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Cloudinary](https://cloudinary.com/)
- [Render](https://render.com/)
- [Vercel](https://vercel.com/)
- [GitHub](https://github.com/)

### APIs
- [REST API Reference](./API_REFERENCE.md)
- [Socket.IO Events](./API_REFERENCE.md#socketio-events)
- [Error Responses](./API_REFERENCE.md#error-responses)

---

## Quick Reference

### Start Development
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Open browser
http://localhost:5173
```

### Deploy
```bash
# Push to GitHub
git add .
git commit -m "Deploy: Version 1.0"
git push origin main

# Render auto-deploys backend
# Vercel auto-deploys frontend
```

### Monitor
```bash
# Check backend logs
# Render dashboard → Logs

# Check frontend logs
# Vercel dashboard → Deployments

# Check database
# MongoDB Atlas → Metrics
```

---

**Last Updated**: January 2024
**Version**: 1.0.0
