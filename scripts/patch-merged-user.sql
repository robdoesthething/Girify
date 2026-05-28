-- Restore the two fields that didn't copy across during the merge.
-- Email was nulled before the SELECT captured it; supabase_uid was
-- skipped to avoid the unique constraint (source row still held it).
UPDATE users
SET
  email        = 'robertosaga96@gmail.com',
  supabase_uid = '4ae2d39e-1d49-4ece-b587-516141458ff3'
WHERE username = 'robertosnc9113';

-- Verify
SELECT username, email, games_played, best_score, supabase_uid
FROM users
WHERE username = 'robertosnc9113';
