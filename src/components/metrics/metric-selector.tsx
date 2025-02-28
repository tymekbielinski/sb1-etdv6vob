import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MetricOption {
  value: string;
  label: string;
}

interface MetricSelectorProps {
  metrics: MetricOption[];
  selectedMetrics: string[];
  onChange: (metrics: string[]) => void;
  className?: string;
}

export function MetricSelector({ metrics, selectedMetrics, onChange, className }: MetricSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (selectedMetrics.includes(value)) {
      onChange(selectedMetrics.filter(m => m !== value));
    } else {
      onChange([...selectedMetrics, value]);
    }
    setIsOpen(true);
  };

  return (
    <div className={className}>
      <Select
        open={isOpen}
        onOpenChange={setIsOpen}
        value={undefined}
        onValueChange={handleSelect}
      >
        <SelectTrigger className="h-10">
          <SelectValue placeholder="Select metrics" />
        </SelectTrigger>
        <SelectContent>
          {metrics.map(metric => (
            <SelectItem
              key={metric.value}
              value={metric.value}
              className={selectedMetrics.includes(metric.value) ? 'bg-muted' : ''}
            >
              {metric.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
