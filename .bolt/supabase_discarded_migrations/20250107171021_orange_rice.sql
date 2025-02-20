-- Create efficient session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  last_active timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add session tracking to daily logs
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES user_sessions(id);
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS last_modified timestamptz DEFAULT now();

-- Create function to manage sessions
CREATE OR REPLACE FUNCTION manage_user_session()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_team_id uuid;
BEGIN
  -- Get user's team
  SELECT team_id INTO v_team_id
  FROM users
  WHERE id = auth.uid();

  -- Get or create session
  INSERT INTO user_sessions (user_id, team_id)
  VALUES (auth.uid(), v_team_id)
  ON CONFLICT (user_id) WHERE last_active > now() - interval '24 hours'
  DO UPDATE SET last_active = now()
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- Create function to sync daily logs
CREATE OR REPLACE FUNCTION sync_daily_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.last_modified = now();
  NEW.session_id = (SELECT id FROM user_sessions WHERE user_id = auth.uid() ORDER BY last_active DESC LIMIT 1);
  RETURN NEW;
END;
$$;

-- Create trigger for daily logs sync
CREATE TRIGGER sync_daily_log_trigger
  BEFORE INSERT OR UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION sync_daily_log();

-- Create minimal policies
CREATE POLICY "session_access"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "daily_logs_access"
  ON daily_logs
  FOR ALL
  TO authenticated
  USING (
    team_id = (SELECT team_id FROM users WHERE id = auth.uid())
  );

-- Add efficient indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id, last_active);
CREATE INDEX IF NOT EXISTS idx_sessions_team ON user_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_session ON daily_logs(session_id, last_modified);