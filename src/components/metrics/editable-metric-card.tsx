import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';
import { useTeamStore } from '@/lib/store/team-store';
import { getDailyLog } from '@/lib/api/daily-logs/mutations';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface EditableMetricCardProps {
  title: string;
  metricId: string;
  selectedDate: Date;
  onUpdate: (field: string, value: string) => Promise<void>;
  isLoading?: boolean;
  icon?: any;
  className?: string;
  disabled?: boolean;
  displayType?: 'number' | 'currency';
  value?: string;
}

// Global event bus for metric cards
export const SAVE_ALL_METRICS_EVENT = 'saveAllMetrics';
export const METRIC_EDIT_START_EVENT = 'metricEditStart';
export const METRIC_SAVE_COMPLETE_EVENT = 'metricSaveComplete';

export function EditableMetricCard({
  title,
  metricId,
  selectedDate,
  onUpdate,
  isLoading,
  icon: Icon,
  className,
  disabled = false,
  displayType = 'number',
  value: initialValue
}: EditableMetricCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('0');
  const [displayValue, setDisplayValue] = useState('0');
  const [isSaving, setIsSaving] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { team } = useTeamStore();

  useEffect(() => {
    if (initialValue !== undefined) {
      setValue(initialValue);
      setDisplayValue(initialValue);
      return;
    }

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
  }, [user?.id, team?.id, metricId, selectedDate, initialValue]);
  
  // Set up event listeners for saving and editing
  useEffect(() => {
    // Handler for saving all metrics except the one specified
    const handleSaveAll = (e: CustomEvent) => {
      const exceptMetricId = e.detail?.exceptMetricId;
      
      // If we're editing and we're not the excepted metric, save our value
      if (isEditing && metricId !== exceptMetricId) {
        if (value !== displayValue) {
          saveValue(value);
        }
        setIsEditing(false);
      }
    };
    
    // Handler for when another metric starts editing
    const handleEditStart = (e: CustomEvent) => {
      const startingMetricId = e.detail?.metricId;
      
      // If we're not the metric that's starting to edit, and we're currently editing, save our value
      if (isEditing && metricId !== startingMetricId) {
        if (value !== displayValue) {
          saveValue(value);
        }
        setIsEditing(false);
      }
    };
    
    // Add event listeners
    document.addEventListener(SAVE_ALL_METRICS_EVENT, handleSaveAll as EventListener);
    document.addEventListener(METRIC_EDIT_START_EVENT, handleEditStart as EventListener);
    
    // Clean up
    return () => {
      document.removeEventListener(SAVE_ALL_METRICS_EVENT, handleSaveAll as EventListener);
      document.removeEventListener(METRIC_EDIT_START_EVENT, handleEditStart as EventListener);
    };
  }, [isEditing, metricId, value, displayValue]);

  const handleClick = () => {
    if (disabled) return;
    
    // Notify other metrics that we're starting to edit
    document.dispatchEvent(new CustomEvent(METRIC_EDIT_START_EVENT, {
      detail: { metricId }
    }));
    
    setIsEditing(true);
    
    // Focus after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveValue = async (valueToSave: string) => {
    if (isSaving || valueToSave === displayValue) return;

    setIsSaving(true);
    try {
      const numValue = Number(valueToSave);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Invalid value');
      }

      // Save to database
      await onUpdate(metricId, valueToSave);
      setDisplayValue(valueToSave);
      setValue(valueToSave);
      // Notify save completion
      document.dispatchEvent(new CustomEvent(METRIC_SAVE_COMPLETE_EVENT, { detail: { metricId } }));
    } catch (error) {
      console.error('Error saving value:', error);
      setValue(displayValue); // Reset on error
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleIncrement = () => {
    if (disabled || isSaving) return;
    
    // Notify other metrics that we're starting to edit
    document.dispatchEvent(new CustomEvent(METRIC_EDIT_START_EVENT, {
      detail: { metricId }
    }));
    
    // Get current value to increment
    const currentValue = Number(isEditing ? value : displayValue);
    if (isNaN(currentValue)) return;
    
    const newValue = (currentValue + 1).toString();
    setValue(newValue);
    
    // Start editing mode but don't save
    if (!isEditing) {
      setIsEditing(true);
      // Set focus to input after we enter edit mode
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };
  
  const handleDecrement = () => {
    if (disabled || isSaving) return;
    
    // Notify other metrics that we're starting to edit
    document.dispatchEvent(new CustomEvent(METRIC_EDIT_START_EVENT, {
      detail: { metricId }
    }));
    
    // Get current value to decrement
    const currentValue = Number(isEditing ? value : displayValue);
    if (isNaN(currentValue) || currentValue <= 0) return;
    
    const newValue = (currentValue - 1).toString();
    setValue(newValue);
    
    // Start editing mode but don't save
    if (!isEditing) {
      setIsEditing(true);
      // Set focus to input after we enter edit mode
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };


  
  const handleBlur = async (e: React.FocusEvent) => {
    // Check if the related target is within this card
    if (cardRef.current?.contains(e.relatedTarget as Node)) {
      // Focus is still within the card, don't save yet
      return;
    }
    
    // Save if value has changed
    if (isEditing && value !== displayValue) {
      await saveValue(value);
    }
    
    setIsEditing(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value !== displayValue) {
        await saveValue(value);
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setValue(displayValue); // Reset to previous value
      setIsEditing(false);
    } else if (e.key === 'Tab') {
      // Let default tab behavior work
      if (value !== displayValue) {
        await saveValue(value);
      }
      setIsEditing(false);
    }
  };

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "transition-colors",
        !disabled && "hover:bg-accent/50",
        isEditing && "bg-accent/50",
        !isEditing && "bg-card",
        "backdrop-blur-sm border-muted/20",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/70" />}
      </CardHeader>
      <CardContent>
        <div 
          className={cn(
            "relative",
            !disabled && "cursor-text",
            disabled && "cursor-not-allowed"
          )}
          onClick={handleClick}
          onMouseEnter={() => !disabled && setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Value Controls */}
          {isHovering && !disabled && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex flex-col">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleIncrement();
                }}
                className="p-1 rounded-t-md bg-primary/10 hover:bg-primary/20 transition-colors"
                disabled={isSaving}
              >
                <ChevronUp className="h-6 w-6 text-primary" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDecrement();
                }}
                className="p-1 rounded-b-md bg-primary/10 hover:bg-primary/20 transition-colors"
                disabled={isSaving || Number(value) <= 0}
              >
                <ChevronDown className="h-6 w-6 text-primary" />
              </button>
            </div>
          )}
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              min="0"
              value={value}
              onChange={(e) => {
                const newValue = e.target.value;
                // Only allow non-negative numbers
                if (newValue === '' || (!isNaN(Number(newValue)) && Number(newValue) >= 0)) {
                  setValue(newValue);
                  
                  // We no longer auto-save on typing - only on blur
                  if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                  }
                }
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none"
              disabled={isLoading || disabled || isSaving}
            />
          ) : (
            <div className="text-3xl font-bold tracking-tight pr-10">
              {displayValue}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}