import { Card } from '@/components/ui/card';
import { MetricCard } from './metric-card';
import { useMetricsStore, type MetricRow as MetricRowType } from '@/lib/store/metrics-store';

interface MetricRowProps {
  row: MetricRowType;
  isDefault?: boolean;
}

export function MetricRow({ row, isDefault = false }: MetricRowProps) {
  const { definitions } = useMetricsStore();
  
  // Get metrics for this row
  const rowMetrics = definitions
    .filter(def => row.metrics.includes(def.id))
    .sort((a, b) => a.order - b.order);

  return (
    <Card className="p-4 transition-colors hover:bg-accent/20">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {rowMetrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
          />
        ))}
      </div>
    </Card>
  );
}