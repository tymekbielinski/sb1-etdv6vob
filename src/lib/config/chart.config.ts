import { CHART_COLORS } from '../constants/colors';

export const axisConfig = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
  scale: "auto",
  allowDecimals: true,
  allowDataOverflow: false,
  allowDuplicatedCategory: true,
  includeHidden: false,
  reversed: false,
  tickCount: 5,
} as const;

export const tooltipConfig = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
  },
} as const;

export const areaConfig = {
  type: "monotone" as const,
  strokeWidth: 2,
  dot: false,
};

export const gradientConfig = {
  id: "colorActivities",
  color: CHART_COLORS.primary,
  opacity: {
    start: 0.1,
    end: 0,
  },
} as const;