/*
  # Update Team Authorization System

  1. Changes
    - Add functions for team authentication and access control
    - Update RLS policies for team-based access
    - Add indexes for performance optimization

  2. Security
    - Implement secure team member validation
    - Add RLS policies for team-based data access
    - Ensure proper authorization checks
*/

-- Start transaction
BEGIN;

-- Function to get user's team
CREATE OR REPLACE FUNCTION get_user_team()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  -- Get team ID where user is a member
  SELECT id INTO v_team_id
  FROM teams
  WHERE auth.email() = ANY(team_members)
  LIMIT 1;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'User not found in any team';
  END IF;

  RETURN v_team_id;
END;
$$;

-- Function to validate team membership
CREATE OR REPLACE FUNCTION is_team_member(p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM teams
    WHERE id = p_team_id
    AND auth.email() = ANY(team_members)
  );
END;
$$;

-- Update daily_logs policies
DROP POLICY IF EXISTS "Users can view team logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can view own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON daily_logs;

-- Create new policies for team-based access
CREATE POLICY "Team members can view logs"
  ON daily_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = daily_logs.team_id
      AND auth.email() = ANY(team_members)
    )
  );

CREATE POLICY "Team members can insert logs"
  ON daily_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = daily_logs.team_id
      AND auth.email() = ANY(team_members)
    )
    AND
    auth.uid() = user_id
  );

CREATE POLICY "Users can update own logs"
  ON daily_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = daily_logs.team_id
      AND auth.email() = ANY(team_members)
    )
    AND
    auth.uid() = user_id
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = daily_logs.team_id
      AND auth.email() = ANY(team_members)
    )
    AND
    auth.uid() = user_id
  );

-- Create composite index for performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_team_user
  ON daily_logs(team_id, user_id);

-- Create function to get team daily logs with member validation
CREATE OR REPLACE FUNCTION get_team_daily_logs(
  p_team_id uuid,
  p_start_date date,
  p_end_date date,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  date date,
  user_id uuid,
  team_id uuid,
  cold_calls integer,
  text_messages integer,
  facebook_dms integer,
  linkedin_dms integer,
  instagram_dms integer,
  cold_emails integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify team membership
  IF NOT EXISTS (
    SELECT 1 FROM teams
    WHERE id = p_team_id
    AND auth.email() = ANY(team_members)
  ) THEN
    RAISE EXCEPTION 'Not authorized to access team data';
  END IF;

  RETURN QUERY
  SELECT dl.*
  FROM daily_logs dl
  WHERE dl.team_id = p_team_id
  AND dl.date BETWEEN p_start_date AND p_end_date
  AND (p_user_id IS NULL OR dl.user_id = p_user_id)
  ORDER BY dl.date;
END;
$$;

COMMIT;