import type { RequestHandler } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from './error.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'missing_token'));
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next(new HttpError(401, 'missing_token'));
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new HttpError(401, 'invalid_token'));
  }
};

/**
 * Encadeia requireAuth + checa role=ADMIN no DB.
 * Usar em todas as rotas /api/admin/*.
 */
export const requireAdmin: RequestHandler = async (req, _res, next) => {
  if (!req.user) {
    return next(new HttpError(401, 'missing_token'));
  }
  try {
    const u = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });
    if (!u || u.role !== 'ADMIN') {
      return next(new HttpError(403, 'admin_required'));
    }
    next();
  } catch (err) {
    next(err);
  }
};
