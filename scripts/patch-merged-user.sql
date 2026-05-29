-- One-time repair: restores email and supabase_uid that failed to copy during
-- the @robertosnc9113 → robertosnc9113 merge (email was NULLed before the
-- subquery captured it; supabase_uid was skipped to avoid the unique constraint).
--
-- Replace the placeholders below with the actual values before running.
-- Retrieve them from the Supabase Auth dashboard or your records — do NOT
-- commit real email addresses or UUIDs to version control.
UPDATE users
SET
  email        = '<USER_EMAIL>',
  supabase_uid = '<SUPABASE_AUTH_UUID>'
WHERE username = 'robertosnc9113';

-- Verify
SELECT username, email, games_played, best_score, supabase_uid
FROM users
WHERE username = 'robertosnc9113';
