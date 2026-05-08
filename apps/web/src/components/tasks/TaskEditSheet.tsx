import { useMemo, useState } from 'react';
import type { Task } from '@savit/shared';
import { Sheet } from '@/components/Sheet';
import { CategoryPicker } from '@/components/composer/CategoryPicker';
import { useCategories } from '@/hooks/useCategories';
import { useUpdateTask } from '@/hooks/useTasks';
import { toast } from '@/stores/ui';

interface TaskEditSheetProps {
  task: Task;
  onClose: () => void;
}

type Priority = 'low' | 'med' | 'high' | null;

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: null, label: 'nenhuma' },
  { value: 'low', label: 'baixa' },
  { value: 'med', label: 'média' },
  { value: 'high', label: 'alta' },
];

export function TaskEditSheet({ task, onClose }: TaskEditSheetProps) {
  const cats = useCategories();
  const update = useUpdateTask();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(task.categoryId ?? null);
  const [priority, setPriority] = useState<Priority>(task.priority ?? null);
  const [dueLocal, setDueLocal] = useState<string>(toLocalInput(task.dueAt));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const initial = useMemo(
    () => ({
      title: task.title,
      description: task.description ?? '',
      categoryId: task.categoryId ?? null,
      priority: (task.priority ?? null) as Priority,
      dueLocal: toLocalInput(task.dueAt),
    }),
    [task],
  );

  const dirty =
    title !== initial.title ||
    description !== initial.description ||
    categoryId !== initial.categoryId ||
    priority !== initial.priority ||
    dueLocal !== initial.dueLocal;

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Dê um título pra tarefa.');
      return;
    }
    setBusy(true);
    setError(null);

    const patch: Parameters<typeof update.mutateAsync>[0] = { id: task.id };
    if (trimmed !== initial.title) patch.title = trimmed;
    if (description !== initial.description) patch.description = description.trim() ? description.trim() : null;
    if (categoryId !== initial.categoryId) patch.categoryId = categoryId;
    if (priority !== initial.priority) patch.priority = priority;
    if (dueLocal !== initial.dueLocal) patch.dueAt = dueLocal ? new Date(dueLocal).toISOString() : null;

    try {
      await update.mutateAsync(patch);
      toast({ message: 'Tarefa atualizada', tone: 'success' });
      onClose();
    } catch {
      setError('Não foi possível salvar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Editar tarefa"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-3 py-1.5 text-sm text-ink-2 hover:text-ink"
          >
            cancelar
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || !title.trim() || !dirty}
            className="rounded-md bg-ink text-bg px-4 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {busy ? '…' : 'salvar'}
          </button>
        </>
      }
    >
      <div className="mb-5">
        <label className="font-mono text-[11px] uppercase tracking-mono text-ink-3 block mb-1.5">
          TÍTULO
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          autoFocus
          className="w-full bg-transparent border-b hairline text-ink text-md py-2 outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="mb-5">
        <label className="font-mono text-[11px] uppercase tracking-mono text-ink-3 block mb-1.5">
          DESCRIÇÃO
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
          rows={5}
          placeholder="Detalhes opcionais…"
          className="w-full bg-transparent border hairline rounded-md text-ink text-sm p-2.5 outline-none focus:border-accent transition-colors resize-y"
        />
      </div>

      <div className="mb-5">
        <span className="font-mono text-[11px] uppercase tracking-mono text-ink-3 block mb-1.5">
          CATEGORIA
        </span>
        <CategoryPicker
          categories={cats.data ?? []}
          value={categoryId}
          onChange={setCategoryId}
        />
      </div>

      <div className="mb-5">
        <span className="font-mono text-[11px] uppercase tracking-mono text-ink-3 block mb-2">
          PRIORIDADE
        </span>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((opt) => {
            const active = priority === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setPriority(opt.value)}
                aria-pressed={active}
                className={`rounded-pill border hairline px-3 py-1 text-xs transition-colors ${
                  active
                    ? 'bg-ink text-bg border-ink'
                    : 'text-ink-2 hover:text-ink hover:border-ink-3'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="font-mono text-[11px] uppercase tracking-mono text-ink-3 block mb-1.5">
          DATA / HORA
        </label>
        <div className="flex items-center gap-3">
          <input
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
            className="bg-transparent border-b hairline text-ink text-sm py-1.5 outline-none focus:border-accent transition-colors"
          />
          {dueLocal ? (
            <button
              type="button"
              onClick={() => setDueLocal('')}
              className="text-xs text-ink-3 hover:text-danger underline-offset-2 hover:underline"
            >
              remover
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-danger mt-4" role="alert">
          {error}
        </p>
      ) : null}
    </Sheet>
  );
}

// `<input type="datetime-local">` espera "YYYY-MM-DDTHH:mm" em hora local.
// `new Date(iso).toISOString()` retorna UTC; aqui montamos o local manualmente
// pra evitar deslocamento de fuso ao editar.
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
