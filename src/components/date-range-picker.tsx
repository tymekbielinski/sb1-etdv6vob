import { useState, useEffect } from 'react';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subWeeks, 
  subMonths, 
  startOfQuarter, 
  endOfQuarter, 
  subQuarters 
} from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerWithRangeProps {
  className?: string;
  date?: DateRange;
  setDate: (date: DateRange | undefined) => void;
}

type QuickDateOption = 'this-month' | 'this-week' | 'last-week' | 'last-month' | 'this-quarter' | 'last-quarter' | 'custom';

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  // Get the current date for calculations
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // Initialize with 'this-month' as the default selected option
  const [selectedOption, setSelectedOption] = useState<QuickDateOption>('this-month');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  
  // Set up date ranges for each quick option
  const getDateRanges = () => {
    // This Month
    const thisMonthStart = startOfMonth(today);
    const thisMonthEnd = endOfMonth(today);
    const thisMonthName = format(today, 'MMMM');
    
    // This Week
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday as start of week
    const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday as end of week
    
    // Last Week
    const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
    
    // Last Month
    const lastMonthStart = startOfMonth(subMonths(today, 1));
    const lastMonthEnd = endOfMonth(subMonths(today, 1));
    const lastMonthName = format(subMonths(today, 1), 'MMMM');
    
    // This Quarter
    const thisQuarterStart = startOfQuarter(today);
    const thisQuarterEnd = endOfQuarter(today);
    const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
    const thisQuarterLabel = `Q${currentQuarter}`;
    
    // Last Quarter
    const lastQuarterDate = subQuarters(today, 1);
    const lastQuarterStart = startOfQuarter(lastQuarterDate);
    const lastQuarterEnd = endOfQuarter(lastQuarterDate);
    const lastQuarter = Math.floor(lastQuarterDate.getMonth() / 3) + 1;
    const lastQuarterLabel = `Q${lastQuarter}`;
    
    // Create ordered map with custom first
    return {
      'custom': { label: 'Custom' },
      'this-week': { from: thisWeekStart, to: thisWeekEnd, label: 'This Week' },
      'last-week': { from: lastWeekStart, to: lastWeekEnd, label: 'Last Week' },
      'this-month': { from: thisMonthStart, to: thisMonthEnd, label: thisMonthName },
      'last-month': { from: lastMonthStart, to: lastMonthEnd, label: lastMonthName },
      'this-quarter': { from: thisQuarterStart, to: thisQuarterEnd, label: thisQuarterLabel },
      'last-quarter': { from: lastQuarterStart, to: lastQuarterEnd, label: lastQuarterLabel }
    };
  };
  
  const dateRanges = getDateRanges();
  
  // Initialize with 'this-month' on component mount if no date is provided
  useEffect(() => {
    if (!date && selectedOption === 'this-month') {
      const { from, to } = dateRanges['this-month'];
      setDate({ from, to });
    }
  }, []);
  
  // Handle option selection
  const handleOptionSelect = (option: QuickDateOption) => {
    setSelectedOption(option);
    
    if (option === 'custom') {
      setIsCustomOpen(true);
      return;
    }
    
    const selectedRange = dateRanges[option];
    if (selectedRange.from && selectedRange.to) {
      setDate({
        from: startOfDay(selectedRange.from),
        to: endOfDay(selectedRange.to)
      });
    }
    
    setIsCustomOpen(false);
  };
  
  // Handle custom date selection
  const handleCustomDateSelect = (newDate: DateRange | undefined) => {
    if (!newDate) {
      setDate(undefined);
      return;
    }

    // If only from is selected, set both from and to to the same day
    if (newDate.from && !newDate.to) {
      setDate({
        from: startOfDay(newDate.from),
        to: endOfDay(newDate.from)
      });
      return;
    }

    // If both dates are selected and they're the same, ensure we use start and end of day
    if (newDate.from && newDate.to && newDate.from.toDateString() === newDate.to.toDateString()) {
      setDate({
        from: startOfDay(newDate.from),
        to: endOfDay(newDate.from)
      });
      return;
    }

    // For different dates, use start of first day and end of last day
    if (newDate.from && newDate.to) {
      setDate({
        from: startOfDay(newDate.from),
        to: endOfDay(newDate.to)
      });
    }
  };
  
  // Format the date range for display
  const formatDateRange = () => {
    if (!date?.from || !date?.to) return 'Select dates';
    
    // Check if this matches one of our predefined ranges
    for (const [key, range] of Object.entries(dateRanges)) {
      if (key === 'custom') continue;
      
      if (range.from && range.to && 
          date.from?.getTime() === startOfDay(range.from).getTime() && 
          date.to?.getTime() === endOfDay(range.to).getTime()) {
        return range.label;
      }
    }
    
    // If it doesn't match, show the custom date range
    if (date.from.toDateString() === date.to.toDateString()) {
      return format(date.from, 'MMM d, yyyy');
    }
    
    return `${format(date.from, 'MMM d, yyyy')} - ${format(date.to, 'MMM d, yyyy')}`;
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex w-full overflow-x-auto border rounded-md h-10">
        {/* Quick options */}
        {Object.entries(dateRanges).map(([key, range]) => {
          // For the Custom button, wrap it in a Popover
          if (key === 'custom') {
            return (
              <Popover key={key} open={isCustomOpen} onOpenChange={setIsCustomOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedOption === key ? "secondary" : "ghost"}
                    className={cn(
                      "rounded-none border-r px-3 py-0",
                      "text-sm whitespace-nowrap font-medium h-full",
                      selectedOption === key && "border-b-2 border-b-primary"
                    )}
                    onClick={() => {
                      setSelectedOption(key as QuickDateOption);
                      setIsCustomOpen(true); // Explicitly open the popover
                    }}
                  >
                    {range.label}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={(newDate) => {
                      handleCustomDateSelect(newDate);
                      // Don't automatically close - let user close it manually
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            );
          }
          
          // For other buttons, render normally
          return (
            <Button
              key={key}
              variant={selectedOption === key ? "secondary" : "ghost"}
              className={cn(
                "rounded-none border-r last:border-r-0 px-3 py-0",
                "text-sm whitespace-nowrap font-medium h-full",
                selectedOption === key && "border-b-2 border-b-primary"
              )}
              onClick={() => handleOptionSelect(key as QuickDateOption)}
            >
              {range.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}