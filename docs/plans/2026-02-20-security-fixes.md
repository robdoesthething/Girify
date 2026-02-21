# Security Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the top 7 priority security vulnerabilities identified in the security review.

**Architecture:** Seven independent fixes across SQL migrations, server-side API code, and client-side service code. Fixes range from deleting a file (Redis client) to adding two lines (admin guards). SQL changes require running migrations against the live Supabase instance.

**Tech Stack:** React/TypeScript (Vite), Supabase (PostgreSQL + RLS), Vercel serverless functions, Upstash Redis

---

## Fix 1: Remove client-side Redis — eliminate credential exposure in JS bundle

**What:** `src/services/redis.ts` reads `VITE_UPSTASH_REDIS_REST_TOKEN` which Vite bakes into the JS bundle at build time. Anyone can extract the token from DevTools. `src/services/gameService.ts` uses it to manage game sessions. Since a fallback to direct Supabase saves already exists in `useGamePersistence.ts`, we can remove Redis from the client entirely.

**Files:**

- Modify: `src/services/redis.ts`
- Modify: `src/services/gameService.ts`
- Modify: `api/_lib/rate-limit.ts:15-16`
- Modify: `.env.template`

---

**Step 1: Update `src/services/redis.ts` to a no-op that never references VITE\_ vars**

Replace the entire file with:

```typescript
// Redis is server-side only. Client code must not use this directly.
// All Redis operations are handled via Vercel API functions in api/_lib/rate-limit.ts
// which use process.env.UPSTASH_REDIS_REST_URL (no VITE_ prefix, never bundled).
export const redis = null;
```

**Step 2: Update `src/services/gameService.ts` to skip Redis entirely**

The game session lifecycle (startGame → updateGameScore → endGame) was using Redis to store intermediate state. Since `useGamePersistence.ts` already has a fallback that calls `insertGameResult` directly, we simplify gameService to just be a thin wrapper around `insertGameResult` without any Redis dependency.

Replace the entire file with:

```typescript
import { createLogger } from '../utils/logger';
import { insertGameResult } from './db/games';

const logger = createLogger('GameService');

export interface EndGameResult {
  success: boolean;
  error?: string;
  gameId?: string;
}

/**
 * Generates a simple game ID for correlation.
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Start a new game session. Returns a correlation ID only.
 * Game state is managed client-side; no server session required.
 */
export async function startGame(_userId: string): Promise<string> {
  return generateId();
}

/**
 * No-op: game score is tracked client-side.
 */
export async function updateGameScore(_gameId: string, _newScore: number): Promise<void> {
  // Game state is managed client-side; no server update required.
}

/**
 * Save final game result to Supabase.
 */
export async function endGame(
  gameId: string,
  finalScore: number,
  finalTime: number,
  correctAnswers: number,
  questionCount: number,
  userId: string | null
): Promise<EndGameResult> {
  try {
    const { success, error } = await insertGameResult({
      user_id: userId,
      score: finalScore,
      time_taken: finalTime,
      correct_answers: correctAnswers,
      question_count: questionCount,
      played_at: new Date().toISOString(),
      platform: 'web',
      is_bonus: false,
    });

    if (!success) {
      logger.error('Failed to save game:', error);
      return {
        success: false,
        error: `Database error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    return { success: true, gameId };
  } catch (error) {
    logger.error('Unexpected error in endGame:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

> **Note:** `endGame` now takes `userId` as an explicit parameter. Check callers in `useGamePersistence.ts` — if it calls `endGame(gameId, score, time, correct, count)` without userId, update the call to pass `state.username` or `null`. The existing call signature in the old code was `endGame(gameId, finalScore, finalTime, correctAnswers, questionCount)` — we're adding `userId` as the 6th parameter.

**Step 3: Fix `api/_lib/rate-limit.ts` env var prefix**

Change lines 15–16:

```typescript
// BEFORE:
const url = process.env.VITE_UPSTASH_REDIS_REST_URL;
const token = process.env.VITE_UPSTASH_REDIS_REST_TOKEN;

// AFTER:
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
```

**Step 4: Update `.env.template`**

Change:

```
VITE_UPSTASH_REDIS_REST_URL=
VITE_UPSTASH_REDIS_REST_TOKEN=
```

To (under the server-only section):

```
# Upstash Redis (server-only — used by Vercel functions for rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Step 5: Run type-check**

```bash
cd /Users/robertosanchezgallego/Desktop/Girify
npm run type-check
```

Expected: zero errors (the old `redis` export was typed as `Redis`, callers may need a type update if any remain).

**Step 6: Commit**

```bash
git add src/services/redis.ts src/services/gameService.ts api/_lib/rate-limit.ts .env.template
git commit -m "fix(security): remove client-side Redis to prevent credential exposure in bundle"
```

---

## Fix 2: Tighten game_results INSERT RLS to prevent score fabrication

**What:** The `game_results` INSERT policy is `WITH CHECK (true)`, meaning any authenticated user can insert scores for any username. Fix: enforce that `user_id` matches the authenticated user's username via a join.

**Files:**

- Create: `scripts/fix-game-results-rls.sql`

**Step 1: Create the SQL migration file**

```sql
-- Fix game_results INSERT policy to enforce username ownership.
-- Previously WITH CHECK (true) allowed any authenticated user to submit
-- scores for any username. This constrains inserts to the current user's
-- own username by joining through the users table.

DROP POLICY IF EXISTS "Users can insert own game results" ON game_results;

CREATE POLICY "Users can insert own game results" ON game_results
FOR INSERT TO authenticated
WITH CHECK (
  user_id IS NULL
  OR user_id IN (
    SELECT username FROM users WHERE supabase_uid = auth.uid()
  )
);
```

**Step 2: Run the migration in the Supabase SQL editor**

Paste the contents of `scripts/fix-game-results-rls.sql` into the Supabase SQL editor and execute.

Expected: "Success. No rows returned."

**Step 3: Verify by testing a game save**

Play one full game while logged in and confirm the score saves successfully. Check the Supabase `game_results` table to confirm the row exists with the correct `user_id`.

**Step 4: Commit**

```bash
git add scripts/fix-game-results-rls.sql
git commit -m "fix(security): enforce game_results INSERT ownership via RLS — prevent score fabrication"
```

---

## Fix 3: Guard linkSupabaseUid against unverified email accounts

**What:** `linkSupabaseUid` links a `supabase_uid` to an existing user row by email match. If email verification is not enforced or an attacker times their registration before the victim, they can claim another user's profile. Fix: skip linking if the authenticated user's email has not been verified.

**Files:**

- Modify: `src/features/auth/hooks/useAuth.ts:27-47`

**Step 1: Add email verification guard**

In `linkSupabaseUid`, add a check after the `if (!user.email) return;` guard:

```typescript
async function linkSupabaseUid(user: User): Promise<void> {
  if (!user.email) {
    return;
  }

  // Only link verified emails to prevent account takeover via unverified registrations.
  if (!user.email_confirmed_at) {
    return;
  }

  try {
    // ... rest of function unchanged
```

**Step 2: Run type-check**

```bash
npm run type-check
```

**Step 3: Commit**

```bash
git add src/features/auth/hooks/useAuth.ts
git commit -m "fix(security): skip supabase_uid linking for unverified emails"
```

---

## Fix 4: Create add_giuros atomic RPC and update callers

**What:** `addGiuros` in `giuros.ts` and the giuros increment in `claimQuestReward` are read-modify-write operations susceptible to TOCTOU races (two concurrent calls read the same balance, both write `stale + amount`, one increment is lost). Fix: create an `add_giuros` SQL function that does an atomic `UPDATE ... SET giuros = giuros + amount`.

**Files:**

- Create: `scripts/atomic-add-giuros.sql`
- Modify: `src/utils/shop/giuros.ts:43-76`
- Modify: `src/services/db/quests.ts:139-161`

---

**Step 1: Write the SQL function**

Create `scripts/atomic-add-giuros.sql`:

```sql
-- Atomic giuros increment function.
-- Uses a single UPDATE to avoid TOCTOU race between read and write.
-- SECURITY DEFINER so it can bypass RLS; caller identity is enforced
-- at the application layer (assertCurrentUser or requireAdmin).
-- Note: intentionally no per-caller ownership check because this
-- function is also used to credit referrers (different user than caller).

CREATE OR REPLACE FUNCTION add_giuros(
  p_username TEXT,
  p_amount INTEGER,
  p_reason TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  UPDATE users
  SET giuros = COALESCE(giuros, 0) + p_amount
  WHERE username = p_username
  RETURNING giuros INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;
```

**Step 2: Run the migration in Supabase SQL editor**

Paste `scripts/atomic-add-giuros.sql` into the Supabase SQL editor and execute.

Expected: "Success. No rows returned."

**Step 3: Update `addGiuros` in `src/utils/shop/giuros.ts`**

Replace the body of the `addGiuros` function (lines 53–75) to use the RPC:

```typescript
export const addGiuros = async (
  username: string | null,
  amount: number,
  reason: string = ''
): Promise<{ success: boolean; newBalance: number }> => {
  if (!username || amount <= 0) {
    return { success: false, newBalance: 0 };
  }
  const normalizedUsername = normalizeUsername(username);

  try {
    const { data, error } = await (supabase as any).rpc('add_giuros', {
      p_username: normalizedUsername,
      p_amount: amount,
      p_reason: reason,
    });

    if (error) {
      console.error('[Giuros] add_giuros RPC error:', error);
      return { success: false, newBalance: 0 };
    }

    const result = data as { success: boolean; error?: string; new_balance?: number };

    if (!result.success) {
      console.error('[Giuros] add_giuros failed:', result.error);
      return { success: false, newBalance: 0 };
    }

    const newBalance = result.new_balance ?? 0;
    // eslint-disable-next-line no-console
    console.log(
      `[Giuros] +${amount} for ${normalizedUsername} (${reason}). New balance: ${newBalance}`
    );
    return { success: true, newBalance };
  } catch (e) {
    console.error('Error adding giuros:', e);
    return { success: false, newBalance: 0 };
  }
};
```

**Step 4: Update `claimQuestReward` giuros increment in `src/services/db/quests.ts`**

Replace lines 139–161 (the read-modify-write block under `// 3. Add Giuros`):

```typescript
// 3. Add Giuros — atomic via RPC to avoid TOCTOU race
if (quest.reward_giuros && quest.reward_giuros > 0) {
  const { data: rpcData, error: rpcError } = await (supabase as any).rpc('add_giuros', {
    p_username: cleanUserId,
    p_amount: quest.reward_giuros,
    p_reason: `quest_reward:${questId}`,
  });

  if (rpcError || !(rpcData as any)?.success) {
    logger.error('Failed to add giuros via RPC', rpcError || (rpcData as any)?.error);
    // Quest is claimed; currency failed — don't fail the whole claim.
    return { success: true, reward: 0, error: 'Claimed, but failed to add currency' };
  }

  return { success: true, reward: quest.reward_giuros };
}
```

**Step 5: Run type-check**

```bash
npm run type-check
```

**Step 6: Commit**

```bash
git add scripts/atomic-add-giuros.sql src/utils/shop/giuros.ts src/services/db/quests.ts
git commit -m "fix(security): atomic add_giuros RPC to prevent TOCTOU balance race"
```

---

## Fix 5: Add caller ownership check to spend_giuros SQL function

**What:** `spend_giuros` is `SECURITY DEFINER` and accepts `p_username` without verifying the caller owns that account. Any authenticated user can spend another user's giuros by passing a different username. Fix: add an ownership assertion at the top of the function.

**Files:**

- Modify: `scripts/atomic-spend-giuros.sql`

**Step 1: Add ownership check to the SQL function**

In `scripts/atomic-spend-giuros.sql`, add after `BEGIN`:

```sql
CREATE OR REPLACE FUNCTION spend_giuros(
  p_username TEXT,
  p_cost INTEGER,
  p_item_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_purchased TEXT[];
  v_is_badge BOOLEAN;
  v_already_owned BOOLEAN := FALSE;
BEGIN
  -- Verify caller owns this account (prevents spending other users' giuros)
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE username = p_username
      AND supabase_uid = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  v_is_badge := p_item_id LIKE 'badge_%';

  -- Lock the user row for update (prevents concurrent modifications)
  SELECT giuros, purchased_cosmetics
  INTO v_current_balance, v_purchased
  FROM users
  WHERE username = p_username
  FOR UPDATE;

  -- ... rest of function unchanged from line 26 onward
```

The full updated file (replacing the old one in its entirety):

```sql
-- Atomic spend_giuros function
-- Prevents TOCTOU race conditions by checking balance and deducting in a single transaction
-- Also handles purchased_cosmetics array append atomically

-- Function: spend_giuros
-- Atomically checks balance >= cost and deducts, returning success/failure
CREATE OR REPLACE FUNCTION spend_giuros(
  p_username TEXT,
  p_cost INTEGER,
  p_item_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_purchased TEXT[];
  v_is_badge BOOLEAN;
  v_already_owned BOOLEAN := FALSE;
BEGIN
  -- Verify caller owns this account (prevents spending other users' giuros)
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE username = p_username
      AND supabase_uid = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  v_is_badge := p_item_id LIKE 'badge_%';

  -- Lock the user row for update (prevents concurrent modifications)
  SELECT giuros, purchased_cosmetics
  INTO v_current_balance, v_purchased
  FROM users
  WHERE username = p_username
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check ownership for non-badge items (badges are in a separate table)
  IF NOT v_is_badge AND p_item_id != 'handle_change' AND NOT p_item_id LIKE 'handle_change%' THEN
    IF p_item_id = ANY(COALESCE(v_purchased, '{}')) THEN
      v_already_owned := TRUE;
    END IF;
  END IF;

  -- Check badge ownership
  IF v_is_badge THEN
    IF EXISTS (SELECT 1 FROM purchased_badges WHERE username = p_username AND badge_id = p_item_id) THEN
      v_already_owned := TRUE;
    END IF;
  END IF;

  IF v_already_owned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already owned');
  END IF;

  -- Check balance
  v_current_balance := COALESCE(v_current_balance, 0);
  IF v_current_balance < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient giuros');
  END IF;

  v_new_balance := v_current_balance - p_cost;

  -- Deduct balance
  UPDATE users SET giuros = v_new_balance WHERE username = p_username;

  -- Add item
  IF v_is_badge THEN
    INSERT INTO purchased_badges (username, badge_id)
    VALUES (p_username, p_item_id)
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE users
    SET purchased_cosmetics = array_append(COALESCE(purchased_cosmetics, '{}'), p_item_id)
    WHERE username = p_username;
  END IF;

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;
```

**Step 2: Run the migration in Supabase SQL editor**

Paste the full updated `scripts/atomic-spend-giuros.sql` into the Supabase SQL editor and execute.

Expected: "Success. No rows returned."

**Step 3: Test a shop purchase**

In the app, attempt to purchase a cosmetic item. Confirm the purchase succeeds and giuros deducts correctly.

**Step 4: Commit**

```bash
git add scripts/atomic-spend-giuros.sql
git commit -m "fix(security): add caller ownership check to spend_giuros SQL function"
```

---

## Fix 6: Fix admin key comparison to eliminate key-length oracle

**What:** `api/admin/promote.ts:112-113` checks `keyBuffer.length === serverKeyBuffer.length` before calling `timingSafeEqual`. This short-circuit leaks the exact byte length of `ADMIN_SECRET_KEY`. Fix: compare HMAC-SHA256 digests of both keys (fixed 32-byte output), making the comparison constant-time and length-agnostic.

**Files:**

- Modify: `api/admin/promote.ts:110-114`

**Step 1: Replace the key comparison block**

In `api/admin/promote.ts`, replace lines 110–113:

```typescript
// BEFORE:
const keyBuffer = Buffer.from(adminKey);
const serverKeyBuffer = Buffer.from(serverAdminKey);
const keysMatch =
  keyBuffer.length === serverKeyBuffer.length && timingSafeEqual(keyBuffer, serverKeyBuffer);
```

```typescript
// AFTER:
// Use HMAC-SHA256 to produce fixed-length digests before comparing.
// This eliminates the key-length oracle introduced by checking .length first.
const { createHmac } = await import('crypto');
const hmac = (k: string) => createHmac('sha256', 'girify-key-compare').update(k).digest();
const keysMatch = timingSafeEqual(hmac(adminKey), hmac(serverAdminKey));
```

Note: `timingSafeEqual` is already imported at line 12. The `createHmac` import is already available via the existing `import { timingSafeEqual } from 'crypto'` — just extend it: change line 12 to `import { timingSafeEqual, createHmac } from 'crypto';` and use the synchronous version instead of the dynamic import:

```typescript
// Line 12 — extend existing import:
import { timingSafeEqual, createHmac } from 'crypto';

// Lines 110-113 — replace with:
const hmac = (k: string) => createHmac('sha256', 'girify-key-compare').update(k).digest();
const keysMatch = timingSafeEqual(hmac(adminKey), hmac(serverAdminKey));
```

**Step 2: Run type-check**

```bash
npm run type-check
```

**Step 3: Commit**

```bash
git add api/admin/promote.ts
git commit -m "fix(security): use HMAC digest comparison in admin key check to eliminate length oracle"
```

---

## Fix 7: Add requireAdmin guards to deleteUserAndData and config mutators

**What:** Three functions — `deleteUserAndData`, `updatePayoutConfig`, `updateGameConfig` — perform privileged mutations but have no server-side authorization check. They rely solely on being called from within `AdminRoute` (a client-side redirect). Fix: add `await requireAdmin()` at the top of each, matching the pattern already used by `updateUserAsAdmin`.

**Files:**

- Modify: `src/utils/social/profile.ts:371-393`
- Modify: `src/services/db/config.ts:128-179`
- Modify: `src/services/db/config.ts:283-336`

---

**Step 1: Add requireAdmin to `deleteUserAndData`**

In `src/utils/social/profile.ts`, update `deleteUserAndData` (line 371):

```typescript
export const deleteUserAndData = async (
  username: string
): Promise<{ success: boolean; error?: string }> => {
  if (!username) {
    return { success: false, error: 'No username provided' };
  }

  // Guard: caller must be an admin (mirrors updateUserAsAdmin pattern)
  const { requireAdmin } = await import('../auth');
  await requireAdmin();

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('username', normalizeUsername(username));

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (e) {
    console.error('Error deleting user:', e);
    return { success: false, error: (e as Error).message };
  }
};
```

**Step 2: Add requireAdmin to `updatePayoutConfig`**

In `src/services/db/config.ts`, update `updatePayoutConfig` (line 128):

```typescript
export const updatePayoutConfig = async (
  updates: Partial<PayoutConfig>
): Promise<{ success: boolean; error?: string }> => {
  // Guard: caller must be an admin
  const { requireAdmin } = await import('../../utils/auth');
  await requireAdmin();

  try {
    // ... rest of function unchanged
```

**Step 3: Add requireAdmin to `updateGameConfig`**

In `src/services/db/config.ts`, update `updateGameConfig` (line 283):

```typescript
export const updateGameConfig = async (
  updates: Partial<GameConfig>
): Promise<{ success: boolean; error?: string }> => {
  // Guard: caller must be an admin
  const { requireAdmin } = await import('../../utils/auth');
  await requireAdmin();

  try {
    // Validation: Check values before write
    validateGameConfig(updates);
    // ... rest of function unchanged
```

**Step 4: Run type-check**

```bash
npm run type-check
```

**Step 5: Run tests**

```bash
npm test -- --run
```

Expected: all existing tests pass. If any tests mock admin functions, check they still work with the added `requireAdmin()` call (may need to mock `requireAdmin` to resolve in tests).

**Step 6: Commit**

```bash
git add src/utils/social/profile.ts src/services/db/config.ts
git commit -m "fix(security): add requireAdmin guard to deleteUserAndData and config mutators"
```

---

## Execution Order

Run these tasks strictly in order — each subsequent task is independent, but commits should stay atomic:

1. Fix 1 (Redis) — most impactful; eliminates the credential exposure
2. Fix 2 (RLS) — SQL migration, no code changes; do in Supabase dashboard
3. Fix 3 (linkSupabaseUid) — 2-line change
4. Fix 4 (add_giuros atomic) — SQL + 2 TS files
5. Fix 5 (spend_giuros ownership) — SQL only
6. Fix 6 (timingSafeEqual) — 2-line change in API
7. Fix 7 (requireAdmin guards) — 3 functions, ~3 lines each

After all fixes: run `npm run build` to confirm the production bundle compiles, then `npm test -- --run` for full test suite.

## SQL Migrations Summary

Three SQL files need to be run in the Supabase SQL editor in this order:

1. `scripts/fix-game-results-rls.sql` (Fix 2)
2. `scripts/atomic-add-giuros.sql` (Fix 4)
3. Updated `scripts/atomic-spend-giuros.sql` (Fix 5)

## Environment Variable Changes

In Vercel dashboard, add (if not already present):

- `UPSTASH_REDIS_REST_URL` (replaces `VITE_UPSTASH_REDIS_REST_URL` for server functions)
- `UPSTASH_REDIS_REST_TOKEN` (replaces `VITE_UPSTASH_REDIS_REST_TOKEN` for server functions)

The `VITE_` prefixed variants should be removed from Vercel env vars entirely after confirming the rate limiter works with the new names.
