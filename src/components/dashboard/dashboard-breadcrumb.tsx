import { Link } from 'react-router-dom';
import { ChevronRight, Save, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDashboardsStore } from '@/lib/store/dashboards-store';
import { useTeamStore } from '@/lib/store/team-store';

interface DashboardBreadcrumbProps {
  dashboardTitle?: string;
  isSaving?: boolean;
  onSave?: () => void;
  isHome?: boolean;
  onSetAsHome?: () => void;
  hasUnsavedChanges?: boolean;
}

export function DashboardBreadcrumb({ 
  dashboardTitle, 
  isSaving = false,
  onSave,
  isHome = false,
  onSetAsHome,
  hasUnsavedChanges = false
}: DashboardBreadcrumbProps) {
  const { team } = useTeamStore();
  const { currentDashboard } = useDashboardsStore();
  
  // Use provided title, or currentDashboard title, or default to "Dashboard"
  const title = dashboardTitle || (currentDashboard?.title || 'Dashboard');
  
  // Use team name if available, otherwise default to "Personal"
  const teamName = team?.name || 'Personal';

  return (
    <div className="mb-4 flex justify-between items-center">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link 
                to="/dashboards" 
                className="text-sm font-medium text-primary hover:underline"
              >
                {teamName} Dashboards
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <span className="text-sm font-medium">{title}</span>
            {isHome && (
              <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                <Home className="mr-1 h-3 w-3" />
                Home
              </span>
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex gap-2">
        {onSetAsHome && !isHome && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onSetAsHome}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Set as Home
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Make this your default dashboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {onSave && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={hasUnsavedChanges ? "default" : "outline"} 
                  size="sm" 
                  onClick={onSave}
                  disabled={isSaving}
                  className={hasUnsavedChanges ? "animate-pulse" : ""}
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Saving...
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {hasUnsavedChanges 
                  ? "You have unsaved changes" 
                  : "All changes are saved"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
