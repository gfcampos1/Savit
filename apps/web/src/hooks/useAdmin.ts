import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BillingStatus, UserRole, SubscriptionPlan } from '@savit/shared';

export interface AdminMetrics {
  totalUsers: number;
  trialing: number;
  active: number;
  pastDue: number;
  blocked: number;
  canceled: number;
  mrrCents: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: BillingStatus;
  plan: SubscriptionPlan | null;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  hasGoogle: boolean;
  hasPassword: boolean;
  createdAt: string;
  noteCount: number;
  taskCount: number;
}

const KEY = ['admin'] as const;

export function useAdminMetrics() {
  return useQuery({
    queryKey: [...KEY, 'metrics'],
    queryFn: () => api<AdminMetrics>('/api/admin/metrics'),
    staleTime: 60_000,
  });
}

export function useAdminUsers(opts: { q?: string; status?: BillingStatus } = {}) {
  const params = new URLSearchParams();
  if (opts.q) params.set('q', opts.q);
  if (opts.status) params.set('status', opts.status);
  const qs = params.toString();
  return useQuery({
    queryKey: [...KEY, 'users', opts],
    queryFn: () =>
      api<{ items: AdminUserRow[]; nextCursor: string | null }>(
        `/api/admin/users${qs ? `?${qs}` : ''}`,
      ),
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: {
      id: string;
      status?: BillingStatus;
      role?: UserRole;
      trialEndsAt?: string | null;
    }) => api(`/api/admin/users/${id}`, { method: 'PATCH', body: patch }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
