/*
  # Authentication System Rebuild
  
  1. Tables
    - Reset and recreate users table with proper structure
    - Add necessary indexes and constraints
  
  2. Security
    - Enable RLS
    - Add comprehensive policies
    
  3. Triggers
    - Create robust user creation trigger
    - Add error handling and logging
*/

-- First, clean up any existing setup
DROP TRIGGER IF EXISTS on_auth_user_created_setup ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_setup();

-- Recreate users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user setup
CREATE OR REPLACE FUNCTION handle_new_user_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  -- Log function start
  RAISE LOG 'Starting user setup for %', NEW.id;

  -- Insert user profile with retry logic
  FOR i IN 1..3 LOOP
    BEGIN
      INSERT INTO users (id, email, name)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User')
      );
      
      RAISE LOG 'Created user profile for % on attempt %', NEW.id, i;
      EXIT; -- Success, exit loop
      
    EXCEPTION WHEN unique_violation THEN
      -- Log conflict and continue
      RAISE LOG 'Attempt % - Conflict creating user profile for %: %', i, NEW.id, SQLERRM;
      IF i = 3 THEN
        RAISE EXCEPTION 'Failed to create user profile after 3 attempts';
      END IF;
      PERFORM pg_sleep(0.1 * i); -- Exponential backoff
    END;
  END LOOP;

  -- Create team
  INSERT INTO teams (name, user_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'name', 'User') || '''s Team',
    NEW.id
  )
  RETURNING id INTO v_team_id;
  
  RAISE LOG 'Created team % for user %', v_team_id, NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error details
  RAISE LOG 'Error in handle_new_user_setup for user %: %', NEW.id, SQLERRM;
  RAISE LOG 'Error detail: %', SQLSTATE;
  RETURN NULL;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_setup();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);