## Development Setup

### Quick Start

```bash
# Install dependencies
npm install

# Initialize MSW for API mocking
npx msw init public/ --save

# Start development server
npm run dev
```

### Environment Setup

No environment variables are required for local development. MSW handles all API mocking automatically.

### IDE Configuration

#### VS Code (Recommended)

Install these extensions:
- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)

#### Settings

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Testing Strategy

### Unit Tests
- Domain models (`src/models/`)
- Services (`src/services/`)
- Custom hooks (`src/hooks/`)

### Integration Tests
- Components with hooks (`src/components/`)
- State management flows

### Test Structure

```typescript
describe('FeatureName', () => {
  describe('SubFeature', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Architecture Decisions

### Why Zustand over Redux?
- Simpler API with less boilerplate
- Better TypeScript support
- Smaller bundle size
- Easier to test

### Why MSW?
- Works in both browser and Node.js (tests)
- Intercepts requests at network level
- Realistic API simulation
- No need to mock fetch or axios

### Why Domain Models?
- Encapsulates business logic
- Easier to test in isolation
- Reusable across different UI implementations
- Enforces data validation

## Common Tasks

### Adding a New Feature

1. **Write Domain Model Test**
   ```bash
   touch src/models/__tests__/NewFeatureModel.test.ts
   ```

2. **Implement Domain Model**
   ```bash
   touch src/models/NewFeatureModel.ts
   ```

3. **Add Service Layer**
   ```bash
   touch src/services/newFeatureService.ts
   touch src/services/__tests__/newFeatureService.test.ts
   ```

4. **Create Custom Hook**
   ```bash
   touch src/hooks/useNewFeature.ts
   touch src/hooks/__tests__/useNewFeature.test.ts
   ```

5. **Build UI Component**
   ```bash
   touch src/components/NewFeature.tsx
   touch src/components/__tests__/NewFeature.test.tsx
   ```

### Debugging Tests

```bash
# Run specific test file
npm test -- TeamMemberModel.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create"

# Debug with Chrome DevTools
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Performance Optimization

1. **Code Splitting**
   - Components lazy loaded where appropriate
   - Routes split into separate chunks

2. **Bundle Analysis**
   ```bash
   npm run build
   npx vite-bundle-visualizer
   ```

3. **Lighthouse Audit**
   - Run in Chrome DevTools
   - Target: Performance score > 90

## Deployment Checklist

- [ ] All tests passing
- [ ] Linter has no errors
- [ ] TypeScript compilation successful
- [ ] Bundle size within limits
- [ ] Performance metrics acceptable
- [ ] Vercel secrets configured
- [ ] CI/CD pipeline green

## Troubleshooting

### MSW Not Working

```bash
# Reinitialize MSW
rm -rf public/mockServiceWorker.js
npx msw init public/ --save
```

### Tests Failing

```bash
# Clear Jest cache
npm test -- --clearCache

# Update snapshots
npm test -- -u
```

### Build Errors

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

### TypeScript Errors

```bash
# Regenerate types
npm run type-check

# Check specific file
npx tsc --noEmit src/path/to/file.ts
```

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Guide](https://docs.pmnd.rs/zustand)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vercel Documentation](https://vercel.com/docs)
