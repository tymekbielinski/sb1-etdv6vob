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
  if (metric.name) {
    return metric.name;
  }
  
  if (metric.type === 'total') {
    const metricNames = metric.metrics.map(m => METRIC_LABELS[m]);
    return `Total ${metricNames.join(' + ')}`;
  } else {
    const [numerator, denominator] = metric.metrics;
    return `${METRIC_LABELS[numerator]} / ${METRIC_LABELS[denominator]} Rate`;
  }
}

export function MetricCard({ title, value, className, metric }: MetricCardProps) {
  const navigate = useNavigate();
  const { removeMetric } = useMetricsStore();
  const { data } = useDailyLogsStore();
  const { ref, style } = useResizable();

  const handleEdit = () => {
    if (metric) {
      navigate(`/metrics/${metric.id}`);
    }
  };

  if (!metric) {
    return (
      <Card className={cn('flex flex-col', className)} style={style} ref={ref}>
        <CardHeader className="flex-1">
          <div className="font-medium">{title}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    );
  }

  const metricTitle = getMetricTitle(metric);
  const metricValue = formatValue(calculateMetricValue(metric, data), metric.displayType);

  return (
    <Card className={cn('flex flex-col group relative', className)} style={style} ref={ref}>
      <CardHeader className="flex-1">
        <div className="font-medium">{metricTitle}</div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
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
                className="h-8 w-8 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete metric?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the metric.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => metric && removeMetric(metric.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metricValue}</div>
      </CardContent>
    </Card>
  );
}