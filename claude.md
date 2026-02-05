# Claude Development Guide for Girify

This document provides context and best practices for AI assistants (Claude) working on the Girify codebase. Following these guidelines ensures consistency, quality, and efficient collaboration.

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack & Architecture](#tech-stack--architecture)
- [Code Review & Refactoring Standards](#code-review--refactoring-standards)
- [TypeScript Conventions](#typescript-conventions)
- [Key Conventions](#key-conventions)
- [Important Files & Directories](#important-files--directories)
- [Common Patterns](#common-patterns)
- [Development Workflow](#development-workflow)
- [Multi-File Refactoring Checklist](#multi-file-refactoring-checklist)
- [Testing Strategy](#testing-strategy)
- [Deployment & News](#deployment--news)
- [Gotchas & Pitfalls](#gotchas--pitfalls)
- [Best Practices for Claude](#best-practices-for-claude)
  - [Core Behavioral Guidelines](#core-behavioral-guidelines)
  - [Think Before Coding](#1-think-before-coding)
  - [Simplicity First](#2-simplicity-first)
  - [Surgical Changes](#3-surgical-changes)
  - [Goal-Driven Execution](#4-goal-driven-execution)

## Project Overview

**Girify** is a daily geography quiz game focused on Barcelona streets. Users identify street locations on an interactive map, competing for high scores with speed-based scoring.

**Core Features**:

- Daily challenge (same 10 streets for everyone)
- Interactive Leaflet map
- Speed-based scoring (250-1000 points)
- Social features (friends, leaderboards, profiles)
- In-game shop with cosmetics (avatars, frames, titles)
- District-based team system (10 Barcelona districts)
- PWA with offline support

**Current Version**: 0.2.0

## Tech Stack & Architecture

### Frontend

- **React 19** with TypeScript
- **Vite 7** for bundling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router v7** for navigation
- **Leaflet.js** for maps

### Backend & Services

- **Firebase Auth** - User authentication (Google, Email/Password)
- **Supabase** - Primary database (PostgreSQL)
  - User profiles
  - Game results & leaderboards
  - Social data (friends, activity feed)
  - Shop items & cosmetics
- **Upstash Redis** - Session management (optional, has fallback)

### State Management

- **React Context** for global state (auth, theme, game)
- **useReducer** for complex state (game state, shop state)
- Local state with `useState` for simple components

### File Structure

```
src/
├── components/        # Shared UI components
│   └── admin/        # Admin panel components
├── features/         # Feature-based modules (PREFERRED)
│   ├── auth/         # Authentication
│   ├── friends/      # Friend system
│   ├── game/         # Game logic & components
│   ├── leaderboard/  # Rankings
│   ├── profile/      # User profiles
│   └── shop/         # In-game shop
├── context/          # React Context providers
├── data/             # Static data (streets, cosmetics)
├── hooks/            # Shared custom hooks
├── services/         # API & database services
├── types/            # TypeScript definitions
└── utils/            # Utility functions
```

## Code Review & Refactoring Standards

When performing code reviews or refactoring:

1. Group findings by category (rendering, data-fetching, bundle size, type safety)
2. Prioritize by impact: performance > correctness > maintainability > style
3. Always run `tsc --noEmit` after multi-file refactors to catch type errors
4. Run the test suite before and after changes to confirm no regressions

## TypeScript Conventions

- This is a TypeScript-first codebase. Always use TypeScript (.ts/.tsx) for new files.
- Prefer strict typing — avoid `any`. Use `unknown` + type guards when types are uncertain.
- After editing multiple files, run `tsc --noEmit` to verify type correctness.

## Key Conventions

### Code Style

**Read CODING_STANDARDS.md first** - It contains detailed rules. Key points:

1. **Tailwind Only**: No custom CSS unless absolutely necessary
2. **Z-index Scale**: Use 10, 20, 30, 40, 50 (increments of 10)
3. **Spacing**: Use gap-2, gap-4, gap-6 (avoid odd numbers)
4. **Component Props**: Maximum 5 props per component
5. **State Management**: Use `useReducer` for >3 related state values
6. **No Prop Drilling**: Beyond 2 levels, use Context

### Naming Conventions

**Files**:

- Components: `PascalCase.tsx` (e.g., `LoginForm.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`)
- Utils: `camelCase.ts` (e.g., `validation.ts`)
- Types: `types.ts` or `index.types.ts`

**Variables & Functions**:

- `camelCase` for variables and functions
- `PascalCase` for React components
- `UPPER_SNAKE_CASE` for constants

**Database Tables** (Supabase):

- `snake_case` (e.g., `game_results`, `user_cosmetics`)

### Commit Messages

Follow Conventional Commits strictly:

```
type(scope): subject

feat(auth): add password reset flow
fix(shop): prevent duplicate purchases
docs(readme): update installation steps
refactor(game): extract scoring logic to hook
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

**Rules**:

- Subject must be lowercase
- Max 100 characters
- No trailing period
- Use imperative mood

## Important Files & Directories

### Core Configuration

- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind customization
- `.env.template` - Environment variable template
- `eslint.config.js` - Linting rules
- `commitlint.config.js` - Commit message validation

### Key Source Files

**App Entry Points**:

- `src/main.tsx` - React app entry
- `src/App.tsx` - Root component
- `src/AppRoutes.tsx` - Route definitions & redirect logic

**State Management**:

- `src/context/GameContext.tsx` - Global game state
- `src/context/AuthContext.tsx` - Authentication state
- `src/context/ThemeContext.tsx` - Theme (dark/light/auto)

**Game Logic**:

- `src/features/game/hooks/useGameState.ts` - Main game reducer
- `src/features/game/hooks/useGamePersistence.ts` - Score saving
- `src/services/gameService.ts` - Game session management (Redis)
- `src/utils/scoring.ts` - Score calculation

**Database**:

- `src/services/database.ts` - Supabase queries
- `src/utils/supabase.ts` - Supabase client initialization
- `scripts/supabase-schema.sql` - Database schema

**Authentication**:

- `src/features/auth/hooks/useAuth.ts` - Auth logic
- `src/utils/firebase.ts` - Firebase initialization

### Scripts

- `scripts/fetchStreets.js` - Download street data from OpenStreetMap
- `scripts/publishNews.js` - Create news/announcements
- `scripts/fix-supabase-permissions.sql` - Set up RLS policies
- `scripts/seed-test-data.sql` - Test data for development
- `scripts/migrate-*.ts` - Firebase → Supabase migration scripts

## Common Patterns

### 1. Database Queries (Supabase)

Always handle errors and use proper typing:

```typescript
import { supabase } from '@/utils/supabase';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('users').select('*').eq('uid', userId).single();

  if (error) {
    console.error('[DB] Error fetching user:', error);
    return null;
  }

  return data;
}
```

**Key Points**:

- Always destructure `{ data, error }`
- Use `.single()` for one row, omit for multiple
- Add `[DB]` prefix to console logs
- Return `null` or empty array on error (don't throw)

### 2. Game State Updates

Use the reducer pattern from `useGameState`:

```typescript
const { state, dispatch } = useGameState(streets, getHintStreets);

// Correct answer
dispatch({ type: 'ANSWER_CORRECT', payload: { points: 750 } });

// Wrong answer
dispatch({ type: 'ANSWER_WRONG' });

// Move to next question
dispatch({ type: 'NEXT_QUESTION' });
```

**Never** directly mutate `state` - always use `dispatch`.

### 3. Authentication Checks

Use the `useAuth` hook:

```typescript
import { useAuth } from '@/features/auth/hooks/useAuth';

function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <LoginPrompt />;

  return <div>Welcome {user.displayName}</div>;
}
```

### 4. Protected Routes

Check `AppRoutes.tsx` for the pattern:

```typescript
{user ? (
  <Route path="/profile" element={<ProfilePage />} />
) : (
  <Route path="/profile" element={<Navigate to="/" replace />} />
)}
```

### 5. Modal Components

All modals must have:

- Backdrop
- Close button
- ESC key handler
- AnimatePresence wrapper (for animations)

```typescript
<AnimatePresence>
  {showModal && (
    <Modal onClose={() => setShowModal(false)}>
      <Modal.Backdrop onClick={() => setShowModal(false)} />
      <Modal.Content>
        <Modal.CloseButton onClick={() => setShowModal(false)} />
        {/* content */}
      </Modal.Content>
    </Modal>
  )}
</AnimatePresence>
```

### 6. Score Saving Flow

**Current Architecture** (post-migration):

1. Game session created in Redis (optional)
2. On game end, try to save via `gameService.endGame()`
3. If Redis fails or unavailable, fallback to direct Supabase save
4. Check return value to confirm success

```typescript
const result = await endGame(gameId, gameData);

if (!result.success) {
  // Fallback to direct save
  await fallbackSaveScore(gameData);
}
```

### 7. Leaderboard Queries

Use time-based filtering for daily/weekly boards:

```typescript
// Daily: rolling 24 hours
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const { data } = await supabase
  .from('game_results')
  .select('*')
  .gte('played_at', oneDayAgo)
  .order('score', { ascending: false });
```

## Development Workflow

### Starting Work

1. **Always pull latest**:

   ```bash
   git pull origin main
   ```

2. **Check existing issues/branches**:
   - Don't duplicate work
   - Check `CHANGELOG.md` for recent changes

3. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Making Changes

1. **Read relevant docs first**:
   - `CODING_STANDARDS.md` for code style
   - `CONTRIBUTING.md` for contribution process
   - This file (`claude.md`) for context

2. **Follow the pattern**:
   - Find similar existing code
   - Match the style and structure
   - Don't reinvent patterns

3. **Test as you go**:

   ```bash
   npm run dev          # Run dev server
   npm run lint         # Check for errors
   npm run type-check   # TypeScript validation
   npm test             # Run tests
   ```

4. **Commit frequently**:
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

### Before Pushing

1. **Run all checks**:

   ```bash
   npm run lint
   npm run type-check
   npm test -- --run
   npm run format:check
   ```

2. **Build succeeds**:

   ```bash
   npm run build
   ```

3. **Review changes**:
   ```bash
   git diff
   git status
   ```

## Multi-File Refactoring Checklist

When making changes across 3+ files:

1. Read all affected files first before editing any
2. Make changes in dependency order (utils → components → pages)
3. Run type checker after all edits
4. Run tests if available
5. Summarize all changed files at the end

## Testing Strategy

### Unit Tests

Located in `__tests__` directories:

```typescript
// src/utils/__tests__/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { calculateScore } from '../scoring';

describe('calculateScore', () => {
  it('should award 1000 points for < 3s', () => {
    expect(calculateScore(2)).toBe(1000);
  });
});
```

### Component Tests

Use React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoginForm from '../LoginForm';

describe('LoginForm', () => {
  it('should render email input', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
```

### E2E Tests

Playwright tests in `e2e/`:

```bash
npm run test:e2e       # Run E2E tests
npm run test:e2e:ui    # Interactive mode
```

## Deployment & News

### Every Feature Deployment Requires News

**Critical**: After deploying a user-facing feature, create an announcement.

```bash
node scripts/publishNews.js
```

**Required Info**:

- Title: User-friendly description
- Content: 1-3 sentences explaining the change
- Category: `feature`, `bugfix`, `maintenance`, `event`
- Publish date & optional expiry

**Privacy Rule**: Never include:

- Internal implementation details
- Database schemas
- API keys or credentials
- Error messages with stack traces

**Good Example**:

```
Title: "Weekly Leaderboard Reset"
Content: "Weekly leaderboards now reset every Monday at midnight!"
Category: feature
```

**Bad Example**:

```
Title: "Fixed RLS policies in game_results table"
Content: "Updated SQL to handle null values in cosmetics.avatar_url"
Category: bugfix
```

### Deployment Checklist

- [ ] All tests pass
- [ ] Build succeeds
- [ ] No console errors in production build
- [ ] Environment variables set in Vercel
- [ ] Database migrations run (if needed)
- [ ] News announcement created (if user-facing)

## Gotchas & Pitfalls

### 1. Team Selection Modal Loop

**Issue**: Modal can appear repeatedly if username changes during async operations.

**Solution**: Always track the specific username checked, not just a boolean flag.

```typescript
// Bad
const hasChecked = useRef(false);

// Good
const checkedUsername = useRef<string | null>(null);
```

**Fixed in**: `src/AppRoutes.tsx` (commit ccda0ea and later fix)

### 2. Firebase vs Supabase

**Current State**: Migration in progress

- **Authentication**: Still using Firebase Auth
- **Database**: Moved to Supabase
- **User IDs**: Firebase UIDs used as primary keys in Supabase

**Important**:

- User `uid` in Supabase = Firebase Auth `uid`
- Always use Firebase Auth user ID for Supabase queries
- Don't create new Supabase auth users

### 3. Redis Session Optional

**Redis is optional** - app has fallback mechanism:

```typescript
// Always check return value from endGame
const result = await endGame(gameId, data);

if (!result.success) {
  // Fallback saves directly to Supabase
  await fallbackSaveScore(data);
}
```

Don't assume Redis is always available.

### 4. Row Level Security (RLS)

**All Supabase tables have RLS enabled**.

If inserts/updates fail with "permission denied":

1. Check `scripts/fix-supabase-permissions.sql`
2. Verify policies exist for that table
3. Ensure user is authenticated
4. Check that policy matches the operation

### 5. Street Data

**Never manually edit** `src/data/streets.ts`:

- Auto-generated from OpenStreetMap
- Use `npm run fetch-streets` to update
- Coordinates are in GeoJSON format

### 6. Theme Handling

Theme state is in Context + localStorage:

```typescript
// Get current theme
const { theme, setTheme } = useTheme();

// Values: 'light', 'dark', 'auto'
// 'auto' follows system preference
```

Always test in all three theme modes.

### 7. Mobile vs Desktop

**Key Differences**:

- Auth uses popup on mobile (not redirect)
- Map controls positioned differently
- Touch events vs mouse events

Always test on mobile viewport in dev tools.

## Best Practices for Claude

### Core Behavioral Guidelines

These principles help reduce common AI coding mistakes. They bias toward caution over speed - use judgment for trivial tasks.

#### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- **State assumptions explicitly** - If uncertain, ask first
- **Present multiple interpretations** - If ambiguous, don't pick silently
- **Suggest simpler approaches** - Push back when warranted
- **Stop when confused** - Name what's unclear and ask

**Examples:**

✅ Good:

```
"I see two ways to implement this:
1. Add a new field to the existing table (simpler, but denormalizes data)
2. Create a join table (normalized, but adds complexity)

Which approach fits your architecture better?"
```

❌ Bad:

```
"I'll create a new join table for this."
(Silent assumption about architecture preference)
```

#### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

Rules:

- ❌ No features beyond what was asked
- ❌ No abstractions for single-use code
- ❌ No "flexibility" or "configurability" that wasn't requested
- ❌ No error handling for impossible scenarios
- ✅ If it takes 200 lines and could be 50, rewrite it

**Ask yourself:** "Would a senior engineer say this is overcomplicated?" If yes, simplify.

**Examples:**

✅ Good (50 lines):

```typescript
// Direct implementation
function saveGame(username: string, score: number) {
  return supabase.from('game_results').insert({
    user_id: normalizeUsername(username),
    score,
  });
}
```

❌ Bad (200 lines):

```typescript
// Over-engineered with strategy pattern, factory, and config
class GameSaveStrategy {
  constructor(private config: GameSaveConfig) {}
  // ... 150 more lines of abstraction
}
```

#### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- ❌ Don't "improve" adjacent code, comments, or formatting
- ❌ Don't refactor things that aren't broken
- ✅ Match existing style, even if you'd do it differently
- ✅ If you notice dead code, mention it - don't delete it

When your changes create orphans:

- ✅ Remove imports/variables/functions that YOUR changes made unused
- ❌ Don't remove pre-existing dead code unless asked

**The test:** Every changed line should trace directly to the user's request.

**Examples:**

✅ Good:

```diff
// User asked: "Add username validation"
+ function validateUsername(username: string): boolean {
+   return username.length >= 3 && username.length <= 20;
+ }

  function createUser(username: string) {
+   if (!validateUsername(username)) {
+     throw new Error('Invalid username');
+   }
    // existing code unchanged
  }
```

❌ Bad:

```diff
// User asked: "Add username validation"
+ function validateUsername(username: string): boolean {
+   return username.length >= 3 && username.length <= 20;
+ }

- function createUser(username: string) {
+ async function createUser(username: string): Promise<User> {
+   if (!validateUsername(username)) {
+     throw new Error('Invalid username');
+   }
-   const user = { id: generateId(), name: username };
-   users.push(user);
-   return user;
+   // Refactored to use await (not requested!)
+   const user = await db.users.create({ username });
+   return user;
  }
```

#### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

**For multi-step tasks, state a brief plan:**

```
1. Add getUserGameHistory test → verify: test fails as expected
2. Update query to use game_results table → verify: test passes
3. Run full test suite → verify: no regressions
```

Strong success criteria let you work independently. Weak criteria ("make it work") require constant clarification.

**Examples:**

✅ Good:

```
"I'll fix the profile activity bug with these verifiable steps:

1. Add debug logging to identify username format mismatch
   → Verify: Console shows exact username used in save vs query

2. Apply normalizeUsername() to both save points
   → Verify: Console shows consistent format

3. Test that getUserGameHistory returns results
   → Verify: Profile shows recent games

4. Remove debug logging
   → Verify: Clean console in production build

Each step has a clear success check."
```

❌ Bad:

```
"I'll fix the profile activity bug."
(No clear verification steps or success criteria)
```

---

### When Starting a Task

1. **Ask clarifying questions** if requirements are unclear
2. **Check existing code** for similar patterns
3. **Read relevant documentation** before proposing solutions
4. **Search the codebase** to understand current implementation
5. **Consider backwards compatibility** - don't break existing features

### When Writing Code

1. **Match existing patterns** - consistency > cleverness
2. **Add logging** for debugging (use appropriate prefixes like `[DB]`, `[Auth]`, `[Game]`)
3. **Handle errors gracefully** - don't throw, return null/empty
4. **Type everything** - avoid `any` types
5. **Keep functions small** - single responsibility
6. **Comment complex logic** - but prefer self-documenting code

### When Reviewing Changes

1. **Test in dev mode** first
2. **Check console** for errors/warnings
3. **Verify type safety** with `npm run type-check`
4. **Run linter** with `npm run lint`
5. **Check git diff** before committing
6. **Write clear commit messages** following Conventional Commits

### Communication with User

1. **Explain the "why"** not just the "what"
2. **Show file paths** for code locations (e.g., `src/AppRoutes.tsx:253`)
3. **Highlight breaking changes** clearly
4. **Provide migration steps** if needed
5. **Link to relevant docs** when referencing standards

### When Stuck

1. **Search existing issues** in the codebase
2. **Check git history** for related changes
3. **Review recent commits** for context
4. **Ask the user** for clarification
5. **Propose multiple solutions** with tradeoffs

### Red Flags to Watch For

❌ **Don't**:

- Make assumptions about user preferences
- Skip error handling
- Ignore TypeScript errors
- Mix different patterns in same file
- Add dependencies without asking
- Modify build config without reason
- Change database schema without migration plan
- Break existing tests
- Commit commented-out code
- Use `console.log` for production logging

✅ **Do**:

- Ask questions when unclear
- Follow existing patterns
- Add tests for new features
- Handle edge cases
- Update documentation
- Consider performance
- Think about mobile users
- Check accessibility
- Verify browser compatibility
- Clean up temporary code

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix lint errors
npm run type-check       # TypeScript check
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# Testing
npm test                 # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests

# Utilities
npm run fetch-streets    # Update street data from OSM
node scripts/publishNews.js  # Create announcement
```

### Environment Variables

Required in `.env.development`:

```bash
# Firebase (Auth only)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Supabase (Database)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Upstash Redis (Optional)
VITE_UPSTASH_REDIS_REST_URL=
VITE_UPSTASH_REDIS_REST_TOKEN=
```

### Key URLs

- Production: https://girify.vercel.app
- GitHub: https://github.com/robdoesthething/Girify
- Supabase Dashboard: (project-specific)
- Firebase Console: (project-specific)

---

## Summary

This guide should help you work efficiently on Girify. Key principles:

1. **Consistency** - Follow existing patterns
2. **Quality** - Test thoroughly, handle errors
3. **Documentation** - Update docs when needed
4. **Communication** - Ask questions, explain changes
5. **User Focus** - Consider UX in every decision

When in doubt, ask the user or check existing code for similar examples.

---

## Summary: Guidelines in Action

These guidelines are **working** if you see:

✅ **Fewer unnecessary changes** in diffs
✅ **Fewer rewrites** due to overcomplication
✅ **Clarifying questions** before implementation (not after mistakes)
✅ **Focused PRs** where every change traces to the user's request
✅ **Self-verifying code** with clear success criteria

**Remember:**

1. **Think** → Ask questions, surface tradeoffs, state assumptions
2. **Simplify** → Minimum code, no speculation, no premature abstraction
3. **Surgical** → Touch only what's needed, match existing style
4. **Verify** → Define success criteria, test each step

When in doubt: **Ask** > Assume, **Simple** > Clever, **Focused** > Comprehensive

---

**Last Updated**: January 27, 2026
