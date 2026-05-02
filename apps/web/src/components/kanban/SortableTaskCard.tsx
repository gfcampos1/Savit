import type { Task } from '@savit/shared';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { dueLabel } from '@/lib/format-date';
import { useToggleTaskDone, useDeleteTask } from '@/hooks/useTasks';

interface SortableTaskCardProps {
  task: Task;
  /** Quando true, renderiza visual de placeholder no lugar original. */
  ghost?: boolean;
  /** True quando está sendo arrastado pelo overlay (esconde o original). */
  hideWhileDragging?: boolean;
}

export function SortableTaskCard({ task, ghost, hideWhileDragging }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', column: task.column, sortOrder: task.sortOrder },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: hideWhileDragging || isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`select-none ${ghost ? 'opacity-50' : ''}`}
    >
      <TaskCardBody task={task} />
    </div>
  );
}

/** Card no overlay durante o drag (segue o cursor). */
export function DraggingTaskCard({ task }: { task: Task }) {
  return (
    <div className="select-none rotate-1">
      <TaskCardBody task={task} elevated />
    </div>
  );
}

interface TaskCardBodyProps {
  task: Task;
  elevated?: boolean;
}

function TaskCardBody({ task, elevated }: TaskCardBodyProps) {
  const toggle = useToggleTaskDone();
  const del = useDeleteTask();
  const done = task.status === 'DONE';
  const overdue = !done && task.dueAt && new Date(task.dueAt).getTime() < Date.now();
  const stripeColor = task.category?.color;

  return (
    <article
      className={`rounded-md border hairline bg-surface p-3 pl-[11px] ${
        elevated ? 'shadow-lg ring-2 ring-accent/20' : 'shadow-card'
      } ${done ? 'opacity-60' : ''}`}
      style={
        stripeColor ? { borderLeft: `3px solid ${stripeColor}` } : undefined
      }
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            toggle.mutate({ id: task.id, done: !done });
          }}
          className="mt-0.5 grid h-4 w-4 place-items-center rounded-sm border-2 transition-colors shrink-0"
          style={{
            borderColor: task.category?.color ?? 'var(--ink-3)',
            background: done ? task.category?.color ?? 'var(--ink-3)' : 'transparent',
          }}
        >
          {done ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : null}
        </button>

        <div className="flex-1 min-w-0">
          {task.priority === 'high' ? (
            <span className="inline-block rounded-sm bg-accent-soft text-accent text-[10px] font-mono uppercase tracking-mono px-1.5 py-0.5 mb-1">
              urgente
            </span>
          ) : null}
          <p className={`text-sm leading-snug text-ink ${done ? 'line-through' : ''}`}>
            {task.title}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-ink-3">
            {task.category ? (
              <span className="inline-flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-sm"
                  style={{ background: task.category.color }}
                  aria-hidden
                />
                <span className="uppercase tracking-mono">{task.category.name}</span>
              </span>
            ) : null}
            {task.dueAt ? (
              <span className={overdue ? 'text-danger' : ''}>· {dueLabel(task.dueAt)}</span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          aria-label="excluir tarefa"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Excluir esta tarefa?')) del.mutate(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-ink-3 hover:text-danger text-xs transition-opacity"
        >
          ×
        </button>
      </div>
    </article>
  );
}
