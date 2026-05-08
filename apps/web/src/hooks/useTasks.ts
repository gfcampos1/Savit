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
  description?: string | null;
  status?: TaskStatus;
  column?: string;
  dueAt?: string | null;
  priority?: 'low' | 'med' | 'high' | null;
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

export interface MoveTaskInput {
  id: string;
  column: string;
  sortOrder: number;
  /** opcional — se ausente o backend calcula manhã do dia da coluna */
  dueAt?: string | null;
}

export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: MoveTaskInput) =>
      api<Task>(`/api/tasks/${id}/move`, { method: 'PATCH', body }),
    // Optimistic: atualiza cache antes do round-trip
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: KEY });
      type Snap = readonly [readonly unknown[], TasksResponse | undefined];
      const snapshots: Snap[] = [];
      qc.getQueriesData<TasksResponse>({ queryKey: KEY }).forEach(([key, data]) => {
        if (!data) return;
        snapshots.push([key, data] as Snap);
        const next: TasksResponse = {
          items: data.items.map((t) =>
            t.id === vars.id
              ? { ...t, column: vars.column, sortOrder: vars.sortOrder }
              : t,
          ),
        };
        qc.setQueryData(key, next);
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useConvertNoteToTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      noteId,
      ...body
    }: {
      noteId: string;
      column?: string;
      dueAt?: string | null;
      title?: string;
    }) => api<Task>(`/api/notes/${noteId}/convert-to-task`, { method: 'POST', body }),
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
