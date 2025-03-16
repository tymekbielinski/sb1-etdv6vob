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