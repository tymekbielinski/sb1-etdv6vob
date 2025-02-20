import { supabase } from '@/lib/supabase';
import type { Team, UserRole } from '@/lib/types/team';

export async function createTeam(name: string, userEmail: string): Promise<Team> {
  // Start a Supabase transaction using a stored function
  const { data, error } = await supabase.rpc('create_team_with_owner', {
    team_name: name,
    owner_email: userEmail
  });

  if (error) throw error;
  return data.team;
}

export async function updateTeamName(teamId: string, name: string): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .update({ name })
    .eq('id', teamId)
    .select()
    .single();

  if (error) throw error;
  return data;
}