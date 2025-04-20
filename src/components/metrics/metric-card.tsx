import { Settings, Trash2, MoreVertical, Hash, Percent, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils';
import { useMetricsStore, type MetricDefinition } from '@/lib/store/metrics-store';
import { useDailyLogsStore } from '@/lib/store/daily-logs-store';
import { useTeamStore } from '@/lib/store/team-store';
import { formatMetricValue } from '@/lib/utils/format';
import { METRIC_ICON_COLORS } from '@/lib/constants/colors'; // Re-import metric icon colors
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRef, useState, useEffect, useCallback } from 'react';

interface MetricCardProps {
  id: string; // Required for dnd-kit
  title?: string; // Optional: Used for static cards
  value?: string | number; // Optional: Used for static cards
  className?: string; // Includes col-span
  metric?: MetricDefinition; // Optional: Used for dynamic cards from store
  icon?: React.ElementType;
  onResize?: () => void; // Callback when resize finishes
  isDraggable?: boolean; // If false, dnd/resize logic is disabled
  isOver?: boolean; // If true, indicates an item is being dragged over this card
}

export function MetricCard({
  id,
  title,
  value,
  className,
  metric,
  icon: Icon,
  onResize,
  isDraggable = false, // Default to false
  isOver = false, // Default to false
}: MetricCardProps) {
  const { removeMetric, updateMetric } = useMetricsStore();
  const { data: activityData } = useDailyLogsStore();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for dropdown open status

  // --- Conditional dnd-kit Hook --- 
  // Only enable sorting/dragging if isDraggable is true
  const { 
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: id, 
    // Disable hook if not draggable OR if the dropdown menu is open
    disabled: !isDraggable || isMenuOpen 
  }); 
  // --- End Conditional dnd-kit Hook --- 

  const cardRef = useRef<HTMLDivElement>(null);
  const [currentWidth, setCurrentWidth] = useState<number>(0); // Keep track of current rendered width
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [resizeDirection, setResizeDirection] = useState<'left' | 'right' | null>(null);

  // Apply transform/transition styles from dnd-kit
  // Hide original item completely when dragging, DragOverlay provides the visual
  const dndStyle: React.CSSProperties = isDraggable ? {
    // Only apply transform to the card being dragged, not siblings
    transform: isDragging ? CSS.Transform.toString(transform) : 'none',
    // Only apply transition to the element being dragged (or the overlay)
    // This prevents other elements from animating during drag over
    transition: isDragging ? transition : 'none', 
    visibility: isDragging ? 'hidden' : 'visible',
  } : {}; // Empty style object if not draggable

  // Effect to get initial width (needed for calculations)
  useEffect(() => {
    if (cardRef.current && !isResizing) {
      setCurrentWidth(cardRef.current.offsetWidth);
      setStartWidth(cardRef.current.offsetWidth); // Update reference width
    }
  }, [className, isResizing]); // Re-run if colSpan class changes or resizing stops

  const handleEdit = () => {
    if (metric) {
      navigate(`/metrics/${metric.id}`);
    }
  };

  const handleDelete = () => {
    if (metric) {
      removeMetric(metric.id);
    }
  };

  // Calculation logic (adapted from previous handleResizeStop)
  const calculateAndSetNewSpan = (finalWidth: number) => {
    if (!metric || !cardRef.current) return;

    // Use startWidth which was captured when resize began
    const initialWidth = startWidth;
    if (initialWidth === 0) return; // Avoid division by zero

    const currentSpan = metric.colSpan || 3;
    // Ensure colWidth is at least 1 to avoid division by zero or infinite loops
    const colWidth = Math.max(1, initialWidth / currentSpan);
    let newSpan = Math.round(finalWidth / colWidth);
    newSpan = Math.max(2, Math.min(12, newSpan)); // Clamp between 2 and 12

    if (newSpan !== currentSpan) {
      updateMetric(metric.id, { colSpan: newSpan });
      onResize?.(); // Trigger save state update
    }
    // Let the useEffect update currentWidth based on the new colSpan class
  };

  // --- Custom Resize Event Handlers ---
  const handleResizeStart = useCallback((direction: 'left' | 'right') => (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    setResizeDirection(direction);
    setIsResizing(true);
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    setStartX(pageX);
    setStartWidth(cardRef.current.offsetWidth);

    // Prevent dnd-kit drag start and text selection
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const handleResizeEnd = useCallback(() => {
    if (!isResizing || !cardRef.current) return;

    // Get final width from element
    const finalWidth = cardRef.current.offsetWidth;
    calculateAndSetNewSpan(finalWidth);

    // Reset state and inline styles
    setIsResizing(false);
    setResizeDirection(null);
    cardRef.current.style.width = '';
    cardRef.current.style.left = '';
    cardRef.current.style.position = ''; // Reset position if set
  }, [isResizing, calculateAndSetNewSpan]);

  const handleResizing = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing || !cardRef.current || !resizeDirection) return;

    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    const deltaX = pageX - startX; 
    let newWidth = startWidth + (resizeDirection === 'right' ? deltaX : -deltaX);

    // Set width directly for visual feedback
    // Apply minimum width constraint visually during resize
    const minPossibleWidth = (startWidth / (metric?.colSpan || 3)) * 2; 
    cardRef.current.style.width = `${Math.max(minPossibleWidth, newWidth)}px`;

    // Adjust position for left resize visually
    if (resizeDirection === 'left') {
        cardRef.current.style.position = 'relative';
        cardRef.current.style.left = `${startWidth - newWidth}px`; // Move left by the amount shrunk
    }
  }, [isResizing, startX, startWidth, resizeDirection]);

  // Add/remove global listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizing);
      document.addEventListener('touchmove', handleResizing);
      document.addEventListener('mouseup', handleResizeEnd);
      document.addEventListener('touchend', handleResizeEnd);
    } else {
      document.removeEventListener('mousemove', handleResizing);
      document.removeEventListener('touchmove', handleResizing);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchend', handleResizeEnd);
    }

    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleResizing);
      document.removeEventListener('touchmove', handleResizing);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchend', handleResizeEnd);
    };
  }, [isResizing, handleResizing, handleResizeEnd]);

  // --- End Custom Resize Event Handlers ---

  // Re-define displayTitle and displayValue before return
  const displayTitle = metric ? getMetricTitle(metric) : title;
  const displayValue = metric
    ? formatMetricValue(calculateMetricValue(metric, activityData), metric.displayType)
    : value;

  // Determine the icon component and color
  let IconComponent: React.ElementType | null = Icon; // Start with passed icon if available
  let iconColorHex: string | null = null; // Hex color for custom types

  if (!IconComponent && metric?.displayType) { // If no passed icon, check displayType
    switch (metric.displayType) {
      case 'number':
        IconComponent = Hash;
        iconColorHex = METRIC_ICON_COLORS.number;
        break;
      case 'percent': 
        IconComponent = Percent;
        iconColorHex = METRIC_ICON_COLORS.percent;
        break;
      case 'dollar':
        IconComponent = DollarSign;
        iconColorHex = METRIC_ICON_COLORS.dollar;
        break;
      default:
        IconComponent = null;
    }
  }

  return (
    // Main Card Div
    <div
      ref={(node) => {
        setNodeRef(node);
        // Also assign to cardRef for size measurements, regardless of draggability
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node; // Assign to cardRef too
      }}
      style={dndStyle} // Apply dnd transform/visibility style here
      // Apply cardRef here to the element whose width we measure/manipulate
      className={cn(
        "relative group transition-colors flex flex-col min-h-[150px] bg-card rounded-lg border border-border",
        className, // Apply colSpan class here
        isDragging && isDraggable ? 'shadow-lg' : '', // Shadow only if dragging
        // Prevent text selection when resizing
        isResizing ? 'select-none' : ''
      )}>
        {/* Drop Indicator: Render INSIDE card, positioned absolutely to the left gap */}
        {isDraggable && isOver && (
          <div 
            // Revert to final styles: bg-border, z-20
            className="absolute top-1/2 left-0 h-3/4 w-1 bg-border rounded z-20 pointer-events-none"
            // Center vertically and shift left into the gap
            // Account for half the gap (8px) + half the indicator's own width (w-1 -> 4px / 2 = 2px) = 10px total shift
            style={{ transform: 'translateX(-10px) translateY(-50%)' }} 
          />
        )}
        
        {/* Render resize handles only if draggable */}
        {isDraggable && (
          <>
            {/* Left Resize Handle */}
            <div
              className="absolute -left-1 top-0 bottom-0 w-3 cursor-ew-resize z-10 group-hover:bg-primary/20 rounded-l-md transition-colors"
              onMouseDown={handleResizeStart('left')}
              onTouchStart={handleResizeStart('left')}
              onClick={(e) => e.stopPropagation()} // Prevent card drag
            />
            {/* Right Resize Handle */}
            <div
              className="absolute -right-1 top-0 bottom-0 w-3 cursor-ew-resize z-10 group-hover:bg-primary/20 rounded-r-md transition-colors"
              onMouseDown={handleResizeStart('right')}
              onTouchStart={handleResizeStart('right')}
              onClick={(e) => e.stopPropagation()} // Prevent card drag
            />
          </>
        )}
        
        {/* Top Section: Header - Make this the drag handle */}
        {/* Add grab cursor and dnd listeners only if draggable */}
        <div 
          className={cn(
            "p-3 transition-colors", 
            isDraggable ? "hover:bg-accent/20 cursor-grab" : ""
          )}
          {...(isDraggable ? attributes : {})} 
          {...(isDraggable ? listeners : {})} 
        >
          <div className="flex items-center justify-between space-x-2">
            {/* Left side: Icon and Title */}
            <div className="flex items-center space-x-2">
              {/* Render the determined icon with its assigned color class */}
              {IconComponent && (
                <IconComponent
                  className={cn(
                    "h-4 w-4 flex-shrink-0 mr-2",
                    // Apply muted foreground only if it's a passed icon (not custom type)
                    !iconColorHex && "text-muted-foreground"
                  )}
                  // Apply specific hex color using inline style for custom types
                  style={iconColorHex ? { color: iconColorHex } : {}}
                />
              )}
              <h3 className="font-medium leading-none truncate" title={displayTitle}>{displayTitle}</h3>
            </div>

            {metric && (
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Edit/Delete options only for custom metrics */}
                <AlertDialog>
                  <DropdownMenu onOpenChange={setIsMenuOpen}> {/* Update state on open/close */}
                    <DropdownMenuTrigger asChild>
                      {/* Stop pointer event to prevent drag start when clicking menu */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onPointerDown={(e) => e.stopPropagation()} 
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEdit}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <div onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onSelect={(e) => e.preventDefault()} // Prevent closing dropdown
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this metric.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50"></div>

        {/* Bottom Section: Value */}
        <div className="flex flex-grow items-center justify-center p-4 transition-colors hover:bg-accent/30">
          <div className="text-4xl font-bold">{displayValue}</div>
        </div>
      </div>
  );
}

function getMetricLabel(id: string): string {
  const { team } = useTeamStore();
  const activity = team?.default_activities?.find(a => a.id === id);
  if (activity) return activity.label;

  // Fallback to formatted ID if no custom label found
  return id.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function calculateMetricValue(metric: MetricDefinition, data: any[]): number {
  if (metric.type === 'total') {
    const values = data.flatMap(day => 
      metric.metrics.map(m => day[m] || 0)
    );

    switch (metric.aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'average':
        return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return 0;
    }
  } else if (metric.type === 'conversion') {
    const [numerator, denominator] = metric.metrics;
    const totalNumerator = data.reduce((sum, day) => sum + (day[numerator] || 0), 0);
    const totalDenominator = data.reduce((sum, day) => sum + (day[denominator] || 0), 0);
    return totalDenominator ? totalNumerator / totalDenominator : 0;
  }

  return 0;
}

function getMetricTitle(metric: MetricDefinition): string {
  if (metric.name) {
    return metric.name;
  }
  
  if (metric.type === 'total') {
    const metricNames = metric.metrics.map(m => getMetricLabel(m));
    return `Total ${metricNames.join(' + ')}`;
  } else {
    const [numerator, denominator] = metric.metrics;
    return `${getMetricLabel(numerator)} / ${getMetricLabel(denominator)}`;
  }
}