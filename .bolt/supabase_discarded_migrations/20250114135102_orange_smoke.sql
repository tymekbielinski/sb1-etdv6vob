/*
  # Update user setup triggers and policies

  1. Changes
    - Safely drops and recreates user setup trigger
    - Updates user and team policies
    - Adds performance indexes
    
  2. Security
    - Maintains RLS policies for users and teams
    - Ensures proper access control
*/

-- Start transaction
BEGIN;

-- Drop existing trigger safely with IF EXISTS
DROP TRIGGER IF EXISTS on_auth_user_created_setup ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Drop existing functions safely with CASCADE to remove dependencies
DROP FUNCTION IF EXISTS handle_new_user_setup() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_profile() CASCADE;

-- Drop existing policies safely
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Users can update their teams" ON teams;

-- Create enhanced function to handle new user setup
CREATE OR REPLACE FUNCTION handle_new_user_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  -- Create user profile with retry logic
  FOR i IN 1..3 LOOP
    BEGIN
      INSERT INTO users (id, name, email)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        NEW.email
      );
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF i = 3 THEN RAISE EXCEPTION 'Failed to create user profile'; END IF;
      PERFORM pg_sleep(0.1 * i);
    END;
  END LOOP;
  
  -- Create team
  INSERT INTO teams (name, user_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'name', 'User') || '''s Team',
    NEW.id
  )
  RETURNING id INTO v_team_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user_setup: %', SQLERRM;
  RETURN NULL;
END;
$$;

-- Create trigger with IF NOT EXISTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created_setup'
  ) THEN
    CREATE TRIGGER on_auth_user_created_setup
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user_setup();
  END IF;
END $$;

-- Recreate policies with proper checks
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their teams"
  ON teams FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their teams"
  ON teams FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);

COMMIT;