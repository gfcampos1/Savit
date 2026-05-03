// Painel admin: métricas + lista de usuários com busca e ações inline.
// Acessível só pra users com role=ADMIN (RequireAdmin guard no router).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { BillingStatus } from '@savit/shared';
import {
  useAdminMetrics,
  useAdminUsers,
  useUpdateAdminUser,
  type AdminUserRow,
} from '@/hooks/useAdmin';
import { dayHeading } from '@/lib/format-date';
import { toast } from '@/stores/ui';

const STATUS_LABELS: Record<BillingStatus, string> = {
  TRIALING: 'trial',
  ACTIVE: 'ativo',
  PAST_DUE: 'atrasado',
  CANCELED: 'cancelado',
  BLOCKED: 'bloqueado',
};

const STATUS_COLORS: Record<BillingStatus, string> = {
  TRIALING: 'bg-warning/15 text-warning border-warning/30',
  ACTIVE: 'bg-success/15 text-success border-success/30',
  PAST_DUE: 'bg-danger/10 text-danger border-danger/30',
  CANCELED: 'bg-surface-2 text-ink-3 border-hair',
  BLOCKED: 'bg-danger/15 text-danger border-danger/40',
};

export function AdminPage() {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillingStatus | undefined>(undefined);
  const metrics = useAdminMetrics();
  const users = useAdminUsers({ q: q || undefined, status: statusFilter });
  const update = useUpdateAdminUser();

  async function setStatus(u: AdminUserRow, status: BillingStatus) {
    if (!confirm(`Mudar status de ${u.email} para ${STATUS_LABELS[status]}?`)) return;
    try {
      await update.mutateAsync({ id: u.id, status });
      toast({ message: `Status atualizado: ${u.email} → ${STATUS_LABELS[status]}`, tone: 'success' });
    } catch {
      toast({ message: 'Falhou.', tone: 'danger' });
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-32">
      <header className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">Admin</p>
        <h1 className="display-serif text-2xl mt-1">Painel</h1>
      </header>

      {metrics.data ? (
        <section className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          <KpiTile label="usuários" value={metrics.data.totalUsers} />
          <KpiTile label="ativos" value={metrics.data.active} tone="success" />
          <KpiTile label="trial" value={metrics.data.trialing} tone="warning" />
          <KpiTile label="atrasados" value={metrics.data.pastDue} tone="danger" />
          <KpiTile label="cancelados" value={metrics.data.canceled} />
          <KpiTile
            label="MRR"
            value={brl(metrics.data.mrrCents)}
            tone="success"
          />
        </section>
      ) : null}

      <section>
        <header className="flex items-center gap-3 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="buscar email ou nome…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 min-w-[200px] bg-transparent border-b hairline text-ink text-md py-2 outline-none focus:border-accent"
          />
          <select
            value={statusFilter ?? ''}
            onChange={(e) =>
              setStatusFilter(e.target.value ? (e.target.value as BillingStatus) : undefined)
            }
            className="text-xs bg-surface border hairline rounded px-2 py-1.5 text-ink-2 focus:outline-none focus:border-accent"
          >
            <option value="">todos status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </header>

        {users.isLoading ? (
          <p className="text-center font-mono text-[11px] uppercase tracking-mono text-ink-3 py-10">
            carregando…
          </p>
        ) : users.data?.items.length === 0 ? (
          <p className="text-center text-sm text-ink-3 py-10">nenhum usuário encontrado.</p>
        ) : (
          <div className="rounded-md border hairline bg-surface overflow-x-auto shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b hairline">
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Plano</Th>
                  <Th>Trial até</Th>
                  <Th>Notas</Th>
                  <Th>Tarefas</Th>
                  <Th>Auth</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {users.data?.items.map((u) => (
                  <tr key={u.id} className="border-b hairline last:border-b-0 hover:bg-surface-2/30">
                    <Td>
                      <div className="font-medium text-ink truncate max-w-[200px]" title={u.email}>
                        {u.email}
                      </div>
                      {u.name ? <div className="text-xs text-ink-3">{u.name}</div> : null}
                      {u.role === 'ADMIN' ? (
                        <span className="font-mono text-[10px] uppercase tracking-mono text-accent">
                          admin
                        </span>
                      ) : null}
                    </Td>
                    <Td>
                      <span
                        className={`inline-block rounded-pill border px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono ${STATUS_COLORS[u.status]}`}
                      >
                        {STATUS_LABELS[u.status]}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-[11px] text-ink-2">
                        {u.plan === 'PRO_MONTHLY'
                          ? 'mensal'
                          : u.plan === 'PRO_YEARLY'
                          ? 'anual'
                          : '—'}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-[11px] text-ink-3">
                        {u.trialEndsAt ? dayHeading(u.trialEndsAt) : '—'}
                      </span>
                    </Td>
                    <Td>{u.noteCount}</Td>
                    <Td>{u.taskCount}</Td>
                    <Td>
                      <span className="font-mono text-[10px] text-ink-3">
                        {[u.hasPassword && 'senha', u.hasGoogle && 'google'].filter(Boolean).join(' · ') ||
                          '—'}
                      </span>
                    </Td>
                    <Td>
                      {u.status === 'BLOCKED' || u.status === 'PAST_DUE' ? (
                        <button
                          type="button"
                          onClick={() => void setStatus(u, 'ACTIVE')}
                          className="text-xs text-success hover:underline underline-offset-2"
                        >
                          desbloquear
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void setStatus(u, 'BLOCKED')}
                          className="text-xs text-danger hover:underline underline-offset-2"
                        >
                          bloquear
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-ink-3 mt-4">
          {users.data?.items.length ?? 0} usuário(s) listados.{' '}
          <Link to="/" className="text-accent underline underline-offset-2">
            voltar
          </Link>
        </p>
      </section>
    </div>
  );
}

function KpiTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: 'success' | 'warning' | 'danger';
}) {
  const cls =
    tone === 'success'
      ? 'text-success'
      : tone === 'warning'
      ? 'text-warning'
      : tone === 'danger'
      ? 'text-danger'
      : 'text-ink';
  return (
    <div className="rounded-md border hairline bg-surface p-3">
      <p className={`display-serif text-2xl ${cls} leading-none`}>{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3 mt-1.5">{label}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-mono text-[10px] uppercase tracking-mono text-ink-3 px-3 py-2.5">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2.5 align-top">{children}</td>;
}

function brl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}
