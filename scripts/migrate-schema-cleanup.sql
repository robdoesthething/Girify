-- Schema Cleanup Migration
-- 1. Rename game_results.user_id -> username (consistent with all other tables)
-- 2. Drop users.uid (legacy Firebase UID column, replaced by supabase_uid)
--
-- Run order matters: rename game_results column first (FK still valid),
-- then drop uid from users.
--
-- IMPORTANT: Run in a transaction and verify row counts before committing.
-- BEGIN;
-- <run the statements below>
-- SELECT COUNT(*) FROM game_results; -- verify rows intact
-- SELECT COUNT(*) FROM users WHERE supabase_uid IS NOT NULL; -- verify no uid data lost
-- COMMIT; (or ROLLBACK if anything looks wrong)

-- ============================================================================
-- 1. Rename game_results.user_id -> game_results.username
-- ============================================================================

-- Drop the existing FK constraint (it references users.username, just named user_id_fkey)
ALTER TABLE game_results DROP CONSTRAINT IF EXISTS game_results_user_id_fkey;

-- Rename the column
ALTER TABLE game_results RENAME COLUMN user_id TO username;

-- Re-add FK with correct name
ALTER TABLE game_results
  ADD CONSTRAINT game_results_username_fkey
  FOREIGN KEY (username) REFERENCES users(username) ON DELETE SET NULL;

-- If there is an index on user_id, recreate it
DROP INDEX IF EXISTS game_results_user_id_idx;
CREATE INDEX IF NOT EXISTS game_results_username_idx ON game_results(username);

-- Update any RLS policies that reference the old column name
-- (SELECT/UPDATE policies typically don't reference user_id directly,
--  but review your policies after running this)

-- ============================================================================
-- 2. Drop users.uid (legacy Firebase UID — fully replaced by supabase_uid)
-- ============================================================================

-- Safety check: copy any non-null uid values to supabase_uid where supabase_uid is still null
-- (catches any users who logged in with Firebase after the supabase_uid column was added
--  but before the supabase_uid was being populated)
UPDATE users
SET supabase_uid = uid
WHERE supabase_uid IS NULL AND uid IS NOT NULL;

-- Now safe to drop the column
ALTER TABLE users DROP COLUMN IF EXISTS uid;
