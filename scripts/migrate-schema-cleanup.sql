-- Schema Cleanup Migration
-- 1. Rename game_results.user_id -> username (consistent with all other tables)
-- 2. Drop users.uid (legacy Firebase UID column, replaced by supabase_uid)
--
-- IMPORTANT: Run in a transaction and verify row counts before committing.
-- BEGIN;
-- <run the statements below>
-- SELECT COUNT(*) FROM game_results; -- verify rows intact
-- SELECT COUNT(*) FROM users WHERE supabase_uid IS NOT NULL; -- verify no uid data lost
-- COMMIT; (or ROLLBACK if anything looks wrong)

-- ============================================================================
-- 1. Rename game_results.user_id -> game_results.username
-- ============================================================================

ALTER TABLE game_results DROP CONSTRAINT IF EXISTS game_results_user_id_fkey;
ALTER TABLE game_results RENAME COLUMN user_id TO username;
ALTER TABLE game_results
  ADD CONSTRAINT game_results_username_fkey
  FOREIGN KEY (username) REFERENCES users(username) ON DELETE SET NULL;

DROP INDEX IF EXISTS game_results_user_id_idx;
CREATE INDEX IF NOT EXISTS game_results_username_idx ON game_results(username);

-- ============================================================================
-- 2. Drop users.uid — update all dependent RLS policies first
-- ============================================================================
-- All policies below were checking: auth.uid() = (SELECT uid FROM users WHERE ...)
-- They are replaced to check supabase_uid instead.

-- badge_stats
DROP POLICY IF EXISTS "Users can manage own badge stats" ON badge_stats;
CREATE POLICY "Users can manage own badge stats" ON badge_stats
  FOR ALL TO authenticated
  USING (auth.uid() = (SELECT supabase_uid FROM users WHERE username = badge_stats.username))
  WITH CHECK (auth.uid() = (SELECT supabase_uid FROM users WHERE username = badge_stats.username));

-- friendships
DROP POLICY IF EXISTS "Users can view friendships they're part of" ON friendships;
CREATE POLICY "Users can view friendships they're part of" ON friendships
  FOR SELECT TO authenticated
  USING (
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = friendships.user1) OR
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = friendships.user2)
  );

DROP POLICY IF EXISTS "Users can create friendships involving themselves" ON friendships;
CREATE POLICY "Users can create friendships involving themselves" ON friendships
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = friendships.user1) OR
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = friendships.user2)
  );

DROP POLICY IF EXISTS "Users can delete friendships they're part of" ON friendships;
CREATE POLICY "Users can delete friendships they're part of" ON friendships
  FOR DELETE TO authenticated
  USING (
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = friendships.user1) OR
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = friendships.user2)
  );

-- friend_requests
DROP POLICY IF EXISTS "Users can view their own requests" ON friend_requests;
CREATE POLICY "Users can view their own requests" ON friend_requests
  FOR SELECT TO authenticated
  USING (
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = friend_requests.from_user) OR
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = friend_requests.to_user)
  );

DROP POLICY IF EXISTS "Users can create requests from themselves" ON friend_requests;
CREATE POLICY "Users can create requests from themselves" ON friend_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = friend_requests.from_user)
  );

DROP POLICY IF EXISTS "Users can update requests to themselves" ON friend_requests;
CREATE POLICY "Users can update requests to themselves" ON friend_requests
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = friend_requests.to_user)
  );

DROP POLICY IF EXISTS "Users can delete their own requests" ON friend_requests;
CREATE POLICY "Users can delete their own requests" ON friend_requests
  FOR DELETE TO authenticated
  USING (
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = friend_requests.from_user)
  );

-- user_games
DROP POLICY IF EXISTS "Users can view their own games" ON user_games;
CREATE POLICY "Users can view their own games" ON user_games
  FOR SELECT TO authenticated
  USING (auth.uid() = (SELECT supabase_uid FROM users WHERE username = user_games.username));

DROP POLICY IF EXISTS "Users can insert their own games" ON user_games;
CREATE POLICY "Users can insert their own games" ON user_games
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = (SELECT supabase_uid FROM users WHERE username = user_games.username));

-- purchased_badges
DROP POLICY IF EXISTS "Users can view their own purchased badges" ON purchased_badges;
CREATE POLICY "Users can view their own purchased badges" ON purchased_badges
  FOR SELECT TO authenticated
  USING (auth.uid() = (SELECT supabase_uid FROM users WHERE username = purchased_badges.username));

DROP POLICY IF EXISTS "Users can manage their own purchased badges" ON purchased_badges;
CREATE POLICY "Users can manage their own purchased badges" ON purchased_badges
  FOR ALL TO authenticated
  USING (auth.uid() = (SELECT supabase_uid FROM users WHERE username = purchased_badges.username))
  WITH CHECK (auth.uid() = (SELECT supabase_uid FROM users WHERE username = purchased_badges.username));

-- feedback
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = (SELECT supabase_uid FROM users WHERE username = feedback.username));

DROP POLICY IF EXISTS "Users can submit feedback" ON feedback;
CREATE POLICY "Users can submit feedback" ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = (SELECT supabase_uid FROM users WHERE username = feedback.username));

-- referrals
DROP POLICY IF EXISTS "Users can view referrals they're involved in" ON referrals;
CREATE POLICY "Users can view referrals they're involved in" ON referrals
  FOR SELECT TO authenticated
  USING (
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = referrals.referrer) OR
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = referrals.referred)
  );

-- activity_feed
DROP POLICY IF EXISTS "Users can create their own activity" ON activity_feed;
CREATE POLICY "Users can create their own activity" ON activity_feed
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = (SELECT supabase_uid FROM users WHERE username = activity_feed.username));

DROP POLICY IF EXISTS "Activity feed is viewable by non-blocked users" ON activity_feed;
CREATE POLICY "Activity feed is viewable by non-blocked users" ON activity_feed
  FOR SELECT TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE blocks.blocker = (SELECT username FROM users WHERE supabase_uid = auth.uid())
        AND blocks.blocked = activity_feed.username
    )
  );

-- blocks
DROP POLICY IF EXISTS "Users can view blocks involving themselves" ON blocks;
CREATE POLICY "Users can view blocks involving themselves" ON blocks
  FOR SELECT TO authenticated
  USING (
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = blocks.blocker) OR
    auth.uid() = (SELECT supabase_uid FROM users WHERE username = blocks.blocked)
  );

DROP POLICY IF EXISTS "Users can manage their own blocks" ON blocks;
CREATE POLICY "Users can manage their own blocks" ON blocks
  FOR ALL TO authenticated
  USING (auth.uid() = (SELECT supabase_uid FROM users WHERE username = blocks.blocker))
  WITH CHECK (auth.uid() = (SELECT supabase_uid FROM users WHERE username = blocks.blocker));

-- user_quests
DROP POLICY IF EXISTS "Users can view their own quest progress" ON user_quests;
CREATE POLICY "Users can view their own quest progress" ON user_quests
  FOR SELECT TO authenticated
  USING (auth.uid() = (SELECT supabase_uid FROM users WHERE username = user_quests.username));

DROP POLICY IF EXISTS "Users can insert their own quest progress" ON user_quests;
CREATE POLICY "Users can insert their own quest progress" ON user_quests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = (SELECT supabase_uid FROM users WHERE username = user_quests.username));

DROP POLICY IF EXISTS "Users can update their own quest progress" ON user_quests;
CREATE POLICY "Users can update their own quest progress" ON user_quests
  FOR UPDATE TO authenticated
  USING (auth.uid() = (SELECT supabase_uid FROM users WHERE username = user_quests.username));

-- Now safe to drop uid
ALTER TABLE users DROP COLUMN IF EXISTS uid;
