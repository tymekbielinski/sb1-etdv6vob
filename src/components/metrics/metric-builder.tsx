import { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCw, CalendarIcon, X, Check, Settings, Hash, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/date-range-picker';
import type { MetricDefinition } from '@/lib/store/metrics-store';
import type { DateRange } from '@/lib/types';
import { calculateMetricValue } from '@/lib/utils/metrics';
import { formatMetricValue } from '@/lib/utils/format';
import { useDailyLogsStore } from '@/lib/store/daily-logs-store';
import { useTeamStore } from '@/lib/store/team-store';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MetricSelector } from '@/components/metrics/metric-selector';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { ActivityChart } from '@/components/charts/activity-chart';

const AVAILABLE_METRICS = [
  { value: 'cold_calls', label: 'Cold Calls' },
  { value: 'text_messages', label: 'Text Messages' },
  { value: 'facebook_dms', label: 'Facebook DMs' },
  { value: 'linkedin_dms', label: 'LinkedIn DMs' },
  { value: 'instagram_dms', label: 'Instagram DMs' },
  { value: 'cold_emails', label: 'Cold Emails' },
  { value: 'quotes', label: 'Quotes' },
  { value: 'booked_calls', label: 'Booked Calls' },
  { value: 'completed_calls', label: 'Completed Calls' },
  { value: 'booked_presentations', label: 'Booked Presentations' },
  { value: 'completed_presentations', label: 'Completed Presentations' },
  { value: 'submitted_applications', label: 'Submitted Applications' },
  { value: 'deals_won', label: 'Deals Won' },
  { value: 'deal_value', label: 'Deal Value' },
];

interface MetricBuilderProps {
  onSave: (definition: Omit<MetricDefinition, 'id' | 'order' | 'rowId'>) => void;
  existingMetric?: MetricDefinition;
}

export function MetricBuilder({ onSave, existingMetric }: MetricBuilderProps) {
  const [activeTab, setActiveTab] = useState<'totals' | 'conversions'>('totals');
  const [metricName, setMetricName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<'number' | 'chart'>('number');
  const [unit, setUnit] = useState<'number' | 'dollar' | 'percent'>('number');
  const [chartType, setChartType] = useState<'chart_total' | 'chart_team' | 'chart_metric'>('chart_total');
  const [aggregation, setAggregation] = useState<'sum' | 'average' | 'max' | 'min'>('sum');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    const lastDayOfMonth = endOfMonth(today);
    return { 
      from: firstDayOfMonth,
      to: lastDayOfMonth
    };
  });
  const [metricValue, setMetricValue] = useState<number | null>(null);

  const { team, isLoading: isTeamLoading } = useTeamStore();
  const { data: activityData, isLoading: isActivityLoading, error, fetchLogs } = useDailyLogsStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get available metrics with labels from team settings
  const getAvailableMetrics = () => {
    if (!team?.default_activities) return AVAILABLE_METRICS;

    return AVAILABLE_METRICS.map(metric => {
      const teamMetric = team.default_activities.find(a => a.id === metric.value);
      return {
        value: metric.value,
        label: teamMetric?.label || metric.label
      };
    });
  };

  // Load activity data when date range changes
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

  // Calculate metric value when activity data changes
  useEffect(() => {
    if (!selectedMetrics.length || !activityData?.length) return;

    const definition: MetricDefinition = {
      id: existingMetric?.id || 'temp',
      type: activeTab === 'totals' ? 'total' : 'conversion',
      metrics: selectedMetrics,
      displayType: unit,
      aggregation: activeTab === 'totals' ? aggregation : undefined,
      order: existingMetric?.order || 0,
      rowId: existingMetric?.rowId || 'temp',
    };

    const value = calculateMetricValue(definition, activityData);
    setMetricValue(value);
  }, [selectedMetrics, activeTab, aggregation, activityData]);

  // Initialize form with existing metric data if provided
  useEffect(() => {
    if (existingMetric) {
      const isConversion = existingMetric.type === 'conversion';
      setActiveTab(isConversion ? 'conversions' : 'totals');
      setSelectedMetrics(existingMetric.metrics);
      if (existingMetric.aggregation) {
        setAggregation(existingMetric.aggregation);
      }
      if (existingMetric.name) {
        setMetricName(existingMetric.name);
      }
      if (existingMetric.description) {
        setDescription(existingMetric.description);
      }
      
      // Set display mode and chart type
      if (existingMetric.displayMode === 'number') {
        setDisplayMode('number');
      } else if (existingMetric.displayMode.startsWith('chart_')) {
        setDisplayMode('chart');
        setChartType(existingMetric.displayMode as typeof chartType);
      } else {
        setDisplayMode('number'); // Default
      }

      // Explicitly set unit based on metric type for existing metrics
      setUnit(isConversion ? 'percent' : (existingMetric.unit || 'number'));
    }
  }, [existingMetric]);

  // Update display type when tab changes
  useEffect(() => {
    if (!existingMetric) {
      setUnit(activeTab === 'conversions' ? 'percent' : 'number');
    }
  }, [activeTab, existingMetric]);

  const handleSave = async () => {
    if (!metricName) {
      toast({
        title: "Error",
        description: "Please provide a name for your metric",
        variant: "destructive",
      });
      return;
    }

    if (selectedMetrics.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one metric",
        variant: "destructive",
      });
      return;
    }

    const metricType = activeTab === 'totals' ? 'total' : 'conversion';

    if (metricType === 'conversion' && selectedMetrics.length !== 2) {
      toast({
        title: "Error",
        description: "Please select exactly two metrics for conversion calculation (numerator first, then denominator)",
        variant: "destructive",
      });
      return;
    }

    const finalUnit = metricType === 'conversion' ? 'percent' : unit;
    const metricDisplayMode = displayMode === 'chart' ? chartType : 'number';

    const metricToSave: Omit<MetricDefinition, 'id' | 'order' | 'rowId'> = {
      type: metricType,
      metrics: selectedMetrics,
      displayType: finalUnit,
      displayMode: metricDisplayMode,
      aggregation: metricType === 'total' ? aggregation : undefined,
      name: metricName || undefined,
      description: description || undefined,
    };

    // Add numerator and denominator for conversion metrics
    if (metricType === 'conversion') {
      metricToSave.numerator = selectedMetrics[0];
      metricToSave.denominator = selectedMetrics[1];
    }

    onSave(metricToSave);

    // Navigate to dashboard
    navigate('/');
  };

  // Get metric label from team settings or default
  const getMetricLabel = (metricId: string): string => {
    const teamMetric = team?.default_activities?.find(a => a.id === metricId);
    if (teamMetric) return teamMetric.label;

    const defaultMetric = AVAILABLE_METRICS.find(m => m.value === metricId);
    return defaultMetric?.label || metricId;
  };

  // Memoize conversionMetric prop for chart
  const chartConversionMetric = useMemo(() => {
    if (activeTab === 'conversions' && selectedMetrics.length === 2) {
      return { numerator: selectedMetrics[0], denominator: selectedMetrics[1] };
    }
    return undefined; // Important: Undefined for non-conversion types
  }, [activeTab, selectedMetrics]);

  // Memoize selectedActivities prop for chart
  const chartSelectedActivities = useMemo(() => {
    if (activeTab === 'totals') {
      return selectedMetrics;
    }
    return undefined; // Important: Undefined for conversion types
  }, [activeTab, selectedMetrics]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Fixed Save Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button onClick={handleSave}>Save</Button>
      </div>

      <div className="container mx-auto pt-2 space-y-6">
        {/* Title and Description */}
        <div className="space-y-2 border-b pb-4">
          <input
            type="text"
            placeholder="Metric Name"
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            className="text-xl font-semibold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/50"
          />
          <input
            type="text"
            placeholder="Add description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm text-muted-foreground bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Tabs Section */}
        <div className="flex items-center">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="h-9 px-1">
              <TabsTrigger value="totals" className="px-3">Totals</TabsTrigger>
              <TabsTrigger value="conversions" className="px-3">Conversions</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Metric Definition Section */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Definition</h2>
          <Card className="p-6 border border-input/20">
            {/* Controls Row */}
            <div className="flex flex-col gap-4">
              {/* Selected Metrics Pool */}
              {selectedMetrics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedMetrics.map(value => (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="group cursor-pointer hover:bg-muted"
                    >
                      {getMetricLabel(value)}
                      <button
                        onClick={() => setSelectedMetrics(metrics => metrics.filter(m => m !== value))}
                        className="ml-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-background/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <MetricSelector
                    metrics={getAvailableMetrics()}
                    selectedMetrics={selectedMetrics}
                    onChange={setSelectedMetrics}
                    className="w-full"
                  />
                </div>

                {activeTab === 'totals' && (
                  <div className="w-[200px]">
                    <Select value={aggregation} onValueChange={(value: any) => setAggregation(value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select aggregation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sum">Total count</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="max">Maximum</SelectItem>
                        <SelectItem value="min">Minimum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Metric Visualization Section */}
          <Card className="p-6 border border-input/20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <DatePickerWithRange
                  date={dateRange}
                  setDate={setDateRange}
                />
              </div>

              <div className="flex items-center space-x-4">
                {/* Options Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[110px]">
                      <Settings className="mr-2 h-4 w-4" /> Options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Metric Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Unit Selection Group - Only show for non-conversion metrics */}
                    {activeTab !== 'conversions' && (
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs text-muted-foreground px-2">Unit</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => setUnit('number')}>
                          <span className="flex-grow">Number</span>
                          {unit === 'number' && <Check className="ml-2 h-4 w-4" />} 
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setUnit('dollar')}>
                          <span className="flex-grow">Currency ($)</span>
                          {unit === 'dollar' && <Check className="ml-2 h-4 w-4" />} 
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setUnit('percent')}>
                          <span className="flex-grow">Percentage (%)</span>
                          {unit === 'percent' && <Check className="ml-2 h-4 w-4" />} 
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    )}

                    {/* Breakdown Selection - Show for Activity AND Conversion */}
                    {(activeTab === 'totals' || activeTab === 'conversions') && (
                      <>
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Breakdown by</DropdownMenuLabel>
                        {/* Restore Radio Group structure */}
                        <DropdownMenuRadioGroup value={chartType} onValueChange={(value) => setChartType(value as 'chart_total' | 'chart_team' | 'chart_metric')}>
                          {/* Total: Always show if group is visible */}
                          <DropdownMenuRadioItem value="chart_total">Total</DropdownMenuRadioItem>
                          {/* Team & Metric: Only show for 'activity' type */}
                          {activeTab === 'totals' && (
                            <>
                              <DropdownMenuRadioItem value="chart_team">Team</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="chart_metric">Metric</DropdownMenuRadioItem>
                            </>
                          )}
                        </DropdownMenuRadioGroup>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Simplified Display Mode Select (No Label) */}
                <Select 
                  value={displayMode} 
                  onValueChange={(value: 'number' | 'chart') => setDisplayMode(value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">
                      <div className="flex items-center">
                        <Hash className="mr-2 h-4 w-4" />
                        <span>Number</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="chart">
                      <div className="flex items-center">
                        <LineChart className="mr-2 h-4 w-4" />
                        <span>Chart</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center min-h-[250px] p-4 bg-muted/40 rounded-md border border-dashed">
              {/* Show Numeric Value ONLY if mode is 'number' */}
              {displayMode === 'number' && (
                <span className="text-5xl font-semibold tracking-tight">
                  {isActivityLoading ? <LoadingSpinner size="large"/> : formatMetricValue(metricValue, unit)}
                </span>
              )}
              
              {/* Show Chart ONLY if mode is 'chart' */}
              {displayMode === 'chart' && (
                <div className="w-full h-full min-h-[230px]"> {/* Ensure container takes space */}
                  {isActivityLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner size="large" />
                    </div>
                  ) : activityData ? (
                    <ActivityChart
                      data={activityData}
                      selectedActivities={chartSelectedActivities}
                      displayMode={chartType} 
                      showLegend={false} // Keep preview clean
                      conversionMetric={chartConversionMetric} 
                      // Add a flag to potentially disable internal padding/margins if needed for preview
                      // isPreview={true} 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available for preview.
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}