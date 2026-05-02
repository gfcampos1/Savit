import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface StatsResponse {
  totals: {
    notes: number;
    tasks: number;
    tasksCompleted: number;
    pending: number;
  };
  streak: {
    currentDays: number;
    recordDays: number;
    lastActive: string | null;
  };
  daily: { date: string; count: number }[];
  byCategory: { id: string; name: string; color: string; count: number; pct: number }[];
  byHourDay: { dow: number; hour: number; count: number }[];
  weekSummary: {
    capturedThisWeek: number;
    becameTask: number;
    topCategories: { name: string; count: number }[];
    deltaVsLastWeek: number;
  };
}

export interface WeeklySummaryResponse {
  id: string;
  weekStart: string;
  text: string;
  payload: {
    weekStart: string;
    capturedThisWeek: number;
    becameTask: number;
    topCategories: { name: string; count: number }[];
    deltaVsLastWeek: number;
    whenPattern: 'manhã' | 'tarde' | 'noite' | 'distribuído';
  };
  createdAt: string;
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api<StatsResponse>('/api/stats'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeekly() {
  return useQuery({
    queryKey: ['weekly'],
    queryFn: () => api<WeeklySummaryResponse | null>('/api/weekly'),
    staleTime: 30 * 60 * 1000,
  });
}
