-- ============================================================================
-- Migrate RLS Policies to Supabase Auth
-- ============================================================================
-- Run this AFTER deploying the Supabase Auth migration and confirming
-- that existing users have their supabase_uid column populated.
--
-- This replaces the overly-permissive WITH CHECK (true) policies with
-- proper ownership checks using auth.uid(), which now works natively
-- because we use Supabase Auth instead of Firebase Auth.
-- ============================================================================

-- ============================================================================
-- STEP 1: Users table - tighten update policy
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "users_link_supabase_uid" ON users;

-- Users can update their own profile if:
-- 1. supabase_uid matches (already linked), OR
-- 2. email matches and supabase_uid is NULL (first-login linking)
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE TO authenticated
USING (
    supabase_uid = auth.uid()
    OR (supabase_uid IS NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
)
WITH CHECK (
    supabase_uid = auth.uid()
    OR (supabase_uid IS NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Users can insert their own profile (first login)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================================================
-- STEP 2: game_results - ownership on insert
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own game results" ON game_results;

CREATE POLICY "Users can insert own game results" ON game_results
FOR INSERT TO authenticated
WITH CHECK (true);
-- Note: game_results.user_id is a username, not a UID.
-- Ownership validation still happens in app code via assertCurrentUser().

-- ============================================================================
-- STEP 3: activity_feed - ownership on insert
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own activity" ON activity_feed;

CREATE POLICY "Users can insert own activity" ON activity_feed
FOR INSERT TO authenticated
WITH CHECK (true);
-- Note: activity_feed.username is checked in app code via publishActivity().

-- ============================================================================
-- STEP 4: admins table - check against supabase_uid
-- ============================================================================

DROP POLICY IF EXISTS "Admins can read own record" ON admins;
DROP POLICY IF EXISTS "Authenticated can read admins" ON admins;

-- Allow authenticated users to check if they are admin
-- The admins table needs to be updated to store supabase_uid instead of firebase uid
CREATE POLICY "Authenticated can read admins" ON admins
FOR SELECT TO authenticated
USING (true);

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- After running this script:
-- 1. Update the admins table to use Supabase Auth UIDs instead of Firebase UIDs
-- 2. Test that profile updates work (user can only update their own)
-- 3. Test that game results still save correctly
-- 4. Test that admin panel still works
--
-- The key improvement: Users table UPDATE is now properly locked down to
-- supabase_uid = auth.uid(), which was impossible with Firebase Auth.
--
-- Tables that still use WITH CHECK (true) on INSERT:
--   - game_results: user_id is a username string, not a UID
--   - activity_feed: username is validated in app code
--   - user_games: username is validated in app code
-- These could be further tightened with a subquery like:
--   WITH CHECK (user_id IN (SELECT username FROM users WHERE supabase_uid = auth.uid()))
-- but that adds query overhead. Consider adding this in a future migration.
-- ============================================================================
