import { Settings, Trash2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useMetricsStore, type MetricDefinition } from '@/lib/store/metrics-store';
import { useDailyLogsStore } from '@/lib/store/daily-logs-store';
import { useResizable } from '@/hooks/use-resizable';
import { formatMetricValue } from '@/lib/utils/format';

interface MetricCardProps {
  title?: string;
  value?: string;
  className?: string;
  metric?: MetricDefinition;
  icon?: any;
}

const METRIC_LABELS: Record<string, string> = {
  cold_calls: 'Cold Calls',
  text_messages: 'Text Messages',
  facebook_dms: 'Facebook DMs',
  linkedin_dms: 'LinkedIn DMs',
  instagram_dms: 'Instagram DMs',
  cold_emails: 'Cold Emails',
  quotes: 'Quotes',
  booked_calls: 'Booked Calls',
  completed_calls: 'Completed Calls',
  booked_presentations: 'Booked Presentations',
  completed_presentations: 'Completed Presentations',
  submitted_applications: 'Submitted Applications',
  deals_won: 'Deals Won',
  deal_value: 'Deal Value',
};

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
    const metricNames = metric.metrics.map(m => METRIC_LABELS[m]);
    return `Total ${metricNames.join(' + ')}`;
  } else {
    const [numerator, denominator] = metric.metrics;
    return `${METRIC_LABELS[numerator]} / ${METRIC_LABELS[denominator]}`;
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
    <Card className={cn("relative group", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <h3 className="font-medium leading-none">{displayTitle}</h3>
        </div>
        {metric && (
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleEdit}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
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
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
      </CardContent>
    </Card>
  );
}