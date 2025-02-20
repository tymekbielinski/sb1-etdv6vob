-- Create user_role type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'member');
  END IF;
END $$;

-- First create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Then create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role DEFAULT 'member',
  team_id uuid REFERENCES teams(id),
  created_at timestamptz DEFAULT now()
);

-- Finally create daily logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  team_id uuid NOT NULL REFERENCES teams(id),
  date date NOT NULL,
  cold_calls integer DEFAULT 0,
  text_messages integer DEFAULT 0,
  facebook_dms integer DEFAULT 0,
  linkedin_dms integer DEFAULT 0,
  instagram_dms integer DEFAULT 0,
  cold_emails integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, team_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_team ON daily_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_lookup ON daily_logs(team_id, user_id, date);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Create policies after tables exist
CREATE POLICY "users_read_access" ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "teams_access" ON teams
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.team_id = teams.id
  ));

CREATE POLICY "daily_logs_select" ON daily_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.team_id = daily_logs.team_id
  ));

CREATE POLICY "daily_logs_insert" ON daily_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.team_id = daily_logs.team_id
    )
  );

CREATE POLICY "daily_logs_update" ON daily_logs
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.team_id = daily_logs.team_id
    )
  );

-- Create helper functions
CREATE OR REPLACE FUNCTION get_daily_log(
  p_date date,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  id uuid,
  cold_calls integer,
  text_messages integer,
  facebook_dms integer,
  linkedin_dms integer,
  instagram_dms integer,
  cold_emails integer,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    cold_calls,
    text_messages,
    facebook_dms,
    linkedin_dms,
    instagram_dms,
    cold_emails,
    created_at,
    updated_at
  FROM daily_logs
  WHERE user_id = p_user_id
    AND date = p_date
  LIMIT 1;
$$;

-- Create team analytics function
CREATE OR REPLACE FUNCTION get_team_analytics(
  p_start_date date,
  p_end_date date,
  p_team_id uuid DEFAULT NULL
)
RETURNS TABLE (
  date date,
  total_cold_calls bigint,
  total_messages bigint,
  total_emails bigint
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH dates AS (
    SELECT d::date
    FROM generate_series(p_start_date, p_end_date, '1 day'::interval) d
  ),
  user_team AS (
    SELECT team_id FROM users WHERE id = auth.uid() LIMIT 1
  )
  SELECT
    d.d::date as date,
    COALESCE(SUM(dl.cold_calls), 0) as total_cold_calls,
    COALESCE(SUM(dl.text_messages + dl.facebook_dms + dl.linkedin_dms + dl.instagram_dms), 0) as total_messages,
    COALESCE(SUM(dl.cold_emails), 0) as total_emails
  FROM dates d
  LEFT JOIN daily_logs dl ON dl.date = d.d
    AND dl.team_id = COALESCE(p_team_id, (SELECT team_id FROM user_team))
  GROUP BY d.d
  ORDER BY d.d;
$$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();