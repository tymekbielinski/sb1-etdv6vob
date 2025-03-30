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
    
    // First check if user is an owner of any team
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
    
    // Then check if user is a member of any team (using their email)
    if (userData.user.email) {
      const { data: memberTeams, error: memberError } = await supabase
        .from('teams')
        .select('id, name, team_members')
        .contains('team_members', [userData.user.email]);
      
      if (memberError) {
        console.error('Error checking team membership:', memberError);
      } else if (memberTeams && memberTeams.length > 0) {
        console.log(`User is already a member of team: ${memberTeams[0].name}`);
        return memberTeams[0];
      }
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
 * Checks if an email is in any team's members list
 * @param email The email to check
 * @returns A promise that resolves to the team if found, null otherwise
 */
export async function checkEmailInTeams(email: string) {
  try {
    if (!email) return null;
    
    // Check if email is in any team's members list
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name, user_id, team_members')
      .contains('team_members', [email]);
    
    if (error) {
      console.error('Error checking email in teams:', error);
      return null;
    }
    
    if (teams && teams.length > 0) {
      console.log(`Email ${email} found in team: ${teams[0].name}`);
      return teams[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error checking email in teams:', error);
    return null;
  }
}

/**
 * Checks if a user has any teams (either as owner or member)
 * @returns A promise that resolves to true if the user has at least one team, false otherwise
 */
export async function userHasTeam(): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      return false;
    }
    
    // First check if user is an owner of any team
    const { data: ownedTeams, error: ownedError } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userData.user.id);
    
    if (ownedError) {
      console.error('Error checking owned teams:', ownedError);
    } else if (ownedTeams && ownedTeams.length > 0) {
      console.log('User is an owner of teams:', ownedTeams.length);
      return true;
    }
    
    // Then check if user is a member of any team (using their email)
    if (userData.user.email) {
      const { data: memberTeams, error: memberError } = await supabase
        .from('teams')
        .select('id, name, team_members')
        .contains('team_members', [userData.user.email]);
      
      if (memberError) {
        console.error('Error checking team membership:', memberError);
      } else if (memberTeams && memberTeams.length > 0) {
        console.log('User is a member of teams:', memberTeams.length);
        return true;
      }
    }
    
    // User is neither an owner nor a member of any team
    return false;
  } catch (error) {
    console.error('Error checking if user has team:', error);
    return false;
  }
}
