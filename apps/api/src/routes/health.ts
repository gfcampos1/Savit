import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const healthRouter: Router = Router();

healthRouter.get('/', async (_req, res) => {
  const startedAt = Date.now();
  let db: 'ok' | 'error' = 'ok';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'error';
  }

  res.json({
    status: db === 'ok' ? 'ok' : 'degraded',
    db,
    uptimeMs: Math.floor(process.uptime() * 1000),
    latencyMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
});
