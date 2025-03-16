import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTeamStore } from '@/lib/store/team-store';
import { ActivityType } from '@/components/dashboard/activity-filter';
import { TeamActivity } from '@/lib/types/team';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricItem {
  id: string;
  label: string;
  defaultId: string;
  tooltip: string;
}

const DEFAULT_ACTIVITIES: MetricItem[] = [
  { id: 'cold_calls', label: 'Cold Calls', defaultId: 'cold_calls', tooltip: 'Default metric ID: cold_calls' },
  { id: 'text_messages', label: 'Text Messages', defaultId: 'text_messages', tooltip: 'Default metric ID: text_messages' },
  { id: 'facebook_dms', label: 'Facebook DMs', defaultId: 'facebook_dms', tooltip: 'Default metric ID: facebook_dms' },
  { id: 'linkedin_dms', label: 'LinkedIn DMs', defaultId: 'linkedin_dms', tooltip: 'Default metric ID: linkedin_dms' },
  { id: 'instagram_dms', label: 'Instagram DMs', defaultId: 'instagram_dms', tooltip: 'Default metric ID: instagram_dms' },
  { id: 'cold_emails', label: 'Cold Emails', defaultId: 'cold_emails', tooltip: 'Default metric ID: cold_emails' },
];

const FUNNEL_METRICS: MetricItem[] = [
  { id: 'quotes', label: 'Quotes', defaultId: 'quotes', tooltip: 'Default metric ID: quotes' },
  { id: 'booked_calls', label: 'Booked Calls', defaultId: 'booked_calls', tooltip: 'Default metric ID: booked_calls' },
  { id: 'completed_calls', label: 'Completed Calls', defaultId: 'completed_calls', tooltip: 'Default metric ID: completed_calls' },
  { id: 'booked_presentations', label: 'Booked Presentations', defaultId: 'booked_presentations', tooltip: 'Default metric ID: booked_presentations' },
  { id: 'completed_presentations', label: 'Completed Presentations', defaultId: 'completed_presentations', tooltip: 'Default metric ID: completed_presentations' },
  { id: 'submitted_applications', label: 'Submitted Applications', defaultId: 'submitted_applications', tooltip: 'Default metric ID: submitted_applications' },
];

export function DefaultMetrics() {
  const { team, updateTeamActivities } = useTeamStore();
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();

  // Initialize metrics from team's default_activities or fall back to defaults
  useEffect(() => {
    if (team?.default_activities) {
      const teamMetrics = team.default_activities.map(activity => ({
        id: activity.id,
        label: activity.label,
        defaultId: activity.id,
        tooltip: `Default metric ID: ${activity.id}`
      }));
      setMetrics(teamMetrics);
    } else {
      setMetrics([...DEFAULT_ACTIVITIES, ...FUNNEL_METRICS]);
    }
  }, [team?.default_activities]);

  const handleEdit = (metric: MetricItem) => {
    setEditingId(metric.id);
    setEditValue(metric.label);
  };

  const handleSave = async (metric: MetricItem) => {
    const newLabel = editValue.trim();
    if (!newLabel) return;

    try {
      // Update local state
      const updatedMetrics = metrics.map(m => 
        m.id === metric.id ? { ...m, label: newLabel } : m
      );
      setMetrics(updatedMetrics);

      // Update database
      const teamActivities: TeamActivity[] = updatedMetrics.map(m => ({
        id: m.id as ActivityType,
        label: m.label
      }));
      await updateTeamActivities(teamActivities);

      toast({
        title: 'Success',
        description: 'Metric label updated successfully',
      });
    } catch (error) {
      console.error('Failed to update metric label:', error);
      toast({
        title: 'Error',
        description: 'Failed to update metric label',
        variant: 'destructive',
      });
    }

    setEditingId(null);
    setEditValue('');
  };

  const MetricRow = ({ metric, index }: { metric: MetricItem; index?: number }) => (
    <div className="flex items-center justify-between py-2 group">
      <div className="flex items-center gap-3">
        {index !== undefined && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
            {index + 1}
          </div>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                {editingId === metric.id ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSave(metric)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave(metric)}
                    className="h-8 w-[200px]"
                    autoFocus
                  />
                ) : (
                  <span className="font-medium">{metric.label}</span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{metric.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => handleEdit(metric)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Default Activities</h3>
          <div className="space-y-1">
            {metrics
              .filter(metric => DEFAULT_ACTIVITIES.some(a => a.id === metric.id))
              .map((metric) => (
                <MetricRow key={metric.id} metric={metric} />
              ))}
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Funnel Metrics</h3>
          <div className="space-y-1">
            {metrics
              .filter(metric => FUNNEL_METRICS.some(f => f.id === metric.id))
              .map((metric, index) => (
                <MetricRow key={metric.id} metric={metric} index={index} />
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}