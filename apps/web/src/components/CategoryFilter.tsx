// Faixa horizontal de chips pra filtrar por categoria. Usado no Inbox e
// no Tasks (e potencialmente em /chat futuramente). Em mobile rola sem
// scrollbar; em desktop quebra linha.

import type { Category } from '@savit/shared';

interface CategoryFilterProps {
  categories: Category[];
  /** id da categoria selecionada, ou null pra "tudo" */
  value: string | null;
  onChange: (id: string | null) => void;
  /** Métrica usada nos contadores: 'tasks' | 'notes'. Default 'notes'. */
  countKind?: 'tasks' | 'notes';
}

export function CategoryFilter({
  categories,
  value,
  onChange,
  countKind = 'notes',
}: CategoryFilterProps) {
  if (categories.length === 0) return null;
  return (
    <div className="-mx-6 px-6 overflow-x-auto md:overflow-visible no-scrollbar">
      <div className="flex md:flex-wrap items-center gap-2 min-w-max md:min-w-0">
        <Chip
          label="Tudo"
          active={value === null}
          onClick={() => onChange(null)}
        />
        {categories.map((c) => {
          const count = countKind === 'tasks' ? c.taskCount ?? 0 : c.noteCount ?? 0;
          return (
            <Chip
              key={c.id}
              label={c.name}
              count={count}
              color={c.color}
              active={value === c.id}
              onClick={() => onChange(value === c.id ? null : c.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface ChipProps {
  label: string;
  count?: number;
  color?: string;
  active: boolean;
  onClick: () => void;
}

function Chip({ label, count, color, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors border ${
        active
          ? 'bg-ink text-bg border-ink'
          : 'bg-surface text-ink-2 hover:text-ink hairline'
      }`}
    >
      {color ? (
        <span
          className="h-2 w-2 rounded-sm"
          style={{ background: active ? 'var(--bg)' : color }}
          aria-hidden
        />
      ) : null}
      <span>{label}</span>
      {count !== undefined && count > 0 ? (
        <span
          className={`font-mono text-[10px] ${
            active ? 'text-bg/70' : 'text-ink-3'
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
