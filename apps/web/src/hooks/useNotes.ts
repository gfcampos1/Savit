import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Note } from '@savit/shared';
import { api } from '@/lib/api';

const KEY = ['notes'] as const;

export interface NotesResponse {
  items: Note[];
  nextCursor: string | null;
}

export function useNotes(opts?: { categoryId?: string; q?: string }) {
  const params = new URLSearchParams();
  if (opts?.categoryId) params.set('categoryId', opts.categoryId);
  if (opts?.q) params.set('q', opts.q);
  const qs = params.toString();
  const path = `/api/notes${qs ? `?${qs}` : ''}`;
  return useQuery({
    queryKey: [...KEY, opts ?? {}],
    queryFn: () => api<NotesResponse>(path),
  });
}

export interface CreateNoteInput {
  type?: 'TEXT' | 'VOICE' | 'DRAWING' | 'MINDMAP' | 'PHOTO' | 'MIXED';
  title?: string;
  contentText?: string;
  contentJson?: unknown;
  rawInput?: string;
  categoryId?: string | null;
  priority?: 'low' | 'med' | 'high';
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNoteInput) => api<Note>('/api/notes', { method: 'POST', body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/notes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
