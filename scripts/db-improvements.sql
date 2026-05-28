-- ============================================================================
-- DB Improvements Migration
-- Run in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- FIX 1 (Critical): spend_giuros — add ownership check
-- The original version allowed any authenticated user to spend giuros from
-- any account. This version enforces that auth.uid() owns p_username.
-- Service_role callers (auth.uid() IS NULL) bypass this for server-side flows.
-- ============================================================================

CREATE OR REPLACE FUNCTION spend_giuros(
  p_username TEXT,
  p_cost INTEGER,
  p_item_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance     INTEGER;
  v_purchased       TEXT[];
  v_is_badge        BOOLEAN;
  v_already_owned   BOOLEAN := FALSE;
  v_caller_uid      UUID;
BEGIN
  -- Ownership check: authenticated clients can only spend their own giuros.
  -- Service_role calls have auth.uid() = NULL and bypass this check.
  v_caller_uid := auth.uid();
  IF v_caller_uid IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM users WHERE username = p_username AND supabase_uid = v_caller_uid
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: can only spend own giuros');
    END IF;
  END IF;

  v_is_badge := p_item_id LIKE 'badge_%';

  -- Lock the user row for update (prevents concurrent modifications)
  SELECT giuros, purchased_cosmetics
  INTO v_current_balance, v_purchased
  FROM users
  WHERE username = p_username
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check ownership for non-badge items (badges are in a separate table)
  IF NOT v_is_badge AND p_item_id != 'handle_change' AND NOT p_item_id LIKE 'handle_change%' THEN
    IF p_item_id = ANY(COALESCE(v_purchased, '{}')) THEN
      v_already_owned := TRUE;
    END IF;
  END IF;

  -- Check badge ownership
  IF v_is_badge THEN
    IF EXISTS (SELECT 1 FROM purchased_badges WHERE username = p_username AND badge_id = p_item_id) THEN
      v_already_owned := TRUE;
    END IF;
  END IF;

  IF v_already_owned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already owned');
  END IF;

  -- Check balance
  v_current_balance := COALESCE(v_current_balance, 0);
  IF v_current_balance < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient giuros');
  END IF;

  v_new_balance := v_current_balance - p_cost;

  -- Deduct balance
  UPDATE users SET giuros = v_new_balance WHERE username = p_username;

  -- Add item
  IF v_is_badge THEN
    INSERT INTO purchased_badges (username, badge_id)
    VALUES (p_username, p_item_id)
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE users
    SET purchased_cosmetics = array_append(COALESCE(purchased_cosmetics, '{}'), p_item_id)
    WHERE username = p_username;
  END IF;

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

REVOKE ALL ON FUNCTION spend_giuros(TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION spend_giuros(TEXT, INTEGER, TEXT) TO authenticated;

-- ============================================================================
-- FIX 2 (Critical): claim_quest_reward — atomic single-RPC claim
-- The previous client-side flow marked is_claimed first, then called add_giuros.
-- If add_giuros failed, the quest was permanently consumed with no reward.
-- This RPC does both in a single transaction: if the giuros UPDATE fails, the
-- is_claimed UPDATE is also rolled back.
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_quest_reward(
  p_username TEXT,
  p_quest_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reward_giuros INTEGER;
  v_progress_id   INTEGER;
  v_new_balance   INTEGER;
BEGIN
  -- Ownership check
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM users WHERE username = p_username AND supabase_uid = auth.uid()
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;
  END IF;

  -- Fetch quest reward
  SELECT reward_giuros INTO v_reward_giuros FROM quests WHERE id = p_quest_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quest not found');
  END IF;

  -- Atomically mark claimed — only succeeds if completed and not yet claimed.
  -- If another request claims the same quest concurrently, one will get NOT FOUND.
  UPDATE user_quests
  SET is_claimed = TRUE
  WHERE username  = p_username
    AND quest_id  = p_quest_id
    AND is_completed = TRUE
    AND is_claimed   = FALSE
  RETURNING id INTO v_progress_id;

  IF NOT FOUND THEN
    IF EXISTS (
      SELECT 1 FROM user_quests
      WHERE username = p_username AND quest_id = p_quest_id AND is_claimed = TRUE
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Reward already claimed');
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Quest not completed');
  END IF;

  -- Credit giuros in the same transaction
  IF COALESCE(v_reward_giuros, 0) > 0 THEN
    UPDATE users
    SET giuros = COALESCE(giuros, 0) + v_reward_giuros
    WHERE username = p_username
    RETURNING giuros INTO v_new_balance;
  ELSE
    SELECT COALESCE(giuros, 0) INTO v_new_balance FROM users WHERE username = p_username;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reward',  COALESCE(v_reward_giuros, 0),
    'new_balance', COALESCE(v_new_balance, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION claim_quest_reward(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_quest_reward(TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- FIX 3 (Medium): Add missing index on users.supabase_uid
-- This column is used in every ownership check (auth.uid() = supabase_uid)
-- but had no index, causing sequential scans on large user tables.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_supabase_uid ON users(supabase_uid);

-- ============================================================================
-- FIX 4 (Medium): RLS policy optimisation — wrap auth.uid() in (SELECT ...)
-- Plain auth.uid() in a USING/WITH CHECK clause is re-evaluated per row.
-- Wrapping it in a subselect promotes it to a one-time evaluation.
-- Apply to the highest-traffic policies.
-- ============================================================================

-- game_results: read policy (column is 'username', not 'user_id')
DROP POLICY IF EXISTS "Users can view own game results" ON game_results;
CREATE POLICY "Users can view own game results" ON game_results
  FOR SELECT TO authenticated
  USING (
    username IN (
      SELECT username FROM users WHERE supabase_uid = (SELECT auth.uid())
    )
  );

-- activity_feed: read policy
DROP POLICY IF EXISTS "Users can view own activity" ON activity_feed;
CREATE POLICY "Users can view own activity" ON activity_feed
  FOR SELECT TO authenticated
  USING (
    username IN (
      SELECT username FROM users WHERE supabase_uid = (SELECT auth.uid())
    )
  );
