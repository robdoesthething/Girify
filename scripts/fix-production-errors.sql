-- =============================================================================
-- Production error fixes — run once in Supabase SQL editor
-- =============================================================================

-- Fix 1: shop_items type constraint
-- 'badge' was missing; 'avatars' (plural) was never used in code.
-- This stops the syncWithLocal() loop from spamming 400 errors on every page load.
ALTER TABLE shop_items DROP CONSTRAINT IF EXISTS shop_items_type_check;
ALTER TABLE shop_items ADD CONSTRAINT shop_items_type_check
  CHECK (type IN ('frame', 'title', 'special', 'avatar', 'badge'));

-- Fix 2: claim_daily_login_bonus RPC (was never deployed — caused 404 on every login)
DROP FUNCTION IF EXISTS claim_daily_login_bonus(TEXT, INTEGER);
DROP FUNCTION IF EXISTS claim_daily_login_bonus(TEXT);

CREATE OR REPLACE FUNCTION claim_daily_login_bonus(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today       DATE    := CURRENT_DATE;
  v_bonus       INTEGER;
  v_new_balance INTEGER;
  v_current_bal INTEGER;
BEGIN
  -- Ownership check: ensure the caller owns this username
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM users WHERE username = p_username AND supabase_uid = auth.uid()
    ) THEN
      RETURN jsonb_build_object('claimed', false, 'error', 'Unauthorized');
    END IF;
  END IF;

  -- Read bonus amount from app_config — callers cannot influence this value
  SELECT daily_login_bonus INTO v_bonus
  FROM app_config
  LIMIT 1;

  v_bonus := COALESCE(v_bonus, 50);

  -- Atomic: only award if last_login_date < today (or never logged in)
  UPDATE users
  SET
    giuros          = COALESCE(giuros, 0) + v_bonus,
    last_login_date = v_today
  WHERE username = p_username
    AND (last_login_date IS NULL OR last_login_date < v_today)
  RETURNING giuros INTO v_new_balance;

  IF NOT FOUND THEN
    -- Already claimed today — return current balance, claimed=false
    SELECT COALESCE(giuros, 0) INTO v_current_bal FROM users WHERE username = p_username;
    RETURN jsonb_build_object('claimed', false, 'bonus', 0, 'new_balance', COALESCE(v_current_bal, 0));
  END IF;

  RETURN jsonb_build_object('claimed', true, 'bonus', v_bonus, 'new_balance', v_new_balance);
END;
$$;

REVOKE ALL ON FUNCTION claim_daily_login_bonus(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_daily_login_bonus(TEXT) TO authenticated;
