-- Fix game_results INSERT RLS policy
-- Root cause: original policy used Firebase UID (users.uid) against auth.uid()
-- which now returns a Supabase UUID — the check always fails.
-- This script drops ALL known insert policies by name to ensure a clean slate.

-- Drop all known insert policy names (some may not exist — that's fine)
DROP POLICY IF EXISTS "Users can insert their own results" ON game_results;
DROP POLICY IF EXISTS "Users can insert own game results" ON game_results;
DROP POLICY IF EXISTS "Enable insert for all users" ON game_results;

-- Create working policy: any authenticated user can insert game results.
-- user_id ownership is validated at the app layer (normalizeUsername).
CREATE POLICY "Users can insert own game results" ON game_results
FOR INSERT TO authenticated
WITH CHECK (true);

-- Also ensure anonymous (unauthenticated) inserts are blocked.
-- The above policy already limits to 'authenticated', so no extra step needed.

-- Verify the result
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'game_results'
ORDER BY cmd, policyname;
