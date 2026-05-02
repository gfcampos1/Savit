interface KpiStripProps {
  totals: {
    notes: number;
    tasks: number;
    tasksCompleted: number;
    pending: number;
  };
  streak: { currentDays: number };
}

export function KpiStrip({ totals, streak }: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Kpi value={totals.notes} label="capturadas" />
      <Kpi value={totals.tasksCompleted} label="concluídas" />
      <Kpi value={totals.pending} label="pendentes" />
      <Kpi value={streak.currentDays} label="dias seguidos" suffix="d" />
    </div>
  );
}

function Kpi({
  value,
  label,
  suffix,
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-md border hairline bg-surface p-4 shadow-card">
      <p className="display-serif text-display text-ink leading-none">
        {value}
        {suffix ? <span className="text-ink-3 text-2xl ml-0.5">{suffix}</span> : null}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3 mt-2">
        {label}
      </p>
    </div>
  );
}
