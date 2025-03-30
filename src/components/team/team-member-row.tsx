import { Mail, UserMinus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTeamStore } from '@/lib/store/team-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { TeamMember } from '@/lib/types/team';

interface TeamMemberRowProps {
  member: TeamMember;
}

export function TeamMemberRow({ member }: TeamMemberRowProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { removeTeamMember } = useTeamStore();
  const { toast } = useToast();
  
  // Safely handle potentially undefined name
  const name = member.name || member.email.split('@')[0];
  const initials = name
    .split(' ')
    .map(part => part?.[0] || '')
    .join('')
    .toUpperCase();
    
  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      await removeTeamMember(member.email);
      toast({
        title: 'Team member removed',
        description: `${name} has been removed from your team.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove team member',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-muted/20">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium">{initials}</span>
        </div>
        <div>
          <p className="font-medium">{member.name || member.email.split('@')[0]}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{member.email}</span>
            {member.isOwner && (
              <span className="ml-2 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                Team Owner
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Only show remove button for non-owners */}
      {!member.isOwner && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setShowConfirmDialog(true)}
          disabled={isRemoving}
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      )}
      
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {name} from your team?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemoving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}