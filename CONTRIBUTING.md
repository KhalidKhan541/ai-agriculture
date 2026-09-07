# Contributing to AI Agriculture Platform

Thank you for your interest in contributing! This document provides guidelines and information about contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers feel welcome
- No harassment or discrimination

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/ai-agriculture.git
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Set up environment:
   ```bash
   cp .env.example .env
   ```

## Development Process

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### Local Development

1. Start development server:
   ```bash
   npm run dev
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Run linter:
   ```bash
   npm run lint
   ```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## Coding Standards

### TypeScript

- Use strict TypeScript
- Define proper types/interfaces
- Avoid `any` when possible
- Use meaningful variable names

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Follow naming conventions

### File Structure

```
src/
├── components/     # React components
├── pages/         # Next.js pages
├── services/      # Business logic
├── dto/           # Data transfer objects
├── lib/           # Utilities
└── types/         # TypeScript types
```

### Naming Conventions

- Components: PascalCase (`CropCard.tsx`)
- Utils: camelCase (`formatDate.ts`)
- Types: PascalCase (`Farm.ts`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

## Testing Guidelines

### Unit Tests

- Test individual functions/methods
- Mock external dependencies
- Aim for 80%+ coverage

### Integration Tests

- Test API endpoints
- Test service interactions
- Use test database

### E2E Tests

- Test critical user flows
- Use Cypress or Playwright
- Run before releases

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Examples

```
feat(crops): add yield prediction endpoint

- Implemented ML-based yield prediction
- Added confidence interval calculations
- Updated API documentation

Closes #123
```

```
fix(soil): correct pH validation range

Fixed validation to accept pH values between 0 and 14.

Fixes #456
```

## Issue Reporting

### Bug Reports

```markdown
**Describe the bug**
Clear description of the issue

**To reproduce**
Steps to reproduce the behavior

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 90]
- Node.js: [e.g., 20.0.0]
```

### Feature Requests

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution**
Proposed solution

**Alternatives considered**
Other solutions considered

**Additional context**
Any other information
```

## Questions?

- Open a discussion on GitHub
- Join our Discord community
- Email: contribute@agriculture-app.com

Thank you for contributing!
