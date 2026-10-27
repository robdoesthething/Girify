-- DEPRECATED: superseded by supabase/migrations/20260324_security_fixes.sql
-- The authoritative, ownership-checked version of add_giuros lives there.
--
-- This file is kept for git history only. Running it would overwrite the
-- secured version with one that lacks the ownership check.
-- A hard-fail guard prevents accidental execution.

DO $$
BEGIN
  RAISE EXCEPTION
    'atomic-add-giuros.sql is deprecated — run supabase/migrations/20260324_security_fixes.sql instead';
END;
$$;
