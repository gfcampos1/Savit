import { buildServer } from './server.js';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { ensureAdminUser } from './services/admin.js';

// Tasks de boot — falhas aqui são fatais (não sobe o servidor com estado ruim).
async function boot() {
  await ensureAdminUser();
}

const app = buildServer();

await boot().catch((err) => {
  logger.fatal({ err }, 'boot failed');
  process.exit(1);
});

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, frontend: env.FRONTEND_URL },
    `🚀 Savit API listening on :${env.PORT}`,
  );
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
