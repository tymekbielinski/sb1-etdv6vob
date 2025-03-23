import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export interface MetricDefinition {
  id: string;
  type: 'total' | 'conversion';
  metrics: string[];
  displayType: 'number' | 'dollar' | 'percent';
  aggregation?: 'sum' | 'average' | 'max' | 'min';
  order: number;
  rowId: string;
  name?: string;
  description?: string;
}

export interface MetricRow {
  id: string;
  metrics: string[]; // Array of metric IDs
  order: number;
  height?: number;
}

interface MetricsState {
  definitions: MetricDefinition[];
  rows: MetricRow[];
  addMetric: (rowId: string, definition: Omit<MetricDefinition, 'id' | 'order' | 'rowId'>) => void;
  updateMetric: (id: string, updates: Partial<MetricDefinition>) => void;
  removeMetric: (id: string) => void;
  addRow: () => void;
  updateRow: (id: string, updates: Partial<MetricRow>) => void;
  removeRow: (id: string) => void;
  reorderRows: (fromIndex: number, toIndex: number) => void;
  reorderMetrics: (rowId: string, fromIndex: number, toIndex: number) => void;
  setDefinitions: (definitions: MetricDefinition[]) => void;
  setRows: (rows: MetricRow[]) => void;
}

export const useMetricsStore = create<MetricsState>()(
  persist(
    (set) => ({
      definitions: [],
      rows: [
        {
          id: 'default',
          metrics: [],
          order: 0,
        },
      ],
      addMetric: (rowId, definition) => set((state) => {
        const row = state.rows.find(r => r.id === rowId);
        if (!row) return state;

        const newMetric: MetricDefinition = {
          id: nanoid(),
          rowId,
          order: row.metrics.length,
          ...definition,
        };

        return {
          definitions: [...state.definitions, newMetric],
          rows: state.rows.map(r => 
            r.id === rowId 
              ? { ...r, metrics: [...r.metrics, newMetric.id] }
              : r
          ),
        };
      }),
      updateMetric: (id, updates) => set((state) => ({
        definitions: state.definitions.map(d => d.id === id ? { ...d, ...updates } : d),
      })),
      removeMetric: (id) => set((state) => {
        const metric = state.definitions.find(d => d.id === id);
        if (!metric) return state;

        return {
          definitions: state.definitions.filter(d => d.id !== id),
          rows: state.rows.map(r => 
            r.id === metric.rowId 
              ? { ...r, metrics: r.metrics.filter(m => m !== id) }
              : r
          ),
        };
      }),
      addRow: () => set((state) => ({
        rows: [
          ...state.rows,
          {
            id: nanoid(),
            metrics: [],
            order: state.rows.length,
          },
        ],
      })),
      updateRow: (id, updates) => set((state) => ({
        rows: state.rows.map(r => r.id === id ? { ...r, ...updates } : r),
      })),
      removeRow: (id) => set((state) => {
        // Don't remove the last row
        if (state.rows.length <= 1) return state;

        // Remove all metrics in this row
        const metricsToRemove = state.definitions
          .filter(d => d.rowId === id)
          .map(d => d.id);

        return {
          definitions: state.definitions.filter(d => !metricsToRemove.includes(d.id)),
          rows: state.rows.filter(r => r.id !== id),
        };
      }),
      reorderRows: (fromIndex, toIndex) => set((state) => {
        const newRows = [...state.rows];
        const [movedRow] = newRows.splice(fromIndex, 1);
        newRows.splice(toIndex, 0, movedRow);

        // Update order property
        return {
          rows: newRows.map((r, i) => ({ ...r, order: i })),
        };
      }),
      reorderMetrics: (rowId, fromIndex, toIndex) => set((state) => {
        const row = state.rows.find(r => r.id === rowId);
        if (!row) return state;

        const newMetricIds = [...row.metrics];
        const [movedMetricId] = newMetricIds.splice(fromIndex, 1);
        newMetricIds.splice(toIndex, 0, movedMetricId);

        // Update rows and metric orders
        return {
          rows: state.rows.map(r => 
            r.id === rowId 
              ? { ...r, metrics: newMetricIds }
              : r
          ),
          definitions: state.definitions.map(d => {
            if (d.rowId !== rowId) return d;
            const newIndex = newMetricIds.indexOf(d.id);
            return newIndex !== -1 ? { ...d, order: newIndex } : d;
          }),
        };
      }),
      setDefinitions: (definitions) => set({ 
        definitions: Array.isArray(definitions) ? definitions.map(def => ({
          id: def.id || nanoid(),
          type: ['total', 'conversion'].includes(def.type) ? def.type : 'total',
          metrics: Array.isArray(def.metrics) ? def.metrics : [],
          displayType: ['number', 'dollar', 'percent'].includes(def.displayType) ? def.displayType : 'number',
          aggregation: ['sum', 'average', 'max', 'min'].includes(def.aggregation as string) ? def.aggregation : 'sum',
          order: typeof def.order === 'number' ? def.order : 0,
          rowId: def.rowId || 'default',
          name: def.name || '',
          description: def.description || ''
        })) : []
      }),
      setRows: (rows) => set({ 
        rows: Array.isArray(rows) ? rows.map(row => ({
          id: row.id || nanoid(),
          metrics: Array.isArray(row.metrics) ? row.metrics : [],
          order: typeof row.order === 'number' ? row.order : 0,
          height: typeof row.height === 'number' ? row.height : undefined
        })) : [
          {
            id: 'default',
            metrics: [],
            order: 0,
          }
        ]
      }),
    }),
    {
      name: 'metrics-storage',
    }
  )
);