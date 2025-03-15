import { create } from 'zustand';
import { getDashboards, getDashboard, createDashboard, updateDashboard, deleteDashboard } from '@/lib/api/dashboards/queries';
import type { Dashboard, CreateDashboardParams, UpdateDashboardParams } from '@/lib/api/dashboards/types';

interface DashboardsState {
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboards: () => Promise<void>;
  fetchDashboard: (id: string) => Promise<void>;
  createDashboard: (params: CreateDashboardParams) => Promise<Dashboard>;
  updateDashboard: (params: UpdateDashboardParams) => Promise<Dashboard>;
  deleteDashboard: (id: string) => Promise<void>;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  reset: () => void;
}

export const useDashboardsStore = create<DashboardsState>((set, get) => ({
  dashboards: [],
  currentDashboard: null,
  isLoading: false,
  error: null,
  
  fetchDashboards: async () => {
    set({ isLoading: true, error: null });
    try {
      const dashboards = await getDashboards();
      set({ dashboards, isLoading: false });
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch dashboards', 
        isLoading: false 
      });
    }
  },
  
  fetchDashboard: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await getDashboard(id);
      set({ currentDashboard: dashboard, isLoading: false });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard', 
        isLoading: false 
      });
    }
  },
  
  createDashboard: async (params: CreateDashboardParams) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await createDashboard(params);
      set(state => ({ 
        dashboards: [...state.dashboards, dashboard],
        currentDashboard: dashboard,
        isLoading: false 
      }));
      return dashboard;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create dashboard', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateDashboard: async (params: UpdateDashboardParams) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await updateDashboard(params);
      set(state => ({ 
        dashboards: state.dashboards.map(d => d.id === dashboard.id ? dashboard : d),
        currentDashboard: state.currentDashboard?.id === dashboard.id ? dashboard : state.currentDashboard,
        isLoading: false 
      }));
      return dashboard;
    } catch (error) {
      console.error('Error updating dashboard:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update dashboard', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteDashboard: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDashboard(id);
      set(state => ({ 
        dashboards: state.dashboards.filter(d => d.id !== id),
        currentDashboard: state.currentDashboard?.id === id ? null : state.currentDashboard,
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete dashboard', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  setCurrentDashboard: (dashboard: Dashboard | null) => {
    set({ currentDashboard: dashboard });
  },
  
  reset: () => {
    set({ 
      dashboards: [],
      currentDashboard: null,
      isLoading: false,
      error: null
    });
  }
}));
