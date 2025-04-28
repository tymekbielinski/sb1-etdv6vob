import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  TooltipProps,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { CHART_COLORS, MEMBER_COLORS } from '@/lib/constants/colors';
import { ChartLegend } from './chart-legend';
import { ChartGradient } from './chart-gradient';
import type { DailyLogData } from '@/lib/api/daily-logs/queries';
import type { ActivityType } from '../dashboard/activity-filter';
import { useTeamStore } from '@/lib/store/team-store';
import { axisConfig, areaConfig } from '@/lib/config/chart.config';
import { formatPercentage } from '@/lib/utils';
import { useEffect, useMemo } from 'react';

// Define types needed by the helper function
type DisplayMode = 'chart_total' | 'chart_team' | 'chart_metric' | undefined;
type ActivityType = string; // Assuming ActivityType is string based on usage

// --- External Helper Function for Color Logic ---
const getMetricColorHelper = (
  metric: string,
  index: number,
  displayMode: DisplayMode,
  data: DailyLogData[] | undefined,
  selectedActivities: ActivityType[]
) => {
  if (metric === 'total') return CHART_COLORS.primary;
  if (displayMode === 'chart_team') {
    // Ensure data and member_data exist before accessing
    const memberIndex = data?.[0]?.member_data?.findIndex((m) => m.name === metric) ?? index;
    return MEMBER_COLORS[memberIndex % MEMBER_COLORS.length];
  }
  // Assumes chart_metric otherwise (or potentially 'total' if logic above is bypassed)
  const activityIndex = selectedActivities.indexOf(metric as ActivityType);
  const colorKeys = Object.keys(CHART_COLORS).filter(k => k !== 'conversion'); // Exclude conversion color
  const colorKey = colorKeys[activityIndex % colorKeys.length] as keyof typeof CHART_COLORS;
  return CHART_COLORS[colorKey];
};

interface ActivityChartProps {
  data: DailyLogData[];
  selectedActivities: ActivityType[];
  displayMode?: 'chart_total' | 'chart_team' | 'chart_metric';
  showLegend?: boolean;
  conversionMetric?: {
    numerator: ActivityType;
    denominator: ActivityType;
  };
}

const defaultShowLegend = true;

const CustomTooltip = ({
  active,
  payload,
  label,
  conversionMetric,
}: TooltipProps<number, string> & {
  conversionMetric?: ActivityChartProps['conversionMetric'];
}) => {
  const { team } = useTeamStore();

  if (active && payload && payload.length) {
    const validPayload = payload.filter((p) => p.value !== undefined);
    if (validPayload.length === 0) return null;

    const memberColors = MEMBER_COLORS;
    const activityColors = CHART_COLORS;
    const isMembersView = validPayload.some(
      (p) => team?.members?.some((m) => m.name === p.name)
    );

    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm min-w-[150px]">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Date
            </span>
            <span className="font-bold text-muted-foreground">
              {label}
            </span>
          </div>
          {conversionMetric &&
            validPayload.find((p) => p.dataKey === 'conversionRate') && (
              <div className="flex flex-col items-end">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  Conversion Rate
                </span>
                <span
                  className="font-bold"
                  style={{ color: CHART_COLORS.conversion || '#ff7300' }}
                >
                  {formatPercentage(
                    validPayload.find((p) => p.dataKey === 'conversionRate')?.value
                  )}
                </span>
              </div>
            )}
        </div>

        {!conversionMetric && (
          <div className="grid gap-1.5">
            {validPayload.map((item, index) => {
              const activity = team?.default_activities?.find(
                (a) => a.id === item.name
              );
              const itemName = activity?.label || item.name;
              const color = isMembersView
                ? memberColors[index % memberColors.length]
                : item.name === 'total'
                  ? activityColors.primary
                  : Object.values(activityColors)[
                      index % Object.values(activityColors).length
                    ];

              return (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[0.70rem] text-muted-foreground flex-1 truncate">
                      {itemName}
                    </span>
                  </div>
                  <span className="font-bold text-[0.70rem] text-right">
                    {typeof item.value === 'number'
                      ? item.value.toLocaleString()
                      : item.value}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function ActivityChart({
  data,
  selectedActivities,
  displayMode,
  showLegend = defaultShowLegend,
  conversionMetric,
}: ActivityChartProps) {
  const { team } = useTeamStore();

  // --- DEBUG LOG --- 
  console.log(`[ActivityChart] Received displayMode: ${displayMode}`);

  useEffect(() => {
    if (conversionMetric) {
      console.log('[ActivityChart] Received conversionMetric:', conversionMetric);
    }
  }, [conversionMetric]);

  // --- Data Processing --- 
  const chartData = useMemo(() => {
    if (!data) return [];

    // Step 1: Reduce to aggregate daily sums (for conversion) or activity totals
    const groupedData = data.reduce((acc, day) => {
      // --- Safety Check for Date Field --- 
      if (!day || (typeof day.log_date !== 'string' && typeof day.date !== 'string')) {
        console.warn('[ActivityChart] Skipping day entry due to missing/invalid date field (log_date or date):', day);
        return acc; // Skip this entry
      }
      // Use 'log_date' if available, otherwise fallback to 'date'
      const dateString = day.log_date || day.date;
      if (!dateString) { // Should be caught by above check, but for TS safety
         console.warn('[ActivityChart] Skipping day entry due to missing date string despite checks:', day);
         return acc;
      }
      // --- End Safety Check ---

      const dateKey = dateString.split('T')[0]; // Use the determined date string

      // Initialize date entry if it doesn't exist
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          // Initialize potentially needed fields
          _numeratorSum: 0, // Temporary field for conversion sum
          _denominatorSum: 0, // Temporary field for conversion sum
        };
        // Initialize activity breakdown fields only if NOT a conversion metric
        if (!conversionMetric) {
           if (displayMode === 'chart_team' && day.member_data) {
             day.member_data.forEach(m => { acc[dateKey][m.name] = 0; });
           } else if (displayMode === 'chart_metric') {
             selectedActivities.forEach(act => { acc[dateKey][act] = 0; });
           } else { // 'chart_total' or undefined
             acc[dateKey]['total'] = 0;
           }
        }
      }

      // Aggregate numerator/denominator sums OR activity values
      if (conversionMetric) {
        acc[dateKey]._numeratorSum += safeNumber(day[conversionMetric.numerator as keyof typeof day]);
        acc[dateKey]._denominatorSum += safeNumber(day[conversionMetric.denominator as keyof typeof day]);
      } else {
        // --- Activity Aggregation Logic --- 
         if (displayMode === 'chart_team' && day.member_data) {
            day.member_data.forEach(member => {
              const memberTotal = selectedActivities.reduce((sum, activity) => 
                sum + safeNumber(member[activity as keyof typeof member]), 0);
              acc[dateKey][member.name] = (acc[dateKey][member.name] || 0) + memberTotal;
            });
          } else if (displayMode === 'chart_metric') {
            selectedActivities.forEach(activity => {
              acc[dateKey][activity] = (acc[dateKey][activity] || 0) + safeNumber(day[activity as keyof typeof day]);
            });
          } else { // 'chart_total' or undefined
            const dayTotal = selectedActivities.reduce((sum, activity) => 
              sum + safeNumber(day[activity as keyof typeof day]), 0);
            acc[dateKey]['total'] = (acc[dateKey]['total'] || 0) + dayTotal;
          }
        // --- End Activity Aggregation ---
      }

      return acc;
    }, {} as Record<string, any>); 

    // Step 2: Map to final structure, calculating rate or passing activity data
    const finalChartData = Object.values(groupedData).map((item: any) => {
      if (conversionMetric) {
        // Calculate the final rate from the daily sums
        const rate = item._denominatorSum === 0 ? 0 : item._numeratorSum / item._denominatorSum;
        // Return ONLY date and conversionRate
        return { date: item.date, conversionRate: rate }; 
      } else {
        // For activities, remove temporary sum fields and return the object
        delete item._numeratorSum;
        delete item._denominatorSum;
        return item; 
      }
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date

    // TODO: Fill missing dates if necessary

    // TEMPORARY LOGGING: Inspect the final data for conversion charts
    if (conversionMetric) {
      console.log('[ActivityChart] Final Conversion Chart Data:', finalChartData);
    }

    return finalChartData;

  }, [data, selectedActivities, displayMode, conversionMetric, team?.default_activities]); // Dependencies


  // --- Calculate Legend Items (Memoized) ---
  const activeMetrics = useMemo(() => {
    if (displayMode === 'chart_team' && data?.[0]?.member_data) {
      return data[0].member_data.map((member) => member.name);
    }
    if (displayMode === 'chart_metric') {
      return selectedActivities;
    }
    return ['total'];
  }, [data, displayMode, selectedActivities]);

  const legendItems = useMemo(() => {
    if (!data || data.length === 0) return [];

    const firstDay = data[0];

    if (displayMode === 'chart_team' && firstDay.member_data) {
      return firstDay.member_data.map((member, index) => ({
        name: member.name,
        color: getMetricColorHelper(member.name, index, displayMode, data, selectedActivities),
      }));
    } else if (displayMode === 'chart_metric') {
      return selectedActivities.map((activity, index) => ({
        name: team?.default_activities?.find(a => a.id === activity)?.label || activity,
        color: getMetricColorHelper(activity, index, displayMode, data, selectedActivities),
      }));
    } else {
      return [
        {
          name: 'Total',
          color: getMetricColorHelper('total', 0, displayMode, data, selectedActivities),
        },
      ];
    }
  }, [data, selectedActivities, displayMode, team]);

  // --- Final Chart Data and Config --- 
  const isMembersView = displayMode === 'chart_team';
  const isConversionOnly = !!conversionMetric;

  return (
    <div className="space-y-4">
      {showLegend && legendItems.length > 0 && <ChartLegend items={legendItems} />}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {isConversionOnly ? (
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.2} />
              <XAxis {...axisConfig} dataKey="date" />
              <YAxis
                {...axisConfig}
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => formatPercentage(value)} 
                domain={[0, 'auto']} 
                width={40}
              />
              <Tooltip content={<CustomTooltip conversionMetric={conversionMetric} />} />
              <Line
                key="conversionRate"
                yAxisId="right"
                type="monotone"
                dataKey="conversionRate"
                stroke={CHART_COLORS.conversion || '#ff7300'}
                strokeWidth={2}
                dot={false}
                name="Conversion Rate"
              />
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              {!isMembersView && (
                <defs>
                  {activeMetrics.map((metric, index) => (
                    <ChartGradient
                      key={metric}
                      id={`gradient-${metric}`}
                      color={getMetricColorHelper(metric, index, displayMode, data, selectedActivities)}
                    />
                  ))}
                </defs>
              )}
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.2} />
              <XAxis {...axisConfig} dataKey="date" />
              <YAxis
                {...axisConfig}
                yAxisId="left"
                tickFormatter={(value) => ''}
                width={40}
              />
              <YAxis
                {...axisConfig}
                yAxisId="right"
                tickFormatter={(value) => ''}
                orientation="right"
                width={40}
              />
              <Tooltip content={<CustomTooltip conversionMetric={conversionMetric} />} />
              {activeMetrics.map((metric, index) => (
                <Area
                  key={metric}
                  yAxisId="left"
                  name={metric}
                  dataKey={metric}
                  stroke={getMetricColorHelper(metric, index, displayMode, data, selectedActivities)}
                  fill={isMembersView ? 'transparent' : `url(#gradient-${metric})`}
                  stackId={isMembersView ? 'teamStack' : undefined}
                  {...areaConfig}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function safeNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}