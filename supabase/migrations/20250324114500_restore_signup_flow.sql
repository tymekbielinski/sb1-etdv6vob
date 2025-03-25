-- Migration: 20250324114500_restore_signup_flow.sql

-- 1. Create or replace the create_team_with_owner function
CREATE OR REPLACE FUNCTION public.create_team_with_owner(team_name text, owner_email text)
RETURNS json AS $$
DECLARE
  v_team teams;
  v_user_id uuid;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = owner_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for email: %', owner_email;
  END IF;

  -- Create team with team_members as an array containing the owner's email
  INSERT INTO teams (name, user_id, team_members)
  VALUES (
    team_name,
    v_user_id,  -- Use v_user_id for user_id
    ARRAY[owner_email]  -- Insert the owner's email as a single-element array
  )
  RETURNING * INTO v_team;

  RETURN json_build_object(
    'team', v_team,
    'user_id', v_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_result json;
  v_user_name TEXT;
  v_team_name TEXT;
  v_team_id UUID;
BEGIN
  -- Extract user's name from metadata
  v_user_name := NEW.raw_user_meta_data->>'name';
  
  -- If name is missing, use email prefix
  IF v_user_name IS NULL OR v_user_name = '' THEN
    v_user_name := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Create team name using template
  v_team_name := v_user_name || '''s team';
  
  -- Use the create_team_with_owner function to create the team
  v_result := create_team_with_owner(v_team_name, NEW.email);
  
  -- Extract team ID from result
  v_team_id := (v_result->>'team')::json->>'id';
  
  -- Update user's metadata to include team_id
  IF v_team_id IS NOT NULL THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      CASE 
        WHEN raw_app_meta_data IS NULL THEN 
          jsonb_build_object('team_id', v_team_id)
        ELSE 
          raw_app_meta_data || jsonb_build_object('team_id', v_team_id)
      END
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but allow user creation to proceed
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 3. Add comments for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a team for new users during signup using the create_team_with_owner function';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to handle team creation for new users';
