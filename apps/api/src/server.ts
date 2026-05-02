import express from 'express';
import type { Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import { env } from './lib/env.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { healthRouter } from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function buildServer(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false, // configurar quando o frontend final estiver definido
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // request log mínimo
  app.use((req, _res, next) => {
    logger.debug({ method: req.method, path: req.path }, 'req');
    next();
  });

  // ----- API routes -----
  app.use('/api/health', healthRouter);

  // ----- Static frontend (produção) -----
  // Em prod o build do web está em apps/web/dist; servimos como SPA fallback.
  const webDist = path.resolve(__dirname, '../../web/dist');
  if (env.NODE_ENV === 'production' && existsSync(webDist)) {
    app.use(express.static(webDist, { maxAge: '1y', index: false }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(webDist, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
