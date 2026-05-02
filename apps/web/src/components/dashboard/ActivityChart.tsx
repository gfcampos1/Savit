// Gráfico de barras dos últimos 30 dias. SVG manual — sem deps.

interface ActivityChartProps {
  data: { date: string; count: number }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const W = 600;
  const H = 140;
  const pad = { top: 10, right: 8, bottom: 24, left: 8 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const barW = innerW / data.length - 2;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="rounded-md border hairline bg-surface p-4 shadow-card">
      <header className="flex items-center justify-between mb-3">
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">
          atividade · 30 dias
        </p>
        <p className="font-mono text-[10px] text-ink-3">
          {data.reduce((s, d) => s + d.count, 0)} no total
        </p>
      </header>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="atividade dos últimos 30 dias"
      >
        {data.map((d, i) => {
          const h = (d.count / max) * innerH;
          const x = pad.left + i * (barW + 2);
          const y = pad.top + (innerH - h);
          const isToday = d.date === today;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(2, h)}
                rx={2}
                fill={isToday ? 'var(--accent)' : 'var(--ink-3)'}
                opacity={d.count === 0 ? 0.18 : 1}
              />
            </g>
          );
        })}
        {/* baseline */}
        <line
          x1={pad.left}
          x2={pad.left + innerW}
          y1={pad.top + innerH + 1}
          y2={pad.top + innerH + 1}
          stroke="var(--hair)"
        />
        {/* labels nas pontas */}
        <text
          x={pad.left}
          y={H - 6}
          fontSize="9"
          fontFamily="JetBrains Mono"
          fill="var(--ink-3)"
        >
          {data[0]?.date.slice(5).replace('-', '/')}
        </text>
        <text
          x={W - pad.right}
          y={H - 6}
          fontSize="9"
          fontFamily="JetBrains Mono"
          fill="var(--ink-3)"
          textAnchor="end"
        >
          hoje
        </text>
      </svg>
    </section>
  );
}
