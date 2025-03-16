import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TeamHeader } from '@/components/team/team-header';
import { TeamRoster } from '@/components/team/team-roster';
import { TeamBanner } from '@/components/team/team-banner';
import { DefaultMetrics } from '@/components/team/default-metrics';
import { useTeamStore } from '@/lib/store/team-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { TeamMember } from '@/lib/types/team';
import { supabase } from '@/lib/supabase';

export default function TeamSettings() {
  const { 
    team,
    isLoading,
    error,
    updateTeamName, 
    initialize,
    reset 
  } = useTeamStore();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Reset store before initializing to ensure fresh data
    reset();
    initialize().catch((error) => {
      console.error('Failed to initialize team:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team data',
        variant: 'destructive',
      });
    });
  }, [initialize, reset, toast]);

  // Transform team members array into TeamMember objects with names
  useEffect(() => {
    async function fetchMemberDetails() {
      if (!team?.team_members) return;

      try {
        const { data: users, error } = await supabase
          .from('users')
          .select('email, name')
          .in('email', team.team_members);

        if (error) throw error;

        const transformedMembers = team.team_members.map(email => {
          const user = users?.find(u => u.email === email);
          return {
            email,
            name: user?.name || email.split('@')[0],
            isOwner: email === team.user_id
          };
        });

        setMembers(transformedMembers);
      } catch (error) {
        console.error('Error fetching member details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load team member details',
          variant: 'destructive',
        });
      }
    }

    if (team) {
      fetchMemberDetails();
    }
  }, [team, toast]);

  const handleUpdateTeamName = async (name: string) => {
    try {
      await updateTeamName(name);
      toast({
        title: 'Success',
        description: `Team name has been changed to "${name}"`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update team name',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <button 
          onClick={() => initialize()}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No team found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TeamBanner />
      <TeamHeader teamName={team.name} onUpdateName={handleUpdateTeamName} />
      <TeamRoster members={members} />
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Edit Your Default Metrics</h2>
        <DefaultMetrics />
      </div>
    </div>
  );
}