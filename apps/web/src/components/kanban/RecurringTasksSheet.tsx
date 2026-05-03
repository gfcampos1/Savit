// Sheet de gestão das tarefas recorrentes do usuário.
// - Lista todas (ativas + pausadas).
// - Toggle activa/pausa (PATCH isActive).
// - Excluir (DELETE — Tasks já criadas continuam intactas).
// - "+ nova" abre form inline pra adicionar uma recorrência sem precisar
//   passar por uma Task existente.

import { useState } from 'react';
import type { Category, RecurringTask } from '@savit/shared';
import { Sheet } from '@/components/Sheet';
import {
  useCreateRecurringTask,
  useDeleteRecurringTask,
  usePatchRecurringTask,
  useRecurringTasks,
} from '@/hooks/useRecurringTasks';
import { confirm } from '@/stores/confirm';

const WEEKDAYS = [
  { value: 0, label: 'Domingo', short: 'dom' },
  { value: 1, label: 'Segunda', short: 'seg' },
  { value: 2, label: 'Terça', short: 'ter' },
  { value: 3, label: 'Quarta', short: 'qua' },
  { value: 4, label: 'Quinta', short: 'qui' },
  { value: 5, label: 'Sexta', short: 'sex' },
  { value: 6, label: 'Sábado', short: 'sab' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

export function RecurringTasksSheet({ open, onClose, categories }: Props) {
  const list = useRecurringTasks();
  const patch = usePatchRecurringTask();
  const del = useDeleteRecurringTask();
  const [adding, setAdding] = useState(false);

  if (!open) return null;
  const items = list.data?.items ?? [];

  async function toggle(r: RecurringTask) {
    await patch.mutateAsync({ id: r.id, isActive: !r.isActive });
  }

  async function remove(r: RecurringTask) {
    const ok = await confirm({
      title: `Remover "${r.title}"?`,
      body: 'A recorrência para de criar novas tarefas. As tarefas já criadas no Kanban continuam.',
      confirmLabel: 'Remover',
      tone: 'danger',
    });
    if (!ok) return;
    await del.mutateAsync(r.id);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Tarefas recorrentes"
      footer={
        <>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mr-auto text-sm text-accent hover:underline underline-offset-2"
          >
            + nova
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-ink-2 hover:text-ink"
          >
            fechar
          </button>
        </>
      }
    >
      {adding ? (
        <NewRecurringForm
          categories={categories}
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      ) : null}

      {list.isLoading ? (
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3 py-6 text-center">
          carregando…
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-2 text-center py-8">
          Nenhuma recorrência. Configure uma abaixo — toda semana, no dia escolhido,
          aparecerá no <em>Sem prazo</em> do Kanban.
        </p>
      ) : (
        <ul className="divide-y divide-hair">
          {items.map((r) => (
            <li key={r.id} className="py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${r.isActive ? 'text-ink' : 'text-ink-3 line-through'}`}>
                  {r.title}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3 mt-0.5">
                  toda {WEEKDAYS[r.weekday]?.label.toLowerCase() ?? '?'}
                  {r.category ? ` · ${r.category.name}` : ''}
                  {r.isActive ? ` · próxima ${formatNext(r.nextRunAt)}` : ' · pausada'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void toggle(r)}
                className="text-xs font-mono uppercase tracking-mono text-ink-3 hover:text-ink px-2 py-1"
                aria-label={r.isActive ? 'pausar' : 'ativar'}
              >
                {r.isActive ? 'pausar' : 'ativar'}
              </button>
              <button
                type="button"
                onClick={() => void remove(r)}
                className="text-xs text-danger hover:underline underline-offset-2 px-2 py-1"
                aria-label="remover"
              >
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

function NewRecurringForm({
  categories,
  onCancel,
  onSaved,
}: {
  categories: Category[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const create = useCreateRecurringTask();
  const [title, setTitle] = useState('');
  const [weekday, setWeekday] = useState(new Date().getDay());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!title.trim()) {
      setErr('Dê um título.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await create.mutateAsync({ title: title.trim(), weekday, categoryId });
      setTitle('');
      onSaved();
    } catch {
      setErr('Não foi possível salvar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-5 rounded-md border hairline bg-surface-2 p-3">
      <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3 mb-2">
        nova recorrência
      </p>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="ex: revisar metas da semana"
        maxLength={200}
        autoFocus
        className="w-full bg-transparent border-b hairline text-ink text-sm py-1.5 mb-3 outline-none focus:border-accent"
      />
      <div className="flex flex-wrap gap-1 mb-3">
        {WEEKDAYS.map((w) => (
          <button
            key={w.value}
            type="button"
            onClick={() => setWeekday(w.value)}
            aria-pressed={w.value === weekday}
            className={`px-2 py-1 text-xs rounded-md font-mono uppercase tracking-mono transition-colors ${
              w.value === weekday
                ? 'bg-ink text-bg'
                : 'border hairline text-ink-3 hover:text-ink'
            }`}
          >
            {w.short}
          </button>
        ))}
      </div>
      <select
        value={categoryId ?? ''}
        onChange={(e) => setCategoryId(e.target.value || null)}
        className="w-full bg-transparent border hairline rounded text-ink text-sm py-1.5 px-2 mb-3"
      >
        <option value="">sem categoria</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {err ? <p className="text-xs text-danger mb-2">{err}</p> : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="text-sm text-ink-2 hover:text-ink px-3 py-1.5"
        >
          cancelar
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy || !title.trim()}
          className="rounded-md bg-ink text-bg px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {busy ? '…' : 'salvar'}
        </button>
      </div>
    </div>
  );
}

function formatNext(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'hoje';
  if (diffDays === 1) return 'amanhã';
  if (diffDays < 7) return `em ${diffDays}d`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
