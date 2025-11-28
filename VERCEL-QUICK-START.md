# Vercel Deployment Quick Reference

## ✅ Pre-Deployment Checklist

- [ ] Backend deployed and accessible via HTTPS
- [ ] Vercel environment variables configured
- [ ] GitHub OAuth callback URLs updated for production
- [ ] CORS configured on backend for Vercel domain
- [ ] Test build locally: `npm run build && npm run preview`

## 🚀 Vercel Environment Variables

**Dashboard**: Vercel Project → Settings → Environment Variables

### Required Variables

```bash
# Production & Preview
VITE_BACKEND_URL=https://api.yourapp.com
VITE_USE_REAL_BACKEND=true
VITE_POLL_INTERVAL=3000
```

### Development (Optional)
```bash
# Leave empty to use .env.local
```

## 🔧 Backend Configuration Required

Update backend environment variables for production:

```bash
# In Kubernetes Secrets or backend .env
FRONTEND_URL=https://yourapp.vercel.app
GITHUB_CALLBACK_URL=https://api.yourapp.com/auth/callback
GITHUB_CLIENT_ID=<your-production-oauth-app-id>
GITHUB_CLIENT_SECRET=<your-production-oauth-secret>
NODE_ENV=production
```

## 📦 Vercel Build Settings

**Should be auto-detected**, but verify:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

## 🔐 GitHub OAuth Setup

### Development OAuth App
- Homepage: `http://localhost:3000`
- Callback: `http://localhost:3001/auth/callback`

### Production OAuth App (Create Separate)
- Homepage: `https://yourapp.vercel.app`
- Callback: `https://your-backend.com/auth/callback`

## 🧪 Testing Deployment

1. **Local Build Test**
   ```bash
   npm run build
   npm run preview
   # Visit http://localhost:4173
   ```

2. **Vercel Preview Deploy**
   ```bash
   # Push to non-main branch
   git push origin feat/optimistic-ui-impl
   # Vercel creates preview deployment
   ```

3. **Production Deploy**
   ```bash
   # Merge to main
   git checkout main
   git merge feat/optimistic-ui-impl
   git push origin main
   # Vercel deploys to production
   ```

## 🔍 Verify Deployment

- [ ] Frontend loads at `https://yourapp.vercel.app`
- [ ] Backend API accessible from frontend
- [ ] GitHub OAuth login works
- [ ] No console errors
- [ ] Security headers present (check DevTools Network tab)

## 🐛 Troubleshooting

### Issue: OAuth fails in production
**Fix**: Update GitHub OAuth app callback URL and `FRONTEND_URL` in backend

### Issue: Cannot connect to backend
**Fix**: Check `VITE_BACKEND_URL` in Vercel env vars and CORS on backend

### Issue: Build fails
**Fix**: Check `package.json` scripts and TypeScript errors locally

### Issue: Environment variables not loaded
**Fix**: Variables must be prefixed with `VITE_` for frontend access

## 📚 Documentation

- [VERCEL-COMPLIANCE.md](./VERCEL-COMPLIANCE.md) - Full audit report
- [SECURITY.md](./SECURITY.md) - Security best practices
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide

## 🎯 Architecture Summary

```
Vercel (Frontend)
    ↓ HTTPS
Backend (K8s)
    ↓
Kubernetes API
    ↓
Crossplane/Resources
```

**Frontend**: Static files only, no secrets  
**Backend**: API server with K8s access, secrets in K8s Secrets
