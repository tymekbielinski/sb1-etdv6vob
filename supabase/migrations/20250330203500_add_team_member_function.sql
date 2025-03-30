-- Create a function to safely add a team member
CREATE OR REPLACE FUNCTION public.add_team_member(
  p_team_id UUID,
  p_email TEXT,
  p_new_quota INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_exists BOOLEAN;
  v_updated BOOLEAN;
BEGIN
  -- Check if team exists
  SELECT EXISTS(SELECT 1 FROM public.teams WHERE id = p_team_id) INTO v_team_exists;
  
  IF NOT v_team_exists THEN
    RAISE EXCEPTION 'Team not found';
  END IF;
  
  -- Update the team with the new member and quota
  UPDATE public.teams
  SET 
    team_members = array_append(team_members, p_email),
    quota = p_new_quota
  WHERE id = p_team_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RETURN v_updated > 0;
END;
$$;
