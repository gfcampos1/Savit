import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const healthRouter: Router = Router();

// Liveness probe — processo vivo? Sempre 200 sem dependências externas.
// É o que o Railway/k8s usa pra decidir se reinicia o container. Não pode
// depender de DB ou serviço lento, senão um problema transitório vira
// crash loop.
healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    uptimeMs: Math.floor(process.uptime() * 1000),
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe — pronto pra servir tráfego? Testa DB com timeout curto.
// Use /api/health/ready em LBs ou monitoring se quiser checar dependências.
healthRouter.get('/ready', async (_req, res) => {
  const startedAt = Date.now();
  let db: 'ok' | 'error' | 'slow' = 'ok';
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, rej) => setTimeout(() => rej(new Error('db_timeout')), 2000)),
    ]);
  } catch (err) {
    db = (err as Error).message === 'db_timeout' ? 'slow' : 'error';
  }
  res
    .status(db === 'ok' ? 200 : 503)
    .json({
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      uptimeMs: Math.floor(process.uptime() * 1000),
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
});
