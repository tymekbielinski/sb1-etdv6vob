import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/components/auth/auth-provider';

interface TeamMembershipConfirmationProps {
  teamId: string;
  teamName: string;
  onConfirm: () => void;
  onDecline: () => void;
}

export function TeamMembershipConfirmation({
  teamId,
  teamName,
  onConfirm,
  onDecline,
}: TeamMembershipConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleConfirm = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "User email not found. Please try again or contact support.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Confirm the user's membership in the team
      // This simply verifies that the user's email is in the team_members array
      // No need to add them again since they're already there
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, team_members')
        .eq('id', teamId)
        .contains('team_members', [user.email])
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Team not found or you are not a member');
      }

      toast({
        title: "Team Joined!",
        description: `You've successfully joined ${teamName}.`,
      });
      
      onConfirm();
    } catch (error) {
      console.error('Team join error:', error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message
          : "Failed to join team. Please try again.",
        variant: "destructive",
      });
      onDecline(); // Fall back to creating a new team
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Join Existing Team</CardTitle>
        <CardDescription>
          You've been invited to join a team on GetMyKPI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>
            Your email has been added to the team <strong>{teamName}</strong>.
            Would you like to join this team?
          </p>
          <p className="text-sm text-muted-foreground">
            Joining this team will give you access to all team dashboards and resources.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onDecline}
          disabled={loading}
        >
          No, Create My Own Team
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? <LoadingSpinner className="mr-2" /> : null}
          Yes, Join Team
        </Button>
      </CardFooter>
    </Card>
  );
}
