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
import { createOrUpdateDailyLog, getTodaysLog } from '@/lib/api/daily-logs/mutations';
import { useAuth } from '@/components/auth/auth-provider';
import { useTeamStore } from '@/lib/store/team-store';

function DealEntryModal({ onDealAdded }: { onDealAdded: () => void }) {
  const [dealValue, setDealValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { team } = useTeamStore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !team?.id) return;

    const value = parseFloat(dealValue);
    if (isNaN(value) || value <= 0) {
      toast({
        title: 'Invalid deal value',
        description: 'Please enter a value greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current log
      const currentLog = await getTodaysLog(user.id, team.id);
      
      // Update with new deal
      await createOrUpdateDailyLog({
        ...currentLog,
        deals_won: (currentLog.deals_won || 0) + 1,
        deal_value: (currentLog.deal_value || 0) + Math.round(value * 100), // Convert to cents
        user_id: user.id,
        team_id: team.id,
        date: new Date().toISOString().split('T')[0],
      });

      toast({
        title: 'Success',
        description: 'Deal has been added successfully',
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
          <DialogTitle>Add New Won Deal</DialogTitle>
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
                step="0.01"
                min="0"
                placeholder="0.00"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                className="pl-9"
              />
            </div>
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
  const [metrics, setMetrics] = useState({
    deals_won: 0,
    deal_value: 0,
    quotes: 0,
    booked_calls: 0,
    completed_calls: 0,
    booked_presentations: 0,
    completed_presentations: 0,
    submitted_applications: 0,
  });
  const { user } = useAuth();
  const { team } = useTeamStore();
  const { toast } = useToast();

  const loadMetrics = async () => {
    if (!user?.id || !team?.id) return;

    try {
      const log = await getTodaysLog(user.id, team.id);
      setMetrics({
        deals_won: log.deals_won || 0,
        deal_value: log.deal_value || 0,
        quotes: log.quotes || 0,
        booked_calls: log.booked_calls || 0,
        completed_calls: log.completed_calls || 0,
        booked_presentations: log.booked_presentations || 0,
        completed_presentations: log.completed_presentations || 0,
        submitted_applications: log.submitted_applications || 0,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [user?.id, team?.id, refreshKey]);

  const handleLogUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const handleMetricUpdate = async (field: keyof typeof metrics, value: string) => {
    if (!user?.id || !team?.id) return;

    try {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Invalid value');
      }

      const currentLog = await getTodaysLog(user.id, team.id);
      await createOrUpdateDailyLog({
        ...currentLog,
        [field]: numValue,
        user_id: user.id,
        team_id: team.id,
        date: new Date().toISOString().split('T')[0],
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
      <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>

      {/* Row 1: Deals Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <DealEntryModal onDealAdded={handleLogUpdated} />
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
        <MetricCard
          title="Quotes"
          value={metrics.quotes.toString()}
          icon={FileText}
        />
        <MetricCard
          title="Booked Calls"
          value={metrics.booked_calls.toString()}
          icon={Phone}
        />
        <MetricCard
          title="Completed Calls"
          value={metrics.completed_calls.toString()}
          icon={Phone}
        />
        <MetricCard
          title="Booked Presentations"
          value={metrics.booked_presentations.toString()}
          icon={Calendar}
        />
        <MetricCard
          title="Completed Presentations"
          value={metrics.completed_presentations.toString()}
          icon={Calendar}
        />
        <MetricCard
          title="Applications Submitted"
          value={metrics.submitted_applications.toString()}
          icon={ClipboardList}
        />
      </div>

      {/* Row 3: Inflow Log */}
      <InflowLogForm onLogUpdated={handleLogUpdated} />
    </div>
  );
}