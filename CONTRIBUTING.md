# Contributing to Girify

Thank you for your interest in contributing to Girify! This guide will help you get started with the development workflow.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Creating a Pull Request](#creating-a-pull-request)
- [Code Review Process](#code-review-process)
- [Testing Requirements](#testing-requirements)
- [Code Style](#code-style)

## Getting Started

### 1. Fork the Repository

1. Visit the [Girify repository](https://github.com/USERNAME/REPO)
2. Click the **Fork** button in the top-right corner
3. This creates a copy of the repository in your GitHub account

### 2. Clone Your Fork

```bash
# Clone your fork to your local machine
git clone https://github.com/YOUR_USERNAME/Girify.git

# Navigate into the project directory
cd Girify

# Add the original repository as "upstream"
git remote add upstream https://github.com/ORIGINAL_OWNER/Girify.git

# Verify remotes
git remote -v
# Should show:
# origin    https://github.com/YOUR_USERNAME/Girify.git (fetch)
# origin    https://github.com/YOUR_USERNAME/Girify.git (push)
# upstream  https://github.com/ORIGINAL_OWNER/Girify.git (fetch)
# upstream  https://github.com/ORIGINAL_OWNER/Girify.git (push)
```

### 3. Install Dependencies

```bash
npm install
```

This will also set up Husky git hooks automatically.

### 4. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app running.

## Development Workflow

### 1. Sync with Upstream

Before starting new work, always sync with the main repository:

```bash
# Switch to main branch
git checkout main

# Fetch latest changes from upstream
git fetch upstream

# Merge upstream changes into your local main
git merge upstream/main

# Push updates to your fork
git push origin main
```

### 2. Create a New Branch

Always create a new branch for your work. **Never commit directly to main.**

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

- Write your code
- Follow the [code style guidelines](#code-style)
- Add tests for new features
- Update documentation if needed

### 4. Test Your Changes

```bash
# Run linter
npm run lint

# Run tests
npm test

# Check formatting
npm run format:check

# Run all checks
npm run lint && npm test && npm run format:check
```

### 5. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a conventional commit message
git commit -m "feat: add new feature"
```

**Note**: Husky will automatically run lint-staged and commitlint on your commit.

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

See [Creating a Pull Request](#creating-a-pull-request) section below.

## Branch Naming Conventions

Use descriptive branch names that follow this pattern:

```
type/short-description
```

### Branch Types

- **feature/** - New features or enhancements

  ```bash
  feature/user-authentication
  feature/dark-mode-toggle
  feature/leaderboard-filters
  ```

- **fix/** - Bug fixes

  ```bash
  fix/login-redirect-bug
  fix/map-rendering-issue
  fix/score-calculation-error
  ```

- **docs/** - Documentation updates

  ```bash
  docs/update-readme
  docs/add-api-documentation
  docs/contributing-guide
  ```

- **refactor/** - Code refactoring (no functionality change)

  ```bash
  refactor/extract-custom-hooks
  refactor/simplify-scoring-logic
  refactor/component-structure
  ```

- **test/** - Adding or updating tests

  ```bash
  test/add-unit-tests
  test/e2e-authentication
  test/scoring-edge-cases
  ```

- **chore/** - Maintenance tasks

  ```bash
  chore/update-dependencies
  chore/setup-prettier
  chore/cleanup-unused-code
  ```

- **ci/** - CI/CD changes
  ```bash
  ci/add-github-actions
  ci/update-workflow
  ci/add-security-checks
  ```

### Examples

```bash
# Good ✅
git checkout -b feature/add-weekly-leaderboard
git checkout -b fix/resolve-map-zoom-bug
git checkout -b docs/update-installation-guide

# Bad ❌
git checkout -b new-feature          # Too vague
git checkout -b fix                  # Missing description
git checkout -b Add-Dark-Mode        # Wrong case
```

## Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code formatting (no logic change)
- `refactor` - Code refactoring
- `test` - Adding/updating tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes
- `perf` - Performance improvements

### Examples

```bash
# Feature
git commit -m "feat: add user profile page"
git commit -m "feat(auth): implement Google login"

# Bug fix
git commit -m "fix: resolve navigation bug on mobile"
git commit -m "fix(map): correct street highlighting"

# Documentation
git commit -m "docs: update README with setup instructions"

# Refactoring
git commit -m "refactor: extract game state to useReducer"

# Tests
git commit -m "test: add unit tests for scoring system"

# Chore
git commit -m "chore: update dependencies"
git commit -m "chore(deps): bump react to v19.2.0"
```

### Rules

- ✅ Use lowercase for type and subject
- ✅ Use present tense ("add" not "added")
- ✅ Use imperative mood ("move" not "moves")
- ✅ Don't end subject with a period
- ✅ Keep subject under 100 characters
- ❌ Don't capitalize the subject

**Note**: Commitlint will automatically validate your commit messages. If your message doesn't follow the format, the commit will be rejected.

For more details, see our [Commitlint Guide](/.gemini/antigravity/brain/.../commitlint_guide.md).

## Creating a Pull Request

### 1. Push Your Branch

```bash
git push origin feature/your-feature-name
```

### 2. Open a Pull Request

1. Go to your fork on GitHub
2. Click **Compare & pull request** button
3. Fill out the PR template:

```markdown
## Description

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (please describe)

## Testing

- [ ] Tests pass locally
- [ ] Added new tests for new features
- [ ] Linter passes
- [ ] Manual testing completed

## Screenshots (if applicable)

Add screenshots for UI changes.

## Related Issues

Closes #123
```

### 3. PR Title

Use the same format as commit messages:

```
feat: add user profile page
fix: resolve map rendering bug
docs: update contributing guide
```

### 4. Wait for Review

- Automated checks will run (tests, linting, security audit)
- A maintainer will review your PR
- Address any feedback or requested changes

## Code Review Process

### What Reviewers Look For

1. **Functionality** - Does it work as intended?
2. **Tests** - Are there tests? Do they pass?
3. **Code Quality** - Is the code clean and maintainable?
4. **Documentation** - Are changes documented?
5. **Style** - Does it follow project conventions?

### Responding to Feedback

1. **Make requested changes**

   ```bash
   # Make your changes
   git add .
   git commit -m "fix: address review feedback"
   git push origin feature/your-feature-name
   ```

2. **Discuss if you disagree**
   - Comment on the PR with your reasoning
   - Be respectful and open to discussion

3. **Mark conversations as resolved**
   - After addressing feedback, mark the conversation as resolved

### Approval and Merge

- Once approved, a maintainer will merge your PR
- Your branch will be deleted automatically
- You can delete your local branch:
  ```bash
  git checkout main
  git branch -d feature/your-feature-name
  ```

## Testing Requirements

All PRs must pass these checks:

### 1. Linting

```bash
npm run lint
```

**Must pass with 0 errors.** Warnings are acceptable but should be minimized.

### 2. Tests

```bash
npm test
```

**All tests must pass.** Add new tests for new features.

### 3. Formatting

```bash
npm run format:check
```

**Code must be formatted with Prettier.** Run `npm run format` to auto-format.

### 4. Security Audit

```bash
npm audit
```

**No high or critical vulnerabilities** are allowed.

### Writing Tests

For new features, add tests in the appropriate `__tests__` directory:

```javascript
// src/utils/__tests__/myFunction.test.js
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  it('should return expected result', () => {
    expect(myFunction(input)).toBe(expectedOutput);
  });
});
```

For components:

```javascript
// src/components/__tests__/MyComponent.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Code Style

### Automated Formatting

We use **Prettier** for code formatting. It runs automatically on commit via Husky.

**Manual formatting**:

```bash
npm run format
```

### Linting

We use **ESLint** with strict rules. It runs automatically on commit.

**Manual linting**:

```bash
npm run lint        # Check for errors
npm run lint:fix    # Auto-fix errors
```

### Best Practices

1. **Use TypeScript-style JSDoc comments**

   ```javascript
   /**
    * Calculate score based on time taken.
    * @param {number} timeInSeconds - Time taken to answer
    * @param {boolean} isCorrect - Whether answer was correct
    * @returns {number} Points earned (0-100)
    */
   function calculateScore(timeInSeconds, isCorrect) {
     // ...
   }
   ```

2. **Add PropTypes to React components**

   ```javascript
   import PropTypes from 'prop-types';

   MyComponent.propTypes = {
     name: PropTypes.string.isRequired,
     age: PropTypes.number,
   };
   ```

3. **Use meaningful variable names**

   ```javascript
   // Good ✅
   const userScore = calculateScore(timeElapsed, isCorrect);

   // Bad ❌
   const x = calc(t, c);
   ```

4. **Keep functions small and focused**
   - One function = one responsibility
   - Extract complex logic into helper functions

5. **Write self-documenting code**
   - Clear variable names
   - Descriptive function names
   - Comments for complex logic only

## Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/USERNAME/REPO/discussions)
- **Bug reports** Open a [GitHub Issue](https://github.com/USERNAME/REPO/issues)
- **Security issues** See [SECURITY.md](SECURITY.md)

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Girify! 🎉
