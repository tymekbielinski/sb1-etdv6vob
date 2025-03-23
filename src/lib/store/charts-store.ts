import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export interface ChartConfig {
  id: string;
  title: string;
  displayMode: ('total' | 'breakdown' | 'members')[];
  order: number;
}

interface ChartsState {
  charts: ChartConfig[];
  addChart: () => void;
  updateChart: (id: string, updates: Partial<ChartConfig>) => void;
  reorderCharts: (fromIndex: number, toIndex: number) => void;
  removeChart: (id: string) => void;
  setCharts: (charts: ChartConfig[]) => void;
}

export const useChartsStore = create<ChartsState>()(
  persist(
    (set) => ({
      charts: [
        {
          id: 'default',
          title: 'Activity Overview',
          displayMode: ['total'],
          order: 0,
        },
      ],
      addChart: () => set((state) => {
        const newChart: ChartConfig = {
          id: nanoid(),
          title: 'Activity Overview',
          displayMode: ['total'],
          order: state.charts.length,
        };
        return { charts: [...state.charts, newChart] };
      }),
      updateChart: (id, updates) => set((state) => ({
        charts: state.charts.map((chart) =>
          chart.id === id ? { ...chart, ...updates } : chart
        ),
      })),
      reorderCharts: (fromIndex, toIndex) => set((state) => {
        const newCharts = [...state.charts];
        const [movedChart] = newCharts.splice(fromIndex, 1);
        newCharts.splice(toIndex, 0, movedChart);
        
        // Update order values
        return {
          charts: newCharts.map((chart, index) => ({
            ...chart,
            order: index,
          })),
        };
      }),
      removeChart: (id) => set((state) => {
        // Don't remove the last chart
        if (state.charts.length <= 1) return state;
        
        return {
          charts: state.charts.filter((chart) => chart.id !== id),
        };
      }),
      setCharts: (charts) => set({ 
        charts: Array.isArray(charts) ? charts.map(chart => ({
          id: chart.id || nanoid(),
          title: chart.title || 'Activity Overview',
          displayMode: Array.isArray(chart.displayMode) ? chart.displayMode : ['total'],
          order: typeof chart.order === 'number' ? chart.order : 0
        })) : []
      }),
    }),
    {
      name: 'charts-storage',
    }
  )
);