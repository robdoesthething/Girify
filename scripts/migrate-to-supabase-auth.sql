-- Migration: Add Supabase Auth UID column to users table
-- Run this BEFORE deploying the new auth code
--
-- This adds a supabase_uid column that will be populated on first login
-- after the migration. The old uid (Firebase UID) column is preserved for rollback.

-- 1. Add Supabase Auth UID column
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_uid UUID;

-- 2. Create unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_supabase_uid ON users(supabase_uid);

-- 3. Allow the client to update supabase_uid on their own row (for first-login linking)
-- This policy lets authenticated users set supabase_uid on the row matching their email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_link_supabase_uid' AND tablename = 'users'
  ) THEN
    CREATE POLICY "users_link_supabase_uid"
      ON users
      FOR UPDATE
      USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
  END IF;
END
$$;
