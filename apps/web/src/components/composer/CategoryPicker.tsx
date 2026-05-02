import { useState } from 'react';
import type { Category } from '@savit/shared';

interface CategoryPickerProps {
  categories: Category[];
  value: string | null;
  onChange: (id: string | null) => void;
  /** Categoria detectada pelo parser (#hashtag) — mostrada quando nada foi fixado. */
  autoCategoryName?: string | null;
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  autoCategoryName,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? categories.find((c) => c.id === value) : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-pill border hairline px-2.5 py-1 text-xs text-ink-2 hover:text-ink transition-colors"
      >
        {selected ? (
          <>
            <span className="h-2 w-2 rounded-sm" style={{ background: selected.color }} aria-hidden />
            <span>{selected.name}</span>
          </>
        ) : autoCategoryName ? (
          <>
            <span className="font-mono text-[10px] uppercase tracking-mono text-ink-3">via #</span>
            <span>{autoCategoryName}</span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-sm border hairline" aria-hidden />
            <span>sem categoria</span>
          </>
        )}
        <span className="text-ink-3">▾</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 w-56 rounded-md border hairline bg-surface shadow-card p-1 z-20"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            role="menuitem"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="w-full text-left px-2 py-1.5 text-sm text-ink-2 rounded hover:bg-surface-2"
          >
            sem categoria
          </button>
          {categories.map((c) => (
            <button
              role="menuitem"
              key={c.id}
              onClick={() => {
                onChange(c.id);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 text-sm text-ink rounded hover:bg-surface-2 flex items-center gap-2"
            >
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} aria-hidden />
              {c.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
