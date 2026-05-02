interface TopCategoriesProps {
  items: { id: string; name: string; color: string; count: number; pct: number }[];
}

export function TopCategories({ items }: TopCategoriesProps) {
  const top = items.slice(0, 6);
  return (
    <section className="rounded-md border hairline bg-surface p-4 shadow-card">
      <header className="mb-3">
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">
          top categorias
        </p>
      </header>
      {top.length === 0 ? (
        <p className="text-sm text-ink-3 italic py-4 text-center">sem dados ainda.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {top.map((c) => (
            <div key={c.id}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: c.color }}
                    aria-hidden
                  />
                  <span className="text-ink-2">{c.name}</span>
                </span>
                <span className="font-mono text-[10px] text-ink-3">
                  {c.count} · {c.pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 rounded-pill bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-pill"
                  style={{ width: `${c.pct}%`, background: c.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
