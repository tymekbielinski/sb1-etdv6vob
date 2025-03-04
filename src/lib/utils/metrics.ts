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
  totalQuotes: number;
  totalBookedCalls: number;
  totalCompletedCalls: number;
  totalBookedPresentations: number;
  totalCompletedPresentations: number;
  totalSubmittedApplications: number;
  totalDealsWon: number;
  totalDealValue: number;
}

const metricToKey: Record<string, keyof DailyLogData> = {
  cold_calls: 'cold_calls',
  text_messages: 'text_messages',
  facebook_dms: 'facebook_dms',
  linkedin_dms: 'linkedin_dms',
  instagram_dms: 'instagram_dms',
  cold_emails: 'cold_emails',
  quotes: 'quotes',
  booked_calls: 'booked_calls',
  completed_calls: 'completed_calls',
  booked_presentations: 'booked_presentations',
  completed_presentations: 'completed_presentations',
  submitted_applications: 'submitted_applications',
  deals_won: 'deals_won',
  deal_value: 'deal_value'
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
    totalQuotes: acc.totalQuotes + (day.quotes || 0),
    totalBookedCalls: acc.totalBookedCalls + (day.booked_calls || 0),
    totalCompletedCalls: acc.totalCompletedCalls + (day.completed_calls || 0),
    totalBookedPresentations: acc.totalBookedPresentations + (day.booked_presentations || 0),
    totalCompletedPresentations: acc.totalCompletedPresentations + (day.completed_presentations || 0),
    totalSubmittedApplications: acc.totalSubmittedApplications + (day.submitted_applications || 0),
    totalDealsWon: acc.totalDealsWon + (day.deals_won || 0),
    totalDealValue: acc.totalDealValue + (day.deal_value || 0),
  }), {
    totalActivities: 0,
    totalColdCalls: 0,
    totalTextMessages: 0,
    totalFacebookDms: 0,
    totalLinkedinDms: 0,
    totalInstagramDms: 0,
    totalColdEmails: 0,
    totalQuotes: 0,
    totalBookedCalls: 0,
    totalCompletedCalls: 0,
    totalBookedPresentations: 0,
    totalCompletedPresentations: 0,
    totalSubmittedApplications: 0,
    totalDealsWon: 0,
    totalDealValue: 0,
  });
}

export function calculateMetricValue(metric: MetricDefinition, data: DailyLogData[]): number {
  if (metric.type === 'total') {
    // For each day, sum up the selected metrics
    const values = data.map(day => 
      metric.metrics.reduce((sum, m) => {
        // Only use the top-level metrics, not member_data
        const value = day[metricToKey[m]];
        return sum + (typeof value === 'number' ? value : 0);
      }, 0)
    );

    switch (metric.aggregation) {
      case 'average':
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'max':
        return values.length > 0 ? Math.max(...values) : 0;
      case 'min':
        return values.length > 0 ? Math.min(...values) : 0;
      case 'sum':
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  } else {
    // For conversion metrics
    const [numerator, denominator] = metric.metrics;
    const totalNumerator = data.reduce((sum, day) => {
      const value = day[metricToKey[numerator]];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    const totalDenominator = data.reduce((sum, day) => {
      const value = day[metricToKey[denominator]];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    
    return totalDenominator === 0 ? 0 : totalNumerator / totalDenominator;
  }
}