import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Category, CategoryColor } from '@savit/shared';
import { api } from '@/lib/api';

const KEY = ['categories'] as const;

export function useCategories(opts?: { includeHidden?: boolean }) {
  const includeHidden = opts?.includeHidden ?? false;
  return useQuery({
    queryKey: [...KEY, { includeHidden }],
    queryFn: async () => {
      const path = includeHidden ? '/api/categories?includeHidden=true' : '/api/categories';
      const res = await api<{ items: Category[] }>(path);
      return res.items;
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color: CategoryColor; icon?: string }) =>
      api<Category>('/api/categories', { method: 'POST', body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: {
      id: string;
      name?: string;
      color?: CategoryColor;
      icon?: string;
      /** ISO ou null pra reexibir. */
      hiddenAt?: string | null;
    }) => api<Category>(`/api/categories/${id}`, { method: 'PATCH', body: patch }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
