import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, isToday, isYesterday, isFuture } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerDialogProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

export function DatePickerDialog({ onDateSelect, selectedDate }: DatePickerDialogProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const handlePresetDate = (daysToSubtract: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysToSubtract);
    onDateSelect(date);
  };

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (!date) return;
    onDateSelect(date);
    setIsCustomOpen(false);
  };

  // Determine which button should be active
  const isSelectedToday = isToday(selectedDate);
  const isSelectedYesterday = isYesterday(selectedDate);
  const isCustomSelected = !isSelectedToday && !isSelectedYesterday;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex gap-2">
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant={isCustomSelected ? "default" : "outline"}
              className="w-[140px] justify-start"
            >
              {isCustomSelected ? format(selectedDate, 'MMM d, yyyy') : 'Custom'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCustomDateSelect}
                disabled={(date) => isFuture(date)}
                modifiers={{
                  future: (date) => isFuture(date)
                }}
                modifiersStyles={{
                  future: {
                    opacity: 0.5,
                    textDecoration: 'line-through',
                    cursor: 'not-allowed'
                  }
                }}
                initialFocus
              />
              <div className="text-sm text-muted-foreground">
                Selected: {format(selectedDate, 'MMMM d, yyyy')}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant={isSelectedToday ? "default" : "outline"}
          onClick={() => handlePresetDate(0)}
          className={cn(
            "w-[100px]",
            isSelectedToday && "bg-primary text-primary-foreground"
          )}
        >
          Today
        </Button>
        <Button
          variant={isSelectedYesterday ? "default" : "outline"}
          onClick={() => handlePresetDate(1)}
          className={cn(
            "w-[100px]",
            isSelectedYesterday && "bg-primary text-primary-foreground"
          )}
        >
          Yesterday
        </Button>
      </div>
    </div>
  );
}
