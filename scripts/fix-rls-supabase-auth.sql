-- ============================================================================
-- Fix RLS Policies for Supabase Auth
-- ============================================================================
-- The original policies used current_setting('request.jwt.claims')::json->>'sub'
-- which matched the Firebase UID in the `uid` column. After migrating to
-- Supabase Auth, we use auth.uid() and the `supabase_uid` column.
--
-- This script:
-- 1. Fixes user_read_announcements policies
-- 2. Ensures users UPDATE policy works for users with supabase_uid set
-- 3. Backfills supabase_uid for users that have a matching email in auth.users
-- ============================================================================

-- ============================================================================
-- STEP 1: Backfill supabase_uid for existing users matched by email
-- ============================================================================
UPDATE users
SET supabase_uid = au.id
FROM auth.users au
WHERE users.email = au.email
  AND users.supabase_uid IS NULL;

-- ============================================================================
-- STEP 2: Fix user_read_announcements policies
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own read announcements" ON user_read_announcements;
DROP POLICY IF EXISTS "Users can mark announcements as read" ON user_read_announcements;
DROP POLICY IF EXISTS "Users can manage read status" ON user_read_announcements;

-- New SELECT policy: user can read their own read-status rows
CREATE POLICY "Users can view their own read announcements" ON user_read_announcements
FOR SELECT TO authenticated
USING (
    username IN (
        SELECT username FROM users
        WHERE supabase_uid = auth.uid()
    )
);

-- New INSERT policy: user can mark announcements as read for themselves
CREATE POLICY "Users can mark announcements as read" ON user_read_announcements
FOR INSERT TO authenticated
WITH CHECK (
    username IN (
        SELECT username FROM users
        WHERE supabase_uid = auth.uid()
    )
);

-- ============================================================================
-- STEP 3: Ensure users UPDATE policy exists and works
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
-- VERIFY
-- ============================================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('users', 'user_read_announcements')
ORDER BY tablename, policyname;
