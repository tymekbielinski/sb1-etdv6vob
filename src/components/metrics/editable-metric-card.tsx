import { useState, useRef, useEffect } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EditableMetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  className?: string;
  onChange?: (value: string) => Promise<void>;
  type?: 'number' | 'currency';
}

export function EditableMetricCard({ 
  title, 
  value, 
  icon: Icon, 
  className,
  onChange,
  type = 'number'
}: EditableMetricCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [showCursor, setShowCursor] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Blinking cursor effect
  useEffect(() => {
    if (!isEditing) return;
    
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [isEditing]);

  // Update cursor position based on text width
  useEffect(() => {
    if (isEditing && valueRef.current) {
      const text = editValue;
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.fontSize = '1.5rem';
      tempSpan.style.fontWeight = 'bold';
      tempSpan.style.letterSpacing = '-0.025em';
      tempSpan.textContent = text;
      document.body.appendChild(tempSpan);
      setCursorPosition(tempSpan.offsetWidth);
      document.body.removeChild(tempSpan);
    }
  }, [editValue, isEditing]);

  const handleClick = () => {
    setIsEditing(true);
    // For currency, strip the formatting
    if (type === 'currency') {
      // Extract the numeric value from the formatted currency string
      const numericValue = value.replace(/[^0-9]/g, '');
      setEditValue(numericValue);
    } else {
      setEditValue(value);
    }
    // Focus after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = async () => {
    if (!onChange) return;
    
    try {
      await onChange(editValue);
    } catch (error) {
      console.error('Error updating value:', error);
      setEditValue(value); // Reset on error
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value);
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
        <Icon className="h-4 w-4 text-muted-foreground/70" />
      </CardHeader>
      <CardContent>
        <div 
          className="relative cursor-text"
          onClick={handleClick}
          ref={valueRef}
        >
          {isEditing ? (
            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                min="0"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                
                className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none"
                style={{ caretColor: 'transparent' }}
              />
              {showCursor && (
                <div 
                  className="absolute bg-primary w-0.5"
                  style={{ 
                    left: `${cursorPosition}px`,
                    top: '0',
                    height: '2rem',
                    bottom: '0'
                  }}
                />
              )}
              {type === 'currency' && (
                <div className="text-xs text-muted-foreground mt-1">
                  Enter whole dollar amount
                </div>
              )}
            </div>
          ) : (
            <div className="text-2xl font-bold tracking-tight">
              {value}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}