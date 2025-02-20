import type { DailyLogData } from '@/lib/api/daily-logs/queries';

interface Metrics {
  totalActivities: number;
  totalColdCalls: number;
  totalTextMessages: number;
  totalFacebookDms: number;
  totalLinkedinDms: number;
  totalInstagramDms: number;
  totalColdEmails: number;
}

export function calculateMetrics(data: DailyLogData[]): Metrics {
  return data.reduce((acc, day) => ({
    totalActivities: acc.totalActivities + day.activities,
    totalColdCalls: acc.totalColdCalls + day.cold_calls,
    totalTextMessages: acc.totalTextMessages + day.text_messages,
    totalFacebookDms: acc.totalFacebookDms + day.facebook_dms,
    totalLinkedinDms: acc.totalLinkedinDms + day.linkedin_dms,
    totalInstagramDms: acc.totalInstagramDms + day.instagram_dms,
    totalColdEmails: acc.totalColdEmails + day.cold_emails,
  }), {
    totalActivities: 0,
    totalColdCalls: 0,
    totalTextMessages: 0,
    totalFacebookDms: 0,
    totalLinkedinDms: 0,
    totalInstagramDms: 0,
    totalColdEmails: 0,
  });
}