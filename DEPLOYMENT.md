# Deployment Guide

## Vercel Deployment (Frontend + Backend)

Since this worked on Vercel before, here's how to properly deploy both frontend and backend:

### Option 1: Deploy Backend Separately (Recommended)

1. **Deploy Backend to Railway/Render/Heroku:**
   ```bash
   # Deploy the server to a platform that supports Node.js
   # Railway, Render, or Heroku are good options
   ```

2. **Set Environment Variables on Backend:**
   ```bash
   NODE_ENV=production
   PORT=4000
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
   ```

3. **Deploy Frontend to Vercel:**
   - Connect your GitHub repo to Vercel
   - Set the root directory to `apps/web`
   - Set environment variables:
   ```bash
   NEXT_PUBLIC_CHAT_BASE_URL=https://your-backend-domain.com
   NEXT_PUBLIC_NESTJS_SERVER=https://your-backend-domain.com
   ```

### Option 2: Deploy Both on Vercel (Advanced)

If you want to deploy both frontend and backend on Vercel, you'll need to convert the NestJS backend to Vercel serverless functions.

## Environment Variables Required

### Backend (.env file in apps/server/)
```bash
# Server Configuration
NODE_ENV=production
PORT=4000

# Database Configuration (if using PostgreSQL)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/your_database

# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
```

### Frontend (.env.local file in apps/web/)
```bash
# Frontend Configuration
NEXT_PUBLIC_CHAT_BASE_URL=https://your-backend-domain.com
NEXT_PUBLIC_NESTJS_SERVER=https://your-backend-domain.com
```

## Common Deployment Issues

### 1. Backend Not Deployed
- **Problem**: Frontend can't connect to backend
- **Solution**: Deploy the NestJS backend to a platform like Railway, Render, or Heroku

### 2. Missing DeepSeek API Key
- **Problem**: `DEEPSEEK_API_KEY` not set in production
- **Solution**: Add the API key to your backend environment variables

### 3. CORS Issues
- **Problem**: Frontend can't connect to backend due to CORS
- **Solution**: Set `ALLOWED_ORIGINS` with your Vercel domain

### 4. Wrong URLs
- **Problem**: Frontend pointing to localhost in production
- **Solution**: Set `NEXT_PUBLIC_CHAT_BASE_URL` to your actual backend URL

## Debugging

1. **Use the debug page**: Visit `/debug` on your deployed app to test the connection
2. **Check browser console**: Look for network errors and CORS issues
3. **Check backend logs**: Verify the backend is receiving requests
4. **Test API directly**: Try calling your backend API directly with curl or Postman

## Quick Fix for Current Issue

If it was working before and now it's not:

1. **Check if backend is still running** - The backend might have been stopped or redeployed
2. **Verify environment variables** - Make sure `DEEPSEEK_API_KEY` is still set
3. **Check CORS settings** - Ensure `ALLOWED_ORIGINS` includes your current Vercel domain
4. **Test the connection** - Use the debug page at `/debug` to test the connection

## Docker Deployment

1. Build the image:
```bash
docker build -t bi-site .
```

2. Run with environment variables:
```bash
docker run -d \
  -p 3000:3000 \
  -p 4000:4000 \
  -e NODE_ENV=production \
  -e PORT=4000 \
  -e DEEPSEEK_API_KEY=your_key \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  bi-site
``` 