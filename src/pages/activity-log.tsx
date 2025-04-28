import { useState, useEffect, useContext } from 'react';
import { EditableMetricCard } from '@/components/metrics/editable-metric-card';
import { DatePickerDialog } from '@/components/activity-log/date-picker-dialog';
import { useTeamStore } from '@/lib/store/team-store';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';
import { useAuth } from '@/components/auth/auth-provider';
import { getDailyLog, createOrUpdateDailyLog } from '@/lib/api/daily-logs/mutations';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Phone, MessageSquare, Facebook, Linkedin, Instagram, Mail, Plus, DollarSign, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SAVE_ALL_METRICS_EVENT, METRIC_EDIT_START_EVENT, METRIC_SAVE_COMPLETE_EVENT } from '@/components/metrics/editable-metric-card';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const DEFAULT_ACTIVITIES = [
  { id: 'cold_calls', icon: Phone },
  { id: 'text_messages', icon: MessageSquare },
  { id: 'facebook_dms', icon: Facebook },
  { id: 'linkedin_dms', icon: Linkedin },
  { id: 'instagram_dms', icon: Instagram },
  { id: 'cold_emails', icon: Mail },
] as const;

const FUNNEL_METRICS = [
  { id: 'quotes', label: 'Quotes', icon: MessageSquare },
  { id: 'booked_calls', label: 'Booked Calls', icon: Phone },
  { id: 'completed_calls', label: 'Completed Calls', icon: Phone },
  { id: 'booked_presentations', label: 'Booked Presentations', icon: MessageSquare },
  { id: 'completed_presentations', label: 'Completed Presentations', icon: MessageSquare },
  { id: 'submitted_applications', label: 'Submitted Applications', icon: Mail },
] as const;

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
      const currentLog = await getDailyLog(user.id, team.id, format(selectedDate, 'yyyy-MM-dd'));
      
      await createOrUpdateDailyLog({
        ...currentLog,
        deals_won: (currentLog?.deals_won || 0) + 1,
        deal_value: (currentLog?.deal_value || 0) + value,
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

export default function ActivityLog() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [metrics, setMetrics] = useState({
    deals_won: 0,
    deal_value: 0
  });
  const { team } = useTeamStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const { navigator } = useContext(NavigationContext);
  const [unsavedMetricIds, setUnsavedMetricIds] = useState<Set<string>>(new Set());
  const hasUnsaved = unsavedMetricIds.size > 0;

  useEffect(() => {
    const handleEditStart = (e: CustomEvent) => {
      setUnsavedMetricIds(prev => new Set(prev).add(e.detail.metricId));
    };
    const handleSaveComplete = (e: CustomEvent) => {
      setUnsavedMetricIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.detail.metricId);
        return newSet;
      });
    };
    document.addEventListener(METRIC_EDIT_START_EVENT, handleEditStart as EventListener);
    document.addEventListener(METRIC_SAVE_COMPLETE_EVENT, handleSaveComplete as EventListener);
    return () => {
      document.removeEventListener(METRIC_EDIT_START_EVENT, handleEditStart as EventListener);
      document.removeEventListener(METRIC_SAVE_COMPLETE_EVENT, handleSaveComplete as EventListener);
    };
  }, []);

  useEffect(() => {
    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnloadHandler);
    return () => { window.removeEventListener('beforeunload', beforeUnloadHandler); };
  }, [hasUnsaved]);

  useEffect(() => {
    if (!navigator.block) return;
    const unblockNav = navigator.block((tx: any) => {
      if (!hasUnsaved) {
        tx.retry();
        return;
      }
      const confirmSave = window.confirm('You have unsaved changes. Save before leaving?');
      if (confirmSave) {
        document.dispatchEvent(new CustomEvent(SAVE_ALL_METRICS_EVENT));
        setTimeout(() => tx.retry(), 300);
      } else {
        setUnsavedMetricIds(new Set());
        unblockNav();
        tx.retry();
      }
    });
    return unblockNav;
  }, [navigator, hasUnsaved]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const loadMetrics = async () => {
    if (!user?.id || !team?.id) return;

    try {
      const log = await getDailyLog(user.id, team.id, format(selectedDate, 'yyyy-MM-dd'));
      setMetrics({
        deals_won: log?.deals_won || 0,
        deal_value: log?.deal_value || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [user?.id, team?.id, refreshKey, selectedDate]);

  const handleMetricUpdate = async (field: string, value: string) => {
    if (!user?.id || !team?.id) return;

    try {
      setIsLoading(true);
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Invalid value');
      }

      const currentLog = await getDailyLog(user.id, team.id, format(selectedDate, 'yyyy-MM-dd'));
      const updates: Record<string, number> = {
        [field]: numValue
      };

      // Special handling for deals won and deal value
      if (field === 'deals_won' || field === 'deal_value') {
        if (numValue === 0) {
          // If either metric is set to 0, set both to 0
          updates.deals_won = 0;
          updates.deal_value = 0;
        } else if (field === 'deals_won' && numValue > 0 && currentLog?.deal_value === 0) {
          // If setting deals_won > 0 but deal_value is 0, show error
          throw new Error('Please add a deal using the "Add New Won Deal" button');
        } else if (field === 'deal_value' && numValue > 0 && currentLog?.deals_won === 0) {
          // If setting deal_value > 0 but deals_won is 0, show error
          throw new Error('Please add a deal using the "Add New Won Deal" button');
        }
      }

      await createOrUpdateDailyLog({
        ...currentLog,
        ...updates,
        user_id: user.id,
        team_id: team.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
      });

      // Update local state
      setMetrics(prev => ({
        ...prev,
        ...updates
      }));

      toast({
        title: 'Success',
        description: 'Activity updated successfully',
      });
    } catch (error) {
      console.error('Error updating metric:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update value',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
          <DatePickerDialog 
            selectedDate={selectedDate} 
            onDateSelect={setSelectedDate} 
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={hasUnsaved ? "default" : "outline"} 
                size="sm" 
                onClick={() => document.dispatchEvent(new CustomEvent(SAVE_ALL_METRICS_EVENT))} 
                disabled={isLoading}
                className={hasUnsaved ? "animate-pulse" : ""}
              >
                {isLoading 
                  ? <><span className="animate-spin mr-2">⏳</span>Saving...</>
                  : hasUnsaved 
                    ? <><Save className="h-4 w-4 mr-2" />Save Changes</>
                    : <><Save className="h-4 w-4 mr-2" />Saved</>
                }
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {hasUnsaved ? "You have unsaved changes" : "All changes are saved"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="space-y-8">
        <div className="space-y-4">
          {/* Activities Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Activities</h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {DEFAULT_ACTIVITIES.map(({ id, icon }) => {
                const activity = team?.default_activities?.find(a => a.id === id) || {
                  id,
                  label: id.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')
                };

                return (
                  <EditableMetricCard
                    key={id}
                    title={activity.label}
                    icon={icon}
                    metricId={id}
                    selectedDate={selectedDate}
                    onUpdate={handleMetricUpdate}
                    isLoading={isLoading}
                  />
                );
              })}
            </div>
          </div>

          {/* Deals Won Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Deals Won</h2>
              {metrics.deals_won === 0 && metrics.deal_value === 0 && (
                <p className="text-sm text-muted-foreground">
                  Click "Add New Won Deal" to record your first deal
                </p>
              )}
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <DealEntryModal
                selectedDate={selectedDate}
                onDealAdded={() => setRefreshKey(prev => prev + 1)}
              />
              <EditableMetricCard
                title="Total Deals Won"
                value={metrics.deals_won.toString()}
                metricId="deals_won"
                selectedDate={selectedDate}
                onUpdate={handleMetricUpdate}
                isLoading={isLoading}
                disabled={metrics.deals_won === 0}
              />
              <EditableMetricCard
                title="Total Deal Value"
                value={formatCurrency(metrics.deal_value)}
                metricId="deal_value"
                selectedDate={selectedDate}
                onUpdate={handleMetricUpdate}
                isLoading={isLoading}
                displayType="currency"
                disabled={metrics.deal_value === 0}
              />
            </div>
          </div>

          {/* Funnel Metrics Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Funnel Metrics</h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {FUNNEL_METRICS.map(({ id, label, icon }) => (
                <EditableMetricCard
                  key={id}
                  title={label}
                  metricId={id}
                  selectedDate={selectedDate}
                  onUpdate={handleMetricUpdate}
                  isLoading={isLoading}
                  icon={icon}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}