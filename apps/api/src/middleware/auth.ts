import type { RequestHandler } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
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
