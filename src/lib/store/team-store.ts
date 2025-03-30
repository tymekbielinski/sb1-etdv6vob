import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Team } from '@/lib/types/team';

interface TeamMemberData {
  id: string;
  email: string;
  name: string;
}

interface TeamState {
  team: Team | null;
  isLoading: boolean;
  error: string | null;
  memberData: Record<string, TeamMemberData>;
  lastMemberDataFetch: number | null;
}

interface TeamActions {
  setTeam: (team: Team | null) => void;
  updateTeamName: (name: string) => Promise<void>;
  updateTeamActivities: (activities: TeamActivity[]) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initialize: () => Promise<void>;
  reset: () => void;
  fetchMemberData: () => Promise<void>;
  addTeamMember: (email: string) => Promise<void>;
  removeTeamMember: (email: string) => Promise<void>;
}

type TeamStore = TeamState & TeamActions;

const MEMBER_DATA_CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      // Initial state
      team: null,
      isLoading: false,
      error: null,
      memberData: {},
      lastMemberDataFetch: null,

      // Actions
      setTeam: (team) => set({ team }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchMemberData: async () => {
        const { team, lastMemberDataFetch } = get();
        
        // Skip if no team
        if (!team?.team_members?.length) return;

        // Skip if cache is still valid
        if (
          lastMemberDataFetch && 
          Date.now() - lastMemberDataFetch < MEMBER_DATA_CACHE_DURATION &&
          Object.keys(get().memberData).length > 0
        ) {
          return;
        }

        try {
          set({ isLoading: true });
          
          const { data: users, error } = await supabase
            .from('users')
            .select('id, email, name')
            .in('email', team.team_members);

          if (error) throw error;

          const memberData: Record<string, TeamMemberData> = {};
          users?.forEach(user => {
            if (user.email) {
              memberData[user.email] = user;
            }
          });

          set({ 
            memberData,
            lastMemberDataFetch: Date.now(),
            error: null
          });
        } catch (error) {
          console.error('Error fetching member data:', error);
          const message = error instanceof Error ? error.message : 'Failed to load team member data';
          set({ error: message });
        } finally {
          set({ isLoading: false });
        }
      },

      updateTeamName: async (name: string) => {
        const { team } = get();
        if (!team) {
          const error = new Error('No team found');
          set({ error: error.message });
          throw error;
        }
        
        try {
          set({ isLoading: true, error: null });
          const { data, error } = await supabase
            .from('teams')
            .update({ name })
            .eq('id', team.id)
            .select('*')
            .single();

          if (error) throw error;
          if (!data) throw new Error('Failed to update team name');
          
          set({ team: data });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update team name';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateTeamActivities: async (activities) => {
        const { team } = get();
        if (!team) {
          const error = new Error('No team found');
          set({ error: error.message });
          throw error;
        }
        
        try {
          set({ isLoading: true, error: null });
          const { data, error } = await supabase
            .from('teams')
            .update({ default_activities: activities })
            .eq('id', team.id)
            .select('*')
            .single();

          if (error) throw error;
          if (!data) throw new Error('Failed to update team activities');
          
          // Update the entire team object with the response from the database
          set({ team: data });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update team activities';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      initialize: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Get current user's email
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError) throw authError;
          if (!user?.email) throw new Error('User email not found');

          // Get team where user is either owner or member
          const { data, error } = await supabase
            .from('teams')
            .select('*')
            .or(`user_id.eq.${user.id},team_members.cs.{${user.email}}`)
            .single();

          if (error) throw error;
          if (!data) throw new Error('No team found');

          set({ team: data, error: null });

          // Fetch member data after team is loaded
          await get().fetchMemberData();
        } catch (error) {
          console.error('Error initializing team store:', error);
          const message = error instanceof Error ? error.message : 'Failed to load team data';
          set({ error: message, team: null });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      reset: () => set({
        team: null,
        isLoading: false,
        error: null,
        memberData: {},
        lastMemberDataFetch: null,
      }),

      addTeamMember: async (email: string) => {
        const { team } = get();
        if (!team) {
          const error = new Error('No team found');
          set({ error: error.message });
          throw error;
        }
        
        try {
          set({ isLoading: true, error: null });
          
          // Validate email format
          if (!/\S+@\S+\.\S+/.test(email)) {
            throw new Error('Invalid email format');
          }
          
          // Check quota
          if (team.quota <= 0) {
            throw new Error('Team quota exceeded. Please upgrade to add more members.');
          }
          
          // Check if already in team
          if (team.team_members.includes(email)) {
            throw new Error('Member already exists');
          }
          
          // IMPORTANT: Check if user is already part of any team
          // Only check other teams (not the current team)
          const { data: existingTeams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name')
            .contains('team_members', [email])
            .neq('id', team.id);
            
          if (teamsError) {
            console.error('Error checking existing teams:', teamsError);
            throw teamsError;
          }
          
          // If user is already in any other team, throw error
          if (existingTeams && existingTeams.length > 0) {
            throw new Error('This user is already a member of another team');
          }
          
          // ULTRA SIMPLE APPROACH: Use raw SQL to update the team
          // This bypasses any potential issues with the JavaScript array handling
          const { data: rawData, error: rawError } = await supabase
            .from('teams')
            .update({
              // Use a simple string concatenation approach
              team_members: [...team.team_members, email],
              quota: team.quota - 1
            })
            .eq('id', team.id)
            .select('*');
          
          console.log('Update result:', { rawData, rawError });
          
          if (rawError) {
            console.error('Error updating team:', rawError);
            throw rawError;
          }
          
          // If we got data back, use it
          if (rawData && rawData.length > 0) {
            console.log('Update successful, got data back');
            set({ team: rawData[0] });
            
            // Refresh member data
            await get().fetchMemberData();
            return;
          }
          
          // If we didn't get data back, fetch the team again
          console.log('No data returned, fetching team...');
          const { data: refreshedTeam, error: refreshError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', team.id)
            .single();
          
          if (refreshError) {
            console.error('Error fetching team:', refreshError);
            throw new Error('Failed to verify team update');
          }
          
          if (!refreshedTeam) {
            console.error('Team not found after update');
            throw new Error('Team not found after update');
          }
          
          console.log('Fetched team:', refreshedTeam);
          console.log('Team members:', refreshedTeam.team_members);
          
          // Check if the email is in the team members array
          // Use a more lenient check that logs the actual values for debugging
          let found = false;
          console.log('Looking for email:', email);
          
          refreshedTeam.team_members.forEach((member, index) => {
            console.log(`Member ${index}:`, member);
            if (typeof member === 'string' && 
                (member === email || member.toLowerCase() === email.toLowerCase())) {
              console.log('Found match at index', index);
              found = true;
            }
          });
          
          if (!found) {
            console.error('Email not found in team members');
            throw new Error('Failed to add team member');
          }
          
          console.log('Email found in team members, update successful');
          set({ team: refreshedTeam });
          
          // Refresh member data
          await get().fetchMemberData();
        } catch (error) {
          console.error('Error in addTeamMember:', error);
          const message = error instanceof Error ? error.message : 'Failed to add team member';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removeTeamMember: async (email: string) => {
        const { team } = get();
        if (!team) {
          const error = new Error('No team found');
          set({ error: error.message });
          throw error;
        }
        
        try {
          set({ isLoading: true, error: null });
          
          // Check if email exists in team
          if (!team.team_members.includes(email)) {
            throw new Error('Member not found in team');
          }
          
          // Get current user's email to prevent removing self
          const { data: { user } } = await supabase.auth.getUser();
          if (!user?.email) throw new Error('User email not found');
          
          // Prevent removing self (team owner)
          if (user.email === email) {
            throw new Error('You cannot remove yourself from the team');
          }
          
          // Filter out the email to remove
          const updatedMembers = team.team_members.filter(member => 
            typeof member === 'string' && 
            member.toLowerCase() !== email.toLowerCase()
          );
          
          console.log('Current members:', team.team_members);
          console.log('Updated members:', updatedMembers);
          console.log('Removing:', email);
          console.log('New quota:', team.quota + 1);
          
          // Update the team
          const { data: rawData, error: rawError } = await supabase
            .from('teams')
            .update({
              team_members: updatedMembers,
              quota: team.quota + 1 // Increase quota when removing a member
            })
            .eq('id', team.id)
            .select('*');
          
          console.log('Remove result:', { rawData, rawError });
          
          if (rawError) {
            console.error('Error removing team member:', rawError);
            throw rawError;
          }
          
          // If we got data back, use it
          if (rawData && rawData.length > 0) {
            console.log('Remove successful, got data back');
            set({ team: rawData[0] });
            
            // Refresh member data
            await get().fetchMemberData();
            return;
          }
          
          // If we didn't get data back, fetch the team again
          console.log('No data returned, fetching team...');
          const { data: refreshedTeam, error: refreshError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', team.id)
            .single();
          
          if (refreshError) {
            console.error('Error fetching team:', refreshError);
            throw new Error('Failed to verify member removal');
          }
          
          if (!refreshedTeam) {
            console.error('Team not found after update');
            throw new Error('Team not found after update');
          }
          
          // Verify the email was removed
          const emailStillPresent = refreshedTeam.team_members.some(member => 
            typeof member === 'string' && 
            member.toLowerCase() === email.toLowerCase()
          );
          
          if (emailStillPresent) {
            console.error('Email still found in team members');
            throw new Error('Failed to remove team member');
          }
          
          console.log('Member successfully removed from team');
          set({ team: refreshedTeam });
          
          // Refresh member data
          await get().fetchMemberData();
        } catch (error) {
          console.error('Error in removeTeamMember:', error);
          const message = error instanceof Error ? error.message : 'Failed to remove team member';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'team-storage',
      partialize: (state) => ({
        team: state.team,
        memberData: state.memberData,
        lastMemberDataFetch: state.lastMemberDataFetch,
      }),
    }
  )
);