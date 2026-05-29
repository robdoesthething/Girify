-- ============================================================================
-- Review Findings — Security & Correctness Fixes
-- Run in Supabase SQL Editor after db-improvements-2.sql
-- ============================================================================

-- ============================================================================
-- FIX 1: game_results deduplication
-- Adds a play_date generated column and a unique index so that upsert with
-- ON CONFLICT DO NOTHING can prevent duplicate rows when a save succeeds on
-- the DB side but the HTTP response is lost before the client receives it.
-- ============================================================================

-- Generated column from played_at in UTC. STORED so it can be indexed.
ALTER TABLE game_results
ADD COLUMN IF NOT EXISTS play_date DATE
GENERATED ALWAYS AS (DATE(played_at AT TIME ZONE 'UTC')) STORED;

-- Deduplicate any existing rows before creating the unique index.
-- Keeps the row with the highest score per (username, play_date).
DELETE FROM game_results
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY username, DATE(played_at AT TIME ZONE 'UTC')
             ORDER BY score DESC, played_at ASC
           ) AS rn
    FROM game_results
    WHERE username IS NOT NULL
  ) ranked
  WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_game_results_username_play_date
ON game_results (username, play_date)
WHERE username IS NOT NULL;

-- ============================================================================
-- FIX 2: claim_daily_login_bonus — remove caller-supplied bonus amount
-- The original function accepted p_bonus as a parameter, allowing any
-- authenticated user to pass an arbitrary value. The amount now comes
-- exclusively from app_config.daily_login_bonus server-side.
-- ============================================================================

-- Drop the old signature before replacing (parameter set changed)
DROP FUNCTION IF EXISTS claim_daily_login_bonus(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION claim_daily_login_bonus(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today       TEXT    := CURRENT_DATE::TEXT;
  v_bonus       INTEGER;
  v_new_balance INTEGER;
  v_current_bal INTEGER;
BEGIN
  -- Ownership check
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM users WHERE username = p_username AND supabase_uid = auth.uid()
    ) THEN
      RETURN jsonb_build_object('claimed', false, 'error', 'Unauthorized');
    END IF;
  END IF;

  -- Read bonus amount from config — callers cannot influence this value
  SELECT daily_login_bonus INTO v_bonus
  FROM app_config
  LIMIT 1;

  v_bonus := COALESCE(v_bonus, 50);

  -- Atomic: only update if last_login_date < today (or NULL)
  UPDATE users
  SET
    giuros          = COALESCE(giuros, 0) + v_bonus,
    last_login_date = v_today
  WHERE username = p_username
    AND (last_login_date IS NULL OR last_login_date < v_today)
  RETURNING giuros INTO v_new_balance;

  IF NOT FOUND THEN
    SELECT COALESCE(giuros, 0) INTO v_current_bal FROM users WHERE username = p_username;
    RETURN jsonb_build_object('claimed', false, 'bonus', 0, 'new_balance', COALESCE(v_current_bal, 0));
  END IF;

  RETURN jsonb_build_object('claimed', true, 'bonus', v_bonus, 'new_balance', v_new_balance);
END;
$$;

REVOKE ALL ON FUNCTION claim_daily_login_bonus(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_daily_login_bonus(TEXT) TO authenticated;

-- ============================================================================
-- FIX 3: record_game_result — add score bounds validation
-- Prevents authenticated users from inflating stats via direct RPC calls
-- with out-of-range values.
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
  -- Input bounds: reject obviously invalid values early
  IF p_score < 0 OR p_score > 10000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Score out of range');
  END IF;
  IF p_streak < 0 OR p_streak > 365 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Streak out of range');
  END IF;
  IF p_last_play_date::DATE > CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Future date not allowed');
  END IF;

  -- Ownership check folded into WHERE — atomic, no TOCTOU gap.
  -- auth.uid() IS NULL means service-role caller; ownership check is skipped.
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
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized or user not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION record_game_result(TEXT, INTEGER, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_game_result(TEXT, INTEGER, INTEGER, TEXT) TO authenticated;
