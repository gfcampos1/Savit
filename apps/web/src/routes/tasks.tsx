import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import { useRecurringTasks } from '@/hooks/useRecurringTasks';
import { Composer } from '@/components/composer/Composer';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Board } from '@/components/kanban/Board';
import { RecurringTasksSheet } from '@/components/kanban/RecurringTasksSheet';

export function TasksPage() {
  const tasks = useTasks({ includeDone: true });
  const cats = useCategories();
  const recurring = useRecurringTasks();
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('cat');

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

  const items = tasks.data?.items ?? [];
  const filtered = useMemo(
    () => (categoryId ? items.filter((t) => t.categoryId === categoryId) : items),
    [items, categoryId],
  );

  const total = filtered.length;
  const done = filtered.filter((t) => t.status === 'DONE').length;
  const pending = total - done;

  return (
    <div className="max-w-2xl md:max-w-7xl mx-auto px-6 pt-8 pb-32">
      <header className="mb-6 flex flex-col md:flex-row md:items-end gap-3 md:gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">Quadro</p>
          <h1 className="display-serif text-display md:text-2xl mt-1">Tarefas</h1>
        </div>
        <div className="flex items-baseline gap-5 text-sm text-ink-2 md:ml-auto">
          <Stat label="pendentes" value={pending} />
          <Stat label="concluídas" value={done} />
          <Stat label="total" value={total} />
        </div>
      </header>

      <div className="mb-6 flex items-center gap-3 flex-wrap">
        {/* Hint longo só no desktop — mobile descobre o gesto pela UI. */}
        <p className="hidden md:block text-xs text-ink-3 flex-1 min-w-0">
          Arraste cartões pra mudar de coluna — em <em>Hoje/Amanhã/Semana</em> o prazo ajusta
          sozinho; <em>Concluídas</em> marca como feito.
        </p>
        <button
          type="button"
          onClick={() => setRecurringOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-pill border hairline px-2.5 py-1 text-xs text-ink-2 hover:text-ink transition-colors"
        >
          ↻ recorrentes
          {(recurring.data?.items.length ?? 0) > 0 ? (
            <span className="font-mono text-[10px] text-ink-3">
              ({recurring.data?.items.length})
            </span>
          ) : null}
        </button>
        <CategoryFilter
          categories={cats.data ?? []}
          value={categoryId}
          onChange={setCategoryId}
          countKind="tasks"
        />
      </div>

      <RecurringTasksSheet
        open={recurringOpen}
        onClose={() => setRecurringOpen(false)}
        categories={cats.data ?? []}
      />

      {tasks.isLoading ? (
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3 py-10 text-center">
          carregando…
        </p>
      ) : (
        <Board tasks={filtered} />
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-bg via-bg to-transparent px-6 pt-6 pb-6">
        <div className="max-w-2xl mx-auto">
          <Composer categories={cats.data ?? []} defaultCategoryId={categoryId} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="display-serif text-2xl text-ink">{value}</span>
      <span className="font-mono text-[10px] uppercase tracking-mono text-ink-3">{label}</span>
    </span>
  );
}
