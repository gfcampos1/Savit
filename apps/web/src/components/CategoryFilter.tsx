// Seletor de categoria pra filtrar listas. Por design fica escondido atrás
// de um botão (idealmente pra muitas categorias) — abre um Sheet com busca
// inline e contadores.
//
// API:
//   <CategoryFilter
//     categories={cats}
//     value={categoryId}
//     onChange={setCategoryId}
//     countKind="tasks" | "notes"
//   />

import { useMemo, useState } from 'react';
import type { Category } from '@savit/shared';
import { Sheet } from '@/components/Sheet';

interface CategoryFilterProps {
  categories: Category[];
  value: string | null;
  onChange: (id: string | null) => void;
  countKind?: 'tasks' | 'notes';
}

export function CategoryFilter({
  categories,
  value,
  onChange,
  countKind = 'notes',
}: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? categories.find((c) => c.id === value) ?? null : null;
  const totalCount = categories.reduce(
    (s, c) => s + (countKind === 'tasks' ? c.taskCount ?? 0 : c.noteCount ?? 0),
    0,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-medium border transition-colors ${
          selected
            ? 'bg-accent-soft text-accent border-accent/40'
            : 'bg-surface text-ink-2 hover:text-ink hairline'
        }`}
      >
        {selected ? (
          <>
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: selected.color }}
              aria-hidden
            />
            <span>{selected.name}</span>
            <span
              role="button"
              aria-label="limpar filtro"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="ml-1 text-accent/70 hover:text-accent text-sm leading-none"
            >
              ×
            </span>
          </>
        ) : (
          <>
            <FunnelIcon />
            <span>filtrar por categoria</span>
            {totalCount > 0 ? (
              <span className="font-mono text-[10px] text-ink-3">{categories.length}</span>
            ) : null}
          </>
        )}
      </button>

      {open ? (
        <CategoryPickerSheet
          categories={categories}
          value={value}
          onChange={(id) => {
            onChange(id);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
          countKind={countKind}
        />
      ) : null}
    </>
  );
}

interface SheetProps {
  categories: Category[];
  value: string | null;
  onChange: (id: string | null) => void;
  onClose: () => void;
  countKind: 'tasks' | 'notes';
}

function CategoryPickerSheet({
  categories,
  value,
  onChange,
  onClose,
  countKind,
}: SheetProps) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(s));
  }, [categories, q]);

  return (
    <Sheet open onClose={onClose} title="Filtrar por categoria">
      <input
        type="text"
        autoFocus
        placeholder="buscar categoria…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full bg-transparent border-b hairline text-ink text-md py-2 outline-none focus:border-accent transition-colors mb-3"
      />

      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        className={`w-full text-left px-3 py-2.5 rounded-md text-sm flex items-center gap-3 ${
          value === null ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:bg-surface-2/40'
        }`}
      >
        <span className="h-3 w-3 rounded-sm border hairline shrink-0" aria-hidden />
        <span className="flex-1">Tudo (sem filtro)</span>
      </button>

      <div className="mt-1 flex flex-col">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-ink-3 italic py-6">
            nenhuma categoria com "{q}".
          </p>
        ) : (
          filtered.map((c) => {
            const count = countKind === 'tasks' ? c.taskCount ?? 0 : c.noteCount ?? 0;
            const active = value === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange(c.id)}
                aria-pressed={active}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm flex items-center gap-3 ${
                  active ? 'bg-accent-soft text-ink' : 'text-ink hover:bg-surface-2/40'
                }`}
              >
                <span
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ background: c.color }}
                  aria-hidden
                />
                <span className="flex-1 truncate">{c.name}</span>
                {count > 0 ? (
                  <span className="font-mono text-[10px] text-ink-3">{count}</span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </Sheet>
  );
}

function FunnelIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5h16l-6 8v6l-4-2v-4L4 5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
