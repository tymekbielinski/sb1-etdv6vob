/*
  # Initial Schema Setup

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp)
    - `team_members`
      - `id` (uuid, primary key) 
      - `team_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `email` (text)
      - `role` (text)
    - `daily_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `team_id` (uuid, foreign key) 
      - `date` (date)
      - `calls` (integer)
      - `emails` (integer)
      - `meetings` (integer)
      - `opportunities` (integer)

  2. Functions
    - `create_team_with_owner`: Creates a new team and assigns the owner
    - `get_team_data`: Retrieves team and member data for a user

  3. Security
    - Enable RLS on all tables
    - Add policies for data access
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'sales_rep',
  UNIQUE(team_id, user_id)
);

-- Create daily_logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  date date NOT NULL,
  calls integer DEFAULT 0,
  emails integer DEFAULT 0,
  meetings integer DEFAULT 0,
  opportunities integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Create team creation function
CREATE OR REPLACE FUNCTION create_team_with_owner(
  team_name text,
  owner_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_team teams;
  v_user_id uuid;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = owner_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Create team
  INSERT INTO teams (name)
  VALUES (team_name)
  RETURNING * INTO v_team;

  -- Add owner as team member
  INSERT INTO team_members (team_id, user_id, name, email, role)
  SELECT 
    v_team.id,
    v_user_id,
    u.raw_user_meta_data->>'name',
    owner_email,
    'manager'
  FROM auth.users u
  WHERE u.id = v_user_id;

  RETURN json_build_object(
    'team', v_team,
    'user_id', v_user_id
  );
END;
$$;

-- Create function to get team data
CREATE OR REPLACE FUNCTION get_team_data(p_user_id uuid)
RETURNS TABLE (
  team_id uuid,
  team_name text,
  team_created_at timestamptz,
  member_id uuid,
  member_name text,
  member_email text,
  member_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as team_id,
    t.name as team_name,
    t.created_at as team_created_at,
    tm.id as member_id,
    tm.name as member_name,
    tm.email as member_email,
    tm.role as member_role
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE EXISTS (
    SELECT 1 
    FROM team_members tm2 
    WHERE tm2.team_id = t.id 
    AND tm2.user_id = p_user_id
  );
END;
$$;

-- RLS Policies

-- Teams policies
CREATE POLICY "Users can view their teams"
  ON teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM team_members 
      WHERE team_id = id 
      AND user_id = auth.uid()
    )
  );

-- Team members policies
CREATE POLICY "Users can view team members"
  ON team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM team_members tm 
      WHERE tm.team_id = team_id 
      AND tm.user_id = auth.uid()
    )
  );

-- Daily logs policies
CREATE POLICY "Users can view team logs"
  ON daily_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM team_members 
      WHERE team_id = daily_logs.team_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own logs"
  ON daily_logs
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own logs"
  ON daily_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());