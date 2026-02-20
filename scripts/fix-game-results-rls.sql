-- Fix game_results INSERT policy to enforce username ownership.
-- Previously WITH CHECK (true) allowed any authenticated user to submit
-- scores for any username. This constrains inserts to the current user's
-- own username by joining through the users table.

DROP POLICY IF EXISTS "Users can insert own game results" ON game_results;

CREATE POLICY "Users can insert own game results" ON game_results
FOR INSERT TO authenticated
WITH CHECK (
  user_id IS NULL
  OR user_id IN (
    SELECT username FROM users WHERE supabase_uid = auth.uid()
  )
);
