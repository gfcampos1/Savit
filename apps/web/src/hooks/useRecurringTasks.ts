import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RecurringTask } from '@savit/shared';
import { api } from '@/lib/api';

const KEY = ['recurring-tasks'] as const;

export interface RecurringTasksResponse {
  items: RecurringTask[];
}

export function useRecurringTasks() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api<RecurringTasksResponse>('/api/recurring-tasks'),
  });
}

export interface CreateRecurringTaskInput {
  title: string;
  description?: string;
  categoryId?: string | null;
  priority?: 'low' | 'med' | 'high';
  weekday: number;
}

export function useCreateRecurringTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecurringTaskInput) =>
      api<RecurringTask>('/api/recurring-tasks', { method: 'POST', body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export interface PatchRecurringTaskInput {
  title?: string;
  description?: string;
  categoryId?: string | null;
  priority?: 'low' | 'med' | 'high';
  weekday?: number;
  isActive?: boolean;
}

export function usePatchRecurringTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & PatchRecurringTaskInput) =>
      api<RecurringTask>(`/api/recurring-tasks/${id}`, { method: 'PATCH', body: patch }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteRecurringTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/recurring-tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      // tasks podem ter recurringTaskId apontando pra essa — invalida pra refletir
      void qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Atalho: dado o id de uma Task existente, cria uma RecurringTask copiando
 * título/descrição/categoria/priority. O backend default usa o dia da semana
 * de hoje.
 */
export function useMakeTaskRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, weekday }: { taskId: string; weekday?: number }) =>
      api<RecurringTask>(`/api/tasks/${taskId}/make-recurring`, {
        method: 'POST',
        body: weekday !== undefined ? { weekday } : {},
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
