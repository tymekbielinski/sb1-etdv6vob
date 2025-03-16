import { useEffect, useState } from 'react';
import { Phone, MessageSquare, Facebook, Linkedin, Instagram, Mail } from 'lucide-react';
import { MetricCard } from '@/components/metrics/metric-card';
import { useAuth } from '@/components/auth/auth-provider';
import { useTeamStore } from '@/lib/store/team-store';
import { getDailyLog } from '@/lib/api/daily-logs/mutations';
import { format } from 'date-fns';

interface TodayMetricsProps {
  selectedDate: Date;
}

export function TodayMetrics({ selectedDate }: TodayMetricsProps) {
  const DEFAULT_ACTIVITIES = [
    { id: 'cold_calls', icon: Phone },
    { id: 'text_messages', icon: MessageSquare },
    { id: 'facebook_dms', icon: Facebook },
    { id: 'linkedin_dms', icon: Linkedin },
    { id: 'instagram_dms', icon: Instagram },
    { id: 'cold_emails', icon: Mail },
  ] as const;

  const [metrics, setMetrics] = useState(
    DEFAULT_ACTIVITIES.reduce((acc, { id }) => ({
      ...acc,
      [id]: 0,
    }), {} as Record<string, number>)
  );
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { team } = useTeamStore();

  useEffect(() => {
    async function loadMetrics() {
      if (!user?.id || !team?.id) return;

      try {
        setIsLoading(true);
        const log = await getDailyLog(user.id, team.id, format(selectedDate, 'yyyy-MM-dd'));
        if (log) {
          setMetrics(
            DEFAULT_ACTIVITIES.reduce((acc, { id }) => ({
              ...acc,
              [id]: log[id] || 0,
            }), {} as Record<string, number>)
          );
        } else {
          setMetrics(
            DEFAULT_ACTIVITIES.reduce((acc, { id }) => ({
              ...acc,
              [id]: 0,
            }), {} as Record<string, number>)
          );
        }
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadMetrics();
  }, [user?.id, team?.id, selectedDate]);

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {DEFAULT_ACTIVITIES.map(({ id, icon }) => {
        const activity = team?.default_activities?.find(a => a.id === id) || {
          id,
          label: id.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        };

        return (
          <MetricCard
            key={id}
            title={activity.label}
            value={metrics[id]?.toString() || '0'}
            icon={icon}
          />
        );
      })}
    </div>
  );
}