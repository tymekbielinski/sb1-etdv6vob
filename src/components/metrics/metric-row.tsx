import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MetricCard } from './metric-card';
import { useMetricsStore, type MetricRow as MetricRowType } from '@/lib/store/metrics-store';

interface MetricRowProps {
  row: MetricRowType;
  isDefault?: boolean;
}

export function MetricRow({ row, isDefault = false }: MetricRowProps) {
  const { definitions, removeRow } = useMetricsStore();
  
  // Get metrics for this row
  const rowMetrics = definitions
    .filter(def => row.metrics.includes(def.id))
    .sort((a, b) => a.order - b.order);

  return (
    <div className="relative group">
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="cursor-grab">
          <GripVertical className="h-4 w-4" />
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {!isDefault && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeRow(row.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {rowMetrics.map((metric) => (
            <MetricCard
              key={metric.id}
              metric={metric}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}