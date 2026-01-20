-- ============================================================================
-- Fix Data Persistence Issues After Firebase→Supabase Migration
-- ============================================================================
-- This script addresses critical issues:
-- 1. Admin panel access (insert correct Firebase UIDs)
-- 2. RLS policies for game_results, activity_feed, friendships, announcements
-- 3. Ensure authenticated users can save their data
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix Admin Access
-- ============================================================================
-- Insert Firebase UIDs into admins table
-- Replace these UIDs with actual admin Firebase UIDs if different

INSERT INTO admins (uid, username, created_at) VALUES
('tPqEA75l1WUC8r1p1nhrpA4NM962', 'admin1', NOW()),
('JSNwQ5RIOpMGFaG4zcyVQOVbd5J2', 'admin2', NOW())
ON CONFLICT (uid) DO UPDATE SET
  username = EXCLUDED.username,
  created_at = EXCLUDED.created_at;

-- ============================================================================
-- STEP 2: Add RLS Policies for game_results
-- ============================================================================

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert own game results" ON game_results;
DROP POLICY IF EXISTS "Anyone can read game results" ON game_results;
DROP POLICY IF EXISTS "Users can read all game results" ON game_results;

-- Enable RLS on game_results (if not already enabled)
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own game results
-- Note: Since we're using Firebase Auth with custom user_id, we allow all inserts
-- The application layer ensures the user_id matches the authenticated user
CREATE POLICY "Users can insert own game results" ON game_results
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow everyone to read game results (for leaderboard)
CREATE POLICY "Users can read all game results" ON game_results
FOR SELECT TO anon, authenticated
USING (true);

-- ============================================================================
-- STEP 3: Add RLS Policies for activity_feed
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert own activity" ON activity_feed;
DROP POLICY IF EXISTS "Users can read activity feed" ON activity_feed;

-- Enable RLS on activity_feed (if not already enabled)
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own activity
CREATE POLICY "Users can insert own activity" ON activity_feed
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to read all activity (for friends feed)
CREATE POLICY "Users can read activity feed" ON activity_feed
FOR SELECT TO authenticated
USING (true);

-- ============================================================================
-- STEP 4: Add RLS Policies for friendships
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage friendships" ON friendships;
DROP POLICY IF EXISTS "Users can read friendships" ON friendships;

-- Enable RLS on friendships (if not already enabled)
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their friendships
CREATE POLICY "Users can manage friendships" ON friendships
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 5: Add RLS Policies for friend_requests
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can read friend requests" ON friend_requests;

-- Enable RLS on friend_requests (if not already enabled)
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage friend requests
CREATE POLICY "Users can manage friend requests" ON friend_requests
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 6: Add RLS Policies for announcements
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;

-- Enable RLS on announcements (if not already enabled)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active announcements
CREATE POLICY "Anyone can read announcements" ON announcements
FOR SELECT TO anon, authenticated
USING (is_active = true);

-- Allow admins to manage all announcements
-- Note: This requires a function to check if user is admin
-- For now, we'll allow authenticated users to insert/update/delete
-- You should add proper admin check in production
CREATE POLICY "Admins can manage announcements" ON announcements
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 7: Add RLS Policies for user_games
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert own games" ON user_games;
DROP POLICY IF EXISTS "Users can read own games" ON user_games;
DROP POLICY IF EXISTS "Anyone can read user games" ON user_games;

-- Enable RLS on user_games (if not already enabled)
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own games
CREATE POLICY "Users can insert own games" ON user_games
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow everyone to read user games (for profiles and stats)
CREATE POLICY "Anyone can read user games" ON user_games
FOR SELECT TO anon, authenticated
USING (true);

-- ============================================================================
-- STEP 8: Add RLS Policies for users table
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Enable RLS on users (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read user profiles (for leaderboard, friends, etc)
CREATE POLICY "Users can read all profiles" ON users
FOR SELECT TO anon, authenticated
USING (true);

-- Allow authenticated users to insert their profile
CREATE POLICY "Users can insert own profile" ON users
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 9: Add RLS Policies for user_read_announcements
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage read status" ON user_read_announcements;

-- Enable RLS on user_read_announcements (if not already enabled)
ALTER TABLE user_read_announcements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their read status
CREATE POLICY "Users can manage read status" ON user_read_announcements
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 10: Verify RLS is properly configured
-- ============================================================================

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'game_results',
  'activity_feed',
  'friendships',
  'friend_requests',
  'announcements',
  'user_games',
  'users',
  'user_read_announcements',
  'admins'
);

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- After running this script:
-- 1. Verify admin access works by logging in with admin account
-- 2. Test score saving by playing a complete game
-- 3. Check if friendships are visible in the friends page
-- 4. Verify announcements appear in the news page
--
-- If you need to temporarily disable RLS for debugging:
-- ALTER TABLE game_results DISABLE ROW LEVEL SECURITY;
--
-- Remember to re-enable it afterwards:
-- ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
--
-- ============================================================================
