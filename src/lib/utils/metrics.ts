import type { DailyLogData } from '@/lib/api/daily-logs/queries';
import type { MetricDefinition } from '@/lib/store/metrics-store';

interface Metrics {
  totalActivities: number;
  totalColdCalls: number;
  totalTextMessages: number;
  totalFacebookDms: number;
  totalLinkedinDms: number;
  totalInstagramDms: number;
  totalColdEmails: number;
}

const metricToKey: Record<string, keyof DailyLogData> = {
  cold_calls: 'cold_calls',
  text_messages: 'text_messages',
  facebook_dms: 'facebook_dms',
  linkedin_dms: 'linkedin_dms',
  instagram_dms: 'instagram_dms',
  cold_emails: 'cold_emails',
};

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

export function calculateMetricValue(metric: MetricDefinition, data: DailyLogData[]): number {
  if (metric.type === 'total') {
    const values = data.map(day => 
      metric.metrics.reduce((sum, m) => sum + (day[metricToKey[m]] || 0), 0)
    );

    switch (metric.aggregation) {
      case 'average':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      case 'sum':
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  } else {
    // For conversion metrics
    const [numerator, denominator] = metric.metrics;
    const totalNumerator = data.reduce((sum, day) => sum + (day[metricToKey[numerator]] || 0), 0);
    const totalDenominator = data.reduce((sum, day) => sum + (day[metricToKey[denominator]] || 0), 0);
    
    return totalDenominator === 0 ? 0 : totalNumerator / totalDenominator;
  }
}