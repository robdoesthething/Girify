-- Atomic giuros increment function.
-- Uses a single UPDATE to avoid TOCTOU race between read and write.
-- SECURITY DEFINER bypasses RLS for the update; caller identity is enforced
-- at the application layer (assertCurrentUser or requireAdmin).
-- No per-caller ownership check intentionally — this is also used to credit
-- referrers (a different user than the caller).

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
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
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

-- Restrict execution to authenticated Supabase users only
REVOKE ALL ON FUNCTION add_giuros(TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION add_giuros(TEXT, INTEGER, TEXT) TO authenticated;
