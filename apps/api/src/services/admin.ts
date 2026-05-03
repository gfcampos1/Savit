// Admin único definido por ADMIN_EMAIL/ADMIN_PASSWORD no env.
// Boot do API faz upsert (cria ou re-promove) com role=ADMIN.
// Mudou a senha no env? Próximo boot atualiza o hash.

import type { Prisma } from '@prisma/client';
import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { hashPassword } from '../lib/passwords.js';
import { ensureDefaultCategories } from './categories.js';

/**
 * Garante existência do user admin baseado em ADMIN_EMAIL/ADMIN_PASSWORD.
 * Idempotente: roda no boot do API.
 */
export async function ensureAdminUser(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    logger.info('admin: ADMIN_EMAIL/ADMIN_PASSWORD não setados — pulando seed');
    return;
  }
  const email = env.ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existing) {
    // Re-aplica a senha do env (deploy = rotação de senha) e força role=ADMIN
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, role: 'ADMIN' },
    });
    logger.info({ email }, 'admin: user existente promovido/sincronizado');
    return;
  }

  // Cria novo admin: status ACTIVE permanente (sem trial), trialEndsAt no futuro
  // distante pra não trigger paywall.
  const farFuture = new Date('2099-12-31T00:00:00.000Z');
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: env.ADMIN_NAME,
      role: 'ADMIN',
      status: 'ACTIVE',
      trialEndsAt: farFuture,
      currentPeriodEndsAt: farFuture,
    },
    select: { id: true },
  });
  await ensureDefaultCategories(created.id);
  logger.info({ email }, 'admin: user criado');
}

// ---------- Listagem / metrics ----------

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  status: string;
  plan: string | null;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  hasGoogle: boolean;
  hasPassword: boolean;
  createdAt: string;
  noteCount: number;
  taskCount: number;
}

export interface ListUsersOpts {
  q?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}

export async function listUsers(opts: ListUsersOpts): Promise<{
  items: AdminUserRow[];
  nextCursor: string | null;
}> {
  const where: Prisma.UserWhereInput = {};
  if (opts.q) {
    where.OR = [
      { email: { contains: opts.q, mode: 'insensitive' } },
      { name: { contains: opts.q, mode: 'insensitive' } },
    ];
  }
  if (opts.status) {
    where.status = opts.status as never;
  }

  const limit = Math.min(opts.limit ?? 50, 100);
  const items = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      plan: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
      googleId: true,
      passwordHash: true,
      createdAt: true,
      _count: { select: { notes: true, tasks: true } },
    },
  });

  const hasMore = items.length > limit;
  const trimmed = hasMore ? items.slice(0, -1) : items;

  return {
    items: trimmed.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      plan: u.plan,
      trialEndsAt: u.trialEndsAt?.toISOString() ?? null,
      currentPeriodEndsAt: u.currentPeriodEndsAt?.toISOString() ?? null,
      hasGoogle: Boolean(u.googleId),
      hasPassword: Boolean(u.passwordHash),
      createdAt: u.createdAt.toISOString(),
      noteCount: u._count.notes,
      taskCount: u._count.tasks,
    })),
    nextCursor: hasMore ? (trimmed[trimmed.length - 1]?.id ?? null) : null,
  };
}

export async function getMetrics(): Promise<{
  totalUsers: number;
  trialing: number;
  active: number;
  pastDue: number;
  blocked: number;
  canceled: number;
  mrrCents: number;
}> {
  const [totalUsers, byStatus] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ]);
  const map: Record<string, number> = Object.fromEntries(
    byStatus.map((b) => [b.status, b._count._all]),
  );

  // MRR estimado: count(active monthly) * monthly + count(active yearly) / 12 * yearly
  const activeByPlan = await prisma.user.groupBy({
    by: ['plan'],
    where: { status: 'ACTIVE', plan: { not: null } },
    _count: { _all: true },
  });
  let mrrCents = 0;
  for (const row of activeByPlan) {
    if (row.plan === 'PRO_MONTHLY') {
      mrrCents += row._count._all * env.PLAN_MONTHLY_PRICE_BRL;
    } else if (row.plan === 'PRO_YEARLY') {
      mrrCents += Math.round((row._count._all * env.PLAN_YEARLY_PRICE_BRL) / 12);
    }
  }

  return {
    totalUsers,
    trialing: map.TRIALING ?? 0,
    active: map.ACTIVE ?? 0,
    pastDue: map.PAST_DUE ?? 0,
    blocked: map.BLOCKED ?? 0,
    canceled: map.CANCELED ?? 0,
    mrrCents,
  };
}
