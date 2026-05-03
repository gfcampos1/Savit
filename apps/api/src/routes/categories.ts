import { Router } from 'express';
import { z } from 'zod';
import { CategoryInput, CategoryPatch } from '@savit/shared';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireActive } from '../middleware/billing.js';
import { HttpError } from '../middleware/error.js';

export const categoriesRouter: Router = Router();

categoriesRouter.use(requireAuth);

const ListQuery = z.object({
  // Página de gerenciamento usa true; pickers/filters usam o default (ocultas omitidas).
  includeHidden: z.coerce.boolean().default(false),
});

categoriesRouter.get('/', async (req, res, next) => {
  try {
    const { includeHidden } = ListQuery.parse(req.query);
    // Conta tasks pendentes (não DONE/ARCHIVED) — métrica mais útil que total
    const items = await prisma.category.findMany({
      where: {
        userId: req.user!.id,
        ...(includeHidden ? {} : { hiddenAt: null }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: {
            notes: { where: { archivedAt: null } },
            tasks: { where: { status: { notIn: ['DONE', 'ARCHIVED'] } } },
          },
        },
      },
    });
    res.json({
      items: items.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        icon: c.icon,
        sortOrder: c.sortOrder,
        slug: c.slug,
        hiddenAt: c.hiddenAt?.toISOString() ?? null,
        noteCount: c._count.notes,
        taskCount: c._count.tasks,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

categoriesRouter.post('/', requireActive, async (req, res, next) => {
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

categoriesRouter.patch('/reorder', requireActive, async (req, res, next) => {
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

categoriesRouter.patch('/:id', requireActive, async (req, res, next) => {
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
      data: {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.color !== undefined && { color: patch.color }),
        ...(patch.icon !== undefined && { icon: patch.icon }),
        ...(patch.sortOrder !== undefined && { sortOrder: patch.sortOrder }),
        ...(patch.hiddenAt !== undefined && {
          hiddenAt: patch.hiddenAt ? new Date(patch.hiddenAt) : null,
        }),
      },
    });
    res.json({
      ...updated,
      hiddenAt: updated.hiddenAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

categoriesRouter.delete('/:id', requireActive, async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const existing = await prisma.category.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) throw new HttpError(404, 'not_found');
    if (existing.slug) throw new HttpError(400, 'cannot_delete_fixed');
    await prisma.category.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
