import { supabase } from '@/lib/supabase';
import type { Team, UserRole } from '@/lib/types/team';

export async function createTeam(name: string, userEmail: string): Promise<Team> {
  try {
    // First try using the stored procedure
    const { data, error } = await supabase.rpc('create_team_with_owner', {
      team_name: name,
      owner_email: userEmail
    });

    if (error) {
      console.error('Error using create_team_with_owner RPC:', error);
      // If the stored procedure fails, fall back to direct table insertion
      return await createTeamDirectly(name, userEmail);
    }
    
    return data.team;
  } catch (error) {
    console.error('Team creation error:', error);
    throw error;
  }
}

// Fallback function that creates a team directly without using the stored procedure
async function createTeamDirectly(name: string, userEmail: string): Promise<Team> {
  // Get the user ID from the email
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (userError) {
    console.error('Error finding user:', userError);
    throw userError;
  }

  // Create the team with the user as owner
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .insert({
      name,
      user_id: userData.id,
      team_members: [userEmail] // Store the owner's email in the team_members array
    })
    .select()
    .single();

  if (teamError) {
    console.error('Error creating team directly:', teamError);
    throw teamError;
  }

  return teamData;
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