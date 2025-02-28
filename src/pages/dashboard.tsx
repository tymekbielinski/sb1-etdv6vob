import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Facebook, Linkedin, Instagram, Mail, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/metrics/metric-card';
import { ChartContainer } from '@/components/charts/chart-container';
import { FilterControls } from '@/components/dashboard/filter-controls';
import { ActivityFilter, type ActivityType } from '@/components/dashboard/activity-filter';
import { useTeamStore } from '@/lib/store/team-store';
import { useDailyLogsStore } from '@/lib/store/daily-logs-store';
import { useChartsStore } from '@/lib/store/charts-store';
import { useMetricsStore } from '@/lib/store/metrics-store';
import { MetricRow } from '@/components/metrics/metric-row';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { calculateMetrics } from '@/lib/utils/metrics';
import type { DateRange } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

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
  // Initialize with last 30 days
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return { from: thirtyDaysAgo, to: today };
  });
  
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>(DEFAULT_ACTIVITIES);
  const { team, initialize: initializeTeam } = useTeamStore();
  const { data: activityData, isLoading, error, fetchLogs, reset } = useDailyLogsStore();
  const { charts, addChart } = useChartsStore();
  const { rows, addRow, addMetric } = useMetricsStore();
  const { toast } = useToast();
  const navigate = useNavigate();

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
        <button 
          onClick={applyFilters}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
      </div>

      <div className="space-y-6">
        {/* Default Metrics Row */}
        <div className="grid gap-4 grid-cols-7">
          <MetricCard
            title="Total Activities"
            value={metrics.totalActivities.toString()}
            icon={BarChart3}
          />
          <MetricCard
            title="Cold Calls"
            value={metrics.totalColdCalls.toString()}
            icon={Phone}
          />
          <MetricCard
            title="Text Messages"
            value={metrics.totalTextMessages.toString()}
            icon={MessageSquare}
          />
          <MetricCard
            title="Facebook DMs"
            value={metrics.totalFacebookDms.toString()}
            icon={Facebook}
          />
          <MetricCard
            title="LinkedIn DMs"
            value={metrics.totalLinkedinDms.toString()}
            icon={Linkedin}
          />
          <MetricCard
            title="Instagram DMs"
            value={metrics.totalInstagramDms.toString()}
            icon={Instagram}
          />
          <MetricCard
            title="Cold Emails"
            value={metrics.totalColdEmails.toString()}
            icon={Mail}
          />
        </div>

        {/* Add New Metric Button */}
        <Button
          variant="outline"
          className="w-full py-8 border-dashed"
          onClick={() => navigate('/metrics/new')}
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