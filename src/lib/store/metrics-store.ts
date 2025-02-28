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
          ...definition,
          id: nanoid(),
          order: row.metrics.length,
          rowId,
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
        definitions: state.definitions.map((def) =>
          def.id === id ? { ...def, ...updates } : def
        ),
      })),
      removeMetric: (id) => set((state) => {
        const definition = state.definitions.find(d => d.id === id);
        if (!definition) return state;

        return {
          definitions: state.definitions.filter(d => d.id !== id),
          rows: state.rows.map(row => 
            row.id === definition.rowId
              ? { ...row, metrics: row.metrics.filter(m => m !== id) }
              : row
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
        rows: state.rows.map((row) =>
          row.id === id ? { ...row, ...updates } : row
        ),
      })),
      removeRow: (id) => set((state) => {
        // Don't allow removing the default row
        if (id === 'default') return state;

        // Remove all metrics in the row
        const metricsToRemove = state.rows.find(r => r.id === id)?.metrics || [];

        return {
          definitions: state.definitions.filter(d => !metricsToRemove.includes(d.id)),
          rows: state.rows
            .filter(r => r.id !== id)
            .map((row, index) => ({ ...row, order: index })),
        };
      }),
      reorderRows: (fromIndex, toIndex) => set((state) => {
        const newRows = [...state.rows];
        const [movedRow] = newRows.splice(fromIndex, 1);
        newRows.splice(toIndex, 0, movedRow);

        return {
          rows: newRows.map((row, index) => ({ ...row, order: index })),
        };
      }),
      reorderMetrics: (rowId, fromIndex, toIndex) => set((state) => {
        const row = state.rows.find(r => r.id === rowId);
        if (!row) return state;

        const newMetrics = [...row.metrics];
        const [movedMetric] = newMetrics.splice(fromIndex, 1);
        newMetrics.splice(toIndex, 0, movedMetric);

        return {
          rows: state.rows.map(r =>
            r.id === rowId ? { ...r, metrics: newMetrics } : r
          ),
          definitions: state.definitions.map((def, index) => ({
            ...def,
            order: newMetrics.indexOf(def.id),
          })),
        };
      }),
    }),
    {
      name: 'metrics-storage',
    }
  )
);