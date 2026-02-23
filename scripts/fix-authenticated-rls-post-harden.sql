-- ============================================================================
-- Fix RLS Policies After Supabase Auth Migration
-- ============================================================================
-- Context:
-- harden-rls-policies.sql (2026-02-06) removed `authenticated`-role policies
-- because at the time the app used Firebase Auth + anon key, so `authenticated`
-- was inert. Now that we use Supabase Auth natively, `authenticated` is the
-- active role and those policies must be restored.
--
-- Missing policies causing bugs:
--   1. users UPDATE  → district/profile updates silently fail
--   2. user_read_announcements ALL → news modal reappears on every refresh
--
-- Run this in the Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. users — restore UPDATE ownership policy
-- ============================================================================
-- Allows authenticated users to update their own row.
-- Matches by supabase_uid (already-linked users) OR by email (first login).

DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "users_link_supabase_uid" ON users;

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

-- ============================================================================
-- 2. user_read_announcements — restore INSERT + SELECT policies
-- ============================================================================
-- Without these, marking an announcement as read silently fails and
-- getReadAnnouncementIds returns [] — so the news modal reappears every session.

DROP POLICY IF EXISTS "Users can manage read status" ON user_read_announcements;
DROP POLICY IF EXISTS "Users can insert read status" ON user_read_announcements;
DROP POLICY IF EXISTS "Users can read own read status" ON user_read_announcements;

CREATE POLICY "Users can insert read status" ON user_read_announcements
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can read own read status" ON user_read_announcements
FOR SELECT TO authenticated
USING (true);

-- ============================================================================
-- Verify
-- ============================================================================

SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'user_read_announcements')
ORDER BY tablename, policyname;

COMMIT;
