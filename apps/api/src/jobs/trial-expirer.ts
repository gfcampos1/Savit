// Cron diário: marca BLOCKED quem expirou trial sem pagar OU cancelou e o
// período corrente já venceu. Usuário pode resgatar a qualquer momento via
// nova subscription Asaas.

import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';

export async function runTrialExpirer(): Promise<{ trialExpired: number; periodExpired: number }> {
  const now = new Date();

  const [trialExpired, periodExpired] = await Promise.all([
    prisma.user.updateMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: { lt: now },
      },
      data: { status: 'BLOCKED' },
    }),
    prisma.user.updateMany({
      where: {
        status: 'CANCELED',
        currentPeriodEndsAt: { lt: now },
      },
      data: { status: 'BLOCKED' },
    }),
  ]);

  logger.info(
    { trialExpired: trialExpired.count, periodExpired: periodExpired.count },
    'trial-expirer rodou',
  );

  return { trialExpired: trialExpired.count, periodExpired: periodExpired.count };
}
