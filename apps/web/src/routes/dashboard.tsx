import { useStats, useWeekly } from '@/hooks/useStats';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { Heatmap } from '@/components/dashboard/Heatmap';
import { TopCategories } from '@/components/dashboard/TopCategories';
import { WeeklySummaryCard } from '@/components/dashboard/WeeklySummaryCard';

export function DashboardPage() {
  const stats = useStats();
  const weekly = useWeekly();

  if (stats.isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3 text-center">
          carregando…
        </p>
      </div>
    );
  }

  if (stats.error || !stats.data) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-sm text-danger">não foi possível carregar as estatísticas.</p>
      </div>
    );
  }

  const s = stats.data;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">Métricas</p>
        <h1 className="display-serif text-2xl mt-1">Dashboard</h1>
      </header>

      <div className="mb-6">
        <KpiStrip totals={s.totals} streak={s.streak} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <ActivityChart data={s.daily} />
        </div>
        <TopCategories items={s.byCategory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Heatmap data={s.byHourDay} />
        <WeeklySummaryCard data={weekly.data ?? null} />
      </div>
    </div>
  );
}
