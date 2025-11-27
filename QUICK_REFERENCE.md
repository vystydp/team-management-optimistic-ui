# Quick Reference Guide

## 🚀 Quick Start

```bash
# One-line setup
npm install && npx msw init public/ --save && npm run dev
```

## 📝 Common Commands

### Development
```bash
npm run dev          # Start at localhost:3000
npm run build        # Production build
npm run preview      # Preview build
```

### Testing
```bash
npm test            # Run all tests
npm test -- --watch # Watch mode
npm test -- ComponentName  # Specific test
```

### Code Quality
```bash
npm run lint        # Check code
npm run format      # Format code
npm run type-check  # TypeScript check
```

## 🏗️ Architecture Quick Reference

### Request Flow
```
User Action → Component → Hook → Store → Service → MSW/API
                                    ↓
                              Optimistic Update
                                    ↓
                              Success/Rollback
```

### Folder Purpose
- `components/` - UI presentation
- `hooks/` - React hooks & logic
- `models/` - Business rules
- `services/` - API calls
- `stores/` - Global state
- `mocks/` - API mocking
- `types/` - TypeScript definitions

## 🎯 Optimistic UI Pattern

### When to Use
✅ User actions (create, update, delete)  
✅ Status toggles  
✅ Quick operations  
❌ Financial transactions  
❌ Critical operations  

### How It Works
1. **Update UI immediately** (optimistic state)
2. **Call API in background**
3. **On Success**: Keep changes
4. **On Failure**: Revert changes

### Visual Indicators
- Yellow border = Pending
- "Pending..." badge = In progress
- Disabled buttons = Processing

## 🧪 Testing Pattern

### Structure
```typescript
describe('Feature', () => {
  describe('SubFeature', () => {
    it('should do something', () => {
      // Arrange
      const data = createTestData();
      
      // Act
      const result = functionUnderTest(data);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Test Types
- **Unit**: Models, services, hooks
- **Integration**: Components + hooks
- **E2E**: Full user flows (optional)

## 🔧 Key Files

### Configuration
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript
- `vite.config.ts` - Build
- `jest.config.js` - Tests
- `vercel.json` - Deployment

### Source
- `App.tsx` - Main component
- `main.tsx` - Entry point
- `stores/teamStore.ts` - State
- `hooks/useTeamMembers.ts` - Logic

## 📊 State Management

### Zustand Store
```typescript
// Get state
const members = useTeamStore(state => state.members);

// Get action
const addMember = useTeamStore(state => state.addMemberOptimistic);

// Call action
const updateId = addMember(newMember);
```

### Optimistic Pattern
```typescript
// 1. Apply optimistic update
const updateId = addMemberOptimistic(data);

// 2. Try API call
try {
  const result = await api.create(data);
  commitOptimistic(updateId, result);
} catch (error) {
  rollbackOptimistic(updateId);
}
```

## 🎨 Component Pattern

```typescript
// Presentational Component
export const MyComponent: React.FC<Props> = ({ 
  data, 
  onAction 
}) => {
  return (
    <div>
      {/* UI here */}
      <button onClick={() => onAction(data)}>
        Action
      </button>
    </div>
  );
};

// Container (in parent)
function Parent() {
  const { items, updateItem } = useMyHook();
  
  return (
    <MyComponent 
      data={items} 
      onAction={updateItem} 
    />
  );
}
```

## 🌐 MSW Configuration

### Adding New Endpoint
```typescript
// src/mocks/handlers.ts
export const handlers = [
  http.get('/api/new-endpoint', async () => {
    await delay(800); // Simulate network
    return HttpResponse.json(data);
  }),
];
```

### Simulating Errors
```typescript
http.post('/api/endpoint', async () => {
  if (Math.random() < 0.05) {
    return HttpResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
  return HttpResponse.json(data);
});
```

## 🚢 Deployment

### Vercel CLI
```bash
vercel          # Preview
vercel --prod   # Production
```

### Via GitHub
```bash
git push origin main  # Auto-deploy to prod
```

### Required Secrets
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 🐛 Debug Helpers

### Check Tests
```bash
npm test -- --verbose
npm test -- --coverage
```

### Check Types
```bash
npx tsc --noEmit
```

### Check Bundle
```bash
npm run build
npx vite-bundle-visualizer
```

### Clear Caches
```bash
rm -rf node_modules dist coverage
npm install
```

## 💡 Tips & Tricks

### Hot Reload Not Working?
```bash
# Restart dev server
npm run dev
```

### Test Failures After Changes?
```bash
# Clear Jest cache
npm test -- --clearCache
```

### Type Errors?
```bash
# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "Restart TS Server"
```

### Slow Build?
```bash
# Clear dist and rebuild
rm -rf dist
npm run build
```

## 📚 Documentation Map

- **README.md** - Project overview
- **SETUP_COMPLETE.md** - What's been built
- **DEVELOPMENT.md** - Dev guidelines
- **DEPLOYMENT.md** - Deploy instructions
- **CONTRIBUTING.md** - How to contribute
- **QUICK_REFERENCE.md** - This file

## 🔗 Useful Links

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://typescriptlang.org/docs)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [MSW Docs](https://mswjs.io)
- [Testing Library](https://testing-library.com)
- [Vite Guide](https://vitejs.dev)
- [Vercel Docs](https://vercel.com/docs)

## ⚡ Performance

### Optimization Checklist
- [ ] Code splitting implemented
- [ ] Images optimized
- [ ] Bundle size checked
- [ ] Lighthouse score > 90
- [ ] No unnecessary re-renders

### Monitoring
```bash
# Bundle analysis
npm run build
npx vite-bundle-visualizer
```

## 🔐 Security

### Best Practices
- ✅ Input validation
- ✅ Type safety
- ✅ Security headers
- ✅ HTTPS only
- ✅ No secrets in code

## 📈 Next Steps

1. ✅ Install dependencies
2. ✅ Run dev server
3. ✅ Explore code
4. ✅ Run tests
5. ✅ Make changes
6. ✅ Deploy to Vercel

---

**Need help?** Check other documentation files or open an issue!
