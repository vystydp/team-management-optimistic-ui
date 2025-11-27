# 🚀 Installation & Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** (for version control)

Check your versions:
```bash
node --version  # Should be v18.x or higher
npm --version   # Should be v9.x or higher
git --version   # Any recent version
```

---

## Step-by-Step Installation

### 1. Navigate to Project Directory

```bash
cd d:\Repos\team-management-optimistic-ui
```

### 2. Install Dependencies

This will install all required packages (React, TypeScript, Vite, Jest, MSW, Tailwind, etc.):

```bash
npm install
```

**Expected time:** 2-3 minutes  
**Expected output:** 
```
added 1234 packages, and audited 1235 packages in 2m
```

### 3. Initialize Mock Service Worker

MSW requires initialization to create the service worker file:

```bash
npx msw init public/ --save
```

**Expected output:**
```
✔ Service Worker successfully created!
  📦 public/mockServiceWorker.js
```

### 4. Verify Installation

Run this command to check everything is working:

```bash
npm run type-check
```

**Expected output:**
```
No errors found
```

---

## Start Development Server

### Option 1: Standard Start
```bash
npm run dev
```

### Option 2: With Custom Port
```bash
npm run dev -- --port 3001
```

**Expected output:**
```
VITE v5.0.x  ready in 342 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h to show help
```

**Open in browser:** http://localhost:3000

---

## Verify Everything Works

### 1. Check the Application

Open http://localhost:3000 - You should see:
- ✅ Team Management header
- ✅ Optimistic UI Monitor dashboard
- ✅ "Add Team Member" button
- ✅ Two sample team members (from MSW)

### 2. Test Optimistic UI

1. Click "Add Team Member"
2. Fill in the form
3. Click "Create"
4. Watch for:
   - ✅ Instant UI update (optimistic)
   - ✅ Yellow border on new item
   - ✅ "Pending..." badge
   - ✅ After ~800ms, border disappears (confirmed)

### 3. Run Tests

```bash
npm test
```

**Expected output:**
```
Test Suites: X passed, X total
Tests:       X passed, X total
Snapshots:   0 total
Time:        X.XXXs
```

### 4. Build for Production

```bash
npm run build
```

**Expected output:**
```
vite v5.0.x building for production...
✓ XX modules transformed.
dist/index.html                   X.XX kB
dist/assets/index-XXXXX.css       X.XX kB │ gzip: X.XX kB
dist/assets/index-XXXXX.js      XXX.XX kB │ gzip: XX.XX kB
✓ built in X.XXs
```

---

## Troubleshooting Installation

### Issue: npm install fails

**Solution 1: Clear npm cache**
```bash
npm cache clean --force
npm install
```

**Solution 2: Delete node_modules and retry**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Solution 3: Use different registry**
```bash
npm config set registry https://registry.npmjs.org/
npm install
```

### Issue: MSW init fails

**Solution: Create public directory first**
```bash
mkdir public
npx msw init public/ --save
```

### Issue: Port 3000 already in use

**Solution 1: Use different port**
```bash
npm run dev -- --port 3001
```

**Solution 2: Kill process on port 3000**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Issue: TypeScript errors

**Solution: Restart TypeScript server**
```bash
# In VS Code
Ctrl/Cmd + Shift + P → "TypeScript: Restart TS Server"
```

### Issue: Tests fail

**Solution: Clear Jest cache**
```bash
npm test -- --clearCache
npm test
```

---

## IDE Setup (Optional but Recommended)

### Visual Studio Code

**1. Install Extensions:**
```
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- TypeScript Vue Plugin (Vue.volar)
```

**2. Configure Settings:**

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### WebStorm / IntelliJ IDEA

**1. Enable Prettier:**
- Settings → Languages & Frameworks → JavaScript → Prettier
- Check "On code reformat" and "On save"

**2. Enable ESLint:**
- Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
- Select "Automatic ESLint configuration"

---

## Environment Variables (Optional)

This project doesn't require environment variables for local development.

If you need to add any:

**1. Create `.env.local`:**
```bash
VITE_API_URL=http://localhost:3000/api
```

**2. Access in code:**
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## Verify Installation Checklist

Run through this checklist to ensure everything is set up correctly:

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] Project cloned/downloaded
- [ ] `npm install` completed successfully
- [ ] `npx msw init public/` completed
- [ ] `npm run dev` starts server
- [ ] Application opens at http://localhost:3000
- [ ] `npm test` runs without errors
- [ ] `npm run build` completes successfully
- [ ] IDE extensions installed (optional)

---

## Next Steps After Installation

1. **Explore the Code**
   - Start with `src/App.tsx`
   - Check `src/hooks/useTeamMembers.ts` for optimistic UI
   - Look at `src/mocks/handlers.ts` for API mocks

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Read Documentation**
   - `README.md` - Project overview
   - `QUICK_REFERENCE.md` - Common commands
   - `DEVELOPMENT.md` - Development guide

4. **Make Your First Change**
   - Try adding a new field to team members
   - Update the form
   - Add tests
   - See optimistic UI in action

5. **Deploy to Vercel**
   - See `DEPLOYMENT.md` for instructions

---

## Common Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview build

# Testing
npm test                 # Run tests
npm test -- --watch     # Watch mode
npm test -- --coverage  # With coverage

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run type-check       # TypeScript check

# All checks (run before committing)
npm run lint && npm run type-check && npm test
```

---

## Getting Help

If you encounter issues:

1. **Check Documentation**
   - README.md
   - DEVELOPMENT.md
   - TROUBLESHOOTING section above

2. **Check Terminal Output**
   - Look for error messages
   - Check file paths
   - Verify versions

3. **Clear Everything and Retry**
   ```bash
   rm -rf node_modules package-lock.json dist coverage
   npm install
   ```

4. **Check Prerequisites**
   - Verify Node.js version
   - Verify npm version
   - Check disk space

---

## Installation Complete! 🎉

You're all set! Your development environment is ready.

**Start coding:**
```bash
npm run dev
```

Then open http://localhost:3000 and explore! 🚀

---

## What's Next?

✨ **Explore the optimistic UI pattern in action**  
🧪 **Run tests to see TDD approach**  
📚 **Read documentation to understand architecture**  
🚀 **Deploy to Vercel when ready**  

**Happy coding!** 💻
