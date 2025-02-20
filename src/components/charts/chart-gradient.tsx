interface ChartGradientProps {
  id: string;
  color: string;
  startOpacity?: number;
  endOpacity?: number;
}

export function ChartGradient({
  id,
  color,
  startOpacity = 0.2,
  endOpacity = 0.05,
}: ChartGradientProps) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={color} stopOpacity={startOpacity} />
      <stop offset="95%" stopColor={color} stopOpacity={endOpacity} />
    </linearGradient>
  );
}