import { useState } from 'react';
import { DailyLogForm } from '@/components/activity-log/daily-log-form';
import { TodayMetrics } from '@/components/activity-log/today-metrics';

export default function ActivityLog() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
      <TodayMetrics key={refreshKey} />
      <DailyLogForm onLogUpdated={handleLogUpdated} />
    </div>
  );
}