// Estatísticas agregadas pro dashboard. Tudo em queries únicas (groupBy,
// raw quando necessário) — performance crítica pra dashboards mobile.

import { prisma } from '../lib/prisma.js';

export interface StatsResponse {
  totals: {
    notes: number;
    tasks: number;
    tasksCompleted: number;
    pending: number;
  };
  streak: {
    currentDays: number;
    recordDays: number;
    lastActive: string | null;
  };
  daily: { date: string; count: number }[];
  byCategory: { id: string; name: string; color: string; count: number; pct: number }[];
  byHourDay: { dow: number; hour: number; count: number }[];
  weekSummary: {
    capturedThisWeek: number;
    becameTask: number;
    topCategories: { name: string; count: number }[];
    deltaVsLastWeek: number;
  };
}

const DAYS_WINDOW = 30;
const MS_DAY = 86_400_000;

export async function getStats(userId: string): Promise<StatsResponse> {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const windowStart = new Date(today.getTime() - (DAYS_WINDOW - 1) * MS_DAY);
  const weekStart = startOfWeek(today);
  const lastWeekStart = new Date(weekStart.getTime() - 7 * MS_DAY);

  const [
    totalsAgg,
    notesPeriod,
    catGroups,
    notesForHourDay,
    notesByDay,
    notesThisWeek,
    notesLastWeek,
    becameTaskCount,
  ] = await Promise.all([
    // totals
    prisma.$transaction([
      prisma.note.count({ where: { userId, archivedAt: null } }),
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'DONE' } }),
      prisma.task.count({
        where: { userId, status: { notIn: ['DONE', 'ARCHIVED'] } },
      }),
    ]),
    // notas dentro da janela (pra streak + daily)
    prisma.note.findMany({
      where: { userId, createdAt: { gte: windowStart } },
      select: { createdAt: true, categoryId: true },
    }),
    // categorias (top breakdown)
    prisma.category.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        color: true,
        _count: { select: { notes: true, tasks: true } },
      },
    }),
    // hour×day — toda nota da janela (mesma carga de cima — serve pra ambos)
    prisma.note.findMany({
      where: { userId, createdAt: { gte: windowStart } },
      select: { createdAt: true },
    }),
    // alias dummy pra TS — vamos derivar daily de notesPeriod
    Promise.resolve(null),
    // semana atual
    prisma.note.count({
      where: { userId, createdAt: { gte: weekStart } },
    }),
    // semana anterior
    prisma.note.count({
      where: { userId, createdAt: { gte: lastWeekStart, lt: weekStart } },
    }),
    // notas que viraram task (Task.noteId != null) na semana
    prisma.task.count({
      where: { userId, noteId: { not: null }, createdAt: { gte: weekStart } },
    }),
  ]);
  void notesByDay; // unused (mantido pra parallelismo similar)

  const [notesTotal, tasksTotal, tasksDone, pending] = totalsAgg;

  // ----- daily 30d -----
  const dailyMap = new Map<string, number>();
  for (let i = 0; i < DAYS_WINDOW; i++) {
    const d = new Date(today.getTime() - (DAYS_WINDOW - 1 - i) * MS_DAY);
    dailyMap.set(dayKey(d), 0);
  }
  for (const n of notesPeriod) {
    const k = dayKey(n.createdAt);
    if (dailyMap.has(k)) dailyMap.set(k, (dailyMap.get(k) ?? 0) + 1);
  }
  const daily = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

  // ----- streak -----
  const activeDays = new Set(notesPeriod.map((n) => dayKey(n.createdAt)));
  let currentDays = 0;
  for (let i = 0; i < DAYS_WINDOW; i++) {
    const d = new Date(today.getTime() - i * MS_DAY);
    if (activeDays.has(dayKey(d))) currentDays++;
    else break;
  }
  let recordDays = 0;
  let cur = 0;
  for (let i = DAYS_WINDOW - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * MS_DAY);
    if (activeDays.has(dayKey(d))) {
      cur++;
      if (cur > recordDays) recordDays = cur;
    } else {
      cur = 0;
    }
  }
  const lastActive = notesPeriod
    .map((n) => n.createdAt.getTime())
    .reduce((acc, t) => (t > acc ? t : acc), 0);

  // ----- byCategory -----
  const totalCategorized = catGroups.reduce((s, c) => s + c._count.notes, 0);
  const byCategory = catGroups
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      count: c._count.notes,
      pct: totalCategorized > 0 ? Math.round((c._count.notes / totalCategorized) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // ----- byHourDay (heatmap 7x24) -----
  const hd: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const n of notesForHourDay) {
    const d = n.createdAt;
    const dow = d.getDay(); // 0..6 (dom..sab)
    const hour = d.getHours();
    hd[dow]![hour] = (hd[dow]![hour] ?? 0) + 1;
  }
  const byHourDay: StatsResponse['byHourDay'] = [];
  for (let dow = 0; dow < 7; dow++) {
    for (let hour = 0; hour < 24; hour++) {
      const v = hd[dow]?.[hour] ?? 0;
      if (v > 0) byHourDay.push({ dow, hour, count: v });
    }
  }

  // ----- weekSummary -----
  const topCatsThisWeek = await prisma.note.groupBy({
    by: ['categoryId'],
    where: { userId, createdAt: { gte: weekStart }, categoryId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { categoryId: 'desc' } },
    take: 2,
  });
  const catNameById = new Map(catGroups.map((c) => [c.id, c.name]));
  const topCategoriesNames = topCatsThisWeek
    .map((t) => ({
      name: t.categoryId ? catNameById.get(t.categoryId) ?? '—' : '—',
      count: t._count._all,
    }))
    .filter((x) => x.name !== '—');

  return {
    totals: {
      notes: notesTotal,
      tasks: tasksTotal,
      tasksCompleted: tasksDone,
      pending,
    },
    streak: {
      currentDays,
      recordDays,
      lastActive: lastActive ? new Date(lastActive).toISOString() : null,
    },
    daily,
    byCategory,
    byHourDay,
    weekSummary: {
      capturedThisWeek: notesThisWeek,
      becameTask: becameTaskCount,
      topCategories: topCategoriesNames,
      deltaVsLastWeek: notesThisWeek - notesLastWeek,
    },
  };
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const dow = out.getDay(); // 0=dom..6=sab
  // semana começa na segunda (0=dom vira -6, 1=seg vira 0, ...)
  const diff = (dow + 6) % 7;
  out.setDate(out.getDate() - diff);
  out.setHours(0, 0, 0, 0);
  return out;
}
