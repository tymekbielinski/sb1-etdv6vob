import { useEffect, useState } from 'react';
import { Phone, MessageSquare, Facebook, Linkedin, Instagram, Mail } from 'lucide-react';
import { MetricCard } from '@/components/metrics/metric-card';
import { useAuth } from '@/components/auth/auth-provider';
import { useTeamStore } from '@/lib/store/team-store';
import { getTodaysLog } from '@/lib/api/daily-logs/mutations';

export function TodayMetrics() {
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
    async function loadTodaysMetrics() {
      if (!user?.id || !team?.id) return;

      try {
        const log = await getTodaysLog(user.id, team.id);
        if (log) {
          setMetrics({
            coldCalls: log.cold_calls,
            textMessages: log.text_messages,
            facebookDms: log.facebook_dms,
            linkedinDms: log.linkedin_dms,
            instagramDms: log.instagram_dms,
            coldEmails: log.cold_emails,
          });
        }
      } catch (error) {
        console.error('Error loading today\'s metrics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTodaysMetrics();
  }, [user?.id, team?.id]);

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
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