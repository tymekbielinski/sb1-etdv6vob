import { create } from 'zustand';
import { getTeamDailyLogs, type DailyLogData } from '@/lib/api/daily-logs/queries';
import { useTeamStore } from './team-store';

interface DailyLogsState {
  data: DailyLogData[];
  isLoading: boolean;
  error: string | null;
  lastFetch: {
    startDate: Date | null;
    endDate: Date | null;
  };
  fetchLogs: (startDate: Date, endDate: Date) => Promise<void>;
  reset: () => void;
}

export const useDailyLogsStore = create<DailyLogsState>()((set, get) => ({
  data: [],
  isLoading: false,
  error: null,
  lastFetch: {
    startDate: null,
    endDate: null,
  },
  fetchLogs: async (startDate: Date, endDate: Date) => {
    const { lastFetch } = get();
    
    // Skip if already fetching the same data
    if (
      lastFetch.startDate?.getTime() === startDate.getTime() &&
      lastFetch.endDate?.getTime() === endDate.getTime() &&
      get().data.length > 0 &&
      !get().error
    ) {
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const team = useTeamStore.getState().team;
      if (!team) throw new Error('No team found');

      const data = await getTeamDailyLogs(team.id, startDate, endDate);
      
      set({ 
        data, 
        error: null,
        lastFetch: { startDate, endDate }
      });
    } catch (error) {
      console.error('Error fetching daily logs:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch activity data';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  reset: () => set({
    data: [],
    isLoading: false,
    error: null,
    lastFetch: {
      startDate: null,
      endDate: null,
    }
  })
}));