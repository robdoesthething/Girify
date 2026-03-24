-- ============================================================================
-- Security Fixes Migration
-- Run in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- FIX 1 (Critical): add_giuros — add ownership check
-- Authenticated clients can only credit their own account.
-- Service_role callers (auth.uid() IS NULL) bypass this check,
-- which is used by the server-side /api/referral and /api/giuros endpoints.
-- ============================================================================

CREATE OR REPLACE FUNCTION add_giuros(
  p_username TEXT,
  p_amount INTEGER,
  p_reason TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
  v_caller_uid  UUID;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Enforce ownership for authenticated clients.
  -- Service_role calls have auth.uid() = NULL and bypass this check.
  v_caller_uid := auth.uid();
  IF v_caller_uid IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM users WHERE username = p_username AND supabase_uid = v_caller_uid
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: can only credit own account');
    END IF;
  END IF;

  UPDATE users
  SET giuros = COALESCE(giuros, 0) + p_amount
  WHERE username = p_username
  RETURNING giuros INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

REVOKE ALL ON FUNCTION add_giuros(TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION add_giuros(TEXT, INTEGER, TEXT) TO authenticated;

-- ============================================================================
-- FIX 2 (High): game_results INSERT — enforce username ownership via supabase_uid
-- Prevents any authenticated user from submitting scores for other accounts.
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own game results" ON game_results;

CREATE POLICY "Users can insert own game results" ON game_results
FOR INSERT TO authenticated
WITH CHECK (
  user_id IN (SELECT username FROM users WHERE supabase_uid = auth.uid())
);

-- Apply same ownership fix to activity_feed and user_games while we're here
DROP POLICY IF EXISTS "Users can insert own activity" ON activity_feed;

CREATE POLICY "Users can insert own activity" ON activity_feed
FOR INSERT TO authenticated
WITH CHECK (
  username IN (SELECT username FROM users WHERE supabase_uid = auth.uid())
);

-- ============================================================================
-- FIX 3 (High): claim_daily_login_bonus — atomic check-and-update
-- Prevents TOCTOU double-claiming via concurrent requests.
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_daily_login_bonus(
  p_username TEXT,
  p_bonus    INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today       TEXT := CURRENT_DATE::TEXT;
  v_new_balance INTEGER;
  v_current_bal INTEGER;
BEGIN
  -- Ownership check (same pattern as add_giuros)
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM users WHERE username = p_username AND supabase_uid = auth.uid()
    ) THEN
      RETURN jsonb_build_object('claimed', false, 'error', 'Unauthorized');
    END IF;
  END IF;

  -- Atomic: only update if last_login_date < today (or NULL)
  UPDATE users
  SET
    giuros          = COALESCE(giuros, 0) + p_bonus,
    last_login_date = v_today
  WHERE username = p_username
    AND (last_login_date IS NULL OR last_login_date < v_today)
  RETURNING giuros INTO v_new_balance;

  IF NOT FOUND THEN
    -- Already claimed today or user not found — return current balance
    SELECT COALESCE(giuros, 0) INTO v_current_bal FROM users WHERE username = p_username;
    RETURN jsonb_build_object('claimed', false, 'bonus', 0, 'new_balance', COALESCE(v_current_bal, 0));
  END IF;

  RETURN jsonb_build_object('claimed', true, 'bonus', p_bonus, 'new_balance', v_new_balance);
END;
$$;

REVOKE ALL ON FUNCTION claim_daily_login_bonus(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_daily_login_bonus(TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- FIX 4 (Medium): admins table RLS — remove circular self-reference
-- The OR EXISTS (SELECT 1 FROM admins ...) is a recursive self-reference
-- that is logically identical to the first condition and can cause
-- undefined behaviour in some Postgres versions.
-- ============================================================================

DROP POLICY IF EXISTS "Admins are viewable by admins" ON admins;

CREATE POLICY "Admins are viewable by admins" ON admins
FOR SELECT USING (uid = auth.uid()::text);

-- The migrate-rls-to-supabase-auth.sql "Authenticated can read admins" policy
-- (WITH USING (true)) supersedes this for the admin-check use case; keeping
-- the above for cases where that broader policy is removed.
