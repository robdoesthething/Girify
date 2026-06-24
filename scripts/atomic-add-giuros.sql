-- DEPRECATED: superseded by scripts/security-fixes.sql
-- The authoritative, ownership-checked version of add_giuros lives there.
--
-- This file is kept for git history only. Running it would overwrite the
-- secured version with one that lacks the ownership check.
-- A hard-fail guard prevents accidental execution.

DO $$
BEGIN
  RAISE EXCEPTION
    'atomic-add-giuros.sql is deprecated — run scripts/security-fixes.sql instead';
END;
$$;

-- Restrict execution to authenticated Supabase users only
REVOKE ALL ON FUNCTION add_giuros(TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION add_giuros(TEXT, INTEGER, TEXT) TO authenticated;
