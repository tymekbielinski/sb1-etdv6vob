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
      const text = type === 'currency' ? editValue : value;
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
  }, [editValue, isEditing, type, value]);

  const handleClick = () => {
    setIsEditing(true);
    setEditValue(type === 'currency' ? value.replace(/[^0-9.]/g, '') : value);
    // Focus after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = async () => {
    if (!onChange) return;
    
    try {
      let newValue = editValue;
      if (type === 'currency') {
        // Convert to cents for storage
        const dollars = parseFloat(editValue);
        if (!isNaN(dollars)) {
          newValue = Math.round(dollars * 100).toString();
        }
      }
      await onChange(newValue);
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
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none"
              style={{ caretColor: 'transparent' }}
            />
          ) : (
            <div className="text-2xl font-bold tracking-tight">
              {value}
            </div>
          )}
          {isEditing && showCursor && (
            <span 
              className="absolute top-0 h-full w-0.5 bg-primary animate-pulse"
              style={{ left: `${cursorPosition}px` }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}