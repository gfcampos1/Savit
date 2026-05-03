import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_COLORS, type Category, type CategoryColor } from '@savit/shared';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useCategories';
import { Sheet } from '@/components/Sheet';
import { confirm } from '@/stores/confirm';

export function CategoriesPage() {
  const cats = useCategories({ includeHidden: true });
  const update = useUpdateCategory();
  const [editing, setEditing] = useState<Category | 'new' | null>(null);

  async function toggleHidden(c: Category) {
    await update.mutateAsync({
      id: c.id,
      hiddenAt: c.hiddenAt ? null : new Date().toISOString(),
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-8 pb-32">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">Espaços</p>
          <h1 className="display-serif text-2xl mt-1">Categorias</h1>
          <p className="text-sm text-ink-2 mt-2">
            Cor + nome viram tag em todas as notas e tarefas. Categorias fixas têm campos
            extras (Livros, YouTube) e só podem ser ocultadas — não excluídas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="rounded-md bg-ink text-bg px-3 py-2 text-sm font-medium"
        >
          + nova
        </button>
      </header>

      {cats.isLoading ? (
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3 py-10 text-center">
          carregando…
        </p>
      ) : cats.data?.length === 0 ? (
        <div className="text-center py-16">
          <p className="display-serif text-2xl mb-2">Nenhuma categoria.</p>
          <p className="text-sm text-ink-2">Crie a primeira pra organizar seu fluxo.</p>
        </div>
      ) : (
        <ul className="rounded-md border hairline bg-surface divide-y divide-hair shadow-card">
          {cats.data?.map((c) => {
            const isFixed = Boolean(c.slug);
            const isHidden = Boolean(c.hiddenAt);
            return (
              <li
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-2/40 ${
                  isHidden ? 'opacity-60' : ''
                }`}
              >
                <Link
                  to={`/?cat=${c.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                  aria-label={`abrir ${c.name} no inbox`}
                >
                  <span
                    className="grid place-items-center h-10 w-10 rounded-md display-serif text-lg text-bg shrink-0"
                    style={{ background: c.color }}
                    aria-hidden
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-md text-ink truncate flex items-center gap-2">
                      {c.name}
                      {isFixed ? (
                        <span className="font-mono text-[9px] uppercase tracking-mono px-1.5 py-0.5 rounded border hairline text-ink-3">
                          fixa
                        </span>
                      ) : null}
                      {isHidden ? (
                        <span className="font-mono text-[9px] uppercase tracking-mono text-ink-3">
                          oculta
                        </span>
                      ) : null}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3 mt-0.5">
                      {c.noteCount ?? 0} {plural(c.noteCount ?? 0, 'nota', 'notas')}
                      {(c.taskCount ?? 0) > 0
                        ? ` · ${c.taskCount} ${plural(c.taskCount ?? 0, 'tarefa pendente', 'tarefas pendentes')}`
                        : ''}
                    </p>
                  </div>
                </Link>
                <Link
                  to={`/tasks?cat=${c.id}`}
                  aria-label={`abrir tarefas de ${c.name}`}
                  className="text-xs font-mono uppercase tracking-mono text-ink-3 hover:text-accent px-2 py-1"
                >
                  tarefas →
                </Link>
                {isFixed ? (
                  <button
                    type="button"
                    onClick={() => void toggleHidden(c)}
                    aria-label={isHidden ? 'reexibir' : 'ocultar'}
                    className="text-ink-3 hover:text-ink text-sm px-2 py-1"
                  >
                    {isHidden ? 'reexibir' : 'ocultar'}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  aria-label="editar"
                  className="text-ink-3 hover:text-ink text-sm px-2 py-1"
                >
                  editar
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <CategoryEditor
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

interface CategoryEditorProps {
  category: Category | null;
  onClose: () => void;
}

function CategoryEditor({ category, onClose }: CategoryEditorProps) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const del = useDeleteCategory();

  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState<CategoryColor>(
    (category?.color as CategoryColor) ?? CATEGORY_COLORS[0],
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Dê um nome pra categoria.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (category) {
        await update.mutateAsync({ id: category.id, name: trimmed, color });
      } else {
        await create.mutateAsync({ name: trimmed, color });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error && /name_taken/.test(err.message)
          ? 'Já existe uma categoria com esse nome.'
          : 'Não foi possível salvar.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!category) return;
    const ok = await confirm({
      title: `Excluir "${category.name}"?`,
      body: 'Notas e tarefas dessa categoria ficarão sem categoria.',
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await del.mutateAsync(category.id);
      onClose();
    } catch {
      setError('Não foi possível excluir.');
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={category ? 'Editar categoria' : 'Nova categoria'}
      footer={
        <>
          {category && !category.slug ? (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              className="mr-auto text-sm text-danger hover:underline underline-offset-2 disabled:opacity-50"
            >
              excluir
            </button>
          ) : null}
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
            disabled={busy || !name.trim()}
            className="rounded-md bg-ink text-bg px-4 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {busy ? '…' : 'salvar'}
          </button>
        </>
      }
    >
      <div className="mb-5">
        <label className="font-mono text-[11px] uppercase tracking-mono text-ink-3 block mb-1.5">
          NOME
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoFocus
          className="w-full bg-transparent border-b hairline text-ink text-md py-2 outline-none focus:border-accent transition-colors"
        />
      </div>

      <div>
        <label className="font-mono text-[11px] uppercase tracking-mono text-ink-3 block mb-2">
          COR
        </label>
        <div className="grid grid-cols-6 gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`cor ${c}`}
              aria-pressed={c === color}
              className={`h-10 rounded-md transition-transform ${
                c === color ? 'scale-110 ring-2 ring-ink ring-offset-2 ring-offset-bg' : ''
              }`}
              style={{ background: c }}
            />
          ))}
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

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
