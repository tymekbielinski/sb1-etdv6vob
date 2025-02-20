import { supabase } from '@/lib/supabase';

export interface DailyLogData {
  date: string;
  activities: number;
  cold_calls: number;
  text_messages: number;
  facebook_dms: number;
  linkedin_dms: number;
  instagram_dms: number;
  cold_emails: number;
  member_data?: {
    id: string;
    name: string;
    email: string;
    activities: number;
    cold_calls: number;
    text_messages: number;
    facebook_dms: number;
    linkedin_dms: number;
    instagram_dms: number;
    cold_emails: number;
  }[];
}

export async function getTeamDailyLogs(
  teamId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyLogData[]> {
  try {
    // Get current user's email
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user?.email) throw new Error('User email not found');

    // Call the stored function to get team member logs
    const { data, error } = await supabase.rpc('get_team_member_logs', {
      p_team_id: teamId,
      p_start_date: startDate.toISOString().split('T')[0],
      p_end_date: endDate.toISOString().split('T')[0]
    });

    if (error) {
      console.error('Error fetching team member logs:', error);
      throw new Error('Failed to fetch activity data');
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform the data to match our interface
    return data.map(day => ({
      date: day.date,
      activities: Number(day.activities),
      cold_calls: Number(day.cold_calls),
      text_messages: Number(day.text_messages),
      facebook_dms: Number(day.facebook_dms),
      linkedin_dms: Number(day.linkedin_dms),
      instagram_dms: Number(day.instagram_dms),
      cold_emails: Number(day.cold_emails),
      member_data: day.member_data
    }));
  } catch (error) {
    console.error('Error in getTeamDailyLogs:', error);
    throw error;
  }
}