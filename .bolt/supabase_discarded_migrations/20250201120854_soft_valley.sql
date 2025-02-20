-- Start transaction
BEGIN;

-- Drop and recreate get_team_daily_logs function with qualified column names
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
  -- Verify team membership with qualified column names
  IF NOT EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = p_team_id
    AND (
      t.user_id = auth.uid()
      OR auth.email() = ANY(t.team_members)
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

-- Update daily logs policies with qualified column names
DROP POLICY IF EXISTS "Team members can view logs" ON daily_logs;
DROP POLICY IF EXISTS "Team members can insert logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON daily_logs;

CREATE POLICY "Team members can view logs"
  ON daily_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = daily_logs.team_id
      AND (
        t.user_id = auth.uid()
        OR auth.email() = ANY(t.team_members)
      )
    )
  );

CREATE POLICY "Team members can insert logs"
  ON daily_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = daily_logs.team_id
      AND (
        t.user_id = auth.uid()
        OR auth.email() = ANY(t.team_members)
      )
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own logs"
  ON daily_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = daily_logs.team_id
      AND (
        t.user_id = auth.uid()
        OR auth.email() = ANY(t.team_members)
      )
    )
    AND auth.uid() = user_id
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = daily_logs.team_id
      AND (
        t.user_id = auth.uid()
        OR auth.email() = ANY(t.team_members)
      )
    )
    AND auth.uid() = user_id
  );

COMMIT;