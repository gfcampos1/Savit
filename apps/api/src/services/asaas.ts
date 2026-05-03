// Cliente HTTP minimal pra Asaas. API REST, auth via header `access_token`.
// Doc: https://docs.asaas.com/

import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';

export const isAsaasConfigured = (): boolean => Boolean(env.ASAAS_API_KEY);

if (!isAsaasConfigured()) {
  logger.warn(
    'asaas: ASAAS_API_KEY vazio — checkout e cancelamento retornam 503 até configurar.',
  );
}

export class AsaasError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

export type BillingType = 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'UNDEFINED';
export type AsaasCycle = 'MONTHLY' | 'YEARLY';

interface AsaasFetchInit {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

async function asaasFetch<T>(path: string, init: AsaasFetchInit = {}): Promise<T> {
  if (!isAsaasConfigured()) {
    throw new AsaasError(503, 'asaas_not_configured');
  }
  const url = `${env.ASAAS_BASE_URL.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    method: init.method ?? 'GET',
    headers: {
      access_token: env.ASAAS_API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': 'Savit/1.0',
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error({ status: res.status, path, body }, 'asaas: request failed');
    throw new AsaasError(res.status, 'asaas_request_failed', body);
  }
  return (await res.json()) as T;
}

// ---------- Customers ----------

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
}

export async function createCustomer(input: {
  name: string;
  email: string;
  cpfCnpj?: string;
  mobilePhone?: string;
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: input,
  });
}

export async function getCustomer(id: string): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(`/customers/${id}`);
}

// ---------- Subscriptions ----------

export interface AsaasSubscription {
  id: string;
  customer: string;
  cycle: AsaasCycle;
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  billingType: BillingType;
}

export interface CreateSubscriptionInput {
  customer: string;
  billingType: BillingType;
  cycle: AsaasCycle;
  /** Em reais (Asaas usa double, não centavos). */
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  description?: string;
  /** Pra cartão recorrente: token gerado no Asaas (tokenize antes). */
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone?: string;
  };
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: input,
  });
}

export async function cancelSubscription(asaasSubId: string): Promise<{ deleted: boolean; id: string }> {
  return asaasFetch<{ deleted: boolean; id: string }>(`/subscriptions/${asaasSubId}`, {
    method: 'DELETE',
  });
}

export async function getSubscription(asaasSubId: string): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${asaasSubId}`);
}

// ---------- Invoices / Payments listing ----------

export interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string;
  value: number;
  netValue: number;
  status: string;
  dueDate: string;
  paymentDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  /** PIX payload */
  pixQrCode?: { encodedImage: string; payload: string; expirationDate: string };
}

export async function listSubscriptionPayments(asaasSubId: string): Promise<AsaasPayment[]> {
  const res = await asaasFetch<{ data: AsaasPayment[] }>(
    `/subscriptions/${asaasSubId}/payments?status=PENDING&limit=1`,
  );
  return res.data ?? [];
}

export async function getPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${paymentId}`);
}
