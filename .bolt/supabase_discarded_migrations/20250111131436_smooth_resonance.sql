/*
  # Update Daily Logs Metrics

  1. Changes
    - Add new metric columns for detailed activity tracking
    - Remove old metric columns
    - Update indexes for performance

  2. New Columns
    - cold_calls (integer)
    - text_messages (integer)
    - facebook_dms (integer)
    - linkedin_dms (integer)
    - instagram_dms (integer)
    - cold_emails (integer)

  3. Removed Columns
    - calls
    - emails
    - meetings
    - opportunities
*/

-- Add new columns with default values
ALTER TABLE daily_logs
ADD COLUMN cold_calls integer DEFAULT 0,
ADD COLUMN text_messages integer DEFAULT 0,
ADD COLUMN facebook_dms integer DEFAULT 0,
ADD COLUMN linkedin_dms integer DEFAULT 0,
ADD COLUMN instagram_dms integer DEFAULT 0,
ADD COLUMN cold_emails integer DEFAULT 0;

-- Create indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_daily_logs_metrics ON daily_logs (
  cold_calls,
  text_messages,
  facebook_dms,
  linkedin_dms,
  instagram_dms,
  cold_emails
);

-- Drop old columns
ALTER TABLE daily_logs
DROP COLUMN IF EXISTS calls,
DROP COLUMN IF EXISTS emails,
DROP COLUMN IF EXISTS meetings,
DROP COLUMN IF EXISTS opportunities;