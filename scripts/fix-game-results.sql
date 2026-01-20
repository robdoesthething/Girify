-- ============================================================================
-- Fix: Create game_results table
-- ============================================================================
-- The original schema was missing the creation of this table.
-- ============================================================================

DROP TABLE IF EXISTS game_results CASCADE;

CREATE TABLE IF NOT EXISTS game_results (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(username) ON DELETE SET NULL,
    score INTEGER NOT NULL,
    time_taken NUMERIC(10, 2),
    played_at TIMESTAMPTZ DEFAULT NOW(),
    platform TEXT DEFAULT 'web',
    correct_answers INTEGER,
    question_count INTEGER,
    streak_at_play INTEGER,
    is_bonus BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_game_results_user_id ON game_results(user_id);
CREATE INDEX idx_game_results_played_at ON game_results(played_at DESC);
CREATE INDEX idx_game_results_score ON game_results(score DESC);

-- Enable RLS
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- Policies for game_results
CREATE POLICY "Game results are viewable by everyone" ON game_results
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own results" ON game_results
    FOR INSERT WITH CHECK (
        user_id IN (SELECT username FROM users WHERE uid = auth.uid()::text)
    );

-- Grant access
GRANT SELECT, INSERT ON game_results TO authenticated;
GRANT SELECT ON game_results TO anon;
