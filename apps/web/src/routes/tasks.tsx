import { useTasks } from '@/hooks/useTasks';
import { useCategories } from '@/hooks/useCategories';
import { Composer } from '@/components/composer/Composer';
import { Board } from '@/components/kanban/Board';

export function TasksPage() {
  const tasks = useTasks({ includeDone: true });
  const cats = useCategories();

  const items = tasks.data?.items ?? [];
  const total = items.length;
  const done = items.filter((t) => t.status === 'DONE').length;
  const pending = total - done;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-32">
      <header className="mb-6 flex items-end gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">Quadro</p>
          <h1 className="display-serif text-2xl mt-1">Tarefas</h1>
        </div>
        <div className="flex items-baseline gap-4 text-sm text-ink-2 ml-auto">
          <Stat label="pendentes" value={pending} />
          <Stat label="concluídas" value={done} />
          <Stat label="total" value={total} />
        </div>
      </header>

      <p className="text-xs text-ink-3 mb-6">
        Arraste cartões entre colunas — mover pra <em>Hoje/Amanhã/Semana</em> ajusta o prazo
        automaticamente. <em>Concluídas</em> marca como feito.
      </p>

      {tasks.isLoading ? (
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3 py-10 text-center">
          carregando…
        </p>
      ) : (
        <Board tasks={items} />
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-bg via-bg to-transparent px-6 pt-6 pb-6">
        <div className="max-w-2xl mx-auto">
          <Composer categories={cats.data ?? []} />
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
