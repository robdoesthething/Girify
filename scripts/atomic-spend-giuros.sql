-- Atomic spend_giuros function
-- Prevents TOCTOU race conditions by checking balance and deducting in a single transaction
-- Also handles purchased_cosmetics array append atomically

-- Function: spend_giuros
-- Atomically checks balance >= cost and deducts, returning success/failure
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
  v_new_balance INTEGER;
  v_purchased TEXT[];
  v_is_badge BOOLEAN;
  v_already_owned BOOLEAN := FALSE;
BEGIN
  -- Verify caller owns this account (prevents spending other users' giuros)
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE username = p_username
      AND supabase_uid = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
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

-- Restrict execution to authenticated Supabase users only
REVOKE ALL ON FUNCTION spend_giuros(TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION spend_giuros(TEXT, INTEGER, TEXT) TO authenticated;
