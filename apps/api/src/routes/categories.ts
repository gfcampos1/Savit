import { Router } from 'express';
import { z } from 'zod';
import { CategoryInput, CategoryPatch } from '@savit/shared';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';

export const categoriesRouter: Router = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get('/', async (req, res, next) => {
  try {
    const items = await prisma.category.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({
      items: items.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: c.icon,
        sortOrder: c.sortOrder,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

categoriesRouter.post('/', async (req, res, next) => {
  try {
    const input = CategoryInput.parse(req.body);
    const exists = await prisma.category.findUnique({
      where: { userId_name: { userId: req.user!.id, name: input.name } },
    });
    if (exists) throw new HttpError(409, 'name_taken');
    const created = await prisma.category.create({
      data: {
        userId: req.user!.id,
        name: input.name,
        color: input.color,
        icon: input.icon ?? null,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

categoriesRouter.patch('/reorder', async (req, res, next) => {
  try {
    const { ids } = z.object({ ids: z.array(z.string().cuid()).min(1) }).parse(req.body);
    const owned = await prisma.category.findMany({
      where: { userId: req.user!.id, id: { in: ids } },
      select: { id: true },
    });
    if (owned.length !== ids.length) throw new HttpError(404, 'category_not_found');
    await prisma.$transaction(
      ids.map((id, idx) =>
        prisma.category.update({ where: { id }, data: { sortOrder: idx } }),
      ),
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

categoriesRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const patch = CategoryPatch.parse(req.body);
    const existing = await prisma.category.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) throw new HttpError(404, 'not_found');
    if (patch.name && patch.name !== existing.name) {
      const dup = await prisma.category.findUnique({
        where: { userId_name: { userId: req.user!.id, name: patch.name } },
      });
      if (dup) throw new HttpError(409, 'name_taken');
    }
    const updated = await prisma.category.update({
      where: { id },
      data: patch,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

categoriesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const existing = await prisma.category.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) throw new HttpError(404, 'not_found');
    await prisma.category.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
