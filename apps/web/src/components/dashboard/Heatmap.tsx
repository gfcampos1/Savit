// Heatmap hora × dia da semana. Cores via opacidade do --accent.

interface HeatmapProps {
  data: { dow: number; hour: number; count: number }[];
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function Heatmap({ data }: HeatmapProps) {
  // Constrói matriz 7×24
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  let max = 0;
  for (const d of data) {
    grid[d.dow]![d.hour] = d.count;
    if (d.count > max) max = d.count;
  }
  const safeMax = Math.max(1, max);

  return (
    <section className="rounded-md border hairline bg-surface p-4 shadow-card">
      <header className="flex items-center justify-between mb-3">
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">
          padrão · hora × dia
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="border-separate text-[9px] font-mono text-ink-3" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th />
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} className="font-normal w-3 text-center">
                  {h % 6 === 0 ? h : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((label, dow) => (
              <tr key={dow}>
                <th className="font-normal pr-2 text-right">{label}</th>
                {Array.from({ length: 24 }, (_, h) => {
                  const v = grid[dow]?.[h] ?? 0;
                  const intensity = v / safeMax;
                  const opacity = v === 0 ? 0.06 : Math.max(0.18, intensity);
                  return (
                    <td key={h} className="p-0">
                      <div
                        title={v > 0 ? `${label} ${h}h · ${v}` : ''}
                        className="w-3 h-3 rounded-[2px]"
                        style={{
                          background: `var(--accent)`,
                          opacity,
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
