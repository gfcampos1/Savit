// Card inline mostrado quando a IA chama uma tool. Compacto e linkável quando
// a tool teve efeito colateral (criou nota/tarefa).

import { Link } from 'react-router-dom';

export interface ToolEvent {
  id: string;
  name: string;
  args?: unknown;
  effect?: { kind: string; resourceId?: string; label?: string };
  status: 'pending' | 'done';
}

const TOOL_LABELS: Record<string, string> = {
  create_task: 'Criou tarefa',
  create_note: 'Criou nota',
  update_task: 'Atualizou tarefa',
  list_tasks: 'Listou tarefas',
  search_notes: 'Buscou notas',
  list_categories: 'Listou categorias',
  get_today_summary: 'Verificou o dia',
};

export function ToolCallCard({ event }: { event: ToolEvent }) {
  const label = TOOL_LABELS[event.name] ?? event.name;
  const link =
    event.effect?.kind === 'task_created' || event.effect?.kind === 'task_updated'
      ? '/tasks'
      : event.effect?.kind === 'note_created' && event.effect.resourceId
      ? `/notes/${event.effect.resourceId}`
      : null;

  return (
    <div className="my-2 rounded-md border hairline bg-surface-2 px-3 py-2 text-xs text-ink-2 inline-flex items-center gap-2 max-w-full">
      <span className="font-mono text-[10px] uppercase tracking-mono text-ink-3">
        {event.status === 'pending' ? '… executando' : '✦'}
      </span>
      <span>
        <strong className="text-ink">{label}</strong>
        {event.effect?.label ? (
          <>
            : <span className="italic">{event.effect.label}</span>
          </>
        ) : null}
      </span>
      {link ? (
        <Link to={link} className="text-accent hover:underline underline-offset-2">
          ver →
        </Link>
      ) : null}
    </div>
  );
}
