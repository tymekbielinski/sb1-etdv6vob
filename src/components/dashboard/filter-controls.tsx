import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/date-range-picker';
import { useToast } from '@/hooks/use-toast';
import type { DateRange } from '@/lib/types';

interface FilterControlsProps {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  onApplyFilters: () => Promise<void>;
}

export function FilterControls({
  dateRange,
  setDateRange,
  onApplyFilters,
}: FilterControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDateRange, setPendingDateRange] = useState<DateRange | undefined>(dateRange);
  const { toast } = useToast();

  const handleApplyFilters = async () => {
    if (!pendingDateRange) {
      toast({
        title: "Invalid date range",
        description: "Please select a date range",
        variant: "destructive",
      });
      return;
    }

    if (pendingDateRange.to < pendingDateRange.from) {
      toast({
        title: "Invalid date range",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      setDateRange(pendingDateRange);
      await onApplyFilters();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply filters",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <DatePickerWithRange 
        date={pendingDateRange} 
        setDate={setPendingDateRange}
      />
      <Button 
        onClick={handleApplyFilters}
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? "Applying..." : "Apply Filters"}
      </Button>
    </div>
  );
}