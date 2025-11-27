# Contributing to Team Management - Optimistic UI

Thank you for your interest in contributing! This document provides guidelines and best practices.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Follow project standards

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/team-management-optimistic-ui.git
   ```
3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Before Writing Code

- Check existing issues and PRs
- Discuss significant changes in an issue first
- Follow Test-Driven Development (TDD)

### 2. Writing Code

#### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier rules
- Write meaningful variable and function names
- Add comments for complex logic

#### Testing

- Write tests BEFORE implementation
- Aim for >70% code coverage
- Test edge cases and error scenarios
- Use descriptive test names

```typescript
// ✅ Good
it('should rollback optimistic update when API call fails', () => {
  // ...
});

// ❌ Bad
it('test rollback', () => {
  // ...
});
```

#### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add team member filtering
fix: resolve optimistic rollback issue
docs: update README with deployment steps
test: add tests for useOptimistic hook
refactor: simplify store logic
style: format code with prettier
chore: update dependencies
```

### 3. Submitting Changes

1. **Run all checks**
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

2. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Use a clear title
   - Describe changes in detail
   - Link related issues
   - Add screenshots for UI changes

## Pull Request Guidelines

### PR Title

Follow conventional commits format:
```
feat: add team member export functionality
fix: resolve race condition in optimistic updates
docs: improve API documentation
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
```

### Review Process

- All PRs require at least one approval
- CI/CD must pass
- Code coverage must not decrease
- No merge conflicts

## Project Structure Guidelines

### Adding New Features

1. **Domain Model** (`src/models/`)
   - Business logic and validation
   - Comprehensive unit tests

2. **Service** (`src/services/`)
   - API communication
   - Error handling

3. **Custom Hook** (`src/hooks/`)
   - State management
   - Side effects

4. **Component** (`src/components/`)
   - Presentational logic
   - User interactions

5. **MSW Handler** (`src/mocks/handlers.ts`)
   - Mock API endpoints
   - Realistic responses

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (prefixed with `use`)
- Models: `PascalCase.ts`
- Services: `camelCase.ts` (suffixed with `Service`)
- Tests: `*.test.ts` or `*.test.tsx`

## Testing Guidelines

### Unit Tests

Test individual functions and methods:

```typescript
describe('TeamMemberModel', () => {
  describe('validate', () => {
    it('should throw error for empty name', () => {
      expect(() => new TeamMemberModel({ name: '' }))
        .toThrow('Name is required');
    });
  });
});
```

### Integration Tests

Test component interactions:

```typescript
describe('TeamMemberForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<TeamMemberForm onSubmit={onSubmit} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'John Doe' }
    });
    
    // Submit
    fireEvent.click(screen.getByText('Submit'));
    
    // Assert
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'John Doe' })
      );
    });
  });
});
```

## Documentation

### Code Comments

- Document complex algorithms
- Explain "why" not "what"
- Use JSDoc for public APIs

```typescript
/**
 * Creates an optimistic update with rollback capability
 * @param type - The type of operation (create, update, delete)
 * @param data - The optimistic data
 * @param rollbackData - Original data for rollback
 * @returns OptimisticUpdateModel instance
 */
static create<T>(
  type: 'create' | 'update' | 'delete',
  data: T,
  rollbackData?: T
): OptimisticUpdateModel<T>
```

### README Updates

- Keep README.md current
- Update examples when APIs change
- Add new features to feature list

## Performance Considerations

- Avoid unnecessary re-renders
- Memoize expensive computations
- Use appropriate React hooks
- Optimize bundle size

## Accessibility

- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation
- Test with screen readers

## Security

- Validate all inputs
- Sanitize user data
- Follow OWASP guidelines
- Report security issues privately

## Questions?

- Open an issue for discussion
- Join community discussions
- Check existing documentation

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Mentioned in project updates

Thank you for contributing! 🎉
