/*
  # Update daily_logs table and policies

  1. Changes
    - Safely adds user_id column if it doesn't exist
    - Creates performance index
    - Updates RLS policies for better security

  2. Security
    - Adds RLS policies for user-specific access
    - Ensures proper access control for CRUD operations
*/

DO $$ 
BEGIN
  -- Only add the column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'daily_logs' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE daily_logs 
    ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view team logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can view own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON daily_logs;

-- Recreate policies
CREATE POLICY "Users can view own logs"
  ON daily_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own logs"
  ON daily_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own logs"
  ON daily_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());