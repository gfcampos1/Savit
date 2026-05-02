import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useCategories } from '@/hooks/useCategories';
import { useNotes } from '@/hooks/useNotes';
import { useTasks } from '@/hooks/useTasks';
import { Composer } from '@/components/composer/Composer';
import { Feed } from '@/components/feed/Feed';

type FilterTab = 'all' | 'tasks' | 'notes';

export function InboxPage() {
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<FilterTab>('all');

  const cats = useCategories();
  const notes = useNotes();
  const tasks = useTasks({ includeDone: true });

  const noteCount = notes.data?.items.length ?? 0;
  const taskCount = tasks.data?.items.length ?? 0;

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

      <nav className="sticky top-[57px] z-10 -mx-6 px-6 py-3 bg-bg/85 backdrop-blur border-b hairline mb-6">
        <div className="inline-flex gap-1 rounded-pill bg-surface-2 p-1">
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
      </nav>

      {isLoading ? (
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3 py-10 text-center">
          carregando…
        </p>
      ) : (
        <Feed
          notes={notes.data?.items ?? []}
          tasks={tasks.data?.items ?? []}
          filter={filter}
        />
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-bg via-bg to-transparent px-6 pt-6 pb-6">
        <div className="max-w-2xl mx-auto">
          <Composer categories={cats.data ?? []} />
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
