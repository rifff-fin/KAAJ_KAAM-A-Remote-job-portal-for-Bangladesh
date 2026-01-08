# Cloudflare Turnstile Setup Guide

## Current Status
The application uses Cloudflare Turnstile for bot protection on login and signup pages. The current configuration allows **development mode bypass** to prevent authentication issues during development.

## Development Mode (Current Setup)
When `NODE_ENV=development` in `backend/.env`, the Turnstile verification will be bypassed even if:
- The site key and secret key don't match
- The token is missing or invalid
- The Cloudflare service is unreachable

This allows you to login/signup without issues during development.

## For Production Deployment

### Step 1: Get Matching Turnstile Keys
1. Go to [Cloudflare Turnstile Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
2. Create a new site or use an existing one
3. Copy both the **Site Key** and **Secret Key** from the SAME widget

### Step 2: Update Environment Variables

**Backend** (`backend/.env`):
```env
TURNSTILE_SECRET_KEY=your_secret_key_here
NODE_ENV=production
```

**Frontend** (`frontend/.env`):
```env
VITE_TURNSTILE_SITE_KEY=your_site_key_here
```

### Step 3: Restart Both Servers
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## Using Test Keys (Alternative for Development)
Cloudflare provides test keys that always pass verification:

**Backend** (`backend/.env`):
```env
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```env
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

## Troubleshooting

### Error: "Security verification failed"
- **Cause**: Site key and secret key are from different Turnstile widgets
- **Fix**: Ensure both keys are from the same widget configuration, or set `NODE_ENV=development`

### Error: "Turnstile token is required"
- **Cause**: Frontend Turnstile widget not loading
- **Fix**: Check browser console for errors, ensure Cloudflare script is loading

### Widget Not Appearing
- **Cause**: Site key is invalid or missing
- **Fix**: Verify `VITE_TURNSTILE_SITE_KEY` is set correctly in `frontend/.env`

## Security Notes
⚠️ **Important**: Always set `NODE_ENV=production` when deploying to production to enforce Turnstile verification.