-- Start transaction
BEGIN;

-- Drop the updated version of get_team_data
DROP FUNCTION IF EXISTS get_team_data(p_user_id uuid);

-- Recreate the original get_team_data function
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

COMMIT;