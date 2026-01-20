-- ============================================================================
-- Fix Multiple Issues Script
-- ============================================================================
-- Run this in Supabase SQL Editor to fix:
-- 1. Admin panel access (add your Firebase UID to admins table)
-- 2. Remove test announcements
-- 3. Ensure RLS policies are correct
-- ============================================================================

-- ============================================================================
-- STEP 1: Delete Test Announcements
-- ============================================================================

DELETE FROM announcements WHERE title LIKE '[TEST]%';

-- Verify deletion
SELECT COUNT(*) as remaining_test_announcements FROM announcements WHERE title LIKE '[TEST]%';

-- ============================================================================
-- STEP 2: Add Your Firebase UID to Admins Table
-- ============================================================================

-- IMPORTANT: Replace 'YOUR_FIREBASE_UID' with your actual Firebase UID
-- You can find it in Firebase Console > Authentication > Users
-- Or check browser console when logged in (look for user.uid)

-- First, let's see what users exist
SELECT username, uid, email FROM users ORDER BY created_at DESC LIMIT 10;

-- Example: Add yourself as admin (REPLACE THE UID!)
-- INSERT INTO admins (uid, username) VALUES ('YOUR_FIREBASE_UID', 'your_username');

-- ============================================================================
-- STEP 3: Ensure Admins Table Exists and Has Correct RLS
-- ============================================================================

-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS admins (
    uid TEXT PRIMARY KEY,
    username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Admins are viewable by admins" ON admins;
DROP POLICY IF EXISTS "Anyone can check admin status" ON admins;

-- Allow anyone to SELECT from admins (needed for admin check)
-- This is safe because we're only exposing UIDs
CREATE POLICY "Anyone can check admin status" ON admins
    FOR SELECT USING (true);

-- ============================================================================
-- STEP 4: Ensure Announcements RLS is Correct
-- ============================================================================

-- Drop and recreate announcement policies
DROP POLICY IF EXISTS "Anyone can read announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON announcements;

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active announcements
CREATE POLICY "Anyone can read announcements" ON announcements
    FOR SELECT USING (is_active = true);

-- Create or replace is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    current_uid TEXT;
BEGIN
    -- Get the current user's Firebase UID from the JWT
    current_uid := current_setting('request.jwt.claims', true)::json->>'sub';

    IF current_uid IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM admins WHERE uid = current_uid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow admins to manage announcements
CREATE POLICY "Admins can manage announcements" ON announcements
    FOR ALL USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- STEP 5: Verify Everything
-- ============================================================================

-- Check announcements
SELECT id, title, is_active, priority FROM announcements ORDER BY created_at DESC LIMIT 10;

-- Check admins
SELECT * FROM admins;

-- ============================================================================
-- MANUAL STEP: Add yourself as admin
-- ============================================================================
-- After finding your UID from the users table or Firebase Console, run:
--
-- INSERT INTO admins (uid, username)
-- VALUES ('your_firebase_uid_here', 'your_username_here')
-- ON CONFLICT (uid) DO NOTHING;
--
-- ============================================================================
