/*
  # Add Team Owner Column
  
  1. Changes
    - Add user_id column to teams table
    - Add foreign key constraint to auth.users
    - Create index for performance
    - Add NOT NULL constraint since every team needs an owner
  
  2. Security
    - Update RLS policies to consider team ownership
*/

-- Add user_id column
ALTER TABLE teams 
ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_teams_user_id ON teams(user_id);

-- Add RLS policy for team owners
CREATE POLICY "Team owners can update their teams"
  ON teams FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Rollback instructions:
/*
To rollback this migration:

1. Drop the policy:
DROP POLICY "Team owners can update their teams" ON teams;

2. Drop the index:
DROP INDEX idx_teams_user_id;

3. Drop the column:
ALTER TABLE teams DROP COLUMN user_id;
*/