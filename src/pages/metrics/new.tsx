import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MetricBuilder } from '@/components/metrics/metric-builder';
import { useMetricsStore } from '@/lib/store/metrics-store';
import { useDashboardsStore } from '@/lib/store/dashboards-store';
import { useToast } from '@/hooks/use-toast';
import type { MetricDefinition } from '@/lib/store/metrics-store';

export default function NewMetric() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { rows, addRow, addMetric, definitions, updateMetric } = useMetricsStore();
  const { currentDashboard, updateDashboard, fetchDashboard } = useDashboardsStore();
  const { toast } = useToast();

  // Get dashboardId from location state
  const dashboardId = location.state?.dashboardId;

  // Find existing metric if we're editing
  const existingMetric = id ? definitions.find(d => d.id === id) : undefined;

  const handleSave = async (definition: Omit<MetricDefinition, 'id' | 'order' | 'rowId'>) => {
    try {
      if (!dashboardId) {
        throw new Error('No dashboard selected');
      }

      if (existingMetric) {
        // Update existing metric
        updateMetric(existingMetric.id, definition);
      } else {
        // Add a new row if we don't have any
        if (rows.length === 0) {
          addRow();
        }
        // The metric will be added to the first row by default
        const firstRow = rows[0];
        if (firstRow) {
          addMetric(firstRow.id, definition);
        }
      }

      // Save the dashboard with updated metrics
      await updateDashboard({
        id: dashboardId,
        config: {
          metrics: useMetricsStore.getState().definitions,
          layout: useMetricsStore.getState().rows,
          activities: currentDashboard?.config.activities || [],
          charts: currentDashboard?.config.charts || []
        }
      });

      // Fetch the updated dashboard before navigating
      await fetchDashboard(dashboardId);

      toast({
        title: 'Success',
        description: existingMetric ? 'Metric updated successfully' : 'Metric created successfully',
      });
      
      // Navigate back to the specific dashboard
      navigate(`/dashboard/${dashboardId}`);
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
    <MetricBuilder onSave={handleSave} existingMetric={existingMetric} />
  );
}
