import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useDashboardsStore } from '@/lib/store/dashboards-store';
import { useTeamStore } from '@/lib/store/team-store';

interface DashboardBreadcrumbProps {
  dashboardTitle?: string;
}

export function DashboardBreadcrumb({ dashboardTitle }: DashboardBreadcrumbProps) {
  const { team } = useTeamStore();
  const { currentDashboard } = useDashboardsStore();
  
  // Use provided title, or currentDashboard title, or default to "Dashboard"
  const title = dashboardTitle || (currentDashboard?.title || 'Dashboard');
  
  // Use team name if available, otherwise default to "Personal"
  const teamName = team?.name || 'Personal';

  return (
    <div className="mb-4">
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
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
