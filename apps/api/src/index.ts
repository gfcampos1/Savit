import { buildServer } from './server.js';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { ensureAdminUser } from './services/admin.js';

const app = buildServer();

// Listenar PRIMEIRO pra healthcheck do Railway responder rápido.
// Tasks de boot (ensureAdminUser, etc) rodam em background depois.
const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, frontend: env.FRONTEND_URL },
    `🚀 Savit API listening on :${env.PORT}`,
  );
});

// Boot tasks pós-listen. Se o admin seed falhar (ex: DB lento ou connection
// recusada), log e segue — vai retentar em deploys subsequentes via redeploy.
// Tem timeout de 15s pra evitar warnings de unhandled promise pendurados.
void Promise.race([
  ensureAdminUser(),
  new Promise((_, rej) => setTimeout(() => rej(new Error('admin_seed_timeout_15s')), 15_000)),
]).catch((err) => {
  logger.error({ err }, 'admin seed failed (servidor segue rodando)');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
