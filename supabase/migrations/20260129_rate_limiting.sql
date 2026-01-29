-- =====================================================
-- RATE LIMITING FOR FRIEND REQUESTS
-- Run this script in Supabase SQL Editor
-- =====================================================

-- 1. Create rate limit tracking table
CREATE TABLE IF NOT EXISTS friend_request_rate_limits (
  user_id TEXT PRIMARY KEY,
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create rate limit check function (10 requests per hour)
CREATE OR REPLACE FUNCTION check_friend_request_rate_limit(p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_rate_limit INTEGER := 10;  -- Max requests per window
  v_window_hours INTEGER := 1; -- Window duration in hours
BEGIN
  -- Get current count and window start
  SELECT requests_count, window_start INTO v_count, v_window_start
  FROM friend_request_rate_limits WHERE user_id = p_user_id;

  -- If no record exists, create one and allow
  IF NOT FOUND THEN
    INSERT INTO friend_request_rate_limits (user_id, requests_count, window_start)
    VALUES (p_user_id, 1, NOW());
    RETURN TRUE;
  END IF;

  -- Reset if window expired
  IF v_window_start < NOW() - (v_window_hours || ' hour')::INTERVAL THEN
    UPDATE friend_request_rate_limits
    SET requests_count = 1, window_start = NOW()
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Check limit
  IF v_count >= v_rate_limit THEN
    RETURN FALSE;
  END IF;

  -- Increment counter and allow
  UPDATE friend_request_rate_limits
  SET requests_count = requests_count + 1
  WHERE user_id = p_user_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3. Create helper function to get remaining requests
CREATE OR REPLACE FUNCTION get_remaining_friend_requests(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_rate_limit INTEGER := 10;
  v_window_hours INTEGER := 1;
BEGIN
  SELECT requests_count, window_start INTO v_count, v_window_start
  FROM friend_request_rate_limits WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN v_rate_limit;
  END IF;

  -- Reset count if window expired
  IF v_window_start < NOW() - (v_window_hours || ' hour')::INTERVAL THEN
    RETURN v_rate_limit;
  END IF;

  RETURN GREATEST(v_rate_limit - v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 4. Grant access to authenticated users
GRANT EXECUTE ON FUNCTION check_friend_request_rate_limit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_remaining_friend_requests(TEXT) TO authenticated;
GRANT SELECT, INSERT, UPDATE ON friend_request_rate_limits TO authenticated;

-- 5. Enable RLS
ALTER TABLE friend_request_rate_limits ENABLE ROW LEVEL SECURITY;

-- 6. RLS policy - users can only see/update their own rate limit
CREATE POLICY "Users can manage own rate limits"
ON friend_request_rate_limits
FOR ALL
USING (user_id = auth.uid()::TEXT OR user_id = current_setting('request.jwt.claims', true)::json->>'username')
WITH CHECK (user_id = auth.uid()::TEXT OR user_id = current_setting('request.jwt.claims', true)::json->>'username');
