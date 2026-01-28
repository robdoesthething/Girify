# Testing Coverage & Improvement Recommendations

**Date:** January 27, 2026
**Current Status:** 21 test files, 136 tests passing (1 failing)

---

## Current Testing Coverage

### Test Statistics

**Unit Tests:** 21 test files (136 tests)

- ✅ 135 passing
- ❌ 1 failing (`useGamePersistence` integration test)

**Test Files by Category:**

- Game Logic: 9 files (scoring, daily challenge, game state)
- Shop: 4 files
- Friends: 2 files
- Components: 2 files
- Utils: 7 files
- API: 1 file (admin promotion)

**E2E Tests:** 0 files

- ❌ No Playwright tests found (despite configuration)

**Coverage Metrics (Estimated):**

- **Total Source Files:** 233 TypeScript files
- **Files with Tests:** ~20 files
- **Estimated Coverage:** ~8-12% of files
- **Critical Path Coverage:** ~40% (game logic, scoring)

---

## Coverage Gaps (HIGH Priority) 🔴

### 1. **Database Layer - 0% Coverage**

**Impact:** CRITICAL - All data persistence untested

**Files Affected:**

```
services/db/
├── games.ts          ❌ 0 tests (getUserGameHistory, getLeaderboardScores)
├── users.ts          ❌ 0 tests (createUser, getUserByUsername)
├── friends.ts        ❌ 0 tests (addFriendship, getFriends)
├── activity.ts       ❌ 0 tests (getActivityFeed, publishActivity)
├── shop.ts           ❌ 0 tests (getShopItems, createShopItem)
├── quests.ts         ❌ 0 tests
├── announcements.ts  ❌ 0 tests
├── feedback.ts       ❌ 0 tests
├── blocks.ts         ❌ 0 tests
└── (9 more files)    ❌ 0 tests
```

**Why This Matters:**

- Profile activity bug was caused by query mismatch (not caught by tests!)
- Leaderboard timezone bugs weren't caught
- Username normalization issues

**Recommended Tests:**

```typescript
// src/services/db/__tests__/games.test.ts
describe('getUserGameHistory', () => {
  it('should normalize username before querying', async () => {
    // Mock Supabase
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      }),
    };

    await getUserGameHistory('@TestUser');

    // Verify username was normalized to lowercase without @
    expect(mockSupabase.from).toHaveBeenCalledWith('game_results');
    expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('user_id', 'testuser');
  });

  it('should return empty array on error', async () => {
    // Test error handling
  });

  it('should order by played_at DESC', async () => {
    // Verify query construction
  });
});
```

**Effort:** 3 days (cover all 12 database modules)

---

### 2. **Custom Hooks - 45% Coverage**

**Files Affected:** 20 hooks, only 9 tested

**Untested Critical Hooks:**

```
features/auth/hooks/
├── useAuth.ts              ❌ 0 tests (CRITICAL - authentication!)
└── useAuthHandlers.ts      ❌ 0 tests

features/profile/hooks/
├── useProfileData.ts       ❌ 0 tests (profile bug source)
└── usePublicProfile.ts     ❌ 0 tests

features/friends/hooks/
└── useFriends.ts          ✅ Tested (but has known issues)

features/leaderboard/hooks/
└── (no test directory)     ❌ 0 tests

hooks/
├── useAnnouncements.ts     ❌ 0 tests
├── useNotifications.ts     ❌ 0 tests
├── useAuthRedirect.ts      ❌ 0 tests
└── (7 more)                ❌ 0 tests
```

**Recommended Test:**

```typescript
// src/features/profile/hooks/__tests__/useProfileData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useProfileData } from '../useProfileData';

describe('useProfileData', () => {
  it('should fetch profile and game history', async () => {
    const { result } = renderHook(() => useProfileData('testuser'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profileData).toBeDefined();
    expect(result.current.allHistory).toBeInstanceOf(Array);
  });

  it('should normalize username before querying', async () => {
    const { result } = renderHook(() => useProfileData('@TestUser'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have queried with normalized username
    expect(mockGetUserGameHistory).toHaveBeenCalledWith('testuser');
  });
});
```

**Effort:** 2 days

---

### 3. **Integration Tests - Missing**

**Current:** Only 3 integration tests (shop, summary, friends)

**Missing Critical Flows:**

1. **Complete Game Flow** ❌

   ```
   Start Game → Play Questions → Save Results → Show in Profile
   ```

2. **Authentication Flow** ❌

   ```
   Register → Login → Profile Creation → District Selection
   ```

3. **Social Flow** ❌

   ```
   Send Friend Request → Accept → See Activity Feed
   ```

4. **Leaderboard Flow** ❌
   ```
   Play Game → Update Leaderboard → Filter by Period
   ```

**Recommended Test:**

```typescript
// src/features/game/__tests__/completeGameFlow.integration.test.ts
describe('Complete Game Flow', () => {
  it('should save game and display in profile', async () => {
    // 1. Mock user authentication
    mockAuth({ username: 'testuser' });

    // 2. Start game
    const { result: gameResult } = renderHook(() => useGameState(streets));
    act(() => gameResult.current.setupGame());

    // 3. Play through questions
    for (let i = 0; i < 10; i++) {
      act(() => gameResult.current.handleSelectAnswer(correctStreet));
      await waitFor(() => expect(gameResult.current.state.feedback).toBe('correct'));
      act(() => gameResult.current.handleNext());
    }

    // 4. Verify save was called
    expect(mockSaveGameResult).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'testuser' })
    );

    // 5. Load profile and verify game appears
    const { result: profileResult } = renderHook(() => useProfileData('testuser'));
    await waitFor(() => {
      expect(profileResult.current.allHistory).toHaveLength(1);
    });
  });
});
```

**Effort:** 1 week

---

### 4. **E2E Tests - 0% Coverage** 🚨

**Current:** Playwright configured but NO tests

**Critical User Journeys to Test:**

1. **New User Onboarding** ❌
   - Register → Select District → Play First Game → See Tutorial

2. **Daily Game** ❌
   - Login → Play Daily Challenge → See Score → View Leaderboard

3. **Social Features** ❌
   - Add Friend → See Activity → View Friend Profile

4. **Shop & Cosmetics** ❌
   - Earn Giuros → Purchase Item → Equip → See in Profile

5. **Admin Panel** ❌
   - Login as Admin → Create Quest → Approve Feedback → Manage Users

**Recommended E2E Test:**

```typescript
// e2e/dailyGame.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Daily Game Flow', () => {
  test('should complete daily game and see score on leaderboard', async ({ page }) => {
    // 1. Login
    await page.goto('/');
    await page.click('text=Login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button:has-text("Sign In")');

    // 2. Wait for game to load
    await expect(page.locator('text=Question 1/10')).toBeVisible();

    // 3. Play game (select answers)
    for (let i = 0; i < 10; i++) {
      await page.click('.street-option:first-child'); // Click first option
      await page.click('button:has-text("Next")');
    }

    // 4. Verify summary screen
    await expect(page.locator('text=Game Complete')).toBeVisible();
    const score = await page.locator('.final-score').textContent();

    // 5. Navigate to leaderboard
    await page.click('text=Leaderboard');

    // 6. Verify score appears
    await expect(page.locator(`text=${score}`)).toBeVisible();
  });
});
```

**Effort:** 1 week (create 15-20 E2E tests)

---

## Testing Infrastructure Improvements

### 1. **Add Test Coverage Reporting** (30 min)

**Current:** Coverage configured but not tracked

**Update:**

```json
// package.json
{
  "scripts": {
    "test:coverage": "vitest --coverage",
    "test:coverage:report": "vitest --coverage && open coverage/index.html"
  }
}
```

**Add CI check:**

```yaml
# .github/workflows/test.yml
- name: Check Coverage Threshold
  run: |
    npm run test:coverage -- --coverage.thresholds.lines=60
```

**Set Incremental Targets:**

- Month 1: 60% coverage
- Month 2: 70% coverage
- Month 3: 80% coverage

---

### 2. **Add Visual Regression Testing** (2h)

**Install Playwright Visual Testing:**

```bash
npm install -D @playwright/test
```

**Create Visual Tests:**

```typescript
// e2e/visual/profileScreen.spec.ts
import { test, expect } from '@playwright/test';

test('profile screen should match snapshot', async ({ page }) => {
  await page.goto('/profile');
  await expect(page).toHaveScreenshot('profile-desktop.png');
});

test('profile screen mobile should match snapshot', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/profile');
  await expect(page).toHaveScreenshot('profile-mobile.png');
});
```

---

### 3. **Add Performance Testing** (1h)

**Install Lighthouse CI:**

```bash
npm install -D @lhci/cli
```

**Configuration:**

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
  },
};
```

**Add to CI:**

```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse
  run: |
    npm run build
    npm run preview &
    npx lhci autorun
```

---

### 4. **Add Accessibility Testing** (1h)

**Install axe-core:**

```bash
npm install -D @axe-core/playwright
```

**Create Accessibility Tests:**

```typescript
// e2e/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test('game screen should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab'); // Should focus on first interactive element
    await page.keyboard.press('Enter'); // Should activate

    // Verify game can be played with keyboard
  });
});
```

---

### 5. **Add Mutation Testing** (Advanced - 2h)

**Install Stryker:**

```bash
npm install -D @stryker-mutator/core @stryker-mutator/vitest-runner
```

**Configuration:**

```javascript
// stryker.config.mjs
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  mutate: ['src/utils/scoring.ts', 'src/utils/social/leaderboard.ts', 'src/services/db/games.ts'],
};
```

**What it does:**

- Introduces bugs into your code
- Verifies tests catch them
- Measures test quality (not just coverage)

---

## Other Improvements Beyond Testing

### A. Security Improvements 🔒

#### 1. **Add Security Headers** (30 min)

**Create `vercel.json`:**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
        }
      ]
    }
  ]
}
```

#### 2. **Add Dependency Scanning** (15 min)

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Check for known vulnerabilities
        run: npx snyk test
```

#### 3. **Add Rate Limiting to API** (1h)

**Already done for admin API!** ✅ Extend to other endpoints:

```typescript
// api/_lib/apiRateLimit.ts
export const createRateLimiter = (options: { maxRequests: number; windowMs: number }) => {
  // Reuse existing rate-limit.ts logic
};

// Usage in all API endpoints
const limiter = createRateLimiter({ maxRequests: 100, windowMs: 60000 });
```

---

### B. Performance Improvements 🚀

#### 1. **Code Splitting** (2h)

**Current:** Huge bundle (920 KB index.js)

**Implement Route-Based Splitting:**

```typescript
// src/AppRoutes.tsx
import { lazy, Suspense } from 'react';

const GameScreen = lazy(() => import('./features/game/components/GameScreen'));
const ProfileScreen = lazy(() => import('./features/profile/components/ProfileScreen'));
const ShopScreen = lazy(() => import('./features/shop/components/ShopScreen'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));

// Wrap routes in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/game" element={<GameScreen />} />
</Suspense>
```

**Expected Result:**

- Initial bundle: 300-400 KB (down from 920 KB)
- Faster initial load time
- Lazy load admin panel (most users never access it)

#### 2. **Image Optimization** (1h)

```typescript
// vite.config.ts
import imagemin from 'vite-plugin-imagemin';

export default {
  plugins: [
    imagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: true },
        ],
      },
    }),
  ],
};
```

#### 3. **Add Service Worker Caching Strategy** (1h)

**Current:** PWA basic caching

**Improve with Workbox:**

```javascript
// vite.config.ts - PWA plugin
VitePWA({
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
});
```

---

### C. Developer Experience Improvements 🛠️

#### 1. **Add Pre-commit Hooks** (15 min)

```bash
npm install -D husky lint-staged
npx husky install
```

```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write", "vitest related --run"]
  }
}
```

#### 2. **Add Commit Message Linting** (10 min)

**Already configured!** ✅ (`commitlint.config.js` exists)

Verify it's in use:

```bash
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit ${1}'
```

#### 3. **Add VS Code Workspace Settings** (5 min)

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "testing.automaticallyOpenPeekView": "failureInVisibleDocument"
}
```

#### 4. **Add VS Code Recommended Extensions** (5 min)

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "vitest.explorer",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright"
  ]
}
```

---

### D. Monitoring & Observability 📊

#### 1. **Add Error Tracking** (30 min)

**Sentry already configured!** ✅

**Enhance with:**

```typescript
// src/utils/monitoring.ts
export const trackUserAction = (action: string, metadata?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    category: 'user-action',
    message: action,
    data: metadata,
    level: 'info',
  });
};

// Usage
trackUserAction('game-completed', { score: 7500, time: 245 });
```

#### 2. **Add Analytics** (1h)

```typescript
// src/utils/analytics.ts
export const analytics = {
  trackEvent: (event: string, properties?: Record<string, any>) => {
    // Google Analytics 4
    if (window.gtag) {
      window.gtag('event', event, properties);
    }

    // Plausible (privacy-friendly alternative)
    if (window.plausible) {
      window.plausible(event, { props: properties });
    }
  },

  trackPageView: (path: string) => {
    analytics.trackEvent('pageview', { page: path });
  },
};

// Usage in components
useEffect(() => {
  analytics.trackPageView(location.pathname);
}, [location]);
```

#### 3. **Add Performance Monitoring** (1h)

```typescript
// src/utils/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-measure`;

  performance.mark(startMark);
  fn();
  performance.mark(endMark);

  performance.measure(measureName, startMark, endMark);

  const measure = performance.getEntriesByName(measureName)[0];

  // Send to analytics
  analytics.trackEvent('performance', {
    name,
    duration: measure.duration,
  });
};

// Usage
measurePerformance('game-load', () => {
  loadGame();
});
```

---

### E. Documentation Improvements 📚

#### 1. **Add Storybook** (2h)

```bash
npx storybook@latest init
```

**Create stories for components:**

```typescript
// src/components/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    label: 'Click Me',
    variant: 'primary',
  },
};
```

#### 2. **Add API Documentation** (1h)

**Create `docs/API.md`:**

````markdown
# API Documentation

## Admin Promotion

**Endpoint:** `POST /api/admin/promote`

**Authentication:** Firebase ID Token

**Request:**

```json
{
  "adminKey": "string",
  "username": "string"
}
```
````

**Response:**

```json
{
  "success": true,
  "uid": "firebase-uid"
}
```

**Rate Limit:** 5 requests per 15 minutes per user+IP

````

#### 3. **Add Architecture Decision Records** (30 min)

```markdown
# ADR 001: Use Supabase for Database

## Context
Need a database solution for user data, leaderboards, and social features.

## Decision
Use Supabase (PostgreSQL) instead of Firebase Firestore.

## Consequences
**Positive:**
- SQL queries for complex leaderboards
- Row Level Security
- Better performance

**Negative:**
- Migration from Firebase required
- Learning curve for PostgreSQL
````

---

## Implementation Roadmap

### Week 1: Critical Testing (HIGH Priority)

- [ ] Fix failing test (`useGamePersistence`)
- [ ] Add database layer tests (12 modules)
- [ ] Add `useAuth` hook tests
- [ ] Add `useProfileData` hook tests
- [ ] **Expected Coverage:** 30%

### Week 2: Integration & E2E

- [ ] Create 5 integration tests (game flow, auth flow, etc.)
- [ ] Set up Playwright E2E tests
- [ ] Create 10 critical user journey tests
- [ ] **Expected Coverage:** 50%

### Week 3: Infrastructure

- [ ] Set up coverage reporting + CI checks
- [ ] Add visual regression tests
- [ ] Add performance testing (Lighthouse CI)
- [ ] Add accessibility tests
- [ ] **Expected Coverage:** 65%

### Week 4: Security & Performance

- [ ] Add security headers
- [ ] Implement code splitting
- [ ] Add rate limiting to all APIs
- [ ] Set up dependency scanning
- [ ] **Expected Coverage:** 70%

### Week 5: Developer Experience

- [ ] Set up pre-commit hooks
- [ ] Add Storybook
- [ ] Create API documentation
- [ ] Add monitoring dashboards
- [ ] **Expected Coverage:** 75%

### Week 6: Polish & Documentation

- [ ] Add mutation testing for critical paths
- [ ] Complete remaining tests
- [ ] Write architecture docs
- [ ] Create testing guide for contributors
- [ ] **Expected Coverage:** 80%+

---

## Success Metrics

### Code Quality

- [ ] Test coverage: 80%+
- [ ] Mutation score: 70%+
- [ ] 0 high-severity vulnerabilities
- [ ] Lighthouse performance score: 90+

### Developer Experience

- [ ] Tests run in < 30 seconds
- [ ] CI pipeline < 5 minutes
- [ ] Pre-commit hooks < 10 seconds
- [ ] 100% of PRs have passing tests

### Production Quality

- [ ] 0 Sentry errors related to tested code
- [ ] 99.9% uptime
- [ ] < 2s average page load
- [ ] WCAG 2.1 AA compliance

---

## Quick Wins (Start Today)

### 1. Fix Failing Test (30 min) ⚡

```bash
# The useGamePersistence test is failing
# Fix the mock setup and get to 100% passing
npm run test -- useGamePersistence.test.ts
```

### 2. Add Coverage Reporting (15 min) ⚡

```bash
npm run test:coverage
open coverage/index.html
```

### 3. Create First E2E Test (1h) ⚡

```typescript
// e2e/smoke.spec.ts - Basic smoke test
test('app loads successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

### 4. Add Security Headers (30 min) ⚡

Update `vercel.json` with security headers (see above)

### 5. Set Up Pre-commit Hooks (15 min) ⚡

```bash
npx husky install
npx husky add .husky/pre-commit "npm run lint && npm test -- --run"
```

---

## Resources & Tools

### Testing

- **Vitest:** https://vitest.dev
- **Playwright:** https://playwright.dev
- **Testing Library:** https://testing-library.com
- **Stryker (Mutation):** https://stryker-mutator.io

### Performance

- **Lighthouse CI:** https://github.com/GoogleChrome/lighthouse-ci
- **Web Vitals:** https://web.dev/vitals/

### Security

- **Snyk:** https://snyk.io
- **npm audit:** Built-in
- **OWASP:** https://owasp.org/www-project-top-ten/

### Monitoring

- **Sentry:** https://sentry.io
- **Plausible:** https://plausible.io (privacy-friendly analytics)

---

**Document Version:** 1.0
**Last Updated:** January 27, 2026
**Next Review:** February 27, 2026
