import { addDays, format, startOfDay, endOfDay } from 'date-fns';
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

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  const handleSelect = (newDate: DateRange | undefined) => {
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

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                date.from.toDateString() === date.to.toDateString() ? (
                  format(date.from, 'LLL dd, y')
                ) : (
                  <>
                    {format(date.from, 'LLL dd, y')} -{' '}
                    {format(date.to, 'LLL dd, y')}
                  </>
                )
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}