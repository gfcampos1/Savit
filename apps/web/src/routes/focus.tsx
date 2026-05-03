// Modo foco do dia — SPEC §3.9. Tela cheia mostra uma tarefa por vez,
// com 4 ações (concluir / adiar 1h / próxima / arquivar). Setas <-/-> navegam.
// Persiste o índice em sessionStorage pra preservar ao voltar de outras telas.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Task } from '@savit/shared';
import { useTasks, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { dueLabel } from '@/lib/format-date';
import { confirm } from '@/stores/confirm';

const STORAGE_KEY = 'savit_focus_idx';

export function FocusPage() {
  const navigate = useNavigate();
  const tasks = useTasks();
  const update = useUpdateTask();
  const del = useDeleteTask();

  const todayTasks = useMemo(() => {
    const all = tasks.data?.items ?? [];
    return all
      .filter((t) => t.status !== 'DONE' && t.status !== 'ARCHIVED')
      .filter((t) => {
        if (t.column === 'hoje') return true;
        if (!t.dueAt) return false;
        const d = new Date(t.dueAt);
        const today = new Date();
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      })
      .sort((a, b) => {
        const ad = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
        const bd = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
        return ad - bd;
      });
  }, [tasks.data]);

  const [idx, setIdx] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? Number(raw) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (idx >= todayTasks.length) setIdx(0);
  }, [idx, todayTasks.length]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(idx));
    } catch {
      /* indisponível */
    }
  }, [idx]);

  // Atalhos de teclado dentro da tela
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      }
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') navigate('/');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayTasks.length, navigate]);

  function next() {
    if (todayTasks.length === 0) return;
    setIdx((i) => Math.min(i + 1, todayTasks.length - 1));
  }
  function prev() {
    setIdx((i) => Math.max(0, i - 1));
  }

  const current: Task | undefined = todayTasks[idx];

  if (tasks.isLoading) {
    return (
      <Wrapper>
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">carregando…</p>
      </Wrapper>
    );
  }

  if (todayTasks.length === 0) {
    return (
      <Wrapper>
        <Header total={0} idx={0} />
        <div className="flex-1 grid place-items-center text-center px-6">
          <div>
            <p className="display-serif text-display text-ink leading-tight">
              Nada pendente.
            </p>
            <p className="text-md text-ink-2 mt-3">Aproveita.</p>
            <Link
              to="/"
              className="inline-block mt-8 text-sm text-accent underline underline-offset-2"
            >
              ← voltar pro inbox
            </Link>
          </div>
        </div>
      </Wrapper>
    );
  }

  if (!current) return null;

  async function complete() {
    if (!current) return;
    await update.mutateAsync({ id: current.id, status: 'DONE' });
    if (idx >= todayTasks.length - 1) setIdx(Math.max(0, idx - 1));
  }
  async function snoozeOneHour() {
    if (!current) return;
    const newDue = current.dueAt
      ? new Date(new Date(current.dueAt).getTime() + 60 * 60 * 1000)
      : new Date(Date.now() + 60 * 60 * 1000);
    await update.mutateAsync({ id: current.id, dueAt: newDue.toISOString() });
    next();
  }
  async function archive() {
    if (!current) return;
    const ok = await confirm({
      title: 'Arquivar esta tarefa?',
      confirmLabel: 'Arquivar',
    });
    if (!ok) return;
    await del.mutateAsync(current.id);
    if (idx >= todayTasks.length - 1) setIdx(Math.max(0, idx - 1));
  }

  return (
    <Wrapper>
      <Header total={todayTasks.length} idx={idx + 1} />

      <div className="flex-1 grid place-items-center px-6">
        <div className="w-full max-w-xl">
          <p className="display-serif text-display text-ink leading-tight">
            {current.title}
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-ink-2">
            {current.category ? (
              <>
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ background: current.category.color }}
                  aria-hidden
                />
                <span>{current.category.name}</span>
                <span aria-hidden>·</span>
              </>
            ) : null}
            <span>{current.dueAt ? dueLabel(current.dueAt) : 'sem prazo'}</span>
            {current.priority === 'high' ? (
              <>
                <span aria-hidden>·</span>
                <span className="text-accent uppercase font-mono text-[10px] tracking-mono">
                  urgente
                </span>
              </>
            ) : null}
          </div>
          {current.description ? (
            <p className="text-md text-ink-2 mt-6 max-w-prose whitespace-pre-wrap">
              {current.description}
            </p>
          ) : null}
        </div>
      </div>

      <footer className="border-t hairline bg-surface/50">
        <div className="max-w-xl mx-auto px-6 py-4 grid grid-cols-4 gap-2">
          <ActionBtn label="✓ concluir" tone="success" onClick={() => void complete()} />
          <ActionBtn label="⟳ +1h" tone="default" onClick={() => void snoozeOneHour()} />
          <ActionBtn label="→ próxima" tone="default" onClick={next} disabled={idx === todayTasks.length - 1} />
          <ActionBtn label="🗑 arquivar" tone="danger" onClick={() => void archive()} />
        </div>
      </footer>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <section className="fixed inset-0 z-30 bg-bg flex flex-col" style={{ paddingTop: 0 }}>{children}</section>;
}

function Header({ idx, total }: { idx: number; total: number }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b hairline">
      <Link
        to="/"
        aria-label="sair do modo foco"
        className="text-ink-3 hover:text-ink text-lg leading-none"
      >
        ×
      </Link>
      <span className="font-mono text-[11px] uppercase tracking-mono text-ink-3">
        FOCO DO DIA
      </span>
      <span className="font-mono text-[11px] text-ink-3">
        {total === 0 ? '0' : `${idx} / ${total}`}
      </span>
    </header>
  );
}

function ActionBtn({
  label,
  onClick,
  tone,
  disabled,
}: {
  label: string;
  onClick: () => void;
  tone: 'default' | 'success' | 'danger';
  disabled?: boolean;
}) {
  const cls =
    tone === 'success'
      ? 'bg-success/15 text-success border-success/30'
      : tone === 'danger'
      ? 'bg-danger/10 text-danger border-danger/30'
      : 'bg-surface text-ink-2 hairline';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2 py-3 text-xs font-medium transition-colors disabled:opacity-40 ${cls}`}
    >
      {label}
    </button>
  );
}
