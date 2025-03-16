import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';
import { useTeamStore } from '@/lib/store/team-store';
import { getDailyLog } from '@/lib/api/daily-logs/mutations';
import { format } from 'date-fns';

interface EditableMetricCardProps {
  title: string;
  metricId: string;
  selectedDate: Date;
  onUpdate: (field: string, value: string) => Promise<void>;
  isLoading?: boolean;
  icon?: any;
  className?: string;
}

export function EditableMetricCard({
  title,
  metricId,
  selectedDate,
  onUpdate,
  isLoading,
  icon: Icon,
  className
}: EditableMetricCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('0');
  const [displayValue, setDisplayValue] = useState('0');
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { team } = useTeamStore();

  useEffect(() => {
    const loadValue = async () => {
      if (!user?.id || !team?.id) return;

      try {
        const log = await getDailyLog(user.id, team.id, format(selectedDate, 'yyyy-MM-dd'));
        const newValue = log?.[metricId] || 0;
        setValue(newValue.toString());
        setDisplayValue(newValue.toString());
      } catch (error) {
        console.error('Error loading value:', error);
      }
    };

    loadValue();
  }, [user?.id, team?.id, metricId, selectedDate]);

  const handleClick = () => {
    setIsEditing(true);
    // Focus after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = async () => {
    try {
      if (value !== displayValue) {
        await onUpdate(metricId, value);
        setDisplayValue(value);
      }
    } catch (error) {
      setValue(displayValue); // Reset on error
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setValue(displayValue);
      setIsEditing(false);
    } else if (e.key === 'Tab') {
      // Let default tab behavior work
      handleBlur();
    }
  };

  return (
    <Card 
      className={cn(
        "transition-colors hover:bg-accent/50",
        isEditing && "bg-accent/50",
        !isEditing && "bg-card",
        "backdrop-blur-sm border-muted/20",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/70" />}
      </CardHeader>
      <CardContent>
        <div 
          className="relative cursor-text"
          onClick={handleClick}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none"
              disabled={isLoading}
            />
          ) : (
            <div className="text-2xl font-bold tracking-tight">
              {displayValue}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}