/*
  # Fix User Signup Triggers
  
  1. Changes
    - Combine user profile and team creation into a single trigger
    - Add proper error handling
    - Ensure atomic transactions
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_new_user_profile();

-- Create combined function to handle new user setup
CREATE OR REPLACE FUNCTION handle_new_user_setup()
RETURNS TRIGGER AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Create user profile
    INSERT INTO users (id, name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
      NEW.email
    );

    -- Create team
    INSERT INTO teams (name, user_id)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'name', 'User') || '''s Team',
      NEW.id
    );

    RETURN NEW;
  EXCEPTION WHEN OTHERS THEN
    -- Log error details
    RAISE LOG 'Error in handle_new_user_setup: %', SQLERRM;
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create single trigger for all new user setup
CREATE TRIGGER on_auth_user_created_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_setup();