-- ============================================================================
-- Add Admins Table and Policies
-- ============================================================================

-- 1. Create admins table
CREATE TABLE IF NOT EXISTS admins (
    uid TEXT PRIMARY KEY,
    username TEXT, -- Optional, for reference
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Only admins/service role can view admins table
-- We cast auth.uid() to text because the uid column is text
CREATE POLICY "Admins are viewable by admins" ON admins
    FOR SELECT USING (
        uid = auth.uid()::text
        OR EXISTS (SELECT 1 FROM admins WHERE uid = auth.uid()::text)
    );

-- ============================================================================
-- Helper function to check if user is admin
-- ============================================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE uid = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Admin Policies for Content Tables
-- ============================================================================

-- Shop Items
CREATE POLICY "Admins can manage shop_items" ON shop_items
    FOR ALL USING (is_admin());

-- Achievements
CREATE POLICY "Admins can manage achievements" ON achievements
    FOR ALL USING (is_admin());

-- Quests
CREATE POLICY "Admins can manage quests" ON quests
    FOR ALL USING (is_admin());

-- Announcements
CREATE POLICY "Admins can manage announcements" ON announcements
    FOR ALL USING (is_admin());

-- Districts (if editable by admin)
CREATE POLICY "Admins can manage districts" ON districts
    FOR ALL USING (is_admin());

-- ============================================================================
-- Update Auth Utils -> We need to ensure the app uses Supabase Auth UID
-- which matches the 'uid' column in 'admins'.
-- ============================================================================
