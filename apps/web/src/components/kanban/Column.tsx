import type { Task } from '@savit/shared';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskCard } from './SortableTaskCard';
import type { KanbanColumnDef } from './columns';

interface ColumnProps {
  column: KanbanColumnDef;
  tasks: Task[];
  /** id da task arrastada (pra esconder o original durante o overlay). */
  draggingId: string | null;
}

/**
 * Coluna do kanban. Estilizada com Tailwind responsive:
 * - Mobile (`<md`): seção empilhada, header inline com hairline divider, sem
 *   border ou bg da coluna — visualmente fica igual ao Feed do Inbox.
 * - Desktop (`≥md`): card de coluna com border, fundo discreto e min-height.
 */
export function Column({ column, tasks, draggingId }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${column.key}`,
    data: { type: 'column', column: column.key },
  });

  return (
    <section
      ref={setNodeRef}
      className={`flex flex-col md:rounded-lg md:border md:hairline md:bg-surface/40 transition-all ${
        isOver ? 'md:ring-2 md:ring-accent/40 md:bg-surface' : ''
      }`}
    >
      <header className="flex items-center gap-3 px-1 md:px-3 py-2 md:py-2.5 md:border-b md:hairline">
        <span className="font-mono text-[11px] uppercase tracking-mono text-ink-3 md:text-ink-2">
          {column.label}
        </span>
        <span className="flex-1 border-t hairline md:hidden" aria-hidden />
        <span className="font-mono text-[10px] text-ink-3">{tasks.length}</span>
      </header>

      <SortableContext
        id={`sc:${column.key}`}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`flex flex-col gap-2 py-2 md:p-2 md:min-h-[120px] ${
            isOver ? 'bg-accent-soft/30 md:bg-transparent rounded-md' : ''
          }`}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              hideWhileDragging={draggingId === task.id}
            />
          ))}
          {tasks.length === 0 ? (
            <p className="text-center py-4 md:py-6 text-xs text-ink-3 italic">
              {column.terminal ? 'nada concluído ainda.' : 'arraste pra cá.'}
            </p>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}
