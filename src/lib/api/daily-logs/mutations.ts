import { supabase } from '@/lib/supabase';

export interface DailyLogEntry {
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
  team_id: string;
  user_id: string;
  date: string;
}

export async function createOrUpdateDailyLog(data: Partial<DailyLogEntry> & { user_id: string; team_id: string; date: string }) {
  try {
    // Get current user's email
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user?.email) throw new Error('User email not found');

    // Verify team access using email-based check
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', data.team_id)
      .or(`user_id.eq.${user.id},team_members.cs.{${user.email}}`)
      .single();

    if (teamError) throw new Error('Failed to verify team membership');
    if (!teamData) throw new Error('Team not found');

    // Check if a log exists for today
    const { data: existingLog, error: fetchError } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', data.user_id)
      .eq('date', data.date)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const logData = {
      cold_calls: data.cold_calls ?? existingLog?.cold_calls ?? 0,
      text_messages: data.text_messages ?? existingLog?.text_messages ?? 0,
      facebook_dms: data.facebook_dms ?? existingLog?.facebook_dms ?? 0,
      linkedin_dms: data.linkedin_dms ?? existingLog?.linkedin_dms ?? 0,
      instagram_dms: data.instagram_dms ?? existingLog?.instagram_dms ?? 0,
      cold_emails: data.cold_emails ?? existingLog?.cold_emails ?? 0,
      quotes: data.quotes ?? existingLog?.quotes ?? 0,
      booked_calls: data.booked_calls ?? existingLog?.booked_calls ?? 0,
      completed_calls: data.completed_calls ?? existingLog?.completed_calls ?? 0,
      booked_presentations: data.booked_presentations ?? existingLog?.booked_presentations ?? 0,
      completed_presentations: data.completed_presentations ?? existingLog?.completed_presentations ?? 0,
      submitted_applications: data.submitted_applications ?? existingLog?.submitted_applications ?? 0,
      deals_won: data.deals_won ?? existingLog?.deals_won ?? 0,
      deal_value: data.deal_value ?? existingLog?.deal_value ?? 0,
      user_id: data.user_id,
      team_id: teamData.id,
      date: data.date
    };

    if (existingLog) {
      // Update existing log
      const { data: updatedLog, error: updateError } = await supabase
        .from('daily_logs')
        .update(logData)
        .eq('id', existingLog.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedLog;
    } else {
      // Create new log
      const { data: newLog, error: insertError } = await supabase
        .from('daily_logs')
        .insert([logData])
        .select()
        .single();

      if (insertError) throw insertError;
      return newLog;
    }
  } catch (error) {
    console.error('Error in createOrUpdateDailyLog:', error);
    throw error;
  }
}

export async function getTodaysLog(userId: string, teamId: string) {
  try {
    // Get current user's email
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user?.email) throw new Error('User email not found');

    // Verify team access using email-based check
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .or(`user_id.eq.${user.id},team_members.cs.{${user.email}}`)
      .single();

    if (teamError) throw new Error('Failed to verify team membership');
    if (!teamData) throw new Error('Team not found');

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('team_id', teamData.id)
      .eq('date', today)
      .maybeSingle();

    if (error) throw error;

    return data || {
      cold_calls: 0,
      text_messages: 0,
      facebook_dms: 0,
      linkedin_dms: 0,
      instagram_dms: 0,
      cold_emails: 0,
      quotes: 0,
      booked_calls: 0,
      completed_calls: 0,
      booked_presentations: 0,
      completed_presentations: 0,
      submitted_applications: 0,
      deals_won: 0,
      deal_value: 0,
      user_id: userId,
      team_id: teamData.id,
      date: today
    };
  } catch (error) {
    console.error('Error in getTodaysLog:', error);
    throw error;
  }
}