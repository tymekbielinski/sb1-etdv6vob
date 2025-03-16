-- Add quota and default_activities columns to teams table
ALTER TABLE teams
ADD COLUMN quota integer DEFAULT 0,
ADD COLUMN default_activities jsonb[] DEFAULT ARRAY[
  -- Default Activities
  '{"id": "cold_calls", "label": "Cold Calls"}'::jsonb,
  '{"id": "text_messages", "label": "Text Messages"}'::jsonb,
  '{"id": "facebook_dms", "label": "Facebook DMs"}'::jsonb,
  '{"id": "linkedin_dms", "label": "LinkedIn DMs"}'::jsonb,
  '{"id": "instagram_dms", "label": "Instagram DMs"}'::jsonb,
  '{"id": "cold_emails", "label": "Cold Emails"}'::jsonb,
  -- Funnel Metrics
  '{"id": "quotes", "label": "Quotes"}'::jsonb,
  '{"id": "booked_calls", "label": "Booked Calls"}'::jsonb,
  '{"id": "completed_calls", "label": "Completed Calls"}'::jsonb,
  '{"id": "booked_presentations", "label": "Booked Presentations"}'::jsonb,
  '{"id": "completed_presentations", "label": "Completed Presentations"}'::jsonb,
  '{"id": "submitted_applications", "label": "Submitted Applications"}'::jsonb
];
