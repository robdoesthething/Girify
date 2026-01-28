-- Create user_quests table to track progress and claims
CREATE TABLE IF NOT EXISTS user_quests (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(username, quest_id)
);

-- Enable RLS
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;

-- Helper trigger for updated_at
DROP TRIGGER IF EXISTS update_user_quests_updated_at ON user_quests;
CREATE TRIGGER update_user_quests_updated_at
    BEFORE UPDATE ON user_quests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Users can view their own quest progress
CREATE POLICY "Users can view their own quest progress" ON user_quests
    FOR SELECT USING (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- Users can insert their own quest progress (logic handled by backend usually, but for direct interaction/testing)
-- Or better: Service role manages this?
-- For now allow insert/update for self, assuming client-side logic verifies (or backend function).
-- Ideally, claiming rewards should be a secure database function to prevent cheating.
-- But given current architecture (client-side update + RLS), we allow it.

CREATE POLICY "Users can insert their own quest progress" ON user_quests
    FOR INSERT WITH CHECK (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

CREATE POLICY "Users can update their own quest progress" ON user_quests
    FOR UPDATE USING (
        username IN (SELECT username FROM users WHERE uid = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- Grants
GRANT SELECT, INSERT, UPDATE ON user_quests TO authenticated;
