// Billing endpoints — status, planos, checkout (Asaas), cancel, webhook.

import { Router } from 'express';
import express from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import {
  AsaasError,
  cancelSubscription as asaasCancel,
  createCustomer,
  createSubscription,
  listSubscriptionPayments,
} from '../services/asaas.js';
import { formatBRL, getBillingState, invalidateBillingCache, listPlans } from '../services/billing.js';

export const billingRouter: Router = Router();

// ---------- Webhook (sem requireAuth, valida via header secret) ----------
//
// Definido ANTES do requireAuth pra rotas autenticadas mais abaixo.
// Recebe body bruto pra calcular HMAC se necessário no futuro.

billingRouter.post(
  '/webhook',
  express.json({ limit: '256kb' }),
  async (req, res) => {
    // Asaas autentica o webhook por header `asaas-access-token` configurável
    // no painel. Se ASAAS_WEBHOOK_TOKEN vazio em dev, deixamos passar (pra
    // rodar com ngrok sem fricção).
    const expected = env.ASAAS_WEBHOOK_TOKEN;
    const got = req.header('asaas-access-token') ?? '';
    if (expected && got !== expected) {
      logger.warn({ got: got.slice(0, 8) }, 'asaas webhook: token inválido');
      return res.status(401).json({ error: 'invalid_webhook_token' });
    }

    try {
      await handleAsaasWebhook(req.body);
      res.status(200).json({ ok: true });
    } catch (err) {
      logger.error({ err, payload: req.body }, 'asaas webhook handler failed');
      // 500 faz Asaas re-tentar; 200 confirma processamento. Aqui retornamos
      // 200 mesmo em erro pra evitar retry storm — temos BillingEvent persistido
      // pra debug. Pra retry, mude pra 500.
      res.status(200).json({ ok: true, error: 'handler_failed' });
    }
  },
);

// ---------- Endpoints autenticados ----------

billingRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const state = await getBillingState(req.user!.id);
    res.json({
      status: state.status,
      plan: state.plan,
      trialEndsAt: state.trialEndsAt?.toISOString() ?? null,
      currentPeriodEndsAt: state.currentPeriodEndsAt?.toISOString() ?? null,
      canWrite: state.canWrite,
    });
  } catch (err) {
    next(err);
  }
});

billingRouter.get('/plans', (_req, res) => {
  res.json({ items: listPlans() });
});

const CheckoutInput = z.object({
  plan: z.enum(['PRO_MONTHLY', 'PRO_YEARLY']),
  billingType: z.enum(['CREDIT_CARD', 'PIX', 'BOLETO']),
  cpfCnpj: z
    .string()
    .min(11)
    .max(18)
    .regex(/^[\d.\-/]+$/)
    .transform((s) => s.replace(/\D/g, '')),
  // Pra CREDIT_CARD: dados do cartão e holder
  creditCard: z
    .object({
      holderName: z.string().min(3),
      number: z.string().min(13).max(19),
      expiryMonth: z.string().min(2).max(2),
      expiryYear: z.string().min(4).max(4),
      ccv: z.string().min(3).max(4),
    })
    .optional(),
  creditCardHolderInfo: z
    .object({
      name: z.string(),
      email: z.string().email(),
      postalCode: z.string(),
      addressNumber: z.string(),
      phone: z.string().optional(),
    })
    .optional(),
});

billingRouter.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    const input = CheckoutInput.parse(req.body);
    if (input.billingType === 'CREDIT_CARD' && (!input.creditCard || !input.creditCardHolderInfo)) {
      throw new HttpError(400, 'credit_card_required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        asaasCustomerId: true,
        plan: true,
        status: true,
      },
    });
    if (!user) throw new HttpError(401, 'user_not_found');

    // 1. Garantir customer no Asaas
    let asaasCustomerId = user.asaasCustomerId;
    if (!asaasCustomerId) {
      const created = await createCustomer({
        name: user.name ?? user.email.split('@')[0] ?? 'Usuário',
        email: user.email,
        cpfCnpj: input.cpfCnpj,
      });
      asaasCustomerId = created.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { asaasCustomerId },
      });
    }

    // 2. Calcular valor + ciclo + próxima data
    const cycle = input.plan === 'PRO_MONTHLY' ? 'MONTHLY' : 'YEARLY';
    const valueCents =
      input.plan === 'PRO_MONTHLY' ? env.PLAN_MONTHLY_PRICE_BRL : env.PLAN_YEARLY_PRICE_BRL;
    const value = Math.round(valueCents) / 100;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDueDate = tomorrow.toISOString().slice(0, 10);

    // 3. Criar subscription no Asaas
    const sub = await createSubscription({
      customer: asaasCustomerId,
      billingType: input.billingType,
      cycle,
      value,
      nextDueDate,
      description: `Savit ${input.plan === 'PRO_MONTHLY' ? 'PRO mensal' : 'PRO anual'}`,
      ...(input.creditCard && {
        creditCard: input.creditCard,
        creditCardHolderInfo: {
          name: input.creditCardHolderInfo!.name,
          email: input.creditCardHolderInfo!.email,
          cpfCnpj: input.cpfCnpj,
          postalCode: input.creditCardHolderInfo!.postalCode,
          addressNumber: input.creditCardHolderInfo!.addressNumber,
          phone: input.creditCardHolderInfo!.phone,
        },
      }),
    });

    // 4. Persistir Subscription local (status TRIALING ainda — vira ACTIVE no webhook)
    await prisma.subscription.create({
      data: {
        userId: user.id,
        asaasSubscriptionId: sub.id,
        plan: input.plan,
        status: 'TRIALING',
      },
    });

    // 5. Buscar primeira cobrança gerada (Pix QR / Boleto / Invoice URL)
    let invoiceUrl: string | null = null;
    let pixQr: { encodedImage: string; payload: string; expirationDate: string } | null = null;
    let bankSlipUrl: string | null = null;
    if (input.billingType !== 'CREDIT_CARD') {
      // pequena espera — Asaas pode levar instantes pra criar a primeira cobrança
      const payments = await listSubscriptionPayments(sub.id).catch(() => []);
      const first = payments[0];
      if (first) {
        invoiceUrl = first.invoiceUrl ?? null;
        pixQr = first.pixQrCode ?? null;
        bankSlipUrl = first.bankSlipUrl ?? null;
      }
    }

    invalidateBillingCache(user.id);

    res.status(201).json({
      asaasSubscriptionId: sub.id,
      plan: input.plan,
      cycle,
      valueFormatted: formatBRL(valueCents),
      billingType: input.billingType,
      invoiceUrl,
      pixQr,
      bankSlipUrl,
      nextDueDate,
    });
  } catch (err) {
    if (err instanceof AsaasError) {
      return next(new HttpError(err.status, err.message, err.body));
    }
    next(err);
  }
});

billingRouter.post('/cancel', requireAuth, async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId: req.user!.id, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (!sub) throw new HttpError(404, 'no_active_subscription');

    await asaasCancel(sub.asaasSubscriptionId).catch((err) => {
      logger.warn({ err, asaasSubId: sub.asaasSubscriptionId }, 'asaas cancel failed (continuando)');
    });

    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'CANCELED', endedAt: new Date(), cancelReason: 'user_requested' },
      }),
      prisma.user.update({
        where: { id: req.user!.id },
        data: { status: 'CANCELED' },
      }),
    ]);

    invalidateBillingCache(req.user!.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ---------- Webhook handler ----------

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    value: number;
    status: string;
    nextDueDate?: string;
    dueDate?: string;
  };
  subscription?: {
    id: string;
    customer: string;
    nextDueDate: string;
  };
}

async function handleAsaasWebhook(body: unknown): Promise<void> {
  const payload = body as AsaasWebhookPayload;
  const event = payload.event;
  if (!event) {
    logger.warn({ body }, 'asaas webhook sem event');
    return;
  }

  // Resolver o user pelo customer Asaas
  const customerId = payload.payment?.customer ?? payload.subscription?.customer;
  if (!customerId) {
    logger.warn({ event }, 'asaas webhook sem customer');
    return;
  }
  const user = await prisma.user.findUnique({
    where: { asaasCustomerId: customerId },
    select: { id: true },
  });
  if (!user) {
    logger.warn({ event, customerId }, 'asaas webhook: customer desconhecido');
    return;
  }

  const asaasPaymentId = payload.payment?.id ?? null;

  // Idempotência: se já registramos este payment+event, skip
  if (asaasPaymentId) {
    const existing = await prisma.billingEvent.findFirst({
      where: { asaasPaymentId, type: event },
      select: { id: true },
    });
    if (existing) {
      logger.info({ event, asaasPaymentId }, 'webhook já processado, skip');
      return;
    }
  }

  await prisma.billingEvent.create({
    data: {
      userId: user.id,
      asaasPaymentId,
      type: event,
      status: payload.payment?.status ?? null,
      amount: payload.payment?.value ? payload.payment.value.toString() : null,
      payload: payload as unknown as Prisma.InputJsonValue,
    },
  });

  // Mapeia evento → status do user
  let userUpdate: Prisma.UserUpdateInput | null = null;
  let subUpdate: { status: 'ACTIVE' | 'CANCELED' } | null = null;

  if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
    // Pagamento confirmado → ativa user até nextDueDate
    const next = payload.payment?.nextDueDate ?? payload.payment?.dueDate;
    userUpdate = {
      status: 'ACTIVE',
      ...(next && { currentPeriodEndsAt: new Date(`${next}T23:59:59Z`) }),
    };
    subUpdate = { status: 'ACTIVE' };
  } else if (event === 'PAYMENT_OVERDUE') {
    userUpdate = { status: 'PAST_DUE' };
  } else if (
    event === 'SUBSCRIPTION_DELETED' ||
    event === 'SUBSCRIPTION_INACTIVATED'
  ) {
    userUpdate = { status: 'CANCELED' };
    subUpdate = { status: 'CANCELED' };
  }

  if (userUpdate) {
    await prisma.user.update({ where: { id: user.id }, data: userUpdate });
    invalidateBillingCache(user.id);
  }
  if (subUpdate && payload.subscription?.id) {
    await prisma.subscription.updateMany({
      where: { asaasSubscriptionId: payload.subscription.id },
      data: subUpdate,
    });
  }

  logger.info({ event, userId: user.id, status: userUpdate?.status }, 'asaas webhook processado');
}
