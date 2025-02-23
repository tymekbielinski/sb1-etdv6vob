import { useState } from 'react';
import { DailyLogForm } from '@/components/activity-log/daily-log-form';
import { TodayMetrics } from '@/components/activity-log/today-metrics';
import { DatePickerDialog } from '@/components/activity-log/date-picker-dialog';

export default function ActivityLog() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogUpdated = () => {
    setRefreshKey(prev => prev + 1);
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
      <TodayMetrics 
        key={refreshKey} 
        selectedDate={selectedDate}
      />
      <DailyLogForm 
        onLogUpdated={handleLogUpdated} 
        selectedDate={selectedDate}
      />
    </div>
  );
}