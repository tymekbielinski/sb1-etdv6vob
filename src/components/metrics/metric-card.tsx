import { Settings, Trash2, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils';
import { useMetricsStore, type MetricDefinition } from '@/lib/store/metrics-store';
import { useDailyLogsStore } from '@/lib/store/daily-logs-store';
import { useTeamStore } from '@/lib/store/team-store';
import { useResizable } from '@/hooks/use-resizable';
import { formatMetricValue } from '@/lib/utils/format';

interface MetricCardProps {
  title?: string;
  value?: string;
  className?: string;
  metric?: MetricDefinition;
  icon?: any;
}

function getMetricLabel(id: string): string {
  const { team } = useTeamStore();
  const activity = team?.default_activities?.find(a => a.id === id);
  if (activity) return activity.label;

  // Fallback to formatted ID if no custom label found
  return id.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function calculateMetricValue(metric: MetricDefinition, data: any[]): number {
  if (metric.type === 'total') {
    const values = data.flatMap(day => 
      metric.metrics.map(m => day[m] || 0)
    );

    switch (metric.aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'average':
        return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return 0;
    }
  } else if (metric.type === 'conversion') {
    const [numerator, denominator] = metric.metrics;
    const totalNumerator = data.reduce((sum, day) => sum + (day[numerator] || 0), 0);
    const totalDenominator = data.reduce((sum, day) => sum + (day[denominator] || 0), 0);
    return totalDenominator ? totalNumerator / totalDenominator : 0;
  }

  return 0;
}

function getMetricTitle(metric: MetricDefinition): string {
  if (metric.name) {
    return metric.name;
  }
  
  if (metric.type === 'total') {
    const metricNames = metric.metrics.map(m => getMetricLabel(m));
    return `Total ${metricNames.join(' + ')}`;
  } else {
    const [numerator, denominator] = metric.metrics;
    return `${getMetricLabel(numerator)} / ${getMetricLabel(denominator)}`;
  }
}

export function MetricCard({ title, value, className, metric, icon: Icon }: MetricCardProps) {
  const { removeMetric } = useMetricsStore();
  const { data: activityData } = useDailyLogsStore();
  const navigate = useNavigate();

  const handleEdit = () => {
    if (metric) {
      navigate(`/metrics/${metric.id}`);
    }
  };

  const handleDelete = () => {
    if (metric) {
      removeMetric(metric.id);
    }
  };

  const displayValue = metric
    ? formatMetricValue(calculateMetricValue(metric, activityData), metric.displayType)
    : value;

  const displayTitle = metric ? getMetricTitle(metric) : title;

  return (
    <Card className={cn(
      "relative group transition-colors flex flex-col min-h-[150px] overflow-hidden",
      className
    )}>
      {/* Top Section: Header */}
      <div 
        className="p-3 transition-colors hover:bg-accent/20 cursor-pointer"
        onClick={handleEdit}
      >
        <div className="flex items-center justify-between space-x-2">
          {/* Left side: Icon and Title */}
          <div className="flex items-center space-x-2 overflow-hidden">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            <h3 className="font-medium leading-none truncate" title={displayTitle}>{displayTitle}</h3>
          </div>

          {/* Right side: Actions Menu */}
          {metric && (
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <AlertDialogTrigger asChild>
                       <DropdownMenuItem
                         className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                         onSelect={(e) => e.preventDefault()} // Prevent closing dropdown
                       >
                         <Trash2 className="mr-2 h-4 w-4" />
                         <span>Delete</span>
                       </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Delete Confirmation Dialog */}
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this metric.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50"></div>

      {/* Bottom Section: Value */}
      <div className="flex flex-grow items-center justify-center p-4 transition-colors hover:bg-accent/30">
        <div className="text-4xl font-bold">{displayValue}</div>
      </div>
    </Card>
  );
}