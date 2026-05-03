// Jobs disparados por cron externo (Railway Cron, GitHub Actions, etc.).
// Protegido por header `Authorization: Bearer ${CRON_SECRET}` — não usa JWT
// porque é uma chamada de máquina, não de usuário.
//
// Uso (Railway Cron, segunda 9h):
//   curl -X POST https://savit.up.railway.app/api/jobs/weekly-summary \
//        -H "Authorization: Bearer $CRON_SECRET"

import { Router } from 'express';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/error.js';
import { runRecurringTasks } from '../jobs/recurring-tasks.js';
import { runTrialExpirer } from '../jobs/trial-expirer.js';
import { generateWeeklySummary } from '../services/weekly-summary.js';

export const jobsRouter: Router = Router();

jobsRouter.use((req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const expected = `Bearer ${env.CRON_SECRET}`;
  if (header !== expected) return next(new HttpError(401, 'invalid_cron_secret'));
  next();
});

jobsRouter.post('/weekly-summary', async (_req, res, next) => {
  try {
    // Para todo usuário com pelo menos 1 nota, gera o summary da semana
    const users = await prisma.user.findMany({ select: { id: true } });
    let generated = 0;
    let skipped = 0;
    for (const u of users) {
      const captured = await prisma.note.count({
        where: { userId: u.id, createdAt: { gte: weekStartUtc() } },
      });
      if (captured === 0) {
        skipped++;
        continue;
      }
      try {
        await generateWeeklySummary(u.id);
        generated++;
      } catch (err) {
        logger.error({ err, userId: u.id }, 'weekly-summary failed for user');
      }
    }
    logger.info({ generated, skipped }, 'weekly-summary job done');
    res.json({ generated, skipped });
  } catch (err) {
    next(err);
  }
});

jobsRouter.post('/trial-expirer', async (_req, res, next) => {
  try {
    const result = await runTrialExpirer();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

jobsRouter.post('/recurring-tasks', async (_req, res, next) => {
  try {
    const result = await runRecurringTasks();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

function weekStartUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const dow = d.getUTCDay();
  const diff = (dow + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}
