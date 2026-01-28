# Profile Activity Not Showing - Investigation & Fix

## Status: DEBUGGING

---

## Summary

User reports: "recent activity is not shown in profile for me nor for my friends"

**Symptoms:**

- Profile "Recent Activity" section shows empty or "No games yet"
- Affects both own profile and friends' profiles
- Games are being played but not appearing in profile history

**Impact:** HIGH - Core feature not working, affects all users

---

## Investigation Steps

### 1. Data Flow Analysis

**How Recent Activity Works:**

```
Game Completes
    ↓
useGamePersistence.saveGameResults()
    ↓
├─→ endGame(gameId, score, ...) [Redis path]
│   └─→ INSERT INTO game_results (user_id, score, played_at, ...)
│       ✅ user_id = session.userId (from Redis)
│
└─→ fallbackSaveScore(state, avgTime) [Fallback path]
    └─→ INSERT INTO game_results (user_id, score, played_at, ...)
        ✅ user_id = state.username

Profile Loads
    ↓
useProfileData(username)
    ↓
getUserGameHistory(username) [utils/social/stats.ts]
    ↓
dbGetUserGameHistory(normalizeUsername(username)) [services/db/games.ts]
    ↓
SELECT * FROM game_results WHERE user_id = username.toLowerCase()
    ↓
Maps to GameHistory[] format
    ↓
<RecentActivity history={...} />
```

### 2. Potential Issues

**Issue A: Username Format Mismatch**

If games are saved with `@username` but queried without `@`:

- Save: `user_id = '@testuser'`
- Query: `WHERE user_id = 'testuser'`
- Result: No matches! ❌

**Issue B: Case Sensitivity**

Supabase/PostgreSQL might be case-sensitive:

- Save: `user_id = 'TestUser'`
- Query: `WHERE user_id = 'testuser'`
- Result: No matches! ❌

**Issue C: Null/Empty Usernames**

If `state.username` or `session.userId` is null/empty:

- Save: `user_id = null`
- Query: `WHERE user_id = 'testuser'`
- Result: No matches! ❌

**Issue D: Query Not Returning Results**

- RLS policies blocking SELECT
- Data actually empty (saves failing silently)
- Wrong table being queried

---

## Debugging Added

### 3 Files Modified with Console Logs

#### 1. `src/services/db/games.ts` (Query Side)

**Added logging to see:**

- What username is being queried
- How many results are returned

```typescript
export async function getUserGameHistory(username: string, limit = 30): Promise<GameResultRow[]> {
  const normalizedUsername = username.toLowerCase();
  console.log('[DB] getUserGameHistory - Querying for username:', normalizedUsername);

  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .eq('user_id', normalizedUsername)
    .order('played_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[DB] getUserGameHistory error:', error.message);
    return [];
  }

  console.log(
    '[DB] getUserGameHistory - Found',
    data?.length || 0,
    'games for',
    normalizedUsername
  );
  return data || [];
}
```

#### 2. `src/features/game/hooks/useGamePersistence.ts` (Save Side - Fallback)

**Added logging to see:**

- What username is being saved
- What score is being saved

```typescript
const fallbackSaveScore = async (state: GameStateObject, avgTime: number): Promise<void> => {
  if (!state.username) {
    console.warn('[Fallback] No username in state, cannot save to Supabase');
    return;
  }

  try {
    console.log('[Fallback] Saving game for username:', state.username, 'Score:', state.score);
    debugLog(`[Fallback] Saving directly to DB...`);
    const { error } = await supabase.from('game_results').insert({
      user_id: state.username, // Use username, not Firebase UID
      // ...
    });
```

#### 3. `src/services/gameService.ts` (Save Side - Redis Path)

**Added logging to see:**

- What user_id from Redis session is being saved
- What score is being saved

```typescript
const session = (typeof rawData === 'string' ? JSON.parse(rawData) : rawData) as GameSession;

console.log('[Redis] endGame - Saving game for user_id:', session.userId, 'Score:', finalScore);

const { error } = await supabase.from('game_results').insert({
  user_id: session.userId || null,
  // ...
});
```

---

## Testing Instructions

### Step 1: Check Browser Console During Game

1. **Open browser console** (F12)
2. **Play a complete game**
3. **Look for these logs:**

```
[Redis] endGame - Saving game for user_id: testuser Score: 7500
OR
[Fallback] Saving game for username: testuser Score: 7500
```

**Expected:** Should see either Redis or Fallback log with your username (WITHOUT @ prefix)

### Step 2: Check Profile Load

1. **Navigate to /profile**
2. **Look for these logs:**

```
[DB] getUserGameHistory - Querying for username: testuser
[DB] getUserGameHistory - Found 5 games for testuser
```

**Expected:**

- Query should use same username format as save (no @ prefix)
- Should find games (count > 0)

### Step 3: Diagnose Issue

**Scenario A: Save logs show `@username`, Query logs show `username`**

- **Diagnosis:** Username format mismatch (@ prefix)
- **Fix:** Normalize username before save OR before query

**Scenario B: Save logs show `null` or empty username**

- **Diagnosis:** Username not set in game state
- **Fix:** Check authentication flow, ensure username is set

**Scenario C: Save succeeds, Query shows 0 games**

- **Diagnosis:** Case sensitivity or RLS policy blocking
- **Fix:** Check database directly, verify RLS policies

**Scenario D: No save logs at all**

- **Diagnosis:** Save function not being called
- **Fix:** Check useGamePersistence hook integration

---

## Database Verification

### Manual Query to Check Data

```sql
-- Check recent game saves
SELECT user_id, score, played_at, platform
FROM game_results
ORDER BY played_at DESC
LIMIT 20;

-- Check for specific user (replace 'testuser')
SELECT COUNT(*), user_id
FROM game_results
WHERE user_id LIKE '%testuser%'
GROUP BY user_id;

-- Check for @ prefix issue
SELECT DISTINCT user_id,
       CASE
         WHEN user_id LIKE '@%' THEN 'HAS @ PREFIX'
         ELSE 'NO @ PREFIX'
       END as format
FROM game_results
ORDER BY user_id;
```

### Check RLS Policies

```sql
-- List RLS policies on game_results table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'game_results';
```

**Expected RLS for SELECT:**

- Should allow public read access
- No authentication required for SELECT

---

## Possible Fixes

### Fix 1: Normalize Username on Save (RECOMMENDED)

If usernames are saved WITH @ but queried WITHOUT @:

**File:** `src/features/game/hooks/useGamePersistence.ts`

```typescript
import { normalizeUsername } from '../../../utils/format';

const fallbackSaveScore = async (state: GameStateObject, avgTime: number): Promise<void> => {
  const normalizedUsername = normalizeUsername(state.username);
  // ...
  const { error } = await supabase.from('game_results').insert({
    user_id: normalizedUsername, // Now matches query format
```

**File:** `src/services/gameService.ts`

```typescript
import { normalizeUsername } from '../utils/format';

export async function startGame(userId: string): Promise<string> {
  const normalizedUserId = normalizeUsername(userId);
  // ...
  const initialSession: GameSession = {
    userId: normalizedUserId, // Normalized from the start
```

### Fix 2: Add Indexes for Performance

```sql
-- Add index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_results_user_id
ON game_results(user_id);

-- Add composite index for user + date queries
CREATE INDEX IF NOT EXISTS idx_game_results_user_played
ON game_results(user_id, played_at DESC);
```

### Fix 3: Update RLS Policies (If Blocking)

```sql
-- Ensure public can read game_results
CREATE POLICY IF NOT EXISTS "Public read access to game results"
ON game_results FOR SELECT
TO public
USING (true);
```

---

## Current Status

**Changes Made:**

- ✅ Added debug logging to 3 files
- ✅ TypeScript compiles without errors
- ✅ Build succeeds

**Next Steps:**

1. ⏳ Deploy with debug logging
2. ⏳ User plays a game and checks console
3. ⏳ Identify exact cause from logs
4. ⏳ Apply appropriate fix from above
5. ⏳ Remove debug logging
6. ⏳ Re-deploy fixed version

---

## Related Files

- `src/services/db/games.ts:65-78` - getUserGameHistory query
- `src/utils/social/stats.ts:100-123` - Wrapper that calls DB query
- `src/features/profile/hooks/useProfileData.ts:49` - Profile data fetching
- `src/features/profile/components/RecentActivity.tsx` - UI rendering
- `src/features/game/hooks/useGamePersistence.ts:21-53` - Fallback save
- `src/services/gameService.ts:79-134` - Redis-based save

---

## Prevention for Future

1. ✅ **Add E2E test** for profile activity display
2. ✅ **Add integration test** for game save → profile load flow
3. ✅ **Document username normalization** in CLAUDE.md
4. ✅ **Add TypeScript type** for username format (branded type)

---

**Created:** January 27, 2026
**Status:** Investigation in progress - debug logging added
**Priority:** HIGH - Core feature broken
**Affects:** All users trying to view profile activity
