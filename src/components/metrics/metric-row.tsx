import { Card } from '@/components/ui/card';
import { MetricCard } from './metric-card';
import { useMetricsStore, type MetricRow as MetricRowType } from '@/lib/store/metrics-store';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import React, { useState, useMemo } from 'react';
import type { DailyLogData } from '@/lib/api/daily-logs/queries';
import type { ActivityType } from '@/components/dashboard/activity-filter';

interface MetricRowProps {
  row: MetricRowType;
  isDefault?: boolean;
  onReorder?: () => void; // Callback to signal unsaved changes
  onResize?: () => void;
  chartData?: DailyLogData[];
  selectedActivities?: ActivityType[];
}

export function MetricRow({ row, isDefault = false, onReorder, onResize, chartData, selectedActivities }: MetricRowProps) {
  const { definitions, reorderMetrics, updateMetric, metrics } = useMetricsStore();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ensure row.metrics is an array
  const metricsArray = Array.isArray(row.metrics) ? row.metrics : [];

  // Get metrics for this row, preserving the order from metricsArray
  const definitionsMap = new Map(definitions.map(def => [def.id, def]));
  const rowMetrics = metricsArray
    .map(metricId => definitionsMap.get(metricId))
    .filter((metric): metric is MetricRowType['metrics'][number] => !!metric);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null); // Track item being hovered over

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Update the ID of the item being hovered over
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? over.id : null);
  };

  // Handler for when a drag operation ends
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null); // Reset overId

    if (over && active.id !== over.id) {
      const oldIndex = metricsArray.indexOf(active.id as string);
      const newIndex = metricsArray.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newMetricIds = arrayMove(metricsArray, oldIndex, newIndex);
        reorderMetrics(row.id, oldIndex, newIndex);
        onReorder?.(); // Notify parent about the change
      }
    }
  };

  // Reset state on drag cancel
  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  // Find the metric definition for the active card to show in the overlay
  const activeMetric = useMemo(() => {
    return definitionsMap.get(activeId as string);
  }, [activeId, definitionsMap]);

  // Prepare conversion prop for overlay
  const overlayConversionMetric = useMemo(() => {
    return activeMetric?.displayMode === 'chart' && activeMetric?.type === 'conversion' && activeMetric?.metrics?.length === 2
      ? { numerator: activeMetric.metrics[0] as ActivityType, denominator: activeMetric.metrics[1] as ActivityType }
      : undefined;
  }, [activeMetric]);

  // Prepare selected activities for overlay (non-conversion)
  const overlaySelectedActivities = useMemo(() => {
    return activeMetric?.displayMode === 'chart' && activeMetric?.type !== 'conversion'
      ? (activeMetric?.metrics as ActivityType[]) || [] 
      : [];
  }, [activeMetric]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver} // Track hover
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel} // Reset on cancel
    >
      <SortableContext items={metricsArray} strategy={rectSortingStrategy}>
        <Card className="p-4 transition-colors hover:bg-accent/20">
          <div className="grid gap-4 grid-cols-12">
            {rowMetrics.map((metric) => {
              // Ensure metric is not undefined after filter
              if (!metric) return null;
              // Determine if this card is being hovered over by a different card
              const isOver = overId === metric.id && activeId !== null && activeId !== metric.id;
              const colSpanClass = `col-span-${metric.colSpan || 3}`; // Default to 3 if undefined
              return (
                <MetricCard
                  key={metric.id}
                  id={metric.id} // Pass id for dnd-kit
                  isDraggable={!isDefault} // Disable dragging for default rows
                  isOver={isOver} // Pass hover state
                  metric={metric}
                  onResize={onResize} // Pass resize callback down
                  className={colSpanClass} // Apply colSpan class
                  displayMode={metric.displayMode}
                  chartData={chartData} // Pass the appropriate data
                  selectedActivities={selectedActivities} // Pass selected activities
                />
              );
            })}
          </div>
        </Card>
        <DragOverlay>
          {activeId && activeMetric ? (
            <MetricCard
              id={activeMetric.id}
              isDraggable={true} // Overlay copy should also be marked (though hook isn't used)
              metric={activeMetric}
              className={`col-span-${activeMetric.colSpan || 3} opacity-75 shadow-xl`} // Style the overlay copy
              onResize={onResize} // Pass resize handler
              displayMode={activeMetric.displayMode}
              chartData={chartData} // Pass the appropriate data from parent (MetricRow)
              selectedActivities={overlaySelectedActivities} // Pass overlay selected activities
              conversionMetric={overlayConversionMetric} // Pass overlay conversion metric
            />
          ) : null}
        </DragOverlay>
      </SortableContext>
    </DndContext>
  );
}