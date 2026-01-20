-- ============================================================================
-- Seed Test Data for Girify
-- ============================================================================
-- This script populates the database with sample data for testing:
-- 1. Sample announcements (news)
-- 2. Sample friendships (if users exist)
-- 3. Sample activity feed items
--
-- Run this in Supabase SQL Editor AFTER fix-supabase-permissions.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: Insert Sample Announcements
-- ============================================================================

-- Clear existing test announcements (optional - comment out if you want to keep existing ones)
-- DELETE FROM announcements WHERE title LIKE '[TEST]%';

-- Insert sample announcements with correct dates
-- Priority must be: 'low', 'normal', 'high', or 'urgent'
INSERT INTO announcements (title, body, priority, is_active, publish_date, expiry_date, target_audience) VALUES
(
  '[TEST] Welcome to Girify!',
  'Test your knowledge of Barcelona streets in this exciting daily challenge. Can you identify all the streets?',
  'normal',
  true,
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '30 days',
  'all'
),
(
  '[TEST] New Features Coming Soon',
  'We''re working on exciting new features including district battles, custom challenges, and more cosmetic items. Stay tuned!',
  'low',
  true,
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '14 days',
  'all'
),
(
  '[TEST] Weekly Leaderboard Reset',
  'The weekly leaderboard has been reset. Compete with your friends to reach the top this week!',
  'normal',
  true,
  NOW() - INTERVAL '3 days',
  NOW() + INTERVAL '4 days',
  'all'
),
(
  '[TEST] Special Event: Double Giuros Weekend',
  'This weekend only - earn double Giuros for every game you complete! Don''t miss out on this limited-time opportunity.',
  'high',
  true,
  NOW() - INTERVAL '12 hours',
  NOW() + INTERVAL '2 days',
  'all'
);

-- ============================================================================
-- STEP 2: Check for Existing Users
-- ============================================================================

-- First, let's see what users we have
SELECT username, created_at, best_score, district
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 3: Insert Sample Friendships (Manual - Replace with actual usernames)
-- ============================================================================

-- IMPORTANT: Replace 'user1', 'user2', etc. with actual usernames from your database
-- Uncomment and modify the following lines after checking existing users:

-- Example (REPLACE WITH ACTUAL USERNAMES):
-- INSERT INTO friendships (user1, user2, since) VALUES
-- ('actual_username_1', 'actual_username_2', NOW() - INTERVAL '5 days'),
-- ('actual_username_1', 'actual_username_3', NOW() - INTERVAL '3 days'),
-- ('actual_username_2', 'actual_username_3', NOW() - INTERVAL '1 day')
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 4: Insert Sample Activity Feed Items (Manual - Replace with actual usernames)
-- ============================================================================

-- IMPORTANT: Replace 'user1', 'user2', etc. with actual usernames from your database
-- Uncomment and modify the following lines after checking existing users:

-- Example (REPLACE WITH ACTUAL USERNAMES):
-- INSERT INTO activity_feed (username, type, score, time_taken, created_at) VALUES
-- ('actual_username_1', 'daily_score', 9, 15.5, NOW() - INTERVAL '2 hours'),
-- ('actual_username_2', 'daily_score', 10, 12.3, NOW() - INTERVAL '4 hours'),
-- ('actual_username_3', 'daily_score', 8, 18.7, NOW() - INTERVAL '6 hours');

-- Example for badge earned activity:
-- INSERT INTO activity_feed (username, type, badge_name, created_at) VALUES
-- ('actual_username_1', 'badge_earned', 'Perfect Score', NOW() - INTERVAL '1 day'),
-- ('actual_username_2', 'badge_earned', 'Speed Demon', NOW() - INTERVAL '3 days');

-- ============================================================================
-- STEP 5: Verify Inserted Data
-- ============================================================================

-- Check announcements
SELECT id, title, is_active, publish_date, priority
FROM announcements
WHERE title LIKE '[TEST]%'
ORDER BY publish_date DESC;

-- Check friendships count
SELECT COUNT(*) as total_friendships
FROM friendships;

-- Check activity feed count
SELECT COUNT(*) as total_activities
FROM activity_feed;

-- Check recent activity
SELECT username, type, score, badge_name, created_at
FROM activity_feed
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 6: (Optional) Create Test Users
-- ============================================================================

-- If you need to create test users for development, uncomment and modify:
-- NOTE: You'll need to use proper UIDs from Firebase Auth, or use test UIDs

-- INSERT INTO users (username, uid, created_at, best_score, total_score, streak, district) VALUES
-- ('testuser1', 'test_uid_1', NOW() - INTERVAL '10 days', 10, 85, 5, 'eixample'),
-- ('testuser2', 'test_uid_2', NOW() - INTERVAL '8 days', 9, 72, 3, 'gracia'),
-- ('testuser3', 'test_uid_3', NOW() - INTERVAL '5 days', 10, 90, 7, 'ciutat_vella')
-- ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- After running this script:
-- 1. Go to /news page to verify announcements appear
-- 2. Check the friends page to see if friendships are visible
-- 3. Verify activity feed shows recent activities
--
-- To add more test data:
-- 1. Check existing users: SELECT username FROM users LIMIT 20;
-- 2. Use actual usernames in the INSERT statements above
-- 3. Uncomment and run the relevant sections
--
-- Remember: This is TEST data. Remove [TEST] prefix for production announcements.
--
-- ============================================================================
