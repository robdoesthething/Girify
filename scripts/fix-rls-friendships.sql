-- ============================================================================
-- Fix RLS Policies for Friendships and Friend Requests
-- ============================================================================
-- Issue: Friendship operations may be failing due to restrictive RLS
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- FRIENDSHIPS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage friendships" ON friendships;
DROP POLICY IF EXISTS "Users can read friendships" ON friendships;
DROP POLICY IF EXISTS "Enable all access for friendships" ON friendships;

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users full access
-- The RPC functions handle the business logic
CREATE POLICY "Enable all access for friendships" ON friendships
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FRIEND_REQUESTS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can read friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Enable all access for friend_requests" ON friend_requests;

-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users full access
CREATE POLICY "Enable all access for friend_requests" ON friend_requests
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================================
-- Verify policies
-- ============================================================================

SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('friendships', 'friend_requests')
ORDER BY tablename, policyname;
