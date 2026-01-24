-- ============================================================================
-- Firebase Config Migration to Supabase
-- Phase 1: Create configuration tables
-- ============================================================================
-- This migration creates tables to replace Firebase Firestore config collections:
-- - config/settings (payouts) → app_config table
-- - config/global (game settings) → game_config table
-- ============================================================================

-- ============================================================================
-- 1. APP_CONFIG TABLE (replaces 'config/settings' Firestore document)
-- Stores payout configuration values
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    -- Payout values
    starting_giuros INTEGER DEFAULT 100,
    daily_login_bonus INTEGER DEFAULT 50,
    daily_challenge_bonus INTEGER DEFAULT 100,
    streak_week_bonus INTEGER DEFAULT 250,
    perfect_score_bonus INTEGER DEFAULT 50,
    referral_bonus INTEGER DEFAULT 500,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for timestamp queries
CREATE INDEX IF NOT EXISTS idx_app_config_updated_at ON app_config(updated_at DESC);

-- ============================================================================
-- 2. GAME_CONFIG TABLE (replaces 'config/global' Firestore document)
-- Stores admin-controlled game settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    -- Game control settings
    maintenance_mode BOOLEAN DEFAULT FALSE,
    score_multiplier NUMERIC(10, 2) DEFAULT 1.0 CHECK (score_multiplier BETWEEN 0.1 AND 10.0),
    giuros_multiplier NUMERIC(10, 2) DEFAULT 1.0 CHECK (giuros_multiplier BETWEEN 0.1 AND 10.0),
    daily_game_limit INTEGER DEFAULT 0 CHECK (daily_game_limit BETWEEN 0 AND 100),
    announcement_bar TEXT,
    enabled_shop_categories TEXT[] DEFAULT ARRAY['frames', 'titles', 'avatars', 'badges'],
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for timestamp queries
CREATE INDEX IF NOT EXISTS idx_game_config_updated_at ON game_config(updated_at DESC);

-- ============================================================================
-- 3. INSERT DEFAULT VALUES
-- ============================================================================
-- Insert default app config (matches DEFAULT_PAYOUTS from configService.ts)
INSERT INTO app_config (
    id,
    starting_giuros,
    daily_login_bonus,
    daily_challenge_bonus,
    streak_week_bonus,
    perfect_score_bonus,
    referral_bonus
) VALUES (
    'default',
    100,  -- STARTING_GIUROS
    50,   -- DAILY_LOGIN_BONUS
    100,  -- DAILY_CHALLENGE_BONUS
    250,  -- STREAK_WEEK_BONUS
    50,   -- PERFECT_SCORE_BONUS
    500   -- REFERRAL_BONUS
) ON CONFLICT (id) DO NOTHING;

-- Insert default game config (matches DEFAULT_CONFIG from adminConfig.ts)
INSERT INTO game_config (
    id,
    maintenance_mode,
    score_multiplier,
    giuros_multiplier,
    daily_game_limit,
    enabled_shop_categories
) VALUES (
    'default',
    FALSE,
    1.0,
    1.0,
    0,
    ARRAY['frames', 'titles', 'avatars', 'badges']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. TRIGGER: Update updated_at on changes
-- ============================================================================
CREATE TRIGGER update_app_config_updated_at
    BEFORE UPDATE ON app_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_config_updated_at
    BEFORE UPDATE ON game_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================================
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read config (needed for client-side calculations)
CREATE POLICY "App config is viewable by everyone" ON app_config
    FOR SELECT USING (true);

CREATE POLICY "Game config is viewable by everyone" ON game_config
    FOR SELECT USING (true);

-- Only service role can update (admin panel uses service role key)
-- Note: You'll need to use service role key for admin operations
CREATE POLICY "Service role can update app config" ON app_config
    FOR UPDATE USING (true);

CREATE POLICY "Service role can update game config" ON game_config
    FOR UPDATE USING (true);

-- ============================================================================
-- 6. GRANTS FOR ROLES
-- ============================================================================
-- Anonymous users can read (for public leaderboard calculations)
GRANT SELECT ON app_config TO anon;
GRANT SELECT ON game_config TO anon;

-- Authenticated users can read
GRANT SELECT ON app_config TO authenticated;
GRANT SELECT ON game_config TO authenticated;

-- Service role can modify (implicit, but documented here for clarity)
-- GRANT ALL ON app_config TO service_role;
-- GRANT ALL ON game_config TO service_role;

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get payout config (similar to getPayoutConfig in configService.ts)
CREATE OR REPLACE FUNCTION get_payout_config()
RETURNS TABLE(
    starting_giuros INTEGER,
    daily_login_bonus INTEGER,
    daily_challenge_bonus INTEGER,
    streak_week_bonus INTEGER,
    perfect_score_bonus INTEGER,
    referral_bonus INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ac.starting_giuros,
        ac.daily_login_bonus,
        ac.daily_challenge_bonus,
        ac.streak_week_bonus,
        ac.perfect_score_bonus,
        ac.referral_bonus
    FROM app_config ac
    WHERE ac.id = 'default'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get game config (similar to getGameConfig in adminConfig.ts)
CREATE OR REPLACE FUNCTION get_game_config()
RETURNS TABLE(
    maintenance_mode BOOLEAN,
    score_multiplier NUMERIC,
    giuros_multiplier NUMERIC,
    daily_game_limit INTEGER,
    announcement_bar TEXT,
    enabled_shop_categories TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        gc.maintenance_mode,
        gc.score_multiplier,
        gc.giuros_multiplier,
        gc.daily_game_limit,
        gc.announcement_bar,
        gc.enabled_shop_categories
    FROM game_config gc
    WHERE gc.id = 'default'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_payout_config() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_game_config() TO anon, authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run this migration in Supabase SQL editor
-- 2. Export current Firebase config values using Firebase console
-- 3. Update the default values above if Firebase has different values
-- 4. Create new Supabase service files to replace configService.ts and adminConfig.ts
-- 5. Update all files that import from these services
-- ============================================================================
