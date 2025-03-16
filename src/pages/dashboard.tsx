import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Facebook, Linkedin, Instagram, Mail, BarChart3, Plus, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/metrics/metric-card';
import { ChartContainer } from '@/components/charts/chart-container';
import { FilterControls } from '@/components/dashboard/filter-controls';
import { ActivityFilter, type ActivityType } from '@/components/dashboard/activity-filter';
import { DashboardBreadcrumb } from '@/components/dashboard/dashboard-breadcrumb';
import { useTeamStore } from '@/lib/store/team-store';
import { useDailyLogsStore } from '@/lib/store/daily-logs-store';
import { useChartsStore } from '@/lib/store/charts-store';
import { useMetricsStore } from '@/lib/store/metrics-store';
import { useDashboardsStore } from '@/lib/store/dashboards-store';
import { MetricRow } from '@/components/metrics/metric-row';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { calculateMetrics } from '@/lib/utils/metrics';
import type { DateRange } from '@/lib/types';
import { useNavigate, useParams } from 'react-router-dom';

// Define default activities
const DEFAULT_ACTIVITIES: ActivityType[] = [
  'cold_calls',
  'text_messages',
  'facebook_dms',
  'linkedin_dms',
  'instagram_dms',
  'cold_emails'
];

export default function Dashboard() {
  const { id: dashboardId } = useParams<{ id: string }>();
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize with last 30 days
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return { from: thirtyDaysAgo, to: today };
  });
  
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>(DEFAULT_ACTIVITIES);
  const { team, initialize: initializeTeam } = useTeamStore();
  const { data: activityData, isLoading: logsLoading, error: logsError, fetchLogs, reset } = useDailyLogsStore();
  const { charts, addChart } = useChartsStore();
  const { rows, addRow, addMetric } = useMetricsStore();
  const { 
    currentDashboard, 
    isLoading: dashboardLoading, 
    error: dashboardError, 
    fetchDashboard,
    updateDashboard
  } = useDashboardsStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const isLoading = logsLoading || dashboardLoading;
  const error = logsError || dashboardError;

  // Handle saving dashboard changes
  const handleSaveDashboard = async () => {
    if (!currentDashboard || !dashboardId) return;

    setIsSaving(true);
    try {
      await updateDashboard({
        id: dashboardId,
        config: {
          metrics: useMetricsStore.getState().definitions,
          layout: useMetricsStore.getState().rows,
          activities: selectedActivities,
          charts: useChartsStore.getState().charts
        }
      });
    } catch (error) {
      console.error('Error saving dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to save dashboard changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize team data
  useEffect(() => {
    initializeTeam().catch((error) => {
      console.error('Failed to initialize team:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team data',
        variant: 'destructive',
      });
    });
  }, [initializeTeam, toast]);

  // Load specific dashboard if ID is provided
  useEffect(() => {
    if (dashboardId) {
      fetchDashboard(dashboardId).catch((error) => {
        console.error('Failed to load dashboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard',
          variant: 'destructive',
        });
      });
    }
  }, [dashboardId, fetchDashboard, toast]);

  // Apply dashboard configuration if a dashboard is loaded
  useEffect(() => {
    if (currentDashboard?.config) {
      try {
        const config = currentDashboard.config;
        
        // Set metrics definitions from dashboard config
        if (config.metrics) {
          useMetricsStore.getState().setDefinitions(config.metrics);
        }
        
        // Set layout rows from dashboard config
        if (config.layout) {
          useMetricsStore.getState().setRows(config.layout);
        }
        
        // Set activities if defined in config
        if (config.activities) {
          setSelectedActivities(config.activities);
        }

        // Set charts if defined in config
        if (config.charts) {
          useChartsStore.getState().setCharts(config.charts);
        }
        
        // Fetch logs with the current date range
        fetchLogs(dateRange.from, dateRange.to).catch((error) => {
          console.error('Error fetching logs after loading dashboard:', error);
          toast({
            title: 'Error',
            description: 'Failed to load activity data for the dashboard',
            variant: 'destructive',
          });
        });
      } catch (error) {
        console.error('Error applying dashboard configuration:', error);
        toast({
          title: 'Error',
          description: 'Failed to apply dashboard configuration',
          variant: 'destructive',
        });
      }
    }
  }, [currentDashboard, fetchLogs, dateRange, toast]);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  // Fetch logs whenever filters change
  useEffect(() => {
    if (team?.id) {
      fetchLogs(dateRange.from, dateRange.to).catch((error) => {
        console.error('Error fetching logs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load activity data',
          variant: 'destructive',
        });
      });
    }
  }, [team?.id, dateRange, toast, fetchLogs]);

  const applyFilters = async () => {
    if (!team?.id) {
      toast({
        title: 'Error',
        description: 'No team found',
        variant: 'destructive',
      });
      return;
    }

    try {
      await fetchLogs(dateRange.from, dateRange.to);
    } catch (error) {
      console.error('Error applying filters:', error);
      throw error;
    }
  };

  const metrics = calculateMetrics(activityData);

  if (isLoading && !activityData.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (error && !activityData.length) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button 
          onClick={() => fetchDashboards()}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardBreadcrumb />
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboards')}>
              All Dashboards
            </Button>
            <Button 
              onClick={handleSaveDashboard} 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <FilterControls
              dateRange={dateRange}
              setDateRange={setDateRange}
              onApplyFilters={applyFilters}
            />
            <ActivityFilter
              selectedActivities={selectedActivities}
              onSelectionChange={setSelectedActivities}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/metrics/new', { state: { dashboardId } })}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchLogs(dateRange.from, dateRange.to)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Default Metrics Row */}
        <div className="grid gap-4 grid-cols-7">
          <MetricCard
            title="Total Activities"
            value={metrics.totalActivities.toString()}
            icon={BarChart3}
          />
          {DEFAULT_ACTIVITIES.map(activityId => {
            const activity = team?.default_activities?.find(a => a.id === activityId) || {
              id: activityId,
              label: activityId.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')
            };

            const icon = {
              cold_calls: Phone,
              text_messages: MessageSquare,
              facebook_dms: Facebook,
              linkedin_dms: Linkedin,
              instagram_dms: Instagram,
              cold_emails: Mail
            }[activityId];

            const value = {
              cold_calls: metrics.totalColdCalls,
              text_messages: metrics.totalTextMessages,
              facebook_dms: metrics.totalFacebookDms,
              linkedin_dms: metrics.totalLinkedinDms,
              instagram_dms: metrics.totalInstagramDms,
              cold_emails: metrics.totalColdEmails
            }[activityId];

            return (
              <MetricCard
                key={activityId}
                title={activity.label}
                value={value.toString()}
                icon={icon}
              />
            );
          })}
        </div>

        {/* Add New Metric Button */}
        <Button
          variant="outline"
          className="w-full py-8 border-dashed"
          onClick={() => navigate('/metrics/new', { state: { dashboardId } })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Metric
        </Button>

        {/* Custom Metric Rows */}
        <div className="space-y-4">
          {rows
            .sort((a, b) => a.order - b.order)
            .map((row) => (
              <MetricRow
                key={row.id}
                row={row}
                isDefault={row.id === 'default'}
              />
            ))}
        </div>

        {/* Charts */}
        <div className="space-y-4">
          {charts
            .sort((a, b) => a.order - b.order)
            .map((chart) => (
              <ChartContainer
                key={chart.id}
                chart={chart}
                data={activityData}
                selectedActivities={selectedActivities}
                isDefault={chart.id === 'default'}
              />
            ))}

          {/* Add Chart Button */}
          <Button
            variant="outline"
            className="w-full py-8 border-dashed"
            onClick={addChart}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Chart
          </Button>
        </div>
      </div>
    </div>
  );
}