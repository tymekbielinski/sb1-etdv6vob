-- Start transaction
BEGIN;

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_user_team();
DROP FUNCTION IF EXISTS get_team_daily_logs(uuid, date, date, uuid);

-- Create get_user_team function
CREATE OR REPLACE FUNCTION get_user_team()
RETURNS TABLE (
  team_id uuid,
  team_name text,
  team_created_at timestamptz,
  user_id uuid,
  team_members text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.created_at,
    t.user_id,
    t.team_members
  FROM teams t
  WHERE t.user_id = auth.uid()
  OR auth.email() = ANY(t.team_members)
  ORDER BY t.created_at DESC
  LIMIT 1;
END;
$$;

-- Create get_team_daily_logs function
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
  cold_emails integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify team membership
  IF NOT EXISTS (
    SELECT 1 FROM teams
    WHERE id = p_team_id
    AND (
      user_id = auth.uid()
      OR auth.email() = ANY(team_members)
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized to access team data';
  END IF;

  RETURN QUERY
  SELECT 
    dl.date,
    dl.user_id,
    dl.team_id,
    COALESCE(dl.cold_calls, 0) as cold_calls,
    COALESCE(dl.text_messages, 0) as text_messages,
    COALESCE(dl.facebook_dms, 0) as facebook_dms,
    COALESCE(dl.linkedin_dms, 0) as linkedin_dms,
    COALESCE(dl.instagram_dms, 0) as instagram_dms,
    COALESCE(dl.cold_emails, 0) as cold_emails,
    dl.created_at
  FROM daily_logs dl
  WHERE dl.team_id = p_team_id
  AND dl.date BETWEEN p_start_date AND p_end_date
  AND (p_user_id IS NULL OR dl.user_id = p_user_id)
  ORDER BY dl.date;
END;
$$;

-- Update daily logs policies
DROP POLICY IF EXISTS "Team members can view logs" ON daily_logs;
DROP POLICY IF EXISTS "Team members can insert logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON daily_logs;

CREATE POLICY "Team members can view logs"
  ON daily_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = daily_logs.team_id
      AND (
        user_id = auth.uid()
        OR auth.email() = ANY(team_members)
      )
    )
  );

CREATE POLICY "Team members can insert logs"
  ON daily_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = daily_logs.team_id
      AND (
        user_id = auth.uid()
        OR auth.email() = ANY(team_members)
      )
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own logs"
  ON daily_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = daily_logs.team_id
      AND (
        user_id = auth.uid()
        OR auth.email() = ANY(team_members)
      )
    )
    AND auth.uid() = user_id
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = daily_logs.team_id
      AND (
        user_id = auth.uid()
        OR auth.email() = ANY(team_members)
      )
    )
    AND auth.uid() = user_id
  );

COMMIT;