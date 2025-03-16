import { supabase } from '@/lib/supabase';
import { TeamActivity } from '@/lib/types/team';

export async function updateTeamActivities(teamId: string, activities: TeamActivity[]): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .update({ default_activities: activities })
    .eq('id', teamId);

  if (error) {
    throw new Error(`Failed to update team activities: ${error.message}`);
  }
}
