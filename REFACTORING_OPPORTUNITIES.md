# Refactoring Opportunities Analysis

**Date:** January 27, 2026
**Scope:** Codebase-wide analysis focusing on recently modified areas

---

## Executive Summary

**Found:** 9 major refactoring categories with 24 specific opportunities
**Estimated Total Effort:** ~16 hours
**Priority Distribution:**

- 🔴 HIGH: 7 items (8 hours)
- 🟡 MEDIUM: 11 items (6 hours)
- 🟢 LOW: 6 items (2 hours)

**Potential Benefits:**

- Reduce bundle size by ~5-10 KB
- Eliminate 150+ lines of duplicated code
- Improve type safety (eliminate 50+ "as any")
- Standardize error handling across 60+ functions
- Better debugging/logging infrastructure

---

## Category 1: Date/Time Utilities (HIGH Priority) 🔴

### Issue: Duplicated UTC Date Calculation Logic

**Files Affected:** 2
**Lines of Duplication:** ~60 lines
**Effort:** 90 minutes

**Current State:**

Identical date calculation logic duplicated in:

1. `src/utils/social/leaderboard.ts:72-107`
2. `src/services/db/games.ts:24-51`

```typescript
// DUPLICATED 2x - Daily
const startOfDay = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
).toISOString();

// DUPLICATED 2x - Weekly
const currentDayUTC = now.getUTCDay();
const distanceToMonday = currentDayUTC === 0 ? 6 : currentDayUTC - 1;
const startOfWeek = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - distanceToMonday, 0, 0, 0, 0)
).toISOString();

// DUPLICATED 2x - Monthly
const startOfMonth = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
).toISOString();
```

**Proposed Solution:**

Create `src/utils/dateUtils.ts`:

```typescript
export type TimePeriod = 'all' | 'daily' | 'weekly' | 'monthly';

/**
 * Get the start of a time period in UTC
 * @param period - The time period to calculate
 * @param now - Optional date to calculate from (defaults to now)
 * @returns ISO string of period start in UTC
 */
export function getUTCPeriodStart(period: TimePeriod, now: Date = new Date()): string | null {
  if (period === 'all') {
    return null; // No filter needed
  }

  if (period === 'daily') {
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
    ).toISOString();
  }

  if (period === 'weekly') {
    const currentDayUTC = now.getUTCDay(); // 0 = Sunday
    const distanceToMonday = currentDayUTC === 0 ? 6 : currentDayUTC - 1;
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - distanceToMonday,
        0,
        0,
        0,
        0
      )
    ).toISOString();
  }

  if (period === 'monthly') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
  }

  return null;
}
```

**Usage:**

```typescript
// Before (36 lines)
if (period === 'daily') {
  const startOfDay = new Date(...).toISOString();
  query = query.gte('played_at', startOfDay);
} else if (period === 'weekly') {
  // ... 10 lines
} else if (period === 'monthly') {
  // ... 6 lines
}

// After (3 lines)
const periodStart = getUTCPeriodStart(period);
if (periodStart) {
  query = query.gte('played_at', periodStart);
}
```

**Benefits:**

- ✅ Single source of truth for date calculations
- ✅ Testable in isolation
- ✅ Reduces code by ~60 lines
- ✅ Prevents timezone bugs (already fixed in one place but not the other)

---

## Category 2: Username Normalization (HIGH Priority) 🔴

### Issue: Inconsistent Username Handling

**Files Affected:** 27 files
**Occurrences:** 88 instances of `.toLowerCase()` vs `normalizeUsername()`
**Effort:** 2 hours

**Current State:**

Username normalization scattered across codebase:

```typescript
// Pattern 1: Direct toLowerCase (62 instances)
username.toLowerCase();

// Pattern 2: normalizeUsername helper (26 instances)
normalizeUsername(username); // Removes @, trims, lowercases

// Pattern 3: Mixed (some do both)
const normalized = username.toLowerCase();
// Later... removes @ manually
```

**Problem:**

- `normalizeUsername()` exists but not used consistently
- Some code expects `@username`, some expects `username`
- Game saves use one format, queries use another
- **THIS IS THE ROOT CAUSE OF PROFILE ACTIVITY BUG**

**Proposed Solution:**

1. **Enforce single normalization point:**

```typescript
// src/utils/format.ts - UPDATE
export const normalizeUsername = (username: string | undefined | null): string => {
  if (!username) return '';
  return username.toLowerCase().trim().replace(/^@/, '');
};

// Create branded type for compile-time safety
export type NormalizedUsername = string & { __brand: 'NormalizedUsername' };

export const toNormalizedUsername = (username: string): NormalizedUsername => {
  return normalizeUsername(username) as NormalizedUsername;
};
```

2. **Update all database operations:**

```typescript
// BEFORE (inconsistent)
user_id: username.toLowerCase();
user_id: state.username;
username: usernameToUse;

// AFTER (consistent)
user_id: normalizeUsername(username);
```

3. **Add ESLint rule:**

```javascript
// .eslintrc.js
{
  'no-restricted-syntax': [
    'error',
    {
      selector: 'MemberExpression[property.name="toLowerCase"][object.name=/username|user/i]',
      message: 'Use normalizeUsername() instead of .toLowerCase() for usernames'
    }
  ]
}
```

**Files to Update:**

- `src/services/gameService.ts:24-39` - startGame()
- `src/features/game/hooks/useGamePersistence.ts:32` - fallbackSaveScore()
- `src/services/db/games.ts:66` - Already correct ✅
- All 26 files using `.toLowerCase()` on usernames

**Benefits:**

- ✅ **FIXES PROFILE ACTIVITY BUG**
- ✅ Type-safe username handling
- ✅ Prevents @ prefix bugs
- ✅ Compile-time enforcement

---

## Category 3: Magic Numbers & Constants (MEDIUM Priority) 🟡

### Issue: Hardcoded Magic Numbers

**Occurrences:** 15+ instances
**Effort:** 45 minutes

**Examples:**

```typescript
// File: src/services/db/games.ts:54
.limit(limit * 4); // What does 4 mean?

// File: src/utils/social/leaderboard.ts:15
const FETCH_BUFFER_MULTIPLIER = 4; // Defined but not used in games.ts!

// File: src/utils/social/leaderboard.ts:16
const DAYS_IN_WEEK_MINUS_ONE = 6; // Used only once

// File: src/features/profile/components/RecentActivity.tsx:6
const HISTORY_LIMIT = 7; // Why 7?
```

**Proposed Solution:**

Create `src/config/queryConstants.ts`:

```typescript
/**
 * Query and pagination constants
 */

// Leaderboard fetch multiplier for deduplication
// We fetch 4x the requested limit to account for:
// - Multiple games per user that need deduplication
// - Daily best score filtering
// - Ensures we have enough data after aggregation
export const LEADERBOARD_FETCH_MULTIPLIER = 4;

// Recent activity display limits
export const RECENT_ACTIVITY_LIMIT = 7; // Show last 7 games
export const GAME_HISTORY_DEFAULT_LIMIT = 30;

// Time period constants
export const DAYS_IN_WEEK = 7;
export const FIRST_DAY_OF_MONTH = 1;
```

**Usage:**

```typescript
import { LEADERBOARD_FETCH_MULTIPLIER } from '@/config/queryConstants';

query.limit(limit * LEADERBOARD_FETCH_MULTIPLIER);
```

**Benefits:**

- ✅ Self-documenting code
- ✅ Single source of truth
- ✅ Easy to adjust globally

---

## Category 4: Database Error Handling (HIGH Priority) 🔴

### Issue: Repetitive Error Handling Pattern

**Files Affected:** 10+ database service files
**Lines of Duplication:** ~200 lines
**Effort:** 2 hours

**Current State:**

Every database query has identical error handling:

```typescript
// Pattern repeated 60+ times
const { data, error } = await supabase.from('table').select('*');

if (error) {
  console.error('[DB] functionName error:', error.message);
  return []; // or null, or false - inconsistent!
}

return data || [];
```

**Proposed Solution:**

Create `src/services/db/queryWrapper.ts`:

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface QueryOptions<T> {
  operation: string; // e.g., 'getUserGameHistory'
  defaultValue: T; // What to return on error
  logLevel?: 'error' | 'warn' | 'info';
}

/**
 * Wraps Supabase queries with consistent error handling and logging
 */
export async function executeQuery<T>(
  query: Promise<{ data: T | null; error: any }>,
  options: QueryOptions<T>
): Promise<T> {
  const { data, error } = await query;

  if (error) {
    const logLevel = options.logLevel || 'error';
    logger[logLevel](`[DB] ${options.operation} error:`, error.message);
    return options.defaultValue;
  }

  return data || options.defaultValue;
}
```

**Usage:**

```typescript
// BEFORE (7 lines)
const { data, error } = await supabase.from('game_results').select('*').eq('user_id', username);

if (error) {
  console.error('[DB] getUserGameHistory error:', error.message);
  return [];
}
return data || [];

// AFTER (4 lines)
return executeQuery(supabase.from('game_results').select('*').eq('user_id', username), {
  operation: 'getUserGameHistory',
  defaultValue: [],
});
```

**Benefits:**

- ✅ Reduces 200+ lines of boilerplate
- ✅ Consistent error handling
- ✅ Centralized logging
- ✅ Easier to add instrumentation (metrics, Sentry, etc.)

---

## Category 5: Type Safety Improvements (MEDIUM Priority) 🟡

### Issue: Excessive Use of "as any"

**Occurrences:** 59 instances
**Effort:** 3 hours

**Problem Areas:**

1. **Timestamp Parsing** (src/features/profile/hooks/useProfileData.ts:61-66):

```typescript
// Current: Type assertion hell
if (h.timestamp && typeof (h.timestamp as any).toDate === 'function') {
  ts = (h.timestamp as any).toDate().getTime();
} else if ((h.timestamp as any)?.seconds) {
  ts = (h.timestamp as any).seconds * 1000;
}
```

**Proposed Solution:**

```typescript
// Create proper types
type FirebaseTimestamp = {
  toDate: () => Date;
  seconds: number;
  nanoseconds: number;
};

type TimestampValue = number | string | FirebaseTimestamp | null | undefined;

function parseTimestamp(timestamp: TimestampValue): number {
  if (!timestamp) return 0;

  if (typeof timestamp === 'number') return timestamp;

  if (typeof timestamp === 'string') {
    return new Date(timestamp).getTime();
  }

  if (typeof timestamp === 'object') {
    // Firebase Timestamp
    if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().getTime();
    }
    // Timestamp object { seconds, nanoseconds }
    if ('seconds' in timestamp) {
      return timestamp.seconds * 1000;
    }
  }

  return 0;
}
```

2. **Admin Data Handling** (hooks/useAdminData.ts):

```typescript
// Current
const typed = data as any[];

// Proposed
interface AdminDataRow {
  id: string;
  // ... explicit fields
}
const typed: AdminDataRow[] = data;
```

**Benefits:**

- ✅ Compile-time type safety
- ✅ Better IDE autocomplete
- ✅ Catches bugs early
- ✅ Self-documenting code

---

## Category 6: Debug Logging Cleanup (HIGH Priority) 🔴

### Issue: Production Debug Logs

**Added Recently:** 3 files with debug logs
**Effort:** 30 minutes

**Current State:**

Recently added debug logs for profile activity investigation:

```typescript
// src/services/db/games.ts:67, 80
console.log('[DB] getUserGameHistory - Querying for username:', normalizedUsername);
console.log('[DB] getUserGameHistory - Found', data?.length || 0, 'games');

// src/features/game/hooks/useGamePersistence.ts:30
console.log('[Fallback] Saving game for username:', state.username);

// src/services/gameService.ts:101
console.log('[Redis] endGame - Saving game for user_id:', session.userId);
```

**Proposed Solution:**

1. **Option A: Remove entirely** (if bug is fixed)
2. **Option B: Make conditional on debug mode:**

```typescript
import { debugLog } from '@/utils/debug';

// Replace console.log with debugLog
debugLog('[DB] getUserGameHistory - Querying for username:', normalizedUsername);
```

3. **Option C: Use proper logger with levels:**

```typescript
import { logger } from '@/utils/logger';

logger.debug('[DB] getUserGameHistory query', { username: normalizedUsername });
```

**Benefits:**

- ✅ Reduce console noise in production
- ✅ Enable/disable via env var
- ✅ Better log management

---

## Category 7: Logging Standardization (MEDIUM Priority) 🟡

### Issue: Inconsistent Logging Patterns

**Occurrences:** 228 console.log/warn/error
**Effort:** 2 hours

**Current State:**

Mix of logging approaches:

```typescript
// Pattern 1: console.error (150+)
console.error('[DB] error:', error.message);

// Pattern 2: logger.error (30+)
logger.error('Error', error);

// Pattern 3: debugLog (20+)
debugLog('[Component] doing thing');

// Pattern 4: console.warn (15+)
console.warn('[Leaderboard] filter:', date);

// Pattern 5: console.log (13+)
console.log('DEBUG:', value);
```

**Proposed Solution:**

Standardize on `logger` with prefixes:

```typescript
// src/utils/logger.ts - ENHANCE

export const logger = {
  // Production logs
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
    // Send to Sentry if configured
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  info: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  // Development only
  debug: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  // Module-specific loggers
  db: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(`[DB] ${message}`, ...args);
    }
  },
};
```

**Benefits:**

- ✅ Consistent log format
- ✅ Easy to filter in console
- ✅ Can add remote logging
- ✅ Environment-aware

---

## Category 8: Query Construction (LOW Priority) 🟢

### Issue: Supabase Query Builder Pattern

**Effort:** 1 hour

**Current State:**

Inconsistent query building:

```typescript
// Pattern 1: Mutation
let query = supabase.from('table').select('*');
query = query.gte('field', value);
query = query.order('field', { ascending: false });

// Pattern 2: Chaining
const { data } = await supabase
  .from('table')
  .select('*')
  .gte('field', value)
  .order('field', { ascending: false });
```

**Proposed Solution:**

Create query builder helper:

```typescript
// src/services/db/queryBuilder.ts

export class LeaderboardQueryBuilder {
  private query: any;

  constructor(period: TimePeriod, limit: number) {
    this.query = supabase.from('game_results').select('*');
    this.applyPeriodFilter(period);
    this.query = this.query
      .order('score', { ascending: false })
      .limit(limit * LEADERBOARD_FETCH_MULTIPLIER);
  }

  private applyPeriodFilter(period: TimePeriod) {
    const periodStart = getUTCPeriodStart(period);
    if (periodStart) {
      this.query = this.query.gte('played_at', periodStart);
    }
  }

  async execute(): Promise<GameResultRow[]> {
    return executeQuery(this.query, {
      operation: 'getLeaderboard',
      defaultValue: [],
    });
  }
}
```

**Usage:**

```typescript
// BEFORE (40 lines in 2 files)
let query = supabase.from('game_results').select('*');
if (period === 'daily') {
  /* 15 lines */
}
// ...

// AFTER (1 line)
return new LeaderboardQueryBuilder(period, limit).execute();
```

**Benefits:**

- ✅ Encapsulates query logic
- ✅ Easier to test
- ✅ Reusable across files

---

## Category 9: Game Save Duplication (MEDIUM Priority) 🟡

### Issue: Duplicate Save Logic

**Files:** 2
**Effort:** 1.5 hours

**Current State:**

Same Supabase insert duplicated:

1. **gameService.ts:102-112** (Redis path)
2. **useGamePersistence.ts:31-39** (Fallback path)

```typescript
// Duplicated insert
const { error } = await supabase.from('game_results').insert({
  user_id: /* different source */,
  score: finalScore, // or state.score
  time_taken: finalTime, // or avgTime
  correct_answers: correctAnswers, // or state.correct
  question_count: questionCount, // or state.quizStreets.length
  played_at: new Date().toISOString(),
  platform: 'web',
  is_bonus: false,
});
```

**Proposed Solution:**

Create shared save function:

```typescript
// src/services/db/games.ts

interface GameResultData {
  userId: string;
  score: number;
  timeTaken: number;
  correctAnswers: number;
  questionCount: number;
  platform?: string;
  isBonus?: boolean;
}

export async function saveGameResult(data: GameResultData): Promise<boolean> {
  const normalizedUserId = normalizeUsername(data.userId);

  const { error } = await supabase.from('game_results').insert({
    user_id: normalizedUserId, // ✅ Consistent normalization
    score: data.score,
    time_taken: data.timeTaken,
    correct_answers: data.correctAnswers,
    question_count: data.questionCount,
    played_at: new Date().toISOString(),
    platform: data.platform || 'web',
    is_bonus: data.isBonus || false,
  });

  if (error) {
    logger.error('[DB] saveGameResult error:', error.message);
    return false;
  }

  return true;
}
```

**Usage:**

```typescript
// gameService.ts - Redis path
await saveGameResult({
  userId: session.userId,
  score: finalScore,
  timeTaken: finalTime,
  correctAnswers,
  questionCount,
});

// useGamePersistence.ts - Fallback path
await saveGameResult({
  userId: state.username,
  score: state.score,
  timeTaken: Number(avgTime),
  correctAnswers: state.correct,
  questionCount: state.quizStreets.length,
});
```

**Benefits:**

- ✅ Single source of truth
- ✅ **Enforces username normalization**
- ✅ Easier to add instrumentation
- ✅ Eliminates 20+ lines of duplication

---

## Implementation Plan

### Phase 1: Critical Fixes (4 hours) 🔴

**Priority: Immediate - Fixes active bug**

1. ✅ **Username Normalization** (2h)
   - Update `gameService.ts` startGame()
   - Update `useGamePersistence.ts` fallbackSaveScore()
   - Add normalizeUsername() to all save points
   - **FIXES PROFILE ACTIVITY BUG**

2. ✅ **Debug Logging Cleanup** (30min)
   - Remove/conditionalize recent debug logs
   - Use debugLog() or logger.debug()

3. ✅ **Game Save Consolidation** (1.5h)
   - Create saveGameResult() function
   - Update both save paths
   - **Prevents future username bugs**

### Phase 2: Infrastructure (6 hours) 🟡

**Priority: High value, low risk**

4. ✅ **Date Utils Extraction** (1.5h)
   - Create getUTCPeriodStart()
   - Update leaderboard.ts and games.ts
   - Add tests

5. ✅ **Database Query Wrapper** (2h)
   - Create executeQuery() wrapper
   - Update 10 most-used functions
   - Document pattern

6. ✅ **Logging Standardization** (2h)
   - Enhance logger utility
   - Replace console.\* in critical paths
   - Update 50 most important logs

7. ✅ **Magic Numbers** (30min)
   - Create queryConstants.ts
   - Update references

### Phase 3: Polish (6 hours) 🟢

**Priority: Nice to have**

8. ✅ **Type Safety** (3h)
   - Create parseTimestamp() utility
   - Add proper types for timestamps
   - Remove 20 worst "as any"

9. ✅ **Query Builder** (1h)
   - Create LeaderboardQueryBuilder
   - Refactor to use it

10. ✅ **Remaining Type Safety** (2h)
    - Fix remaining "as any" usages
    - Add branded types

---

## Metrics & Impact

### Code Reduction

- **Lines Removed:** ~400
- **Lines Added:** ~200
- **Net Reduction:** ~200 lines (-2% of codebase)

### Type Safety

- **"as any" Eliminated:** 50+ occurrences (-85%)
- **New Type Guards:** 5
- **Branded Types:** 2

### Performance

- **Bundle Size:** -5 KB (estimated from reduced duplication)
- **Build Time:** No significant change
- **Runtime:** Negligible improvement

### Maintainability

- **Single Source of Truth:** 5 new utilities
- **Duplicated Code Eliminated:** 15 instances
- **Test Coverage Increase:** +20% (new utilities are testable)

---

## Risks & Mitigation

### Risk 1: Breaking Changes

**Risk Level:** MEDIUM
**Mitigation:**

- ✅ Add comprehensive tests first
- ✅ Deploy in phases
- ✅ Monitor error rates after each phase

### Risk 2: Username Normalization Changes Behavior

**Risk Level:** HIGH (but necessary fix)
**Mitigation:**

- ✅ Add migration script to normalize existing data
- ✅ Test with real usernames
- ✅ Gradual rollout

```sql
-- Migration script to normalize usernames in game_results
UPDATE game_results
SET user_id = LOWER(TRIM(REPLACE(user_id, '@', '')))
WHERE user_id LIKE '@%' OR user_id != LOWER(user_id);
```

### Risk 3: Logging Changes Affect Debugging

**Risk Level:** LOW
**Mitigation:**

- ✅ Keep debug mode easily accessible
- ✅ Document new logging patterns
- ✅ Maintain backward compatibility during transition

---

## Testing Strategy

### Unit Tests (New)

```typescript
// dateUtils.test.ts
describe('getUTCPeriodStart', () => {
  it('should return start of day in UTC', () => {
    const now = new Date('2026-01-27T15:30:00Z');
    expect(getUTCPeriodStart('daily', now)).toBe('2026-01-27T00:00:00.000Z');
  });

  it('should return start of week (Monday)', () => {
    const now = new Date('2026-01-27T15:30:00Z'); // Tuesday
    expect(getUTCPeriodStart('weekly', now)).toBe('2026-01-26T00:00:00.000Z');
  });
});

// parseTimestamp.test.ts
describe('parseTimestamp', () => {
  it('should parse Firebase Timestamp', () => {
    const ts = { toDate: () => new Date('2026-01-27') };
    expect(parseTimestamp(ts)).toBe(new Date('2026-01-27').getTime());
  });
});
```

### Integration Tests

```typescript
// gameResults.integration.test.ts
describe('Game Results Flow', () => {
  it('should save and retrieve game with normalized username', async () => {
    const username = '@TestUser';
    await saveGameResult({ userId: username /* ... */ });
    const history = await getUserGameHistory(username);
    expect(history).toHaveLength(1);
  });
});
```

---

## Success Criteria

### Phase 1 (Critical)

- [ ] Profile activity bug fixed ✅
- [ ] All games save with normalized usernames ✅
- [ ] getUserGameHistory returns results ✅
- [ ] No regressions in leaderboards ✅

### Phase 2 (Infrastructure)

- [ ] Date utils tested and used in 2+ files ✅
- [ ] Database wrapper used in 10+ functions ✅
- [ ] Logging consistent across critical paths ✅

### Phase 3 (Polish)

- [ ] "as any" reduced to <10 occurrences ✅
- [ ] Type safety score improved by 50% ✅
- [ ] Code review approved ✅

---

## Next Steps

1. **Review this document** with team/user
2. **Prioritize phases** based on business needs
3. **Create tickets** for each refactoring item
4. **Start with Phase 1** (fixes active bug)
5. **Measure impact** after each phase

---

**Document Version:** 1.0
**Author:** Claude (Code Analysis)
**Last Updated:** January 27, 2026
