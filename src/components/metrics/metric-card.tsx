import { Settings, Trash2 } from 'lucide-react';
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
import { MetricFilterModal } from './metric-filter-modal';
import { useMetricsStore, type MetricDefinition } from '@/lib/store/metrics-store';
import { useDailyLogsStore } from '@/lib/store/daily-logs-store';
import { useResizable } from '@/hooks/use-resizable';

interface MetricCardProps {
  title?: string;
  value?: string;
  className?: string;
  metric?: MetricDefinition;
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

function formatValue(value: number, type: 'number' | 'dollar' | 'percent'): string {
  switch (type) {
    case 'dollar':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    case 'percent':
      return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value);
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
}

function getMetricTitle(metric: MetricDefinition): string {
  if (metric.type === 'total') {
    const metricNames = metric.metrics.map(m => METRIC_LABELS[m]);
    return `Total ${metricNames.join(' + ')}`;
  } else {
    const [numerator, denominator] = metric.metrics;
    return `${METRIC_LABELS[numerator]} / ${METRIC_LABELS[denominator]} Rate`;
  }
}

export function MetricCard({ title, value, className, metric }: MetricCardProps) {
  const { data } = useDailyLogsStore();
  const { updateMetric, removeMetric } = useMetricsStore();
  const { ref, style, isResizing } = useResizable({
    direction: 'both',
    onResizeEnd: (size) => {
      if (metric) {
        // Save the new size to the metric definition
        updateMetric(metric.id, { size });
      }
    },
  });

  // If we have a metric definition, calculate the value
  if (metric) {
    const calculatedValue = calculateMetricValue(metric, data);
    value = formatValue(calculatedValue, metric.displayType);
    title = getMetricTitle(metric);
  }

  const handleEdit = (updates: Omit<MetricDefinition, 'id' | 'order' | 'rowId'>) => {
    if (metric) {
      updateMetric(metric.id, updates);
    }
  };

  return (
    <Card 
      ref={ref}
      className={cn(
        "bg-card/50 backdrop-blur-sm border-muted/20 group relative transition-all",
        isResizing && "select-none",
        className
      )}
      style={style}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {metric && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
            <MetricFilterModal
              existingMetric={metric}
              onSave={handleEdit}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Metric</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this metric? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => removeMetric(metric.id)}
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
        <div className="text-2xl font-bold tracking-tight">{value}</div>
      </CardContent>
      {metric && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
    </Card>
  );
}