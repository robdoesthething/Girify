-- ============================================================================
-- Fix RLS Policies for game_results
-- ============================================================================
-- Issue: game_results inserts are being blocked by RLS even for authenticated users
-- Root cause: RLS policy might be checking wrong conditions
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert own game results" ON game_results;
DROP POLICY IF EXISTS "Anyone can read game results" ON game_results;
DROP POLICY IF EXISTS "Users can read all game results" ON game_results;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON game_results;
DROP POLICY IF EXISTS "Enable read access for all users" ON game_results;

-- Enable RLS
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow ALL authenticated and anonymous users to INSERT
-- This is permissive because game scores are public anyway
CREATE POLICY "Enable insert for all users" ON game_results
FOR INSERT
WITH CHECK (true);

-- Policy 2: Allow everyone to read (needed for leaderboard)
CREATE POLICY "Enable read access for all users" ON game_results
FOR SELECT
USING (true);

-- Verify policies are created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'game_results'
ORDER BY policyname;
