import { useNavigate, useParams } from 'react-router-dom';
import { MetricBuilder } from '@/components/metrics/metric-builder';
import { useMetricsStore } from '@/lib/store/metrics-store';
import { useToast } from '@/hooks/use-toast';
import type { MetricDefinition } from '@/lib/store/metrics-store';

export default function NewMetric() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { rows, addRow, addMetric, definitions, updateMetric } = useMetricsStore();
  const { toast } = useToast();

  // Find existing metric if we're editing
  const existingMetric = id ? definitions.find(d => d.id === id) : undefined;

  const handleSave = (definition: Omit<MetricDefinition, 'id' | 'order' | 'rowId'>) => {
    try {
      if (existingMetric) {
        // Update existing metric
        updateMetric(existingMetric.id, definition);
        toast({
          title: 'Success',
          description: 'Metric updated successfully',
        });
      } else {
        // Add a new row if we don't have any
        if (rows.length === 0) {
          addRow();
        }
        // The metric will be added to the first row by default
        const firstRow = rows[0];
        if (firstRow) {
          addMetric(firstRow.id, definition);
          toast({
            title: 'Success',
            description: 'Metric created successfully',
          });
        }
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving metric:', error);
      toast({
        title: 'Error',
        description: 'Failed to save metric',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MetricBuilder onSave={handleSave} existingMetric={existingMetric} />
    </div>
  );
}
