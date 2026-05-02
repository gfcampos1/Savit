import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';

export const meRouter: Router = Router();

meRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) throw new HttpError(401, 'user_not_found');
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
