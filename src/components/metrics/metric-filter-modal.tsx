import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import type { MetricDefinition } from '@/lib/store/metrics-store';

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

interface MetricFilterModalProps {
  onSave: (definition: Omit<MetricDefinition, 'id' | 'order' | 'rowId'>) => void;
  existingMetric?: MetricDefinition;
  trigger?: React.ReactNode;
}

export function MetricFilterModal({ onSave, existingMetric, trigger }: MetricFilterModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'totals' | 'conversions'>('totals');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [displayType, setDisplayType] = useState<'number' | 'dollar' | 'percent'>('number');
  const [aggregation, setAggregation] = useState<'sum' | 'average' | 'max' | 'min'>('sum');

  // Initialize form with existing metric data if provided
  useEffect(() => {
    if (existingMetric) {
      setActiveTab(existingMetric.type === 'total' ? 'totals' : 'conversions');
      setSelectedMetrics(existingMetric.metrics);
      setDisplayType(existingMetric.displayType);
      if (existingMetric.aggregation) {
        setAggregation(existingMetric.aggregation);
      }
    }
  }, [existingMetric]);

  const handleSave = () => {
    const definition: Omit<MetricDefinition, 'id' | 'order' | 'rowId'> = {
      type: activeTab === 'totals' ? 'total' : 'conversion',
      metrics: selectedMetrics,
      displayType,
      aggregation: activeTab === 'totals' ? aggregation : undefined,
    };

    onSave(definition);
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    if (!existingMetric) {
      setActiveTab('totals');
      setSelectedMetrics([]);
      setDisplayType('number');
      setAggregation('sum');
    }
  };

  const handleMetricSelect = (metric: string) => {
    if (activeTab === 'conversions' && selectedMetrics.length >= 2) {
      // Remove the first metric if we already have 2 for conversions
      setSelectedMetrics([selectedMetrics[1], metric]);
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const handleRemoveMetric = (index: number) => {
    setSelectedMetrics(selectedMetrics.filter((_, i) => i !== index));
  };

  const isValid = () => {
    if (activeTab === 'totals') {
      return selectedMetrics.length > 0;
    }
    return selectedMetrics.length === 2;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {existingMetric ? 'Edit Metric' : 'New Metric'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingMetric ? 'Edit Metric' : 'Define New Metric'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'totals' | 'conversions')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totals">Totals</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
          </TabsList>

          <TabsContent value="totals" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Selected Metrics</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedMetrics.map((metric, index) => (
                    <div
                      key={metric}
                      className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                    >
                      {AVAILABLE_METRICS.find(m => m.value === metric)?.label}
                      <button
                        onClick={() => handleRemoveMetric(index)}
                        className="ml-1 rounded-full p-1 hover:bg-primary/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Add Metric</Label>
                <Select onValueChange={handleMetricSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_METRICS
                      .filter(metric => !selectedMetrics.includes(metric.value))
                      .map(metric => (
                        <SelectItem key={metric.value} value={metric.value}>
                          {metric.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Aggregation</Label>
                <Select value={aggregation} onValueChange={(v) => setAggregation(v as typeof aggregation)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="max">Maximum</SelectItem>
                    <SelectItem value="min">Minimum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Display Type</Label>
                <Select value={displayType} onValueChange={(v) => setDisplayType(v as typeof displayType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="dollar">Currency (USD)</SelectItem>
                    <SelectItem value="percent">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="conversions" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Selected Metrics (Numerator ÷ Denominator)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedMetrics.map((metric, index) => (
                    <div
                      key={metric}
                      className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                    >
                      {index === 0 ? 'Numerator: ' : 'Denominator: '}
                      {AVAILABLE_METRICS.find(m => m.value === metric)?.label}
                      <button
                        onClick={() => handleRemoveMetric(index)}
                        className="ml-1 rounded-full p-1 hover:bg-primary/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Add Metric</Label>
                <Select onValueChange={handleMetricSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_METRICS
                      .filter(metric => !selectedMetrics.includes(metric.value))
                      .map(metric => (
                        <SelectItem key={metric.value} value={metric.value}>
                          {metric.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid()}>
            {existingMetric ? 'Save Changes' : 'Add Metric'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}