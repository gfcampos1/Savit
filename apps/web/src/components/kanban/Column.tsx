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

export function Column({ column, tasks, draggingId }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${column.key}`,
    data: { type: 'column', column: column.key },
  });

  return (
    <section
      ref={setNodeRef}
      className={`group flex flex-col rounded-lg border hairline bg-surface/40 ${
        isOver ? 'ring-2 ring-accent/40 bg-surface' : ''
      } transition-all`}
    >
      <header className="flex items-center justify-between px-3 py-2.5 border-b hairline">
        <span className="font-mono text-[11px] uppercase tracking-mono text-ink-2">
          {column.label}
        </span>
        <span className="font-mono text-[10px] text-ink-3">{tasks.length}</span>
      </header>

      <SortableContext
        id={`sc:${column.key}`}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 p-2 min-h-[120px]">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              hideWhileDragging={draggingId === task.id}
            />
          ))}
          {tasks.length === 0 ? (
            <p className="text-center py-6 text-xs text-ink-3 italic">
              {column.terminal ? 'nada concluído ainda.' : 'arraste pra cá.'}
            </p>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}
