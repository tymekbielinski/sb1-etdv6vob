import { useState } from 'react';
import { EditableMetricCard } from '@/components/metrics/editable-metric-card';
import { DatePickerDialog } from '@/components/activity-log/date-picker-dialog';
import { useTeamStore } from '@/lib/store/team-store';
import { useAuth } from '@/components/auth/auth-provider';
import { getDailyLog, createOrUpdateDailyLog } from '@/lib/api/daily-logs/mutations';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Phone, MessageSquare, Facebook, Linkedin, Instagram, Mail } from 'lucide-react';

const DEFAULT_ACTIVITIES = [
  { id: 'cold_calls', icon: Phone },
  { id: 'text_messages', icon: MessageSquare },
  { id: 'facebook_dms', icon: Facebook },
  { id: 'linkedin_dms', icon: Linkedin },
  { id: 'instagram_dms', icon: Instagram },
  { id: 'cold_emails', icon: Mail },
] as const;

const FUNNEL_METRICS = [
  { id: 'quotes', label: 'Quotes' },
  { id: 'booked_calls', label: 'Booked Calls' },
  { id: 'completed_calls', label: 'Completed Calls' },
  { id: 'booked_presentations', label: 'Booked Presentations' },
  { id: 'completed_presentations', label: 'Completed Presentations' },
  { id: 'submitted_applications', label: 'Submitted Applications' },
] as const;

export default function ActivityLog() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const { team } = useTeamStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleMetricUpdate = async (field: string, value: string) => {
    if (!user?.id || !team?.id) return;

    try {
      setIsLoading(true);
      const numValue = parseInt(value, 10);
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

      toast({
        title: 'Success',
        description: 'Activity updated successfully',
      });
    } catch (error) {
      console.error('Error updating metric:', error);
      toast({
        title: 'Error',
        description: 'Failed to update value',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
        <DatePickerDialog 
          selectedDate={selectedDate} 
          onDateSelect={setSelectedDate} 
        />
      </div>

      <div className="space-y-8">
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

        {/* Funnel Metrics Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Funnel Metrics</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {FUNNEL_METRICS.map(({ id }) => {
              const metric = team?.default_activities?.find(a => a.id === id) || {
                id,
                label: id.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
              };

              return (
                <EditableMetricCard
                  key={id}
                  title={metric.label}
                  metricId={id}
                  selectedDate={selectedDate}
                  onUpdate={handleMetricUpdate}
                  isLoading={isLoading}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}