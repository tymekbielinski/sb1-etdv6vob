import { useState, useEffect } from 'react';
import { Sparkles, Plus, DollarSign, Target, Phone, Calendar, FileText, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MetricCard } from '@/components/metrics/metric-card';
import { EditableMetricCard } from '@/components/metrics/editable-metric-card';
import { InflowLogForm } from '@/components/activity-log/inflow-log-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createOrUpdateDailyLog, getDailyLog } from '@/lib/api/daily-logs/mutations';
import { useAuth } from '@/components/auth/auth-provider';
import { useTeamStore } from '@/lib/store/team-store';
import { DatePickerDialog } from '@/components/activity-log/date-picker-dialog';
import { format } from 'date-fns';

function DealEntryModal({ onDealAdded, selectedDate }: { onDealAdded: () => void; selectedDate: Date }) {
  const [dealValue, setDealValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { team } = useTeamStore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !team?.id) return;

    const value = parseInt(dealValue, 10);
    if (isNaN(value) || value <= 0) {
      toast({
        title: 'Invalid deal value',
        description: 'Please enter a whole number greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current log for the selected date
      const currentLog = await getDailyLog(user.id, team.id, format(selectedDate, 'yyyy-MM-dd'));
      
      // Update with new deal - store as whole number
      await createOrUpdateDailyLog({
        ...currentLog,
        deals_won: (currentLog?.deals_won || 0) + 1,
        deal_value: (currentLog?.deal_value || 0) + value, // Store as whole number
        user_id: user.id,
        team_id: team.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
      });

      toast({
        title: 'Success',
        description: `Deal has been added successfully for ${format(selectedDate, 'PPP')}`,
      });
      setOpen(false);
      setDealValue('');
      onDealAdded();
    } catch (error) {
      console.error('Error adding deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to add deal',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 h-[200px] gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Add New Won Deal</h3>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Won Deal for {format(selectedDate, 'PPP')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="dealValue" className="text-sm font-medium">
              Deal Value (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="dealValue"
                type="number"
                min="1"
                placeholder="0"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">Enter whole dollar amount (no cents)</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Opportunities() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const FUNNEL_METRICS = [
    { id: 'quotes', icon: FileText },
    { id: 'booked_calls', icon: Calendar },
    { id: 'completed_calls', icon: Phone },
    { id: 'booked_presentations', icon: Target },
    { id: 'completed_presentations', icon: Target },
    { id: 'submitted_applications', icon: ClipboardList },
  ] as const;

  const [metrics, setMetrics] = useState({
    deals_won: 0,
    deal_value: 0,
    ...FUNNEL_METRICS.reduce((acc, { id }) => ({
      ...acc,
      [id]: 0,
    }), {}),
  });
  const { user } = useAuth();
  const { team } = useTeamStore();
  const { toast } = useToast();

  const loadMetrics = async () => {
    if (!user?.id || !team?.id) return;

    try {
      const log = await getDailyLog(user.id, team.id, format(selectedDate, 'yyyy-MM-dd'));
      const values = {
        deals_won: log?.deals_won || 0,
        deal_value: log?.deal_value || 0,
        ...FUNNEL_METRICS.reduce((acc, { id }) => ({
          ...acc,
          [id]: log?.[id] || 0,
        }), {}),
      };
      setMetrics(values);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [user?.id, team?.id, refreshKey, selectedDate]);

  const handleLogUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleMetricUpdate = async (field: keyof typeof metrics, value: string) => {
    if (!user?.id || !team?.id) return;

    try {
      let numValue: number;
      
      // Parse all values as integers
      numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Invalid value');
      }

      const currentLog = await getDailyLog(user.id, team.id, format(selectedDate, 'yyyy-MM-dd'));
      await createOrUpdateDailyLog({
        ...currentLog,
        [field]: numValue,
        user_id: user.id,
        team_id: team.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
      });

      await loadMetrics();
    } catch (error) {
      console.error('Error updating metric:', error);
      toast({
        title: 'Error',
        description: 'Failed to update value',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
        <DatePickerDialog 
          selectedDate={selectedDate} 
          onDateSelect={setSelectedDate} 
        />
      </div>

      {/* Row 1: Deals Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <DealEntryModal onDealAdded={handleLogUpdated} selectedDate={selectedDate} />
        <EditableMetricCard
          title="Deals Won"
          value={metrics.deals_won.toString()}
          icon={Target}
          className="bg-primary/10 border-primary/20"
          onChange={(value) => handleMetricUpdate('deals_won', value)}
        />
        <EditableMetricCard
          title="Deal Won Value"
          value={formatCurrency(metrics.deal_value)}
          icon={DollarSign}
          className="bg-primary/10 border-primary/20"
          type="currency"
          onChange={(value) => handleMetricUpdate('deal_value', value)}
        />
      </div>

      {/* Row 2: Opportunity Metrics */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {FUNNEL_METRICS.map(({ id, icon }) => {
          const metric = team?.default_activities?.find(a => a.id === id) || {
            id,
            label: id.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')
          };

          return (
            <MetricCard
              key={id}
              title={metric.label}
              value={metrics[id]?.toString() || '0'}
              icon={icon}
            />
          );
        })}
      </div>

      {/* Row 3: Inflow Log */}
      <InflowLogForm onLogUpdated={handleLogUpdated} selectedDate={selectedDate} />
    </div>
  );
}