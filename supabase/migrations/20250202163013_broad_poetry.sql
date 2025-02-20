/*
  # Add opportunity tracking fields

  1. New Fields
    - quotes (integer)
    - booked_calls (integer)
    - completed_calls (integer)
    - booked_presentations (integer)
    - completed_presentations (integer)
    - submitted_applications (integer)
    - deals_won (integer)
    - deal_value (bigint, in cents)

  2. Changes
    - Add new columns with default values
    - Add check constraints for data integrity
    - Update RLS policies
*/

-- Add new columns
ALTER TABLE daily_logs
ADD COLUMN IF NOT EXISTS quotes integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS booked_calls integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_calls integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS booked_presentations integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_presentations integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS submitted_applications integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS deals_won integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS deal_value bigint NOT NULL DEFAULT 0;

-- Add constraints safely
DO $$ 
BEGIN
  -- Basic constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_quotes_non_negative') THEN
    ALTER TABLE daily_logs ADD CONSTRAINT check_quotes_non_negative CHECK (quotes >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_booked_calls_non_negative') THEN
    ALTER TABLE daily_logs ADD CONSTRAINT check_booked_calls_non_negative CHECK (booked_calls >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_completed_calls_non_negative') THEN
    ALTER TABLE daily_logs ADD CONSTRAINT check_completed_calls_non_negative CHECK (completed_calls >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_booked_presentations_non_negative') THEN
    ALTER TABLE daily_logs ADD CONSTRAINT check_booked_presentations_non_negative CHECK (booked_presentations >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_completed_presentations_non_negative') THEN
    ALTER TABLE daily_logs ADD CONSTRAINT check_completed_presentations_non_negative CHECK (completed_presentations >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_submitted_applications_non_negative') THEN
    ALTER TABLE daily_logs ADD CONSTRAINT check_submitted_applications_non_negative CHECK (submitted_applications >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_deals_won_non_negative') THEN
    ALTER TABLE daily_logs ADD CONSTRAINT check_deals_won_non_negative CHECK (deals_won >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_deal_value_non_negative') THEN
    ALTER TABLE daily_logs ADD CONSTRAINT check_deal_value_non_negative CHECK (deal_value >= 0);
  END IF;

  -- Deal value consistency constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_deal_value_consistency') THEN
    ALTER TABLE daily_logs ADD CONSTRAINT check_deal_value_consistency 
      CHECK ((deals_won = 0 AND deal_value = 0) OR (deals_won > 0 AND deal_value > 0));
  END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Team members can view logs" ON daily_logs;
DROP POLICY IF EXISTS "Team members can insert logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON daily_logs;

CREATE POLICY "Team members can view logs"
  ON daily_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = daily_logs.team_id
    AND (t.user_id = auth.uid() OR auth.email() = ANY(t.team_members))
  ));

CREATE POLICY "Team members can insert logs"
  ON daily_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = daily_logs.team_id
      AND (t.user_id = auth.uid() OR auth.email() = ANY(t.team_members))
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own logs"
  ON daily_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = daily_logs.team_id
      AND (t.user_id = auth.uid() OR auth.email() = ANY(t.team_members))
    )
    AND auth.uid() = user_id
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = daily_logs.team_id
      AND (t.user_id = auth.uid() OR auth.email() = ANY(t.team_members))
    )
    AND auth.uid() = user_id
  );