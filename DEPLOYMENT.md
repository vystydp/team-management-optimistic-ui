# Deployment Guide

## Vercel Deployment

### Initial Setup

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link Project**
   ```bash
   vercel link
   ```

### Via GitHub Integration (Recommended)

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Project**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**
   - No environment variables needed for this project
   - MSW is only used in development mode

4. **Deploy**
   - Push to `main` branch → Production deployment
   - Push to other branches → Preview deployment
   - Pull requests → Automatic preview

### Manual Deployment

```bash
# Production
vercel --prod

# Preview
vercel
```

## GitHub Actions Setup

### Required Secrets

Add these secrets to your GitHub repository:

1. **Get Vercel Token**
   - Go to [Vercel Account Settings](https://vercel.com/account/tokens)
   - Create new token
   - Copy and add as `VERCEL_TOKEN`

2. **Get Organization ID**
   ```bash
   vercel whoami
   ```
   Add as `VERCEL_ORG_ID`

3. **Get Project ID**
   ```bash
   vercel project ls
   ```
   Add as `VERCEL_PROJECT_ID`

### Configuring Secrets

```bash
# Via GitHub CLI
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID

# Or via GitHub UI
# Settings → Secrets and variables → Actions → New repository secret
```

## CI/CD Pipeline

The GitHub Actions workflow automatically:

### On Push to Main
1. Runs tests
2. Builds application
3. Deploys to production

### On Pull Request
1. Runs tests
2. Builds application  
3. Deploys preview environment
4. Comments deployment URL on PR

## Custom Domain

### Add Custom Domain

1. **In Vercel Dashboard**
   - Go to Project Settings → Domains
   - Add your domain

2. **DNS Configuration**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel nameservers

3. **SSL**
   - Automatically provisioned by Vercel
   - No additional configuration needed

## Performance Optimization

### Vercel Configuration

The `vercel.json` includes:
- Cache headers for static assets
- Security headers
- SPA routing configuration

### Build Optimization

```bash
# Analyze bundle size
npm run build
du -sh dist/*
```

### Edge Caching

Static assets are automatically cached on Vercel's Edge Network:
- HTML: No cache
- JS/CSS: Immutable cache (1 year)
- Images: Smart caching

## Monitoring

### Vercel Analytics

Enable in project settings:
- Real User Monitoring (RUM)
- Web Vitals tracking
- Performance metrics

### Error Tracking

Consider integrating:
- Sentry
- LogRocket
- DataDog

## Rollback

### Via Vercel Dashboard

1. Go to Deployments
2. Find previous successful deployment
3. Click "Promote to Production"

### Via CLI

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel promote [deployment-url]
```

## Environment-Specific Configuration

### Development
- MSW enabled
- Source maps enabled
- Debug logging

### Production
- MSW disabled
- Minified bundles
- Optimized assets

## Troubleshooting

### Build Failures

```bash
# Check build locally
npm run build

# Check for TypeScript errors
npm run type-check

# Check for lint errors
npm run lint
```

### Deployment Failures

1. Check Vercel build logs
2. Verify secrets are set correctly
3. Ensure dependencies are in `dependencies` not `devDependencies`

### Preview URL Not Working

1. Check GitHub Actions logs
2. Verify Vercel integration is active
3. Check repository permissions

## Cost Management (Free Tier)

Vercel Free Tier includes:
- ✅ 100GB bandwidth per month
- ✅ 100 deployments per day
- ✅ Automatic HTTPS
- ✅ Instant rollbacks
- ✅ Preview deployments
- ✅ Analytics (with limits)

Tips to stay within limits:
- Optimize images
- Enable compression
- Use efficient caching
- Monitor bandwidth usage

## Security

### Headers

Configured in `vercel.json`:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

### Best Practices

- Keep dependencies updated
- Use HTTPS only
- Implement CSP if needed
- Regular security audits

## Backup Strategy

### Automated
- Git repository (GitHub)
- Vercel keeps deployment history
- Database backups (if using external DB)

### Manual
```bash
# Export build artifacts
npm run build
tar -czf backup-$(date +%Y%m%d).tar.gz dist/
```

## Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
