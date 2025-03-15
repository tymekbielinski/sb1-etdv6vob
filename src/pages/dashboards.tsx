import { useState, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useDashboardsStore } from '@/lib/store/dashboards-store';
import { useTeamStore } from '@/lib/store/team-store';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { Dashboard } from '@/lib/api/dashboards/types';
import { RenameDialog } from '@/components/dialogs/rename-dialog';

export default function DashboardsPage() {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  
  const { dashboards, isLoading, error, fetchDashboards, deleteDashboard, updateDashboard } = useDashboardsStore();
  const { team } = useTeamStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const teamName = team?.name || 'Personal';
  
  // Fetch dashboards on mount
  useEffect(() => {
    fetchDashboards().catch(error => {
      console.error('Error fetching dashboards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboards',
        variant: 'destructive',
      });
    });
  }, [fetchDashboards, toast]);
  
  const handleCreateDashboard = () => {
    navigate('/');
  };
  
  const handleViewDashboard = (id: string) => {
    navigate(`/dashboard/${id}`);
  };
  
  const handleDeleteDashboard = async (id: string) => {
    try {
      await deleteDashboard(id);
      toast({
        title: 'Success',
        description: 'Dashboard deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete dashboard',
        variant: 'destructive',
      });
    }
  };

  const handleRenameDashboard = async (newTitle: string) => {
    if (!selectedDashboard) return;
    
    try {
      await updateDashboard({
        id: selectedDashboard.id,
        title: newTitle,
        config: selectedDashboard.config
      });
      toast({
        title: 'Success',
        description: 'Dashboard renamed successfully',
      });
    } catch (error) {
      console.error('Error renaming dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename dashboard',
        variant: 'destructive',
      });
    }
  };
  
  const handleBrowseTemplates = () => {
    navigate('/templates');
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
        <Button 
          onClick={() => fetchDashboards()}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{teamName} Dashboards</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleBrowseTemplates} variant="outline">
            Browse Templates
          </Button>
          <Button onClick={handleCreateDashboard}>
            New Dashboard
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Created</th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {dashboards.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted-foreground">
                  No dashboards found. Create a new dashboard or clone a template.
                </td>
              </tr>
            ) : (
              dashboards.map(dashboard => (
                <tr 
                  key={dashboard.id} 
                  className="border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleViewDashboard(dashboard.id)}
                >
                  <td className="p-3 flex items-center gap-2">
                    <span className="font-medium">{dashboard.title}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {formatDistanceToNow(new Date(dashboard.created_at), { addSuffix: true })}
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleViewDashboard(dashboard.id);
                        }}>
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDashboard(dashboard);
                          setRenameDialogOpen(true);
                        }}>
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDashboard(dashboard.id);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <RenameDialog
        title={selectedDashboard?.title || ''}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        onRename={handleRenameDashboard}
      />
    </div>
  );
}
