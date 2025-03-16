import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  TooltipProps,
} from 'recharts';
import { CHART_COLORS, MEMBER_COLORS } from '@/lib/constants/colors';
import { ChartLegend } from './chart-legend';
import { ChartGradient } from './chart-gradient';
import { axisConfig, tooltipConfig, areaConfig } from '@/lib/config/chart.config';
import type { ActivityType } from '@/components/dashboard/activity-filter';
import type { DailyLogData } from '@/lib/api/daily-logs/queries';
import { useTeamStore } from '@/lib/store/team-store';

interface ActivityChartProps {
  data: DailyLogData[];
  selectedActivities: ActivityType[];
  displayMode: ('total' | 'breakdown' | 'members')[];
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  const { team } = useTeamStore();
  
  if (!active || !payload) return null;

  // Helper function to get activity label
  const getActivityLabel = (id: string): string => {
    const activity = team?.default_activities?.find(a => a.id === id);
    if (activity) return activity.label;
    return id.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="rounded-lg border bg-card p-2 shadow-sm">
      <p className="mb-1 font-medium">{new Date(label).toLocaleDateString()}</p>
      {payload.map((entry, index) => {
        // Get the proper label based on the entry name
        let displayName = entry.name;
        
        // If it's not "total" or a member name, it's an activity ID
        if (entry.name !== 'total' && !payload.find(p => p.payload?.member_data?.some(m => m.name === entry.name))) {
          displayName = getActivityLabel(entry.name);
        }
        
        return (
          <p key={`${entry.name}-${index}`} className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{displayName}:</span>
            <span className="font-medium">{entry.value}</span>
          </p>
        );
      })}
    </div>
  );
};

export function ActivityChart({ data, selectedActivities, displayMode }: ActivityChartProps) {
  const { team } = useTeamStore();
  
  // If no activities are selected, return empty state
  if (selectedActivities.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">Select activities to view data</p>
      </div>
    );
  }

  const getChartData = () => {
    return data.map(day => {
      const chartData: { [key: string]: number | string } = { date: day.date };
      
      // Calculate total only if total mode is selected
      if (displayMode.includes('total')) {
        chartData.total = selectedActivities.reduce((sum, activity) => sum + day[activity], 0);
      }
      
      // Add individual metrics if breakdown is selected
      if (displayMode.includes('breakdown')) {
        selectedActivities.forEach(activity => {
          chartData[activity] = day[activity];
        });
      }

      // Add member data if members mode is selected
      if (displayMode.includes('members') && day.member_data) {
        day.member_data.forEach(member => {
          const memberTotal = selectedActivities.reduce((sum, activity) => 
            sum + member[activity], 0
          );
          chartData[member.name] = memberTotal;
        });
      }
      
      return chartData;
    });
  };

  const getLegendItems = () => {
    const items = [];

    if (displayMode.includes('total')) {
      items.push({ label: 'Total Activities', color: CHART_COLORS.primary });
    }

    if (displayMode.includes('breakdown')) {
      items.push(...selectedActivities.map((metric, index) => {
        const activity = team?.default_activities?.find(a => a.id === metric);
        return {
          label: activity?.label || metric.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          color: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]
        };
      }));
    }

    if (displayMode.includes('members') && data[0]?.member_data) {
      items.push(...data[0].member_data.map((member, index) => ({
        label: member.name,
        color: MEMBER_COLORS[index % MEMBER_COLORS.length]
      })));
    }

    return items;
  };

  const getActiveMetrics = () => {
    const metrics: string[] = [];
    if (displayMode.includes('total')) {
      metrics.push('total');
    }
    if (displayMode.includes('breakdown')) {
      metrics.push(...selectedActivities);
    }
    if (displayMode.includes('members') && data[0]?.member_data) {
      metrics.push(...data[0].member_data.map(member => member.name));
    }
    return metrics;
  };

  const getMetricColor = (metric: string, index: number) => {
    if (metric === 'total') return CHART_COLORS.primary;
    if (displayMode.includes('members')) {
      return MEMBER_COLORS[index % MEMBER_COLORS.length];
    }
    return Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length];
  };

  const chartData = getChartData();
  const activeMetrics = getActiveMetrics();
  const legendItems = getLegendItems();
  const isMembersView = displayMode.includes('members');

  return (
    <div className="space-y-4">
      <ChartLegend items={legendItems} />
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            {!isMembersView && (
              <defs>
                {activeMetrics.map((metric, index) => (
                  <ChartGradient
                    key={metric}
                    id={`gradient-${metric}`}
                    color={getMetricColor(metric, index)}
                  />
                ))}
              </defs>
            )}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted))"
              opacity={0.2}
            />
            <XAxis {...axisConfig} dataKey="date" />
            <YAxis {...axisConfig} />
            <Tooltip content={<CustomTooltip />} />
            {activeMetrics.map((metric, index) => (
              <Area
                key={metric}
                name={metric}
                dataKey={metric}
                stroke={getMetricColor(metric, index)}
                fill={isMembersView ? 'transparent' : `url(#gradient-${metric})`}
                {...areaConfig}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}