-- Start transaction
BEGIN;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create enhanced function to handle new user setup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_name text;
  v_user_email text;
BEGIN
  -- Get user's name and email
  v_team_name := COALESCE(NEW.raw_user_meta_data->>'name', 'My Team') || '''s Team';
  v_user_email := NEW.email;

  -- Create team for new user with proper error handling
  BEGIN
    INSERT INTO teams (name, user_id, team_members)
    VALUES (
      v_team_name,
      NEW.id,
      ARRAY[v_user_email]  -- Initialize team_members with owner's email
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating team for user %: %', NEW.id, SQLERRM;
    RETURN NULL;
  END;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

COMMIT;