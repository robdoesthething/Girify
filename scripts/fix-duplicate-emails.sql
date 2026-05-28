-- ============================================================================
-- Fix duplicate emails before adding unique index
-- Keeps the account with the most activity (games_played DESC, then
-- updated_at DESC as tiebreaker). The lesser duplicate has its email
-- set to NULL — the account itself and all related data are preserved.
-- ============================================================================

-- 1. Inspect duplicates (informational)
SELECT
  email,
  COUNT(*)                                         AS row_count,
  array_agg(username ORDER BY games_played DESC)   AS usernames,
  array_agg(games_played ORDER BY games_played DESC) AS games_played_each
FROM users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- 2. Null out the email on the lesser duplicate(s)
UPDATE users
SET email = NULL
WHERE username IN (
  SELECT username
  FROM (
    SELECT
      username,
      ROW_NUMBER() OVER (
        PARTITION BY email
        ORDER BY
          games_played  DESC NULLS LAST,
          updated_at    DESC NULLS LAST,
          created_at    DESC NULLS LAST
      ) AS rn
    FROM users
    WHERE email IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- 3. Create the unique index (should now succeed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
ON users(email)
WHERE email IS NOT NULL;
