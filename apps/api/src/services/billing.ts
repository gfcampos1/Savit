// Lógica de status de billing — quem pode escrever, quanto tempo de trial,
// preço dos planos, etc. Pequeno cache in-memory de status pra não bater no DB
// em toda request de write.

import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';

export type BillingStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'BLOCKED';
export type SubscriptionPlan = 'PRO_MONTHLY' | 'PRO_YEARLY';

export interface UserBillingState {
  status: BillingStatus;
  plan: SubscriptionPlan | null;
  trialEndsAt: Date | null;
  currentPeriodEndsAt: Date | null;
  /** Computado: pode escrever agora? */
  canWrite: boolean;
}

interface CacheEntry {
  state: UserBillingState;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry>();

export function invalidateBillingCache(userId: string): void {
  cache.delete(userId);
}

export async function getBillingState(userId: string): Promise<UserBillingState> {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.state;
  }

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      status: true,
      plan: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
    },
  });

  if (!u) {
    // user inexistente — bloqueia tudo
    return {
      status: 'BLOCKED',
      plan: null,
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      canWrite: false,
    };
  }

  const now = Date.now();
  let canWrite = false;
  if (u.status === 'TRIALING') {
    canWrite = u.trialEndsAt ? u.trialEndsAt.getTime() > now : false;
  } else if (u.status === 'ACTIVE' || u.status === 'PAST_DUE') {
    // PAST_DUE também pode escrever durante o grace period (currentPeriodEndsAt)
    canWrite = u.currentPeriodEndsAt ? u.currentPeriodEndsAt.getTime() > now : false;
  } else if (u.status === 'CANCELED') {
    // cancelou mas o período ainda está pago — escreve até acabar
    canWrite = u.currentPeriodEndsAt ? u.currentPeriodEndsAt.getTime() > now : false;
  }

  const state: UserBillingState = {
    status: u.status as BillingStatus,
    plan: u.plan as SubscriptionPlan | null,
    trialEndsAt: u.trialEndsAt,
    currentPeriodEndsAt: u.currentPeriodEndsAt,
    canWrite,
  };

  cache.set(userId, { state, expiresAt: now + CACHE_TTL_MS });
  return state;
}

export interface PlanInfo {
  id: SubscriptionPlan;
  cycle: 'MONTHLY' | 'YEARLY';
  priceCents: number;
  priceFormatted: string;
  perMonthFormatted: string;
  yearlySavings?: number;
}

export function listPlans(): PlanInfo[] {
  const monthly = env.PLAN_MONTHLY_PRICE_BRL;
  const yearly = env.PLAN_YEARLY_PRICE_BRL;
  const yearlyPerMonth = yearly / 12;
  const savings = Math.max(0, Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100));

  return [
    {
      id: 'PRO_MONTHLY',
      cycle: 'MONTHLY',
      priceCents: monthly,
      priceFormatted: formatBRL(monthly),
      perMonthFormatted: formatBRL(monthly),
    },
    {
      id: 'PRO_YEARLY',
      cycle: 'YEARLY',
      priceCents: yearly,
      priceFormatted: formatBRL(yearly),
      perMonthFormatted: formatBRL(Math.round(yearlyPerMonth)),
      yearlySavings: savings,
    },
  ];
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  );
}
