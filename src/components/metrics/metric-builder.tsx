import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Filter, CalendarIcon, X } from 'lucide-react';
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
import { startOfDay, endOfDay } from 'date-fns';

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
  const [displayType, setDisplayType] = useState<'number' | 'dollar' | 'percent'>(
    existingMetric?.displayType || (activeTab === 'conversions' ? 'percent' : 'number')
  );
  const [aggregation, setAggregation] = useState<'sum' | 'average' | 'max' | 'min'>('sum');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    return { 
      from: startOfDay(today),
      to: endOfDay(today)
    };
  });
  const [metricValue, setMetricValue] = useState<number | null>(null);

  const { team, isLoading: isTeamLoading } = useTeamStore();
  const { data: activityData, isLoading: isActivityLoading, error, fetchLogs } = useDailyLogsStore();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      displayType,
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
      setActiveTab(existingMetric.type === 'total' ? 'totals' : 'conversions');
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
    }
  }, [existingMetric]);

  // Update display type when tab changes
  useEffect(() => {
    if (!existingMetric) {
      setDisplayType(activeTab === 'conversions' ? 'percent' : 'number');
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

    onSave({
      type: activeTab === 'totals' ? 'total' : 'conversion',
      metrics: selectedMetrics,
      displayType,
      aggregation: activeTab === 'totals' ? aggregation : undefined,
      name: metricName || undefined,
      description: description || undefined,
    });

    // Navigate to dashboard
    navigate('/');
  };

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
                  {selectedMetrics.map(value => {
                    const metric = AVAILABLE_METRICS.find(m => m.value === value);
                    return (
                      <Badge
                        key={value}
                        variant="secondary"
                        className="group cursor-pointer hover:bg-muted"
                      >
                        {metric?.label}
                        <button
                          onClick={() => setSelectedMetrics(metrics => metrics.filter(m => m !== value))}
                          className="ml-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-background/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <MetricSelector
                    metrics={AVAILABLE_METRICS}
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

                <Button variant="outline" size="icon" className="shrink-0 h-10 w-10">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Metric Visualization Section */}
          <Card className="p-6 border border-input/20">
            <div className="flex justify-between items-start mb-8">
              <DatePickerWithRange
                date={dateRange}
                setDate={setDateRange}
              />
            </div>
            <div className="flex flex-col items-center gap-12">
              {/* Large Metric Display */}
              <div className="flex items-center justify-center min-h-[120px]">
                {isActivityLoading ? (
                  <LoadingSpinner className="w-12 h-12" />
                ) : metricValue !== null ? (
                  <span className="text-7xl font-semibold tracking-tight">
                    {formatMetricValue(metricValue, displayType)}
                  </span>
                ) : (
                  <span className="text-3xl text-muted-foreground">
                    Select metrics to preview
                  </span>
                )}
              </div>

              {/* Display Type Selector */}
              <div className="w-full max-w-[200px]">
                <Select
                  value={displayType}
                  onValueChange={(value: 'number' | 'dollar' | 'percent') =>
                    setDisplayType(value)
                  }
                >
                  <SelectTrigger id="displayType">
                    <SelectValue placeholder="Select display type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="dollar">Currency ($)</SelectItem>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
