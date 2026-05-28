-- ============================================================================
-- Merge @robertosnc9113 (35 games, email) → robertosnc9113 (clean username)
-- Run the whole block as a single transaction.
-- ============================================================================

BEGIN;

-- Step 0: Free the email on the source row so the unique constraint doesn't
-- fire when we assign it to the destination row in Step 1.
UPDATE users SET email = NULL WHERE username = '@robertosnc9113';

-- Step 1: Copy all meaningful columns from @robertosnc9113 to robertosnc9113.
-- robertosnc9113 exists but is empty (0 games, NULL email after the dedup fix).
UPDATE users
SET
  email                 = src.email,
  real_name             = src.real_name,
  avatar_id             = src.avatar_id,
  joined_at             = src.joined_at,
  games_played          = src.games_played,
  best_score            = src.best_score,
  total_score           = src.total_score,
  referral_code         = src.referral_code,
  streak                = src.streak,
  max_streak            = src.max_streak,
  last_play_date        = src.last_play_date,
  last_login_date       = src.last_login_date,
  giuros                = src.giuros,
  purchased_cosmetics   = src.purchased_cosmetics,
  equipped_cosmetics    = src.equipped_cosmetics,
  equipped_badges       = src.equipped_badges,
  language              = src.language,
  theme                 = src.theme,
  notification_settings = src.notification_settings,
  district              = src.district,
  team                  = src.team,
  friend_count          = src.friend_count,
  referred_by           = src.referred_by,
  banned                = src.banned
FROM (SELECT * FROM users WHERE username = '@robertosnc9113') src
WHERE users.username = 'robertosnc9113';

-- Step 2: Clear any empty child rows that belong to the 0-game account
-- (prevents unique-constraint conflicts in the next step)
DELETE FROM badge_stats             WHERE username = 'robertosnc9113';
DELETE FROM user_quests             WHERE username = 'robertosnc9113';
DELETE FROM activity_feed           WHERE username = 'robertosnc9113';
DELETE FROM user_read_announcements WHERE username = 'robertosnc9113';
DELETE FROM feedback                WHERE username = 'robertosnc9113';

-- Step 3: Redirect all child-table FK references from @robertosnc9113 → robertosnc9113.
-- robertosnc9113 is a valid users row throughout, so FK constraints are satisfied.
UPDATE game_results       SET username   = 'robertosnc9113' WHERE username   = '@robertosnc9113';
UPDATE badge_stats        SET username   = 'robertosnc9113' WHERE username   = '@robertosnc9113';
UPDATE user_games         SET username   = 'robertosnc9113' WHERE username   = '@robertosnc9113';
UPDATE purchased_badges   SET username   = 'robertosnc9113' WHERE username   = '@robertosnc9113';
UPDATE activity_feed      SET username   = 'robertosnc9113' WHERE username   = '@robertosnc9113';
UPDATE user_read_announcements SET username = 'robertosnc9113' WHERE username = '@robertosnc9113';
UPDATE feedback           SET username   = 'robertosnc9113' WHERE username   = '@robertosnc9113';
UPDATE user_quests        SET username   = 'robertosnc9113' WHERE username   = '@robertosnc9113';
UPDATE friendships        SET user_a     = 'robertosnc9113' WHERE user_a     = '@robertosnc9113';
UPDATE friendships        SET user_b     = 'robertosnc9113' WHERE user_b     = '@robertosnc9113';
UPDATE friend_requests    SET from_user  = 'robertosnc9113' WHERE from_user  = '@robertosnc9113';
UPDATE friend_requests    SET to_user    = 'robertosnc9113' WHERE to_user    = '@robertosnc9113';
UPDATE users              SET referred_by = 'robertosnc9113' WHERE referred_by = '@robertosnc9113';

-- Step 4: Delete the now-orphaned @-prefixed row (nothing references it anymore)
DELETE FROM users WHERE username = '@robertosnc9113';

COMMIT;

-- Verify: should return exactly one row with your email and 35 games
SELECT username, email, games_played, best_score, supabase_uid
FROM users
WHERE username = 'robertosnc9113';
