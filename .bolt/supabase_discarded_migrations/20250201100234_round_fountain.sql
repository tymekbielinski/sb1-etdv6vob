/*
  # Add Team Members Support

  1. Changes
    - Add team_members array column to teams table
    - Populate team_members with existing owner emails
    - Add functions for managing team members
    - Add policies for team member access

  2. Security
    - Update RLS policies to allow team member access
    - Add validation functions for team member operations
*/

-- Start transaction
BEGIN;

-- Add team_members array to teams table
ALTER TABLE teams 
ADD COLUMN team_members text[] NOT NULL DEFAULT '{}';

-- Create index for team_members array
CREATE INDEX idx_teams_members ON teams USING gin(team_members);

-- Populate team_members with existing owner emails
WITH team_owners AS (
  SELECT t.id as team_id, u.email as owner_email
  FROM teams t
  JOIN users u ON t.user_id = u.id
)
UPDATE teams t
SET team_members = array_append(team_members, o.owner_email)
FROM team_owners o
WHERE t.id = o.team_id;

-- Function to add team member
CREATE OR REPLACE FUNCTION add_team_member(
  p_team_id uuid,
  p_member_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_email text;
BEGIN
  -- Check if user is team owner
  SELECT u.email INTO v_owner_email
  FROM teams t
  JOIN users u ON t.user_id = u.id
  WHERE t.id = p_team_id AND u.id = auth.uid();

  IF v_owner_email IS NULL THEN
    RAISE EXCEPTION 'Not authorized to add team members';
  END IF;

  -- Add member if not already in team
  UPDATE teams
  SET team_members = array_append(team_members, p_member_email)
  WHERE id = p_team_id
  AND NOT (team_members @> ARRAY[p_member_email]);

  RETURN true;
END;
$$;

-- Function to remove team member
CREATE OR REPLACE FUNCTION remove_team_member(
  p_team_id uuid,
  p_member_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_email text;
BEGIN
  -- Check if user is team owner
  SELECT u.email INTO v_owner_email
  FROM teams t
  JOIN users u ON t.user_id = u.id
  WHERE t.id = p_team_id AND u.id = auth.uid();

  IF v_owner_email IS NULL THEN
    RAISE EXCEPTION 'Not authorized to remove team members';
  END IF;

  -- Prevent removal of team owner
  IF p_member_email = v_owner_email THEN
    RAISE EXCEPTION 'Cannot remove team owner';
  END IF;

  -- Remove member
  UPDATE teams
  SET team_members = array_remove(team_members, p_member_email)
  WHERE id = p_team_id;

  RETURN true;
END;
$$;

-- Function to get team members
CREATE OR REPLACE FUNCTION get_team_members(p_team_id uuid)
RETURNS TABLE (
  email text,
  is_owner boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(t.team_members) as email,
    CASE WHEN u.id = t.user_id THEN true ELSE false END as is_owner
  FROM teams t
  LEFT JOIN users u ON u.email = unnest(t.team_members)
  WHERE t.id = p_team_id
  AND (
    -- User is team owner
    t.user_id = auth.uid()
    OR
    -- User is team member
    auth.email() = ANY(t.team_members)
  );
END;
$$;

-- Update team access policies
CREATE POLICY "Team members can view their teams"
  ON teams
  FOR SELECT
  USING (
    auth.email() = ANY(team_members)
  );

-- Add constraint to ensure team_members is not empty
ALTER TABLE teams
ADD CONSTRAINT team_members_not_empty
CHECK (array_length(team_members, 1) > 0);

COMMIT;