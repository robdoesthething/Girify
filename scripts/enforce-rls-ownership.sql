-- ============================================================================
-- Enforce RLS Ownership via Custom JWT (Firebase UID → Supabase JWT)
-- ============================================================================
--
-- PREREQUISITE: The app now mints Supabase-compatible JWTs via POST /api/auth/token.
-- These JWTs have `sub` = Firebase UID and `role` = "authenticated".
-- This means `current_setting('request.jwt.claims', true)::json ->> 'sub'`
-- now correctly returns the Firebase UID, and all existing JWT-scoped
-- policies in the schema finally work.
--
-- This script:
-- 1. Drops permissive fallback policies (WITH CHECK (true)) that were added
--    as workarounds when the anon key couldn't carry Firebase UIDs.
-- 2. Adds proper JWT-based ownership policies where missing.
-- 3. Fixes the game_results INSERT policy that used auth.uid().
--
-- RUN THIS IN SUPABASE SQL EDITOR AFTER deploying the /api/auth/token endpoint.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. GAME_RESULTS: Replace permissive INSERT with JWT ownership check
-- ============================================================================

-- Drop the permissive fallback policies
DROP POLICY IF EXISTS "Enable insert for all users" ON game_results;
DROP POLICY IF EXISTS "Users can insert own game results" ON game_results;
-- Drop the auth.uid()-based policy (doesn't work with custom JWT sub)
DROP POLICY IF EXISTS "Users can insert their own results" ON game_results;

-- Add JWT-based ownership: user_id must match the authenticated user's username
CREATE POLICY "Users can insert own game results" ON game_results
FOR INSERT TO public
WITH CHECK (
  user_id IS NULL  -- Allow anonymous game results
  OR user_id IN (
    SELECT username FROM users
    WHERE uid = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  )
);

-- ============================================================================
-- 2. USERS: Replace permissive INSERT/UPDATE with JWT ownership
-- ============================================================================

-- Drop permissive fallback policies from fix-supabase-permissions.sql
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Users can only create their own profile (uid must match JWT sub)
CREATE POLICY "Users can create own profile" ON users
FOR INSERT TO public
WITH CHECK (
  uid = (current_setting('request.jwt.claims', true)::json ->> 'sub')
);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE TO public
USING (
  uid = (current_setting('request.jwt.claims', true)::json ->> 'sub')
)
WITH CHECK (
  uid = (current_setting('request.jwt.claims', true)::json ->> 'sub')
);

-- ============================================================================
-- 3. FRIEND_REQUESTS: Drop permissive "App can ..." fallbacks
-- ============================================================================
-- The JWT-scoped policies from supabase-schema.sql now work:
--   "Users can view their own requests" (SELECT)
--   "Users can create requests from themselves" (INSERT)
--   "Users can update requests to themselves" (UPDATE)
--   "Users can delete their own requests" (DELETE)

DROP POLICY IF EXISTS "App can create friend requests" ON friend_requests;
DROP POLICY IF EXISTS "App can update friend requests" ON friend_requests;
DROP POLICY IF EXISTS "App can delete friend requests" ON friend_requests;
DROP POLICY IF EXISTS "App can read friend requests" ON friend_requests;

-- ============================================================================
-- 4. FRIENDSHIPS: Drop permissive "App can ..." fallbacks
-- ============================================================================
-- The JWT-scoped policies from supabase-schema.sql now work:
--   "Users can view friendships they're part of" (SELECT)
--   "Users can create friendships involving themselves" (INSERT)
--   "Users can delete friendships they're part of" (DELETE)

DROP POLICY IF EXISTS "App can create friendships" ON friendships;
DROP POLICY IF EXISTS "App can delete friendships" ON friendships;
DROP POLICY IF EXISTS "App can read friendships" ON friendships;

-- ============================================================================
-- 5. REFERRALS: Replace permissive INSERT with JWT ownership
-- ============================================================================

-- Drop the permissive fallback from harden-rls-policies.sql
DROP POLICY IF EXISTS "Users can create referrals" ON referrals;
-- Drop the overly-permissive ALL policy (already dropped by harden script, but safe to re-drop)
DROP POLICY IF EXISTS "Service role can manage referrals" ON referrals;

-- Users can only create referrals where they are the referrer
CREATE POLICY "Users can create own referrals" ON referrals
FOR INSERT TO public
WITH CHECK (
  referrer IN (
    SELECT username FROM users
    WHERE uid = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  )
);

-- ============================================================================
-- 6. ACTIVITY_FEED: Drop permissive fallbacks
-- ============================================================================
-- The JWT-scoped policy from supabase-schema.sql now works:
--   "Users can create their own activity" (INSERT, JWT check)
--   "Activity feed is viewable by non-blocked users" (SELECT, JWT check)

DROP POLICY IF EXISTS "Users can insert own activity" ON activity_feed;
DROP POLICY IF EXISTS "Users can read activity feed" ON activity_feed;

-- ============================================================================
-- 7. USER_READ_ANNOUNCEMENTS: Drop permissive fallback
-- ============================================================================
-- JWT-scoped policies from supabase-schema.sql now work:
--   "Users can view their own read announcements" (SELECT)
--   "Users can mark announcements as read" (INSERT)

DROP POLICY IF EXISTS "Users can manage read status" ON user_read_announcements;

-- ============================================================================
-- 8. USER_GAMES: Drop permissive fallbacks
-- ============================================================================
-- JWT-scoped policies from supabase-schema.sql now work:
--   "Users can view their own games" (SELECT)
--   "Users can insert their own games" (INSERT)

DROP POLICY IF EXISTS "Users can insert own games" ON user_games;
DROP POLICY IF EXISTS "Anyone can read user games" ON user_games;

-- ============================================================================
-- VERIFY: List all policies after changes
-- ============================================================================

SELECT tablename, policyname, roles, cmd,
  CASE WHEN qual = 'true' THEN '!! OPEN' ELSE 'scoped' END as using_check,
  CASE WHEN with_check = 'true' THEN '!! OPEN' ELSE
    CASE WHEN with_check IS NULL THEN '-' ELSE 'scoped' END
  END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
--
-- After running this script, all INSERT/UPDATE/DELETE policies enforce
-- ownership via JWT claims. The custom JWT minted by /api/auth/token
-- sets `sub` = Firebase UID, which matches the `uid` column in the
-- `users` table.
--
-- REMAINING PERMISSIVE POLICIES (intentional):
--   - game_results SELECT: Public (leaderboard needs this)
--   - users SELECT: Public (profile lookups)
--   - announcements SELECT: Public with is_active filter
--   - districts SELECT: Public
--   - shop_items SELECT: Public
--   - achievements SELECT: Public
--   - quests SELECT: Public
--   - badge_stats SELECT: Public
--
-- ANONYMOUS USERS:
--   Anonymous game results (user_id IS NULL) are still allowed by the
--   game_results INSERT policy. This supports unauthenticated play.
--
-- ============================================================================
