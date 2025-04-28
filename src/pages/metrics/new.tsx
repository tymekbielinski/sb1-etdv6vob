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

      // Always add the metric as a new one
      // Add a new row if we don't have any
      // Note: This simplification always adds to the first row. 
      // Consider adding logic to add to the same row as existingMetric if needed.
      if (rows.length === 0) {
        addRow();
      }
      // Ensure rows state is updated before accessing rows[0]
      const currentRows = useMetricsStore.getState().rows;
      const targetRow = currentRows[0]; 
      if (targetRow) {
        addMetric(targetRow.id, definition);
      } else {
        // Handle case where row couldn't be created or found
        console.error('Could not find or create a row to add the metric to.');
        throw new Error('Failed to determine target row for the metric.');
      }

      // Save the dashboard with updated metrics
      // Ensure we get the latest state after addMetric potentially updated it
      const updatedDefinitions = useMetricsStore.getState().definitions;
      const updatedRows = useMetricsStore.getState().rows;

      await updateDashboard({
        id: dashboardId,
        config: {
          metrics: updatedDefinitions,
          layout: updatedRows,
          activities: currentDashboard?.config.activities || [],
          charts: currentDashboard?.config.charts || []
        }
      });

      // Fetch the updated dashboard before navigating
      await fetchDashboard(dashboardId);

      toast({
        title: 'Success',
        description: 'Metric created successfully', // Always show created message
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
