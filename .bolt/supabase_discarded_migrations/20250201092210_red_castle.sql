/*
  # User Setup and Team Creation

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `users` table
    - Add policies for users to view and update their own records
    - Create trigger for automatic user and team creation on signup

  3. Changes
    - Create users table with proper constraints
    - Set up automatic user profile creation
    - Link with team creation
*/

-- Start transaction
BEGIN;

-- Drop existing triggers and functions for clean slate
DROP TRIGGER IF EXISTS on_auth_user_created_setup ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_setup();

-- Create users table first
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

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
  -- Log start of function
  RAISE LOG 'Starting user setup for %', NEW.id;

  -- Create user profile
  INSERT INTO users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );
  
  RAISE LOG 'Created user profile for %', NEW.id;

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
  -- Log detailed error information
  RAISE LOG 'Error in handle_new_user_setup for user %: %', NEW.id, SQLERRM;
  RAISE LOG 'Error detail: %', SQLSTATE;
  RETURN NULL;
END;
$$;

-- Create trigger with explicit ordering
CREATE TRIGGER on_auth_user_created_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_setup();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMIT;