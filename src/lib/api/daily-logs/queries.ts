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
  quotes: number;
  booked_calls: number;
  completed_calls: number;
  booked_presentations: number;
  completed_presentations: number;
  submitted_applications: number;
  deals_won: number;
  deal_value: number;
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
    quotes: number;
    booked_calls: number;
    completed_calls: number;
    booked_presentations: number;
    completed_presentations: number;
    submitted_applications: number;
    deals_won: number;
    deal_value: number;
  }[];
}

function logActivityData(title: string, data: any) {
  console.group(`🔍 ${title}`);
  console.log(JSON.stringify(data, null, 2));
  console.groupEnd();
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

    // Verify team access
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .or(`user_id.eq.${user.id},team_members.cs.{${user.email}}`)
      .single();

    if (teamError) throw new Error('Failed to verify team membership');
    if (!teamData) throw new Error('Team not found or access denied');

    // Format dates for query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get all logs for the team in the date range
    const { data: logs, error: logsError } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('team_id', teamId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true });

    if (logsError) throw new Error('Failed to fetch daily logs');

    logActivityData('📊 Raw Daily Logs from Supabase', logs);

    // Get team members from the team_members array in the team data
    const teamMembers = teamData.team_members.map((email: string) => ({
      id: email,
      name: email.split('@')[0],
      email: email,
      user_id: null
    }));

    // Add the team owner
    teamMembers.push({
      id: user.id,
      name: user.email?.split('@')[0] || 'Owner',
      email: user.email || '',
      user_id: user.id
    });

    // Group logs by date
    const logsByDate: Record<string, any[]> = {};
    logs.forEach(log => {
      if (!logsByDate[log.date]) {
        logsByDate[log.date] = [];
      }
      logsByDate[log.date].push(log);
    });

    // Transform into the expected format
    const result: DailyLogData[] = Object.keys(logsByDate).map(date => {
      const dayLogs = logsByDate[date];
      
      // Debug log for quotes values
      console.group(`🔍 Quotes Debug - ${date}`);
      console.log('Raw quotes value:', dayLogs[0]?.quotes);
      console.log('Raw quotes type:', typeof dayLogs[0]?.quotes);
      console.log('Full log entry:', dayLogs[0]);
      console.groupEnd();

      // Get the daily totals from the first log entry since it contains team totals
      const totals = {
        cold_calls: Number(dayLogs[0]?.cold_calls || 0),
        text_messages: Number(dayLogs[0]?.text_messages || 0),
        facebook_dms: Number(dayLogs[0]?.facebook_dms || 0),
        linkedin_dms: Number(dayLogs[0]?.linkedin_dms || 0),
        instagram_dms: Number(dayLogs[0]?.instagram_dms || 0),
        cold_emails: Number(dayLogs[0]?.cold_emails || 0),
        quotes: Number(dayLogs[0]?.quotes || 0),
        booked_calls: Number(dayLogs[0]?.booked_calls || 0),
        completed_calls: Number(dayLogs[0]?.completed_calls || 0),
        booked_presentations: Number(dayLogs[0]?.booked_presentations || 0),
        completed_presentations: Number(dayLogs[0]?.completed_presentations || 0),
        submitted_applications: Number(dayLogs[0]?.submitted_applications || 0),
        deals_won: Number(dayLogs[0]?.deals_won || 0),
        deal_value: Number(dayLogs[0]?.deal_value || 0)
      };

      // Debug log for quotes total
      console.group(`📊 Quotes Total Debug - ${date}`);
      console.log('Processed quotes value:', totals.quotes);
      console.groupEnd();

      // Process member data
      const memberData = dayLogs.map(log => {
        const member = teamMembers.find(m => m.user_id === log.user_id) || {
          id: log.user_id || 'unknown',
          name: 'Unknown',
          email: 'unknown@example.com'
        };

        // Log individual member's daily data
        console.group(`📝 Member Daily Log - ${member.name} - ${date}`);
        console.log('Raw Log Data:', log);
        console.groupEnd();
        
        // Calculate member activities
        const activities = 
          Number(log.cold_calls || 0) +
          Number(log.text_messages || 0) +
          Number(log.facebook_dms || 0) +
          Number(log.linkedin_dms || 0) +
          Number(log.instagram_dms || 0) +
          Number(log.cold_emails || 0);
        
        return {
          id: member.id,
          name: member.name,
          email: member.email,
          activities,
          cold_calls: Number(log.cold_calls || 0),
          text_messages: Number(log.text_messages || 0),
          facebook_dms: Number(log.facebook_dms || 0),
          linkedin_dms: Number(log.linkedin_dms || 0),
          instagram_dms: Number(log.instagram_dms || 0),
          cold_emails: Number(log.cold_emails || 0),
          quotes: Number(log.quotes || 0),
          booked_calls: Number(log.booked_calls || 0),
          completed_calls: Number(log.completed_calls || 0),
          booked_presentations: Number(log.booked_presentations || 0),
          completed_presentations: Number(log.completed_presentations || 0),
          submitted_applications: Number(log.submitted_applications || 0),
          deals_won: Number(log.deals_won || 0),
          deal_value: Number(log.deal_value || 0)
        };
      });
      
      // Calculate total activities
      const activities = 
        totals.cold_calls +
        totals.text_messages +
        totals.facebook_dms +
        totals.linkedin_dms +
        totals.instagram_dms +
        totals.cold_emails;

      const dayData = {
        date,
        activities,
        ...totals,
        member_data: memberData
      };

      // Log daily aggregated data for debugging
      console.group(`📅 Daily Aggregated Data - ${date}`);
      console.log('Raw Day Logs:', dayLogs);
      console.log('Team Totals:', totals);
      console.log('Activities:', activities);
      console.log('Member Data Count:', memberData.length);
      console.groupEnd();
      
      return dayData;
    });

    // Log final processed data
    logActivityData('🎯 Final Processed Data', result);

    return result;
  } catch (error) {
    console.error('❌ Error in getTeamDailyLogs:', error);
    throw error;
  }
}