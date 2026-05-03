// Painel admin — exige role=ADMIN. Lista users, ajusta status/role, métricas.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { getMetrics, listUsers } from '../services/admin.js';

export const adminRouter: Router = Router();
adminRouter.use(requireAuth, requireAdmin);

// ---------- Métricas ----------

adminRouter.get('/metrics', async (_req, res, next) => {
  try {
    res.json(await getMetrics());
  } catch (err) {
    next(err);
  }
});

// ---------- Users ----------

const ListQuery = z.object({
  q: z.string().min(1).max(120).optional(),
  status: z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'BLOCKED']).optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

adminRouter.get('/users', async (req, res, next) => {
  try {
    const opts = ListQuery.parse(req.query);
    res.json(await listUsers(opts));
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/users/:id', async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const u = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        plan: true,
        trialEndsAt: true,
        currentPeriodEndsAt: true,
        asaasCustomerId: true,
        avatarUrl: true,
        googleId: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { notes: true, tasks: true, threads: true, attachments: true, subscriptions: true },
        },
      },
    });
    if (!u) throw new HttpError(404, 'not_found');
    res.json({
      ...u,
      hasGoogle: Boolean(u.googleId),
      hasPassword: Boolean(u.passwordHash),
      googleId: undefined,
      passwordHash: undefined,
      trialEndsAt: u.trialEndsAt?.toISOString() ?? null,
      currentPeriodEndsAt: u.currentPeriodEndsAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

const PatchInput = z.object({
  status: z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'BLOCKED']).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  trialEndsAt: z.string().datetime().nullable().optional(),
});

adminRouter.patch('/users/:id', async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const patch = PatchInput.parse(req.body);

    // Salvaguarda: admin não pode rebaixar a si mesmo
    if (id === req.user!.id && patch.role && patch.role !== 'ADMIN') {
      throw new HttpError(400, 'cannot_demote_self');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.role !== undefined && { role: patch.role }),
        ...(patch.trialEndsAt !== undefined && {
          trialEndsAt: patch.trialEndsAt ? new Date(patch.trialEndsAt) : null,
        }),
      },
      select: { id: true, email: true, status: true, role: true, trialEndsAt: true },
    });
    res.json({
      ...updated,
      trialEndsAt: updated.trialEndsAt?.toISOString() ?? null,
    });
  } catch (err) {
    next(err);
  }
});
