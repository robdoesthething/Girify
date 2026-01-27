-- ============================================================================
-- Girify: Firebase to Supabase Migration Schema
-- ============================================================================
-- This schema migrates all Firestore collections to PostgreSQL tables.
-- Firebase Auth remains intact - only Firestore data is migrated.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS TABLE (replaces 'users' collection)
-- Primary user profile data
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    uid TEXT UNIQUE,
    email TEXT,
    real_name TEXT,
    avatar_id INTEGER DEFAULT 1,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    friend_count INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    referral_code TEXT,
    streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_play_date DATE,
    last_login_date DATE,
    giuros INTEGER DEFAULT 10,
    purchased_cosmetics TEXT[] DEFAULT '{}',
    equipped_cosmetics JSONB DEFAULT '{}',
    equipped_badges TEXT[] DEFAULT '{}',
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'auto')),
    notification_settings JSONB DEFAULT '{"dailyReminder": true, "friendActivity": true, "newsUpdates": true}',
    migrated_to TEXT,
    migrated_from TEXT,
    referred_by TEXT REFERENCES users(username) ON DELETE SET NULL,
    district TEXT,
    team TEXT,
    banned BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_uid ON users(uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_district ON users(district);
CREATE INDEX idx_users_total_score ON users(total_score DESC);
CREATE INDEX idx_users_best_score ON users(best_score DESC);

-- ============================================================================
-- 2. BADGE_STATS TABLE (replaces 'users/{}/badgeStats/current' subcollection)
-- Badge progress tracking per user
-- ============================================================================
CREATE TABLE IF NOT EXISTS badge_stats (
    username TEXT PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
    games_played INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    wrong_streak INTEGER DEFAULT 0,
    total_pan_km NUMERIC(10, 2) DEFAULT 0,
    consecutive_days INTEGER DEFAULT 0,
    games_without_quitting INTEGER DEFAULT 0,
    eixample_corners INTEGER DEFAULT 0,
    gothic_streak INTEGER DEFAULT 0,
    born_guesses INTEGER DEFAULT 0,
    poblenou_guesses INTEGER DEFAULT 0,
    night_play BOOLEAN DEFAULT FALSE,
    ramblas_quick_guess BOOLEAN DEFAULT FALSE,
    precision_guess BOOLEAN DEFAULT FALSE,
    food_streets_perfect INTEGER DEFAULT 0,
    fast_loss BOOLEAN DEFAULT FALSE,
    speed_mode_high_score BOOLEAN DEFAULT FALSE,
    invite_count INTEGER DEFAULT 0,
    last_play_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. FRIENDSHIPS TABLE (replaces 'users/{}/friends' subcollection)
-- Stores friend relationships (bidirectional)
-- ============================================================================
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_a TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    user_b TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_a, user_b),
    CHECK (user_a < user_b) -- Enforce ordering to prevent duplicates
);

CREATE INDEX idx_friendships_user_a ON friendships(user_a);
CREATE INDEX idx_friendships_user_b ON friendships(user_b);

-- ============================================================================
-- 4. FRIEND_REQUESTS TABLE (replaces 'users/{}/requests' subcollection)
-- Pending friend requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS friend_requests (
    id SERIAL PRIMARY KEY,
    from_user TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    to_user TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_user, to_user)
);

CREATE INDEX idx_friend_requests_to_user ON friend_requests(to_user) WHERE status = 'pending';
CREATE INDEX idx_friend_requests_from_user ON friend_requests(from_user);

-- ============================================================================
-- 5. USER_GAMES TABLE (replaces 'users/{}/games' subcollection)
-- Personal game history per user
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_games (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    date DATE NOT NULL,
    score INTEGER NOT NULL,
    avg_time NUMERIC(10, 2),
    played_at TIMESTAMPTZ DEFAULT NOW(),
    incomplete BOOLEAN DEFAULT FALSE,
    correct_answers INTEGER,
    question_count INTEGER
);

CREATE INDEX idx_user_games_username ON user_games(username);
CREATE INDEX idx_user_games_date ON user_games(date DESC);
CREATE INDEX idx_user_games_username_date ON user_games(username, date);

-- ============================================================================
-- 6. PURCHASED_BADGES TABLE (replaces 'users/{}/purchasedBadges' subcollection)
-- Tracks earned/purchased badges per user
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchased_badges (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(username, badge_id)
);

CREATE INDEX idx_purchased_badges_username ON purchased_badges(username);

-- ============================================================================
-- 7. SHOP_ITEMS TABLE (replaces 'shop_items' collection)
-- Cosmetics shop inventory
-- ============================================================================
CREATE TABLE IF NOT EXISTS shop_items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('frame', 'title', 'special', 'avatar', 'avatars')),
    name TEXT NOT NULL,
    cost INTEGER NOT NULL,
    rarity TEXT,
    color TEXT,
    description TEXT,
    image TEXT,
    emoji TEXT,
    css_class TEXT,
    flavor_text TEXT,
    prefix TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shop_items_type ON shop_items(type);
CREATE INDEX idx_shop_items_is_active ON shop_items(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 8. ACHIEVEMENTS TABLE (replaces 'achievements' collection)
-- Badge/achievement definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT,
    criteria TEXT,
    rarity TEXT,
    category TEXT,
    unlock_condition JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_achievements_is_active ON achievements(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_achievements_category ON achievements(category);

-- ============================================================================
-- 9. QUESTS TABLE (replaces 'quests' collection)
-- Daily/special quests
-- ============================================================================
CREATE TABLE IF NOT EXISTS quests (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    criteria_type TEXT NOT NULL CHECK (criteria_type IN ('find_street', 'score_attack', 'district_explorer', 'login_streak')),
    criteria_value TEXT,
    reward_giuros INTEGER DEFAULT 0,
    active_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quests_active_date ON quests(active_date);
CREATE INDEX idx_quests_is_active ON quests(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 10. ANNOUNCEMENTS TABLE (replaces 'announcements' collection)
-- News and admin announcements
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    publish_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'new_users', 'returning')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcements_is_active ON announcements(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_announcements_publish_date ON announcements(publish_date DESC);

-- ============================================================================
-- 11. USER_READ_ANNOUNCEMENTS TABLE (replaces 'userReadAnnouncements' collection)
-- Tracks which announcements users have read
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_read_announcements (
    username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (username, announcement_id)
);

-- ============================================================================
-- 12. FEEDBACK TABLE (replaces 'feedback' collection)
-- User feedback submissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    text TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reward INTEGER,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ
);

CREATE INDEX idx_feedback_username ON feedback(username);
CREATE INDEX idx_feedback_status ON feedback(status);

-- ============================================================================
-- 13. BLOCKS TABLE (replaces 'blocks' collection)
-- User block relationships
-- ============================================================================
CREATE TABLE IF NOT EXISTS blocks (
    blocker TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    blocked TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker, blocked)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker);
CREATE INDEX idx_blocks_blocked ON blocks(blocked);

-- ============================================================================
-- 14. REFERRALS TABLE (replaces 'referrals' collection)
-- Referral tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    referred TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    referrer_email TEXT,
    referred_email TEXT,
    bonus_awarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referred) -- Each user can only be referred once
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer);

-- ============================================================================
-- 15. ACTIVITY_FEED TABLE (replaces 'activityFeed' collection)
-- Friend activity events
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_feed (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('daily_score', 'badge_earned', 'username_changed', 'cosmetic_purchased')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- daily_score specific fields
    score INTEGER,
    time_taken INTEGER,
    -- badge_earned specific fields
    badge_id TEXT,
    badge_name TEXT,
    -- username_changed specific fields
    old_username TEXT,
    -- cosmetic_purchased specific fields
    item_id TEXT,
    item_name TEXT,
    item_type TEXT,
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_activity_feed_username ON activity_feed(username);
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_type ON activity_feed(type);

-- ============================================================================
-- 16. DISTRICTS TABLE (replaces 'districts' collection)
-- Team/district scoring
-- ============================================================================
CREATE TABLE IF NOT EXISTS districts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    team_name TEXT,
    score INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 17. ALTER GAME_RESULTS TABLE (add missing columns if needed)
-- ============================================================================
DO $$
BEGIN
    -- Add correct_answers column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'game_results' AND column_name = 'correct_answers') THEN
        ALTER TABLE game_results ADD COLUMN correct_answers INTEGER;
    END IF;

    -- Add question_count column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'game_results' AND column_name = 'question_count') THEN
        ALTER TABLE game_results ADD COLUMN question_count INTEGER;
    END IF;

    -- Add streak_at_play column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'game_results' AND column_name = 'streak_at_play') THEN
        ALTER TABLE game_results ADD COLUMN streak_at_play INTEGER;
    END IF;

    -- Add is_bonus column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'game_results' AND column_name = 'is_bonus') THEN
        ALTER TABLE game_results ADD COLUMN is_bonus BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_read_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: USERS
-- ============================================================================
-- Public can read user profiles (for leaderboards, friend lookups)
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);

-- Users can update their own profile (matched by Firebase uid passed via RPC or header)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (uid = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role can insert (for registration)
CREATE POLICY "Service role can insert users" ON users
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES: BADGE_STATS
-- ============================================================================
CREATE POLICY "Badge stats are viewable by everyone" ON badge_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own badge stats" ON badge_stats
    FOR ALL USING (
        username IN (
            SELECT username FROM users
            WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- ============================================================================
-- RLS POLICIES: FRIENDSHIPS
-- ============================================================================
CREATE POLICY "Users can view friendships they're part of" ON friendships
    FOR SELECT USING (
        user_a IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
        OR user_b IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Users can create friendships involving themselves" ON friendships
    FOR INSERT WITH CHECK (
        user_a IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
        OR user_b IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Users can delete friendships they're part of" ON friendships
    FOR DELETE USING (
        user_a IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
        OR user_b IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- ============================================================================
-- RLS POLICIES: FRIEND_REQUESTS
-- ============================================================================
CREATE POLICY "Users can view their own requests" ON friend_requests
    FOR SELECT USING (
        from_user IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
        OR to_user IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Users can create requests from themselves" ON friend_requests
    FOR INSERT WITH CHECK (
        from_user IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Users can update requests to themselves" ON friend_requests
    FOR UPDATE USING (
        to_user IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Users can delete their own requests" ON friend_requests
    FOR DELETE USING (
        from_user IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
        OR to_user IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- ============================================================================
-- RLS POLICIES: USER_GAMES
-- ============================================================================
CREATE POLICY "Users can view their own games" ON user_games
    FOR SELECT USING (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Users can insert their own games" ON user_games
    FOR INSERT WITH CHECK (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- ============================================================================
-- RLS POLICIES: PURCHASED_BADGES
-- ============================================================================
CREATE POLICY "Users can view their own purchased badges" ON purchased_badges
    FOR SELECT USING (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Users can manage their own purchased badges" ON purchased_badges
    FOR ALL USING (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- ============================================================================
-- RLS POLICIES: PUBLIC READ TABLES (shop_items, achievements, quests, announcements, districts)
-- ============================================================================
CREATE POLICY "Shop items are viewable by everyone" ON shop_items
    FOR SELECT USING (true);

CREATE POLICY "Achievements are viewable by everyone" ON achievements
    FOR SELECT USING (true);

CREATE POLICY "Quests are viewable by everyone" ON quests
    FOR SELECT USING (true);

CREATE POLICY "Announcements are viewable by everyone" ON announcements
    FOR SELECT USING (true);

CREATE POLICY "Districts are viewable by everyone" ON districts
    FOR SELECT USING (true);

-- ============================================================================
-- RLS POLICIES: USER_READ_ANNOUNCEMENTS
-- ============================================================================
CREATE POLICY "Users can view their own read announcements" ON user_read_announcements
    FOR SELECT USING (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Users can mark announcements as read" ON user_read_announcements
    FOR INSERT WITH CHECK (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- ============================================================================
-- RLS POLICIES: FEEDBACK
-- ============================================================================
CREATE POLICY "Users can view their own feedback" ON feedback
    FOR SELECT USING (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Users can submit feedback" ON feedback
    FOR INSERT WITH CHECK (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- ============================================================================
-- RLS POLICIES: BLOCKS
-- ============================================================================
-- Allow users to see blocks they created OR blocks targeting them (to know they are blocked)
CREATE POLICY "Users can view blocks involving themselves" ON blocks
    FOR SELECT USING (
        blocker IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
        OR
        blocked IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Users can manage their own blocks" ON blocks
    FOR ALL USING (
        blocker IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- ============================================================================
-- RLS POLICIES: REFERRALS
-- ============================================================================
CREATE POLICY "Users can view referrals they're involved in" ON referrals
    FOR SELECT USING (
        referrer IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
        OR referred IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Service role can manage referrals" ON referrals
    FOR ALL USING (true);

-- ============================================================================
-- RLS POLICIES: ACTIVITY_FEED
-- ============================================================================
-- Activity feed is readable by friends (complex logic, simplified here)
-- Activity feed is readable by non-blocked users
CREATE POLICY "Activity feed is viewable by non-blocked users" ON activity_feed
    FOR SELECT USING (
        -- Basic check: allow access, but filter based on blocks
        -- The user must NOT be blocked by the feed owner, and feed owner must NOT be blocked by user
        NOT EXISTS (
            SELECT 1 FROM blocks
            WHERE (
                blocker = activity_feed.username -- Feed owner blocked me
                AND
                blocked = (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub') -- Me
            ) OR (
                blocked = activity_feed.username -- I blocked feed owner
                AND
                blocker = (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub') -- Me
            )
        )
    );

CREATE POLICY "Users can create their own activity" ON activity_feed
    FOR INSERT WITH CHECK (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get friends of a user
CREATE OR REPLACE FUNCTION get_friends(user_username TEXT)
RETURNS TABLE(friend_username TEXT, since TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN f.user_a = user_username THEN f.user_b
            ELSE f.user_a
        END as friend_username,
        f.created_at as since
    FROM friendships f
    WHERE f.user_a = user_username OR f.user_b = user_username;
END;
$$ LANGUAGE plpgsql;

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1 TEXT, user2 TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    a TEXT;
    b TEXT;
BEGIN
    IF user1 < user2 THEN
        a := user1;
        b := user2;
    ELSE
        a := user2;
        b := user1;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM friendships WHERE user_a = a AND user_b = b
    );
END;
$$ LANGUAGE plpgsql;

-- Function to add a friendship (handles ordering)
CREATE OR REPLACE FUNCTION add_friendship(user1 TEXT, user2 TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    a TEXT;
    b TEXT;
BEGIN
    IF user1 < user2 THEN
        a := user1;
        b := user2;
    ELSE
        a := user2;
        b := user1;
    END IF;

    INSERT INTO friendships (user_a, user_b) VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO NOTHING;

    -- Update friend counts
    UPDATE users SET friend_count = friend_count + 1 WHERE username IN (user1, user2);

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to remove a friendship
CREATE OR REPLACE FUNCTION remove_friendship(user1 TEXT, user2 TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    a TEXT;
    b TEXT;
BEGIN
    IF user1 < user2 THEN
        a := user1;
        b := user2;
    ELSE
        a := user2;
        b := user1;
    END IF;

    DELETE FROM friendships WHERE user_a = a AND user_b = b;

    -- Update friend counts
    UPDATE users SET friend_count = GREATEST(0, friend_count - 1) WHERE username IN (user1, user2);

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_badge_stats_updated_at
    BEFORE UPDATE ON badge_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_districts_updated_at
    BEFORE UPDATE ON districts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANTS FOR ANON AND AUTHENTICATED ROLES
-- ============================================================================
-- Note: Adjust these based on your Supabase setup

GRANT SELECT ON users TO anon;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;

GRANT SELECT ON badge_stats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON badge_stats TO authenticated;

GRANT SELECT, INSERT, DELETE ON friendships TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON friend_requests TO authenticated;

GRANT SELECT, INSERT ON user_games TO authenticated;

GRANT SELECT, INSERT, DELETE ON purchased_badges TO authenticated;

GRANT SELECT ON shop_items TO anon, authenticated;
GRANT SELECT ON achievements TO anon, authenticated;
GRANT SELECT ON quests TO anon, authenticated;
GRANT SELECT ON announcements TO anon, authenticated;
GRANT SELECT ON districts TO anon, authenticated;

GRANT SELECT, INSERT ON user_read_announcements TO authenticated;

GRANT SELECT, INSERT ON feedback TO authenticated;

GRANT SELECT, INSERT, DELETE ON blocks TO authenticated;

GRANT SELECT ON referrals TO authenticated;

GRANT SELECT, INSERT ON activity_feed TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_friends(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION are_friends(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_friendship(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_friendship(TEXT, TEXT) TO authenticated;
