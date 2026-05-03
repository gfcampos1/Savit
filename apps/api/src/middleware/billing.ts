// Bloqueia rotas de WRITE quando o usuário não tem assinatura ativa
// (trial expirado, cancelado vencido, ou explicitamente BLOCKED).
// Retorna 402 Payment Required com info pra UI montar o paywall.

import type { RequestHandler } from 'express';
import { getBillingState } from '../services/billing.js';
import { HttpError } from './error.js';

export const requireActive: RequestHandler = async (req, _res, next) => {
  if (!req.user) {
    return next(new HttpError(401, 'missing_token'));
  }
  try {
    const state = await getBillingState(req.user.id);
    if (state.canWrite) return next();

    next(
      new HttpError(402, 'subscription_required', {
        status: state.status,
        plan: state.plan,
        trialEndsAt: state.trialEndsAt?.toISOString() ?? null,
        currentPeriodEndsAt: state.currentPeriodEndsAt?.toISOString() ?? null,
      }),
    );
  } catch (err) {
    next(err);
  }
};
