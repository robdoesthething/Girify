# BUG FIX: Game Results Not Appearing in Profiles

## Status: CRITICAL - Games not saving to user history

---

## Root Cause Analysis

### The Problem

**Two separate tables with incompatible data flows:**

1. **`game_results` table** ✅ WORKING
   - Gets written by: `gameService.endGame()` and `fallbackSaveScore()`
   - Gets read by: Leaderboard queries (`getLeaderboardScores()`)
   - **Result**: Leaderboards WORK correctly

2. **`user_games` table** ❌ BROKEN
   - Should be written by: `saveUserGameResult() → saveUserGame()`
   - Gets read by: Profile queries (`getUserGameHistory()`)
   - **Problem**: Inserts FAIL SILENTLY due to RLS policy mismatch
   - **Result**: Profiles show NO game history

### Why Inserts Fail

**RLS Policy Conflict:**

The `user_games` table has a restrictive RLS policy:

```sql
-- scripts/supabase-schema.sql:471-474
CREATE POLICY "Users can insert their own games" ON user_games
    FOR INSERT WITH CHECK (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );
```

**This policy requires:**

1. JWT claims to be set in PostgreSQL session context
2. The username in the insert to match the authenticated user's username

**The problem:**

- Supabase client is initialized with `VITE_SUPABASE_ANON_KEY` (src/services/supabase.ts:5)
- Firebase Auth is separate from Supabase Auth
- `current_setting('request.jwt.claims'...)` returns NULL because Firebase JWT is NOT propagated to Supabase
- RLS policy check fails → Insert silently fails
- No error is thrown because error handling catches it (src/utils/social/stats.ts:135-137)

---

## The Data Flow (Current - BROKEN)

```
Game Completes
    ↓
useGamePersistence.saveGameResults()
    ↓
├─→ saveUserGameResult()                    [Line 93]
│   └─→ saveUserGame()                      [stats.ts:129]
│       └─→ INSERT INTO user_games          ❌ FAILS SILENTLY (RLS blocks)
│           └─→ error caught, logged        [stats.ts:135-137]
│
└─→ endGame()                                [Line 99]
    └─→ INSERT INTO game_results            ✅ WORKS (different RLS policy)
        └─→ Leaderboard displays correctly
```

**Result:**

- ✅ Leaderboards work (read from `game_results`)
- ❌ Profile history broken (read from `user_games`, but nothing writes there)

---

## Solution Options

### Option A: Consolidate to Single Table (RECOMMENDED) ⭐

**Approach:** Use only `game_results` table for everything

**Pros:**

- ✅ Single source of truth
- ✅ No data duplication
- ✅ Simpler maintenance
- ✅ Already working for leaderboards
- ✅ Less migration work

**Cons:**

- Need to update profile queries
- Need to migrate any existing `user_games` data

**Implementation:**

1. Update `getUserGameHistory()` to query `game_results` instead of `user_games`
2. Update column mapping (user_id vs username, etc.)
3. Migrate existing `user_games` data to `game_results` (if any exists)
4. Drop `user_games` table
5. Remove `saveUserGame()` function

**Estimated time:** 30-45 minutes

---

### Option B: Fix RLS Policy (ALTERNATIVE)

**Approach:** Make `user_games` RLS policy permissive like `game_results`

**Pros:**

- ✅ Keeps both tables
- ✅ No query changes needed

**Cons:**

- ❌ Duplicate data in two tables
- ❌ Potential sync issues
- ❌ More complexity
- ❌ Still requires proper JWT setup (complex with Firebase)

**Implementation:**

1. Update RLS policy to be permissive:

```sql
DROP POLICY IF EXISTS "Users can insert their own games" ON user_games;
CREATE POLICY "Users can insert their own games" ON user_games
FOR INSERT TO authenticated
WITH CHECK (true);
```

2. Keep both save paths

**Estimated time:** 15 minutes

**Risk:** Data inconsistency if one table fails to update

---

### Option C: Link Firebase Auth to Supabase (COMPLEX)

**Approach:** Propagate Firebase JWT to Supabase client

**Pros:**

- ✅ Proper auth integration
- ✅ Secure RLS policies work correctly

**Cons:**

- ❌ Significant complexity
- ❌ Requires custom JWT handling
- ❌ Need to sync Firebase and Supabase auth
- ❌ Potential auth flow breaking changes

**Not recommended** - Over-engineered for this use case

---

## Recommended Fix: Option A (Consolidate to `game_results`)

### Implementation Steps

#### 1. Update Profile Query (30 min)

**File:** `src/services/db/games.ts:52-65`

**Current:**

```typescript
export async function getUserGameHistory(username: string, limit = 30): Promise<UserGameRow[]> {
  const { data, error } = await supabase
    .from('user_games') // ❌ Empty table
    .select('*')
    .eq('username', username.toLowerCase())
    .order('date', { ascending: false })
    .limit(limit);
  // ...
}
```

**Fix:**

```typescript
export async function getUserGameHistory(username: string, limit = 30): Promise<GameResultRow[]> {
  const { data, error } = await supabase
    .from('game_results') // ✅ Use populated table
    .select('*')
    .eq('user_id', username.toLowerCase()) // Column name changed
    .order('played_at', { ascending: false }) // Column name changed
    .limit(limit);

  if (error) {
    console.error('[DB] getUserGameHistory error:', error.message);
    return [];
  }
  return data || [];
}
```

#### 2. Update Return Type Mapping

**File:** `src/utils/social/stats.ts:145-163`

**Current:**

```typescript
return games.map(g => ({
  score: g.score,
  date: parseInt(g.date.replace(/-/g, ''), 10), // ❌ user_games.date
  time: g.avg_time || undefined, // ❌ user_games.avg_time
  timestamp: g.played_at ? new Date(g.played_at).getTime() : Date.now(),
}));
```

**Fix:**

```typescript
return games.map(g => ({
  score: g.score,
  date: parseInt(g.played_at.split('T')[0].replace(/-/g, ''), 10), // ✅ game_results.played_at
  time: g.time_taken || undefined, // ✅ game_results.time_taken
  timestamp: g.played_at ? new Date(g.played_at).getTime() : Date.now(),
}));
```

#### 3. Remove Redundant Code

**File:** `src/features/game/hooks/useGamePersistence.ts`

**Remove line 93:**

```typescript
// Remove this line - no longer needed
// await saveUserGameResult(state.username, firestoreData);
```

**File:** `src/services/db/games.ts`

**Remove saveUserGame function (lines 67-92):**

```typescript
// DELETE THIS ENTIRE FUNCTION
export async function saveUserGame(game: {...}): Promise<boolean> {
  // ... no longer needed
}
```

**File:** `src/utils/social/stats.ts`

**Remove saveUserGameResult function (lines 102-138):**

```typescript
// DELETE THIS ENTIRE FUNCTION
export const saveUserGameResult = async (...): Promise<void> => {
  // ... no longer needed
}
```

#### 4. Update Type Definitions

**File:** `src/types/supabase.ts` (or wherever UserGameRow is defined)

Update imports/usage to use `GameResultRow` instead of `UserGameRow`

#### 5. Database Migration (if needed)

**Only if there's existing data in `user_games`:**

```sql
-- Migrate existing user_games data to game_results
INSERT INTO game_results (user_id, score, time_taken, correct_answers, question_count, played_at, platform, is_bonus)
SELECT
    username,
    score,
    avg_time,
    correct_answers,
    question_count,
    played_at,
    'web' as platform,
    false as is_bonus
FROM user_games
WHERE NOT EXISTS (
    SELECT 1 FROM game_results gr
    WHERE gr.user_id = user_games.username
    AND gr.played_at = user_games.played_at
);

-- Drop user_games table (after confirming migration)
DROP TABLE IF EXISTS user_games CASCADE;
```

---

## Testing Checklist

After implementing the fix:

### 1. Local Testing

- [ ] Play a complete game
- [ ] Check browser console for errors
- [ ] Verify game appears in Supabase `game_results` table
- [ ] Navigate to profile page
- [ ] Verify "Recent Activity" shows the game
- [ ] Check leaderboard still works

### 2. Database Verification

```sql
-- Check recent games for a user
SELECT * FROM game_results
WHERE user_id = '<username>'
ORDER BY played_at DESC
LIMIT 10;

-- Count games per user
SELECT user_id, COUNT(*) as game_count
FROM game_results
GROUP BY user_id
ORDER BY game_count DESC;
```

### 3. Frontend Verification

- [ ] Profile shows "Last 7 games" correctly
- [ ] Leaderboard displays correctly (daily, weekly, all-time)
- [ ] Game history has correct timestamps
- [ ] Average time displays correctly
- [ ] Score displays correctly

---

## Rollback Plan

If issues occur:

1. **Revert code changes:**

   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Restore `user_games` table** (if dropped):
   - Use Supabase dashboard Time Travel feature
   - Or restore from backup

3. **Re-run fix-supabase-permissions.sql** to restore permissive policy

---

## Files to Modify

### Must Change (3 files)

1. `src/services/db/games.ts` - Update getUserGameHistory() query
2. `src/utils/social/stats.ts` - Update return type mapping
3. `src/features/game/hooks/useGamePersistence.ts` - Remove saveUserGameResult() call

### Should Remove (2 functions)

4. `src/services/db/games.ts:67-92` - Delete saveUserGame()
5. `src/utils/social/stats.ts:102-138` - Delete saveUserGameResult()

### May Need (1 file)

6. Type definitions - Update UserGameRow → GameResultRow

---

## Why This Happened

**Migration Incomplete:**
During the Firebase → Supabase migration:

1. `game_results` table was created for leaderboards
2. `user_games` table schema was kept for backwards compatibility
3. Write operations were updated to use `game_results`
4. **BUT:** Profile read operations still queried `user_games`
5. **FORGOT:** To update profile queries or dual-write to both tables

**Silent Failure:**
The bug went unnoticed because:

- Error handling caught the RLS failure
- Console logs were hidden in production
- Leaderboards worked (different table)
- No user-facing error message

---

## Post-Fix Actions

1. **Monitor Logs:**
   - Check Supabase logs for any INSERT failures
   - Monitor browser console for errors

2. **Verify Data:**
   - Confirm games are appearing in profiles
   - Check Supabase dashboard for new rows in `game_results`

3. **User Communication:**
   - Consider creating a news announcement about the fix
   - Note that historical games in `user_games` may be migrated

4. **Technical Debt:**
   - Remove `user_games` table after confirming fix
   - Clean up unused functions
   - Update documentation

---

## Prevention for Future

**Recommendations:**

1. ✅ Add integration tests for game save flow
2. ✅ Add RLS policy tests
3. ✅ Monitor Supabase insert success rates
4. ✅ Add user-facing error messages for failed saves
5. ✅ Implement health checks for critical data flows

---

**Created:** January 26, 2026
**Priority:** CRITICAL
**Status:** Ready for implementation
**Estimated Fix Time:** 45 minutes
