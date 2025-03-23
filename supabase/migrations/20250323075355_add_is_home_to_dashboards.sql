-- Add is_home column to dashboards table
ALTER TABLE dashboards ADD COLUMN is_home BOOLEAN DEFAULT FALSE;

-- Create a function to ensure only one dashboard is set as home per user/team
CREATE OR REPLACE FUNCTION ensure_single_home_dashboard()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a dashboard as home
  IF NEW.is_home = TRUE THEN
    -- For user dashboards, ensure only one is home
    IF NEW.user_id IS NOT NULL THEN
      UPDATE dashboards
      SET is_home = FALSE
      WHERE user_id = NEW.user_id AND id != NEW.id AND is_home = TRUE;
    -- For team dashboards, ensure only one is home per team
    ELSIF NEW.team_id IS NOT NULL THEN
      UPDATE dashboards
      SET is_home = FALSE
      WHERE team_id = NEW.team_id AND id != NEW.id AND is_home = TRUE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to enforce the single home dashboard rule
CREATE TRIGGER ensure_single_home_dashboard_trigger
BEFORE INSERT OR UPDATE ON dashboards
FOR EACH ROW
EXECUTE FUNCTION ensure_single_home_dashboard();

-- Add an index for faster lookup of home dashboards
CREATE INDEX idx_dashboards_is_home ON dashboards(is_home) WHERE is_home = TRUE;
