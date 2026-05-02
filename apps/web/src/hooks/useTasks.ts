import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Task, TaskStatus } from '@savit/shared';
import { api } from '@/lib/api';

const KEY = ['tasks'] as const;

export interface TasksResponse {
  items: Task[];
}

export function useTasks(opts?: { status?: TaskStatus; column?: string; includeDone?: boolean }) {
  const params = new URLSearchParams();
  if (opts?.status) params.set('status', opts.status);
  if (opts?.column) params.set('column', opts.column);
  if (opts?.includeDone) params.set('includeDone', 'true');
  const qs = params.toString();
  const path = `/api/tasks${qs ? `?${qs}` : ''}`;
  return useQuery({
    queryKey: [...KEY, opts ?? {}],
    queryFn: () => api<TasksResponse>(path),
  });
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  column?: string;
  dueAt?: string | null;
  priority?: 'low' | 'med' | 'high';
  categoryId?: string | null;
  noteId?: string | null;
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => api<Task>('/api/tasks', { method: 'POST', body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<CreateTaskInput>) =>
      api<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: patch }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useToggleTaskDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      api<Task>(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: { status: done ? 'DONE' : 'TODAY' },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
