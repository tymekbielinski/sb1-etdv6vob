import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { useTeamStore } from '@/lib/store/team-store';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AddTeamMemberProps {
  children: React.ReactNode;
}

export function AddTeamMember({ children }: AddTeamMemberProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { team, addTeamMember } = useTeamStore();
  const { toast } = useToast();
  
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!team) return;
    
    // Basic email validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      await addTeamMember(email.trim());
      
      toast({
        title: 'Team member added',
        description: `${email} has been added to your team.`,
      });
      
      // Reset and close
      setEmail('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add team member',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a team member by entering their email address. They will be able to access team dashboards and metrics.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
              disabled={isLoading}
            />
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Adding...
                </>
              ) : (
                'Add Member'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
