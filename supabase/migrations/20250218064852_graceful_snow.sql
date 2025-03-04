-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_team_member_logs(uuid, date, date);

-- Create or replace the function
CREATE OR REPLACE FUNCTION get_team_member_logs(
  p_team_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  activities BIGINT,
  cold_calls BIGINT,
  text_messages BIGINT,
  facebook_dms BIGINT,
  linkedin_dms BIGINT,
  instagram_dms BIGINT,
  cold_emails BIGINT,
  member_data JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_email TEXT;
  v_team_exists BOOLEAN;
BEGIN
  -- Get current user's email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check team access
  SELECT EXISTS (
    SELECT 1 FROM teams 
    WHERE id = p_team_id 
    AND (user_id = auth.uid() OR v_user_email = ANY(team_members))
  ) INTO v_team_exists;

  IF NOT v_team_exists THEN
    RAISE EXCEPTION 'Team not found or access denied';
  END IF;

  RETURN QUERY
  WITH daily_totals AS (
    -- Get daily totals for each user
    SELECT 
      dl.date,
      dl.user_id,
      u.email,
      u.raw_user_meta_data->>'name' as name,
      COALESCE(dl.cold_calls, 0) as cold_calls,
      COALESCE(dl.text_messages, 0) as text_messages,
      COALESCE(dl.facebook_dms, 0) as facebook_dms,
      COALESCE(dl.linkedin_dms, 0) as linkedin_dms,
      COALESCE(dl.instagram_dms, 0) as instagram_dms,
      COALESCE(dl.cold_emails, 0) as cold_emails,
      COALESCE(dl.cold_calls, 0) + 
      COALESCE(dl.text_messages, 0) + 
      COALESCE(dl.facebook_dms, 0) + 
      COALESCE(dl.linkedin_dms, 0) + 
      COALESCE(dl.instagram_dms, 0) + 
      COALESCE(dl.cold_emails, 0) as activities
    FROM daily_logs dl
    JOIN auth.users u ON dl.user_id = u.id
    WHERE dl.team_id = p_team_id
    AND dl.date BETWEEN p_start_date AND p_end_date
  ),
  aggregated_by_date AS (
    -- Aggregate totals by date
    SELECT 
      dt.date,
      SUM(dt.activities) as activities,
      SUM(dt.cold_calls) as cold_calls,
      SUM(dt.text_messages) as text_messages,
      SUM(dt.facebook_dms) as facebook_dms,
      SUM(dt.linkedin_dms) as linkedin_dms,
      SUM(dt.instagram_dms) as instagram_dms,
      SUM(dt.cold_emails) as cold_emails,
      jsonb_agg(jsonb_build_object(
        'id', dt.user_id,
        'email', dt.email,
        'name', COALESCE(dt.name, split_part(dt.email, '@', 1)),
        'activities', dt.activities,
        'cold_calls', dt.cold_calls,
        'text_messages', dt.text_messages,
        'facebook_dms', dt.facebook_dms,
        'linkedin_dms', dt.linkedin_dms,
        'instagram_dms', dt.instagram_dms,
        'cold_emails', dt.cold_emails
      )) as member_data
    FROM daily_totals dt
    GROUP BY dt.date
  )
  SELECT * FROM aggregated_by_date
  ORDER BY date;
END
$$;