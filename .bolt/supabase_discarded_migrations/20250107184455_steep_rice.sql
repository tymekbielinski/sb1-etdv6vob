-- Create teams table first
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create users table with team reference
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  team_id uuid REFERENCES teams(id),
  created_at timestamptz DEFAULT now()
);

-- Create activity type enum
CREATE TYPE activity_type AS ENUM (
  'cold_call',
  'text_message', 
  'facebook_dm',
  'linkedin_dm',
  'instagram_dm',
  'cold_email'
);

-- Create activity_metrics table
CREATE TABLE IF NOT EXISTS activity_metrics (
  time timestamptz NOT NULL,
  user_id uuid NOT NULL,
  team_id uuid NOT NULL,
  activity activity_type NOT NULL,
  count integer NOT NULL DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Create efficient indexes
CREATE INDEX idx_activity_metrics_time ON activity_metrics(time DESC);
CREATE INDEX idx_activity_metrics_user ON activity_metrics(user_id, time DESC);
CREATE INDEX idx_activity_metrics_team ON activity_metrics(team_id, time DESC);
CREATE INDEX idx_activity_metrics_lookup ON activity_metrics(team_id, user_id, time DESC);

-- Enable RLS
ALTER TABLE activity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create non-recursive RLS policies
CREATE POLICY "activity_metrics_select" ON activity_metrics
  FOR SELECT TO authenticated
  USING (
    team_id = (SELECT team_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "activity_metrics_insert" ON activity_metrics
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    team_id = (SELECT team_id FROM users WHERE id = auth.uid())
  );

-- Create efficient analytics functions
CREATE OR REPLACE FUNCTION get_user_metrics(
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  activity activity_type,
  total_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    activity,
    SUM(count) as total_count
  FROM activity_metrics
  WHERE user_id = p_user_id
    AND time >= p_start_time
    AND time < p_end_time
  GROUP BY activity;
$$;

CREATE OR REPLACE FUNCTION get_team_metrics(
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_interval interval DEFAULT '1 day'::interval
)
RETURNS TABLE (
  time_bucket timestamptz,
  activity activity_type,
  total_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    date_trunc('day', time) as time_bucket,
    activity,
    SUM(count) as total_count
  FROM activity_metrics
  WHERE team_id = (
    SELECT team_id FROM users WHERE id = auth.uid()
  )
  AND time >= p_start_time
  AND time < p_end_time
  GROUP BY time_bucket, activity
  ORDER BY time_bucket DESC;
$$;

-- Create function to record activity
CREATE OR REPLACE FUNCTION record_activity(
  p_activity activity_type,
  p_count integer DEFAULT 1,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  -- Get user's team
  SELECT team_id INTO v_team_id
  FROM users
  WHERE id = auth.uid();

  -- Insert activity
  INSERT INTO activity_metrics (
    time,
    user_id,
    team_id,
    activity,
    count,
    metadata
  )
  VALUES (
    now(),
    auth.uid(),
    v_team_id,
    p_activity,
    p_count,
    p_metadata
  );
END;
$$;