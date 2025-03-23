import { create } from 'zustand';
import { getDashboards, getDashboard, createDashboard, updateDashboard, deleteDashboard } from '@/lib/api/dashboards/queries';
import type { Dashboard, CreateDashboardParams, UpdateDashboardParams } from '@/lib/api/dashboards/types';

interface DashboardsState {
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  homeDashboard: Dashboard | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboards: () => Promise<void>;
  fetchDashboard: (id: string) => Promise<void>;
  fetchHomeDashboard: () => Promise<Dashboard | null>;
  createDashboard: (params: CreateDashboardParams) => Promise<Dashboard>;
  updateDashboard: (params: UpdateDashboardParams) => Promise<Dashboard>;
  setAsHomeDashboard: (id: string) => Promise<Dashboard>;
  deleteDashboard: (id: string) => Promise<void>;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;
  reset: () => void;
}

export const useDashboardsStore = create<DashboardsState>((set, get) => ({
  dashboards: [],
  currentDashboard: null,
  homeDashboard: null,
  isLoading: false,
  error: null,
  
  fetchDashboards: async () => {
    set({ isLoading: true, error: null });
    try {
      const dashboards = await getDashboards();
      const homeDashboard = dashboards.find(d => d.is_home) || null;
      set({ dashboards, homeDashboard, isLoading: false });
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
  
  fetchHomeDashboard: async () => {
    const { dashboards } = get();
    
    // If dashboards are already loaded, find the home dashboard
    if (dashboards.length > 0) {
      const homeDashboard = dashboards.find(d => d.is_home) || null;
      set({ homeDashboard });
      return homeDashboard;
    }
    
    // Otherwise, fetch all dashboards and find the home dashboard
    set({ isLoading: true, error: null });
    try {
      const dashboards = await getDashboards();
      const homeDashboard = dashboards.find(d => d.is_home) || null;
      set({ dashboards, homeDashboard, isLoading: false });
      return homeDashboard;
    } catch (error) {
      console.error('Error fetching home dashboard:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch home dashboard', 
        isLoading: false 
      });
      return null;
    }
  },
  
  setAsHomeDashboard: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await updateDashboard({ id, is_home: true });
      
      // Update the dashboards array and set the new home dashboard
      set(state => ({
        dashboards: state.dashboards.map(d => {
          if (d.id === dashboard.id) {
            return { ...d, is_home: true };
          } else if (d.is_home) {
            // If this was previously the home dashboard, update it
            return { ...d, is_home: false };
          }
          return d;
        }),
        homeDashboard: dashboard,
        isLoading: false
      }));
      
      return dashboard;
    } catch (error) {
      console.error('Error setting home dashboard:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to set home dashboard', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  reset: () => {
    set({ 
      dashboards: [],
      currentDashboard: null,
      homeDashboard: null,
      isLoading: false,
      error: null
    });
  }
}));
