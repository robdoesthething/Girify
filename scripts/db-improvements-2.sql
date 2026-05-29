-- ============================================================================
-- DB Improvements 2 — Run in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- FIX 1 (High): get_leaderboard RPC — server-side aggregation
-- The previous client fetched ALL matching rows for weekly/monthly/all periods,
-- loaded them into JS memory, and aggregated there. On a large table this meant
-- transferring thousands (or millions) of rows over the network.
-- This RPC does the GROUP BY in Postgres and returns only the final N rows.
--
-- Logic mirrors the TypeScript aggregation:
--   daily   → best single score per user today (DISTINCT ON)
--   others  → sum of each user's best-per-calendar-day scores
-- ============================================================================

CREATE OR REPLACE FUNCTION get_leaderboard(
  p_period TEXT    DEFAULT 'all',
  p_limit  INTEGER DEFAULT 100
)
RETURNS TABLE(
  username    TEXT,
  score       BIGINT,
  avg_time    NUMERIC,
  games_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  CASE p_period
    WHEN 'daily'   THEN v_start_date := date_trunc('day',   NOW() AT TIME ZONE 'UTC');
    WHEN 'weekly'  THEN v_start_date := date_trunc('week',  NOW() AT TIME ZONE 'UTC');
    WHEN 'monthly' THEN v_start_date := date_trunc('month', NOW() AT TIME ZONE 'UTC');
    ELSE                v_start_date := NULL;
  END CASE;

  IF p_period = 'daily' THEN
    -- Best single score per user within the day window, ordered by score descending.
    -- DISTINCT ON picks the highest score per user (first row after ORDER BY score DESC),
    -- then the outer query re-orders the result set by score so the caller gets a ranked list.
    RETURN QUERY
    SELECT sub.username, sub.score, sub.avg_time, sub.games_count
    FROM (
      SELECT DISTINCT ON (gr.username)
        gr.username,
        gr.score::BIGINT,
        gr.time_taken::NUMERIC AS avg_time,
        1::BIGINT              AS games_count
      FROM game_results gr
      WHERE gr.username IS NOT NULL
        AND (v_start_date IS NULL OR gr.played_at >= v_start_date)
      ORDER BY gr.username, gr.score DESC, gr.time_taken ASC NULLS LAST
    ) sub
    ORDER BY sub.score DESC, sub.avg_time ASC NULLS LAST
    LIMIT p_limit;
  ELSE
    -- Sum of best-per-calendar-day scores per user
    RETURN QUERY
    WITH daily_best AS (
      SELECT
        gr.username,
        DATE(gr.played_at AT TIME ZONE 'UTC')  AS play_date,
        MAX(gr.score)                           AS best_score,
        MIN(gr.time_taken)                      AS best_time
      FROM game_results gr
      WHERE gr.username IS NOT NULL
        AND (v_start_date IS NULL OR gr.played_at >= v_start_date)
      GROUP BY gr.username, DATE(gr.played_at AT TIME ZONE 'UTC')
    )
    SELECT
      db.username,
      SUM(db.best_score)::BIGINT        AS score,
      AVG(db.best_time)::NUMERIC(10, 2) AS avg_time,
      COUNT(*)::BIGINT                  AS games_count
    FROM daily_best db
    GROUP BY db.username
    ORDER BY score DESC
    LIMIT p_limit;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION get_leaderboard(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_leaderboard(TEXT, INTEGER) TO anon, authenticated;

-- Index supporting both leaderboard paths: covers the username IS NOT NULL filter,
-- allows the daily DISTINCT ON to avoid a sort, and lets the non-daily GROUP BY
-- range-scan by played_at without a full sequential scan.
CREATE INDEX IF NOT EXISTS idx_game_results_username_played_at
ON game_results (username, played_at DESC)
WHERE username IS NOT NULL;

-- ============================================================================
-- FIX 2 (High): record_game_result RPC — atomic stats update
-- updateUserGameStats previously read the user row, computed new values in JS,
-- then wrote back. Two concurrent game saves could both read the same stale
-- values, and whichever wrote last would silently drop the other's increment.
-- This RPC increments games_played/total_score in a single UPDATE, and uses
-- GREATEST() so best_score and max_streak never go backwards.
-- ============================================================================

CREATE OR REPLACE FUNCTION record_game_result(
  p_username       TEXT,
  p_score          INTEGER,
  p_streak         INTEGER,
  p_last_play_date TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ownership check is folded into the UPDATE WHERE clause — atomic, no TOCTOU gap.
  -- When auth.uid() IS NULL (service-role caller), the supabase_uid condition is skipped.
  UPDATE users
  SET
    games_played   = COALESCE(games_played,  0) + 1,
    total_score    = COALESCE(total_score,   0) + p_score,
    best_score     = GREATEST(COALESCE(best_score,  0), p_score),
    streak         = p_streak,
    max_streak     = GREATEST(COALESCE(max_streak,  0), p_streak),
    last_play_date = p_last_play_date::DATE
  WHERE username = p_username
    AND (auth.uid() IS NULL OR supabase_uid = auth.uid());

  IF NOT FOUND THEN
    -- Either user not found or ownership check failed — return the same error to avoid enumeration.
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized or user not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION record_game_result(TEXT, INTEGER, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_game_result(TEXT, INTEGER, INTEGER, TEXT) TO authenticated;

-- ============================================================================
-- FIX 3 (Medium): friend_count trigger
-- Previously maintained client-side via explicit increments/decrements.
-- This trigger keeps the counter in sync automatically for any INSERT or DELETE
-- on the friendships table, including server-side or admin operations.
-- ============================================================================

CREATE OR REPLACE FUNCTION trg_sync_friend_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET friend_count = COALESCE(friend_count, 0) + 1 WHERE username = NEW.user_a;
    UPDATE users SET friend_count = COALESCE(friend_count, 0) + 1 WHERE username = NEW.user_b;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET friend_count = GREATEST(COALESCE(friend_count, 0) - 1, 0) WHERE username = OLD.user_a;
    UPDATE users SET friend_count = GREATEST(COALESCE(friend_count, 0) - 1, 0) WHERE username = OLD.user_b;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_friend_count ON friendships;
CREATE TRIGGER trg_update_friend_count
AFTER INSERT OR DELETE ON friendships
FOR EACH ROW EXECUTE FUNCTION trg_sync_friend_count();

-- Backfill: recompute all friend_count values from the current friendships table
UPDATE users u
SET friend_count = (
  SELECT COUNT(*)
  FROM friendships f
  WHERE f.user_a = u.username OR f.user_b = u.username
);

-- ============================================================================
-- FIX 4 (Low): UNIQUE index on users.email
-- getUserByEmail uses .single() which errors if multiple rows match.
-- A partial unique index on non-null emails prevents this at the DB level.
-- If this fails with "could not create unique index", there are duplicate emails
-- in the table — investigate before re-running.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
ON users(email)
WHERE email IS NOT NULL;
