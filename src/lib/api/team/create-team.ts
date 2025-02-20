import { supabase } from '@/lib/supabase';
import type { Team } from '@/lib/types/team';

interface CreateTeamResult {
  team: Team;
  userId: string;
}

export async function createTeamWithOwner(
  ownerName: string,
  ownerEmail: string
): Promise<CreateTeamResult> {
  const teamName = `${ownerName}'s Team`;
  
  const { data, error } = await supabase.rpc('create_team_with_owner', {
    team_name: teamName,
    owner_email: ownerEmail
  });

  if (error) {
    console.error('Error creating team:', error);
    throw new Error('Failed to create team');
  }

  return {
    team: data.team,
    userId: data.user_id
  };
}