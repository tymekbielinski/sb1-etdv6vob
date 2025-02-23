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
  const [metrics, setMetrics] = useState({
    coldCalls: 0,
    textMessages: 0,
    facebookDms: 0,
    linkedinDms: 0,
    instagramDms: 0,
    coldEmails: 0,
  });
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
          setMetrics({
            coldCalls: log.cold_calls,
            textMessages: log.text_messages,
            facebookDms: log.facebook_dms,
            linkedinDms: log.linkedin_dms,
            instagramDms: log.instagram_dms,
            coldEmails: log.cold_emails,
          });
        } else {
          setMetrics({
            coldCalls: 0,
            textMessages: 0,
            facebookDms: 0,
            linkedinDms: 0,
            instagramDms: 0,
            coldEmails: 0,
          });
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
      <MetricCard
        title="Cold Calls"
        value={metrics.coldCalls.toString()}
        icon={Phone}
      />
      <MetricCard
        title="Text Messages"
        value={metrics.textMessages.toString()}
        icon={MessageSquare}
      />
      <MetricCard
        title="Facebook DMs"
        value={metrics.facebookDms.toString()}
        icon={Facebook}
      />
      <MetricCard
        title="LinkedIn DMs"
        value={metrics.linkedinDms.toString()}
        icon={Linkedin}
      />
      <MetricCard
        title="Instagram DMs"
        value={metrics.instagramDms.toString()}
        icon={Instagram}
      />
      <MetricCard
        title="Cold Emails"
        value={metrics.coldEmails.toString()}
        icon={Mail}
      />
    </div>
  );
}