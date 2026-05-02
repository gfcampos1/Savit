import { useMemo } from 'react';
import type { Note, Task } from '@savit/shared';
import { dayHeading, dayKey } from '@/lib/format-date';
import { NoteCard } from './NoteCard';
import { TaskCard } from './TaskCard';

interface FeedItem {
  type: 'note' | 'task';
  id: string;
  date: string;
  data: Note | Task;
}

interface FeedProps {
  notes: Note[];
  tasks: Task[];
  /** 'all' = ambos · 'tasks' = só tasks · 'notes' = só notas */
  filter: 'all' | 'tasks' | 'notes';
}

export function Feed({ notes, tasks, filter }: FeedProps) {
  const grouped = useMemo(() => {
    const items: FeedItem[] = [];
    if (filter !== 'tasks') {
      for (const n of notes) items.push({ type: 'note', id: n.id, date: n.createdAt, data: n });
    }
    if (filter !== 'notes') {
      for (const t of tasks) items.push({ type: 'task', id: t.id, date: t.createdAt, data: t });
    }
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const out: Array<{ key: string; heading: string; items: FeedItem[] }> = [];
    for (const item of items) {
      const key = dayKey(item.date);
      const last = out[out.length - 1];
      if (last && last.key === key) {
        last.items.push(item);
      } else {
        out.push({ key, heading: dayHeading(item.date), items: [item] });
      }
    }
    return out;
  }, [notes, tasks, filter]);

  if (grouped.length === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <div className="flex flex-col gap-7">
      {grouped.map((day) => (
        <section key={day.key}>
          <header className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[11px] uppercase tracking-mono text-ink-3">
              {day.heading}
            </span>
            <span className="flex-1 border-t hairline" aria-hidden />
            <span className="font-mono text-[11px] text-ink-3">{day.items.length}</span>
          </header>

          <div className="flex flex-col gap-3">
            {day.items.map((item) =>
              item.type === 'note' ? (
                <NoteCard key={`n-${item.id}`} note={item.data as Note} />
              ) : (
                <TaskCard key={`t-${item.id}`} task={item.data as Task} />
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function EmptyState({ filter }: { filter: 'all' | 'tasks' | 'notes' }) {
  const copy =
    filter === 'tasks'
      ? 'Nenhuma tarefa por aqui.'
      : filter === 'notes'
      ? 'Nenhuma nota por aqui.'
      : 'Sua primeira ideia mora aqui.';
  return (
    <div className="text-center py-16 px-6">
      <p className="display-serif text-2xl text-ink mb-2">{copy}</p>
      <p className="text-sm text-ink-2">Use o composer abaixo — funciona com linguagem natural.</p>
    </div>
  );
}
