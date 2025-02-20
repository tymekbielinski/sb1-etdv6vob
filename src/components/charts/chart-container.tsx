import { X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityChart } from './activity-chart';
import { DisplaySettings } from './display-settings';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useChartsStore, type ChartConfig } from '@/lib/store/charts-store';
import type { ActivityType } from '@/components/dashboard/activity-filter';
import type { DailyLogData } from '@/lib/api/daily-logs/queries';

interface ChartContainerProps {
  chart: ChartConfig;
  data: DailyLogData[];
  selectedActivities: ActivityType[];
  isDefault?: boolean;
}

export function ChartContainer({ 
  chart, 
  data, 
  selectedActivities,
  isDefault = false 
}: ChartContainerProps) {
  const { updateChart, removeChart } = useChartsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chart.title);

  const handleTitleClick = () => {
    if (isDefault) return;
    setIsEditing(true);
  };

  const handleTitleSave = () => {
    if (title.trim()) {
      updateChart(chart.id, { title: title.trim() });
    } else {
      setTitle(chart.title);
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitle(chart.title);
      setIsEditing(false);
    }
  };

  const handleDisplayModeChange = (mode: ('total' | 'breakdown' | 'members')[]) => {
    updateChart(chart.id, { displayMode: mode });
  };

  return (
    <Card className="relative group">
      {!isDefault && (
        <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => removeChart(chart.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div 
          className="flex-1 cursor-text"
          onClick={handleTitleClick}
        >
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="max-w-sm"
              autoFocus
            />
          ) : (
            <CardTitle className="text-base font-medium">
              {chart.title}
            </CardTitle>
          )}
        </div>
        <div className="flex items-center gap-4">
          <DisplaySettings
            value={chart.displayMode}
            onChange={handleDisplayModeChange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ActivityChart 
          data={data} 
          selectedActivities={selectedActivities}
          displayMode={chart.displayMode}
        />
      </CardContent>
    </Card>
  );
}