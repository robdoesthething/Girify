-- RLS Policies Update for Friendship/Block Fixes AND Game Results
-- Run this script to apply the necessary RLS changes without re-running the full schema.

-- ============================================================================
-- 1. BLOCKS & FRIENDSHIPS
-- ============================================================================

-- Enable RLS on blocks (if not already enabled)
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own blocks" ON blocks;
DROP POLICY IF EXISTS "Users can view blocks involving themselves" ON blocks;
DROP POLICY IF EXISTS "Users can manage their own blocks" ON blocks;

-- Re-create policies
CREATE POLICY "Users can view blocks involving themselves" ON blocks
    FOR SELECT USING (
        blocker IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
        OR
        blocked IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Users can manage their own blocks" ON blocks
    FOR ALL USING (
        blocker IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- Drop existing policies for activity_feed
DROP POLICY IF EXISTS "Activity feed is viewable by everyone" ON activity_feed;
DROP POLICY IF EXISTS "Activity feed is viewable by non-blocked users" ON activity_feed;

-- Re-create policy with block check
CREATE POLICY "Activity feed is viewable by non-blocked users" ON activity_feed
    FOR SELECT USING (
        NOT EXISTS (
            SELECT 1 FROM blocks
            WHERE (
                blocker = activity_feed.username -- Feed owner blocked me
                AND
                blocked = (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub') -- Me
            ) OR (
                blocked = activity_feed.username -- I blocked feed owner
                AND
                blocker = (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub') -- Me
            )
        )
    );

-- ============================================================================
-- 2. GAME RESULTS (Fix for Leaderboard Recording)
-- ============================================================================

-- Enable RLS
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- Drop potential existing policies
DROP POLICY IF EXISTS "Game results are viewable by everyone" ON game_results;
DROP POLICY IF EXISTS "Users can insert their own game results" ON game_results;

-- Policy 1: Everyone can view game results (for Leaderboards)
CREATE POLICY "Game results are viewable by everyone" ON game_results
    FOR SELECT USING (true);

-- Policy 2: Users can insert their own game results
-- We check that the user_id in the row matches the authenticated user's username
CREATE POLICY "Users can insert their own game results" ON game_results
    FOR INSERT WITH CHECK (
        user_id IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- Policy 3: Users can update their own game results (if needed, though games are usually immutable log)
-- Skipping update policy for now as game history is usually append-only
