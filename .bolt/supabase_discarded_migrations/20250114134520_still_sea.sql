/*
  # Team Management Setup

  1. Changes
    - Creates function for handling new user team creation
    - Updates team RLS policies for better security
    - Adds trigger for automatic team creation

  2. Security
    - Enables proper RLS policies for team access
    - Ensures users can only view and update their own teams
*/

-- Wrap everything in a transaction to ensure atomicity
BEGIN;

-- First, ensure we clean up any existing objects to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function for handling new user team creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create team for new user with proper error handling
  BEGIN
    INSERT INTO teams (name, user_id)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'name', 'My Team') || '''s Team',
      NEW.id
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating team for user %: %', NEW.id, SQLERRM;
    RETURN NULL;
  END;
  
  RETURN NEW;
END;
$$;

-- Remove existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Users can update their teams" ON teams;

-- Create new policies with proper access controls
CREATE POLICY "Users can view their teams"
  ON teams
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their teams"
  ON teams
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Finally, create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);

COMMIT;