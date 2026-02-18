-- Atomic district score increment RPC
-- Prevents TOCTOU race condition in updateDistrictScore
CREATE OR REPLACE FUNCTION increment_district_score(district_id TEXT, score_to_add INT)
RETURNS VOID AS $$
BEGIN
  UPDATE districts
  SET score = COALESCE(score, 0) + score_to_add
  WHERE id = district_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
