// Gera o "resumo editorial da semana" da SPEC §3.6 (F6 das funcionalidades de UX).
//
// Roda por:
//  - cron semanal (segunda 9h UTC) — endpoint /api/jobs/weekly-summary
//  - on-demand quando o usuário abre /dashboard ou /api/weekly e ainda não tem
//    o registro da semana atual (lazy generation)

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface WeeklySummaryPayload {
  weekStart: string;
  capturedThisWeek: number;
  becameTask: number;
  topCategories: { name: string; count: number }[];
  deltaVsLastWeek: number;
  whenPattern: 'manhã' | 'tarde' | 'noite' | 'distribuído';
}

export interface WeeklySummary {
  id: string;
  weekStart: string;
  text: string;
  payload: WeeklySummaryPayload;
  createdAt: string;
}

const MS_DAY = 86_400_000;

/**
 * Gera (ou re-gera) o resumo da semana corrente pra um usuário.
 * Usa upsert pra ser idempotente — chamar 3x roda 3x e atualiza o text.
 */
export async function generateWeeklySummary(userId: string): Promise<WeeklySummary> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = startOfWeek(today);
  const lastWeekStart = new Date(weekStart.getTime() - 7 * MS_DAY);

  const [notesThisWeek, notesLastWeek, becameTask, topCats] = await Promise.all([
    prisma.note.findMany({
      where: { userId, createdAt: { gte: weekStart } },
      select: { createdAt: true, categoryId: true },
    }),
    prisma.note.count({
      where: { userId, createdAt: { gte: lastWeekStart, lt: weekStart } },
    }),
    prisma.task.count({
      where: { userId, noteId: { not: null }, createdAt: { gte: weekStart } },
    }),
    prisma.note.groupBy({
      by: ['categoryId'],
      where: { userId, createdAt: { gte: weekStart }, categoryId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { categoryId: 'desc' } },
      take: 3,
    }),
  ]);

  const captured = notesThisWeek.length;
  const delta = captured - notesLastWeek;

  // when pattern: predominância de manhã (5-12), tarde (12-18), noite (18-24/0-5)
  const buckets = { manha: 0, tarde: 0, noite: 0 };
  for (const n of notesThisWeek) {
    const h = n.createdAt.getHours();
    if (h >= 5 && h < 12) buckets.manha++;
    else if (h >= 12 && h < 18) buckets.tarde++;
    else buckets.noite++;
  }
  const total = captured || 1;
  let whenPattern: WeeklySummaryPayload['whenPattern'] = 'distribuído';
  for (const [k, v] of Object.entries(buckets) as Array<[keyof typeof buckets, number]>) {
    if (v / total >= 0.55) {
      whenPattern = k === 'manha' ? 'manhã' : k === 'tarde' ? 'tarde' : 'noite';
      break;
    }
  }

  // resolver nomes de categorias top
  const catNames = topCats.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: topCats.map((t) => t.categoryId).filter(Boolean) as string[] } },
        select: { id: true, name: true },
      })
    : [];
  const catById = new Map(catNames.map((c) => [c.id, c.name]));
  const topCategories = topCats.map((t) => ({
    name: t.categoryId ? catById.get(t.categoryId) ?? '—' : '—',
    count: t._count._all,
  }));

  const payload: WeeklySummaryPayload = {
    weekStart: weekStart.toISOString().slice(0, 10),
    capturedThisWeek: captured,
    becameTask,
    topCategories,
    deltaVsLastWeek: delta,
    whenPattern,
  };

  const text = renderText(payload);

  const payloadJson = payload as unknown as Prisma.InputJsonValue;
  const saved = await prisma.weeklySummary.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    update: { payload: payloadJson, text },
    create: { userId, weekStart, payload: payloadJson, text },
  });

  return {
    id: saved.id,
    weekStart: saved.weekStart.toISOString().slice(0, 10),
    text: saved.text,
    payload: saved.payload as unknown as WeeklySummaryPayload,
    createdAt: saved.createdAt.toISOString(),
  };
}

/** Lê a última summary, gerando-a se ainda não existir para a semana atual. */
export async function getOrGenerateLatestWeekly(userId: string): Promise<WeeklySummary | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = startOfWeek(today);

  const existing = await prisma.weeklySummary.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });
  if (existing) {
    return {
      id: existing.id,
      weekStart: existing.weekStart.toISOString().slice(0, 10),
      text: existing.text,
      payload: existing.payload as unknown as WeeklySummaryPayload,
      createdAt: existing.createdAt.toISOString(),
    };
  }

  const captured = await prisma.note.count({ where: { userId, createdAt: { gte: weekStart } } });
  if (captured === 0) return null;
  return generateWeeklySummary(userId);
}

function renderText(p: WeeklySummaryPayload): string {
  if (p.capturedThisWeek === 0) {
    return 'Semana sem capturas. Volta quando bater alguma ideia.';
  }
  const parts: string[] = [];
  parts.push(
    `Você capturou **${p.capturedThisWeek}** ${pl(p.capturedThisWeek, 'ideia', 'ideias')} essa semana`,
  );
  if (p.whenPattern !== 'distribuído') {
    parts.push(`— quase tudo de ${p.whenPattern}`);
  }
  if (p.topCategories.length > 0) {
    parts.push(`, principalmente de **${p.topCategories[0]?.name}**`);
  }
  let text = parts.join(' ') + '.';
  if (p.becameTask > 0) {
    text += ` ${cap(numberWord(p.becameTask))} ${pl(p.becameTask, 'virou tarefa', 'viraram tarefa')}.`;
  }
  return text;
}

function pl(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

function numberWord(n: number): string {
  const m: Record<number, string> = {
    1: 'uma',
    2: 'duas',
    3: 'três',
    4: 'quatro',
    5: 'cinco',
    6: 'seis',
    7: 'sete',
    8: 'oito',
    9: 'nove',
    10: 'dez',
  };
  return m[n] ?? String(n);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const dow = out.getDay();
  const diff = (dow + 6) % 7; // semana começa na segunda
  out.setDate(out.getDate() - diff);
  out.setHours(0, 0, 0, 0);
  return out;
}
