-- ============================================================================
-- Harden RLS Policies — Security Remediation (2026-02-06)
-- ============================================================================
--
-- CONTEXT:
-- The app uses Firebase Auth but connects to Supabase with the anon key.
-- This means auth.uid() and JWT claims are NOT the Firebase UID in RLS.
-- Ownership checks happen in application code (assertCurrentUser, requireAdmin).
--
-- This script removes the most dangerous policy misconfigurations:
-- 1. Misnamed "Service role" policies that actually grant public write access
-- 2. Catch-all "Enable all access" (ALL) policies → replaced with per-operation
-- 3. Redundant `authenticated` role policies (inert since client uses anon)
-- 4. Duplicate SELECT policies that bypass is_active filters
--
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FIX CONFIG TABLES: Remove public write access
-- ============================================================================
-- These policies are named "Service role" but actually target `public`,
-- meaning any anonymous user can modify app/game configuration.

DROP POLICY IF EXISTS "Service role can update app config" ON app_config;
DROP POLICY IF EXISTS "Service role can update game config" ON game_config;

-- Config should only be writable via Supabase dashboard or service_role key.
-- No new write policy needed — service_role bypasses RLS automatically.

-- ============================================================================
-- 2. FIX REFERRALS: Remove public ALL access
-- ============================================================================
-- "Service role can manage referrals" (public, ALL, true) lets any anonymous
-- user insert, update, or delete ANY referral.

DROP POLICY IF EXISTS "Service role can manage referrals" ON referrals;

-- App needs: INSERT (create referral) and SELECT (view own referrals).
-- The existing JWT-scoped SELECT policy handles reads.
-- Add a public INSERT so the app can still create referrals.
CREATE POLICY "Users can create referrals" ON referrals
FOR INSERT TO public
WITH CHECK (true);

-- ============================================================================
-- 3. FIX ANNOUNCEMENTS: Remove inactive-announcement leak + open write
-- ============================================================================
-- "Announcements are viewable by everyone" (public, SELECT, true) bypasses
-- the is_active filter in "Anyone can read announcements".

DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON announcements;

-- "Admins can manage announcements" (authenticated, ALL, true) lets any
-- authenticated user create/update/delete announcements.
-- Replace with is_admin() check.

DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;

-- Recreate with proper admin check.
-- NOTE: If admin panel uses anon key, admin mutations may need to go through
-- a server-side API endpoint instead. The publishNews.js script uses
-- service_role which bypasses RLS.
CREATE POLICY "Admins can manage announcements" ON announcements
FOR ALL TO public
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- 4. FIX FRIEND_REQUESTS: Remove catch-all, use per-operation policies
-- ============================================================================
-- "Enable all access for friend_requests" (public, ALL, true) and
-- "Users can manage friend requests" (authenticated, ALL, true) both grant
-- unrestricted access including DELETE.

DROP POLICY IF EXISTS "Enable all access for friend_requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can manage friend requests" ON friend_requests;

-- The app needs INSERT, UPDATE, DELETE, SELECT on friend_requests.
-- Proper JWT-scoped policies already exist for each operation on `public` role.
-- However, those JWT checks don't work with the anon key.
-- Add per-operation fallback policies so the app keeps working.
-- These are still permissive but at least explicitly scoped by operation.
CREATE POLICY "App can create friend requests" ON friend_requests
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "App can update friend requests" ON friend_requests
FOR UPDATE TO public
USING (true);

CREATE POLICY "App can delete friend requests" ON friend_requests
FOR DELETE TO public
USING (true);

CREATE POLICY "App can read friend requests" ON friend_requests
FOR SELECT TO public
USING (true);

-- ============================================================================
-- 5. FIX FRIENDSHIPS: Remove catch-all, use per-operation policies
-- ============================================================================

DROP POLICY IF EXISTS "Enable all access for friendships" ON friendships;
DROP POLICY IF EXISTS "Users can manage friendships" ON friendships;

CREATE POLICY "App can create friendships" ON friendships
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "App can delete friendships" ON friendships
FOR DELETE TO public
USING (true);

CREATE POLICY "App can read friendships" ON friendships
FOR SELECT TO public
USING (true);

-- ============================================================================
-- 6. REMOVE REDUNDANT AUTHENTICATED-ROLE POLICIES
-- ============================================================================
-- These were added by fix-supabase-permissions.sql but are inert because
-- the app connects as `anon`, not `authenticated`. They add confusion and
-- in some cases override ownership checks if a Supabase auth session exists.

-- game_results
DROP POLICY IF EXISTS "Users can insert own game results" ON game_results;
DROP POLICY IF EXISTS "Users can read all game results" ON game_results;

-- activity_feed
DROP POLICY IF EXISTS "Users can insert own activity" ON activity_feed;
DROP POLICY IF EXISTS "Users can read activity feed" ON activity_feed;

-- user_games
DROP POLICY IF EXISTS "Users can insert own games" ON user_games;
DROP POLICY IF EXISTS "Anyone can read user games" ON user_games;

-- users
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read all profiles" ON users;

-- user_read_announcements
DROP POLICY IF EXISTS "Users can manage read status" ON user_read_announcements;

-- ============================================================================
-- 7. DEDUPLICATE game_results SELECT policies
-- ============================================================================
-- Three SELECT policies all resolve to true. Keep only one.

DROP POLICY IF EXISTS "Enable read access for all users" ON game_results;
-- Keep: "Game results are viewable by everyone" (public, SELECT, true)
-- Keep: "Users can insert their own game results" (public, INSERT, JWT check)
-- Keep: "Users can insert their own results" (public, INSERT, auth.uid check)
-- Keep: "Enable insert for all users" (public, INSERT, true) — needed for app

-- ============================================================================
-- VERIFY: List all policies after changes
-- ============================================================================

SELECT tablename, policyname, roles, cmd,
  CASE WHEN qual = 'true' THEN '⚠️ OPEN' ELSE '✅ scoped' END as using_check,
  CASE WHEN with_check = 'true' THEN '⚠️ OPEN' ELSE
    CASE WHEN with_check IS NULL THEN '—' ELSE '✅ scoped' END
  END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

COMMIT;

-- ============================================================================
-- REMAINING KNOWN ISSUES (require architecture change to fix)
-- ============================================================================
--
-- These policies are still permissive (WITH CHECK true) because the app
-- connects as anon and JWT ownership checks don't work:
--
--   game_results INSERT  — "Enable insert for all users" (public)
--   users INSERT         — "Service role can insert users" (public)
--   activity_feed INSERT — "Users can create their own activity" (public, JWT*)
--   user_games INSERT    — "Users can insert their own games" (public, JWT*)
--   friend_requests ALL  — per-operation public policies above
--   friendships ALL      — per-operation public policies above
--
--   * JWT checks exist but evaluate to false with anon key
--
-- Application-layer ownership validation (assertCurrentUser) serves as
-- the primary access control for these operations.
--
-- TO PROPERLY FIX: Implement one of:
--   1. Custom JWT: Generate Supabase-compatible JWT from Firebase token
--      containing the Firebase UID as a custom claim. Then RLS can use:
--      auth.jwt()->>'firebase_uid' for ownership checks.
--   2. API proxy: Move all mutations to Vercel API routes that verify
--      Firebase tokens server-side, then use service_role to write.
--   3. Edge Functions: Supabase Edge Functions as a mutation proxy with
--      Firebase token verification.
--
-- ============================================================================
