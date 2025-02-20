import { supabase } from '@/lib/supabase';
import type { Team } from '@/lib/types/team';

interface TeamData {
  team_id: uuid;
  team_name: string;
  team_created_at: string;
  user_id: string;
  team_members: string[];
}

export async function getTeamData(): Promise<{ team: Team; members: string[] }> {
  const { data, error } = await supabase.rpc('get_user_team');

  if (error) throw error;
  if (!data) throw new Error('No team found');

  const team: Team = {
    id: data.team_id,
    name: data.team_name,
    created_at: data.team_created_at,
    user_id: data.user_id
  };

  return { 
    team,
    members: data.team_members
  };
}