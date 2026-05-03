// Job diário: instancia uma nova Task na coluna 'sem-prazo' (= backlog) para
// cada RecurringTask ativa cujo `nextRunAt` já venceu, e avança `nextRunAt`
// em +7 dias. Idempotente: rodar duas vezes seguidas só cria uma cópia.
//
// Disparado por cron externo (Railway Cron) via:
//   POST /api/jobs/recurring-tasks  (Authorization: Bearer $CRON_SECRET)

import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function runRecurringTasks(now: Date = new Date()): Promise<{ created: number }> {
  const due = await prisma.recurringTask.findMany({
    where: { isActive: true, nextRunAt: { lte: now } },
  });

  let created = 0;
  for (const r of due) {
    try {
      // sortOrder no fim da coluna sem-prazo (mesmo padrão do POST /tasks)
      const last = await prisma.task.aggregate({
        where: { userId: r.userId, column: 'sem-prazo' },
        _max: { sortOrder: true },
      });
      await prisma.$transaction([
        prisma.task.create({
          data: {
            userId: r.userId,
            title: r.title,
            description: r.description ?? null,
            categoryId: r.categoryId ?? null,
            priority: r.priority ?? null,
            recurringTaskId: r.id,
            status: 'SOMEDAY',
            column: 'sem-prazo',
            sortOrder: (last._max.sortOrder ?? -1) + 1,
            dueAt: null,
          },
        }),
        prisma.recurringTask.update({
          where: { id: r.id },
          data: {
            lastRunAt: now,
            nextRunAt: nextWeeklyRun(r.nextRunAt, now),
          },
        }),
      ]);
      created++;
    } catch (err) {
      logger.error({ err, recurringTaskId: r.id }, 'recurring-task instance failed');
    }
  }

  logger.info({ created, candidates: due.length }, 'recurring-tasks job done');
  return { created };
}

/**
 * Avança `nextRunAt` para a próxima ocorrência semanal estritamente no futuro.
 * Cobre o caso de o job ter ficado parado por dias e precisar pular janelas
 * vencidas em vez de criar várias cópias retroativas.
 */
function nextWeeklyRun(currentNext: Date, now: Date): Date {
  let next = currentNext.getTime() + WEEK_MS;
  const nowMs = now.getTime();
  while (next <= nowMs) next += WEEK_MS;
  return new Date(next);
}
