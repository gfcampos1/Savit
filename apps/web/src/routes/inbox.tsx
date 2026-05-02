import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useCategories } from '@/hooks/useCategories';
import { useNotes } from '@/hooks/useNotes';
import { useTasks } from '@/hooks/useTasks';
import { useWeekly } from '@/hooks/useStats';
import { Composer } from '@/components/composer/Composer';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Feed } from '@/components/feed/Feed';
import { WeeklySummaryCard } from '@/components/dashboard/WeeklySummaryCard';

type FilterTab = 'all' | 'tasks' | 'notes';

export function InboxPage() {
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('cat');

  const cats = useCategories();
  // Não passamos categoryId pra hooks: é mais barato filtrar local (pois já
  // temos o feed completo) e mantém a contagem total no header sempre.
  const notes = useNotes();
  const tasks = useTasks({ includeDone: true });

  function setCategoryId(id: string | null) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set('cat', id);
        else next.delete('cat');
        return next;
      },
      { replace: true },
    );
  }

  const filteredNotes = useMemo(() => {
    const all = notes.data?.items ?? [];
    return categoryId ? all.filter((n) => n.categoryId === categoryId) : all;
  }, [notes.data, categoryId]);

  const filteredTasks = useMemo(() => {
    const all = tasks.data?.items ?? [];
    return categoryId ? all.filter((t) => t.categoryId === categoryId) : all;
  }, [tasks.data, categoryId]);

  const activeCat = categoryId
    ? cats.data?.find((c) => c.id === categoryId) ?? null
    : null;
  const weekly = useWeekly();
  const [weeklyDismissed, setWeeklyDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('savit_weekly_dismissed') === isoMonday();
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (weeklyDismissed) {
      try {
        localStorage.setItem('savit_weekly_dismissed', isoMonday());
      } catch {
        /* ignore */
      }
    }
  }, [weeklyDismissed]);
  const isMonday = new Date().getDay() === 1;
  const showWeekly = isMonday && weekly.data && !weeklyDismissed;

  const noteCount = filteredNotes.length;
  const taskCount = filteredTasks.length;

  const isLoading = cats.isLoading || notes.isLoading || tasks.isLoading;

  return (
    <div className="max-w-2xl mx-auto px-6 pt-8 pb-32">
      <header className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">Olá ✦</p>
        <h1 className="display-serif text-display mt-1">{firstName(user?.name) ?? 'você'}.</h1>
        <p className="text-sm text-ink-2 mt-2">
          {noteCount + taskCount === 0
            ? 'Capture sua primeira ideia abaixo.'
            : `${noteCount} ${plural(noteCount, 'nota', 'notas')} · ${taskCount} ${plural(
                taskCount,
                'tarefa',
                'tarefas',
              )} no total.`}
        </p>
      </header>

      <nav className="sticky top-[57px] z-10 -mx-6 px-6 py-3 bg-bg/85 backdrop-blur border-b hairline mb-6 flex flex-col gap-3">
        <div className="inline-flex gap-1 rounded-pill bg-surface-2 p-1 self-start">
          <Tab active={filter === 'all'} onClick={() => setFilter('all')} count={noteCount + taskCount}>
            Tudo
          </Tab>
          <Tab active={filter === 'tasks'} onClick={() => setFilter('tasks')} count={taskCount}>
            Tarefas
          </Tab>
          <Tab active={filter === 'notes'} onClick={() => setFilter('notes')} count={noteCount}>
            Notas
          </Tab>
        </div>
        <CategoryFilter
          categories={cats.data ?? []}
          value={categoryId}
          onChange={setCategoryId}
          countKind="notes"
        />
      </nav>

      {activeCat ? (
        <div className="mb-4 inline-flex items-center gap-2 text-xs text-ink-2">
          <span>filtrando por</span>
          <span
            className="inline-flex items-center gap-1.5 rounded-pill bg-surface px-2 py-1 border hairline"
          >
            <span className="h-2 w-2 rounded-sm" style={{ background: activeCat.color }} aria-hidden />
            <span className="text-ink">{activeCat.name}</span>
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              aria-label="limpar filtro"
              className="ml-0.5 text-ink-3 hover:text-ink"
            >
              ×
            </button>
          </span>
        </div>
      ) : null}

      {showWeekly ? (
        <div className="mb-6">
          <WeeklySummaryCard
            data={weekly.data ?? null}
            dismissable
            onDismiss={() => setWeeklyDismissed(true)}
          />
        </div>
      ) : null}

      {isLoading ? (
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3 py-10 text-center">
          carregando…
        </p>
      ) : (
        <Feed notes={filteredNotes} tasks={filteredTasks} filter={filter} />
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-bg via-bg to-transparent px-6 pt-6 pb-6">
        <div className="max-w-2xl mx-auto">
          <Composer
            categories={cats.data ?? []}
            defaultCategoryId={categoryId}
          />
        </div>
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink'
      }`}
    >
      <span>{children}</span>
      {count !== undefined ? (
        <span className="font-mono text-[10px] text-ink-3">{count}</span>
      ) : null}
    </button>
  );
}

function firstName(name: string | null | undefined): string | null {
  if (!name) return null;
  return name.trim().split(/\s+/)[0] ?? name;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** ISO da segunda da semana atual — chave de "dispensei o card desta semana". */
function isoMonday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const diff = (dow + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}
