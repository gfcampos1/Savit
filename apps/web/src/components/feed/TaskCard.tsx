import type { Task } from '@savit/shared';
import { dueLabel } from '@/lib/format-date';
import { useToggleTaskDone, useDeleteTask } from '@/hooks/useTasks';

interface TaskCardProps {
  task: Task;
}

/** Card de TAREFA — checkbox quadrado 20px com cor da categoria. SPEC §3.2. */
export function TaskCard({ task }: TaskCardProps) {
  const toggle = useToggleTaskDone();
  const del = useDeleteTask();
  const done = task.status === 'DONE';
  const overdue = !done && task.dueAt && new Date(task.dueAt).getTime() < Date.now();

  return (
    <article
      className={`rounded-md border hairline bg-surface p-4 shadow-card relative group ${
        done ? 'opacity-60' : ''
      }`}
      data-task-id={task.id}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          onClick={() => toggle.mutate({ id: task.id, done: !done })}
          className="mt-0.5 grid h-5 w-5 place-items-center rounded-sm border-2 transition-colors"
          style={{
            borderColor: task.category?.color ?? 'var(--ink-3)',
            background: done ? task.category?.color ?? 'var(--ink-3)' : 'transparent',
          }}
        >
          {done ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
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
          <p className={`text-md text-ink ${done ? 'line-through' : ''}`}>{task.title}</p>

          <div className="mt-2 flex items-center gap-2 text-[11.5px] font-mono text-ink-3">
            {task.category ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ background: task.category.color }}
                  aria-hidden
                />
                <span className="uppercase tracking-mono">{task.category.name}</span>
              </span>
            ) : null}
            {task.dueAt ? (
              <>
                {task.category ? <span aria-hidden>·</span> : null}
                <span className={overdue ? 'text-danger' : ''}>{dueLabel(task.dueAt)}</span>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (confirm('Excluir esta tarefa?')) del.mutate(task.id);
              }}
              aria-label="excluir tarefa"
              className="ml-auto opacity-0 group-hover:opacity-100 focus:opacity-100 text-ink-3 hover:text-danger transition-opacity"
            >
              excluir
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
