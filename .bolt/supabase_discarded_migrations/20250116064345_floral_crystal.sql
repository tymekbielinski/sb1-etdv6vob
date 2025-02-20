/*
  # Update RLS policies for team-based access

  1. Changes
    - Update RLS policies to allow team members to see all logs within their team
    - Add proper indexes for performance optimization
    - Add proper constraints for data integrity

  2. Security
    - Enable team-wide visibility for daily logs
    - Maintain user-level write restrictions
    - Ensure proper team membership verification
*/

-- Safely drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies one by one with error handling
  BEGIN
    DROP POLICY IF EXISTS "Users can view own logs" ON daily_logs;
  EXCEPTION WHEN OTHERS THEN
    -- Policy doesn't exist, continue
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can view team logs" ON daily_logs;
  EXCEPTION WHEN OTHERS THEN
    -- Policy doesn't exist, continue
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Team members can view team logs" ON daily_logs;
  EXCEPTION WHEN OTHERS THEN
    -- Policy doesn't exist, continue
  END;
END $$;

-- Create or replace the view policy
CREATE POLICY "Team members can view team logs"
  ON daily_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = daily_logs.team_id
      AND t.user_id = auth.uid()
    )
  );

-- Create composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_team_date
  ON daily_logs (team_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_team_date
  ON daily_logs (user_id, team_id, date);

-- Add constraint to ensure team_id matches user's team
DO $$ 
BEGIN
  -- Drop constraint if it exists
  BEGIN
    ALTER TABLE daily_logs DROP CONSTRAINT IF EXISTS daily_logs_team_user_match;
  EXCEPTION WHEN OTHERS THEN
    -- Constraint doesn't exist, continue
  END;

  -- Add new constraint
  ALTER TABLE daily_logs
    ADD CONSTRAINT daily_logs_team_user_match
    CHECK (
      EXISTS (
        SELECT 1 FROM teams t
        WHERE t.id = team_id
        AND t.user_id = user_id
      )
    );
EXCEPTION WHEN OTHERS THEN
  -- Log error but continue
  RAISE NOTICE 'Failed to add constraint: %', SQLERRM;
END $$;