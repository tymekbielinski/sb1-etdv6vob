import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTemplatesStore } from '@/lib/store/templates-store';
import { useTeamStore } from '@/lib/store/team-store';
import { useNavigate } from 'react-router-dom';
import type { DashboardTemplate } from '@/lib/api/dashboards/types';

interface CloneTemplateDialogProps {
  template: DashboardTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloneTemplateDialog({ template, open, onOpenChange }: CloneTemplateDialogProps) {
  const [title, setTitle] = useState(template.name);
  const [description, setDescription] = useState(template.description || '');
  const [teamId, setTeamId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { cloneTemplate } = useTemplatesStore();
  const { team, teams, initialize: initializeTeams } = useTeamStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch teams on mount
  useEffect(() => {
    initializeTeams().catch(error => {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teams',
        variant: 'destructive',
      });
    });
  }, [initializeTeams, toast]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast({
        title: 'Error',
        description: 'Please provide a title for your dashboard',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const dashboard = await cloneTemplate({
        template_id: template.id,
        title,
        description: description || undefined,
        team_id: teamId || undefined,
      });
      
      toast({
        title: 'Success',
        description: 'Template cloned successfully',
      });
      
      onOpenChange(false);
      navigate(`/dashboard/${dashboard.id}`);
    } catch (error) {
      console.error('Error cloning template:', error);
      toast({
        title: 'Error',
        description: 'Failed to clone template',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Use Template</DialogTitle>
            <DialogDescription>
              Create a new dashboard based on this template. You can customize the title and description.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Dashboard Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., My Sales Dashboard"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for your dashboard..."
                rows={3}
              />
            </div>
            {teams && teams.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="team">Assign to Team (Optional)</Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Personal Dashboard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Personal Dashboard</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  If assigned to a team, all team members will have access to this dashboard.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Dashboard'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
