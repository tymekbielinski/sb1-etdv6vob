import { supabase } from '@/lib/supabase';
import { createTeam } from '@/lib/api/team';

/**
 * Initiates the team creation process for a user
 * @param teamName The name of the team to create
 * @param userEmail The email of the user who will be the team owner
 * @returns A promise that resolves when the team is created
 */
export async function createUserTeam(teamName: string, userEmail: string) {
  try {
    // Check if user already has a team
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }
    
    const { data: existingTeams, error: teamQueryError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('user_id', userData.user.id);
    
    if (teamQueryError) {
      console.error('Error checking for existing teams:', teamQueryError);
      throw teamQueryError;
    }
    
    // Only create a team if the user doesn't already have one
    if (existingTeams && existingTeams.length > 0) {
      console.log(`User already has a team: ${existingTeams[0].name}`);
      return existingTeams[0];
    }
    
    // Create the team
    const team = await createTeam(teamName, userEmail);
    console.log(`Team created for user: ${userEmail}`);
    
    return team;
  } catch (error) {
    console.error('Error in team creation process:', error);
    throw error;
  }
}

/**
 * Checks if a user has any teams
 * @returns A promise that resolves to true if the user has at least one team, false otherwise
 */
export async function userHasTeam(): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      return false;
    }
    
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userData.user.id);
    
    if (error) {
      console.error('Error checking teams:', error);
      return false;
    }
    
    return teams && teams.length > 0;
  } catch (error) {
    console.error('Error checking if user has team:', error);
    return false;
  }
}
