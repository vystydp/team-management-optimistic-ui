# GitHub OAuth Security Audit - Action Items

**Audit Date**: November 27, 2025  
**Status**: ✅ Most practices compliant, 🟡 Medium-priority improvements recommended

---

## 🔴 CRITICAL - Immediate Action Required

### 1. Regenerate GitHub OAuth Secret
**Status**: ⚠️ Current secret visible in repo (even though gitignored)

**Action**:
1. Go to https://github.com/settings/developers
2. Find your OAuth App
3. Click "Regenerate client secret"
4. Update `backend/.env` with new secret
5. Restart backend server

**Why**: If repo was ever pushed with current `.env`, secret may be in git history

---

## 🟡 MEDIUM Priority - Enhance Before Production

### 2. Implement State Parameter Validation
**Status**: ✅ DONE - State parameter added to OAuth flow

**Remaining**:
- Add state validation in callback handler
- Verify state matches session value

**Code location**: `backend/src/routes/auth.routes.ts` (callback handler)

### 3. Consider Moving from localStorage to httpOnly Cookies
**Status**: 🟡 Current implementation uses localStorage (XSS risk)

**Options**:
```typescript
// Option A: httpOnly cookie (more secure)
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000
});

// Option B: Keep localStorage but add CSP headers
// (Already have XSS protection headers in vercel.json)
```

**Trade-offs**:
- Cookies: More secure, requires CORS credentials: true
- localStorage: Simpler for SPA, vulnerable to XSS
- Current choice: localStorage acceptable for MVP with XSS headers

### 4. Store GitHub Access Token
**Status**: ⚠️ Currently not storing GitHub's access token

**Why needed**:
- Can't refresh expired tokens
- Can't make API calls on user's behalf
- Can't revoke access programmatically

**Implementation**:
```typescript
// In userService
interface User {
  // ... existing fields
  githubAccessToken?: string; // encrypted
  tokenExpiresAt?: Date;
}
```

---

## 🟢 LOW Priority - Future Enhancements

### 5. Token Refresh Mechanism
- Implement automatic token refresh before expiry
- Handle 401 responses with re-auth
- Add token rotation strategy

### 6. Rate Limiting
- Add rate limiting to auth endpoints
- Prevent brute force attempts
- Use express-rate-limit middleware

### 7. Audit Logging
- Log all authentication events
- Track failed login attempts
- Monitor for suspicious patterns

---

## ✅ Already Compliant

- ✅ Secrets only in backend environment
- ✅ `.env` files gitignored
- ✅ Frontend doesn't handle secrets
- ✅ Authorization Code flow on backend
- ✅ Minimal scopes (user:email only)
- ✅ Security headers in Vercel config
- ✅ Backend validates tokens
- ✅ No secrets in deployment configs

---

## Production Deployment Checklist

Before deploying to production, complete ALL items:

### Secrets & Environment
- [ ] Regenerate GitHub OAuth app credentials
- [ ] Generate new JWT_SECRET (64+ random chars)
- [ ] Generate new SESSION_SECRET (64+ random chars)
- [ ] Store secrets in Vercel/K8s secret manager
- [ ] Set NODE_ENV=production
- [ ] Update FRONTEND_URL to production domain
- [ ] Update GITHUB_CALLBACK_URL to production backend

### GitHub OAuth App
- [ ] Create separate production OAuth App
- [ ] Set production callback URL
- [ ] Review and minimize scopes
- [ ] Document app in organization
- [ ] Set up access restrictions if in org

### Security Headers
- [ ] Verify CSP headers deployed
- [ ] Enable HSTS
- [ ] Test security headers with securityheaders.com
- [ ] Enable rate limiting on auth endpoints

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor authentication failures
- [ ] Set up alerts for suspicious activity
- [ ] Document incident response procedures

### Documentation
- [ ] Update README with production setup
- [ ] Document secret rotation procedure
- [ ] Create runbook for security incidents
- [ ] Train team on security practices

---

## Quick Reference Commands

### Generate Secure Secrets
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or with OpenSSL
openssl rand -hex 32
```

### Check Git History for Secrets
```bash
# Scan for potential secrets
git log -p | grep -i "secret\|password\|token"

# Use tool like git-secrets or gitleaks
npm install -g gitleaks
gitleaks detect --source . --verbose
```

### Verify Security Headers
```bash
curl -I https://your-app.com
# Look for: X-Frame-Options, X-Content-Type-Options, CSP
```

---

## Resources

- [SECURITY.md](./SECURITY.md) - Detailed security documentation
- [backend/.env.template](./backend/.env.template) - Environment template
- [GitHub OAuth Best Practices](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
