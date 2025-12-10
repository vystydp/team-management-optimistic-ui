# Railway Backend Deployment Guide

## Quick Setup (5 minutes)

### 1. Deploy to Railway

1. **Sign up for Railway**: Go to https://railway.app and sign in with GitHub (no credit card required)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `vystydp/team-management-optimistic-ui`
   - Railway will automatically detect the configuration

3. **Configure Root Directory**:
   - In Railway dashboard, go to Settings
   - Set "Root Directory" to `backend`
   - Set "Build Command" to `npm install && npm run build`
   - Set "Start Command" to `npm start`

### 2. Set Environment Variables

In Railway dashboard, go to "Variables" tab and add:

```bash
# GitHub OAuth (create at https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://your-railway-app.railway.app/auth/callback

# Frontend URL (your Vercel deployment)
FRONTEND_URL=https://team-management-optimistic-ui.vercel.app

# Generate random secrets (use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=<generate-random-string>
JWT_SECRET=<generate-random-string>

# Environment
NODE_ENV=production
```

### 3. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Team Management API
   - **Homepage URL**: `https://team-management-optimistic-ui.vercel.app`
   - **Authorization callback URL**: `https://your-railway-app.railway.app/auth/callback`
4. Copy the Client ID and Client Secret to Railway environment variables

### 4. Update Frontend to Use Railway Backend

After Railway deployment:

1. Get your Railway app URL (e.g., `https://team-management-backend.railway.app`)
2. Add to Vercel environment variables:
   - Go to Vercel project settings → Environment Variables
   - Add: `VITE_BACKEND_URL` = `https://your-railway-app.railway.app`
3. Redeploy Vercel (or it will auto-redeploy)

### 5. Test the Deployment

1. Visit your Vercel app: https://team-management-optimistic-ui.vercel.app
2. Click "Sign in with GitHub"
3. Should redirect to Railway backend, then back to Vercel after auth

## Generate Secrets

Run this in PowerShell to generate random secrets:

```powershell
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### Railway build fails
- Check logs in Railway dashboard
- Ensure `backend/package.json` has all dependencies
- Verify Node.js version compatibility

### CORS errors
- Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Check Railway logs for blocked requests

### GitHub OAuth not working
- Double-check callback URL in GitHub OAuth app matches Railway URL
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set correctly
- Ensure `GITHUB_CALLBACK_URL` environment variable matches

## Railway Free Tier Limits

✅ **Free tier includes**:
- 500 hours of usage per month (enough for a hobby project)
- $5 credit per month
- Automatic HTTPS
- No credit card required to start

Your backend should stay well within free tier limits for development/testing.
