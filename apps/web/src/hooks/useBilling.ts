import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BillingStatus, SubscriptionPlan } from '@savit/shared';
import { api } from '@/lib/api';

export interface BillingMe {
  status: BillingStatus;
  plan: SubscriptionPlan | null;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  canWrite: boolean;
}

export interface PlanInfo {
  id: SubscriptionPlan;
  cycle: 'MONTHLY' | 'YEARLY';
  priceCents: number;
  priceFormatted: string;
  perMonthFormatted: string;
  yearlySavings?: number;
}

const KEY = ['billing'] as const;

export function useBillingStatus() {
  return useQuery({
    queryKey: [...KEY, 'me'],
    queryFn: () => api<BillingMe>('/api/billing/me'),
    staleTime: 30_000,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: [...KEY, 'plans'],
    queryFn: () => api<{ items: PlanInfo[] }>('/api/billing/plans'),
    staleTime: 60 * 60 * 1000,
  });
}

export interface CheckoutInput {
  plan: SubscriptionPlan;
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  cpfCnpj: string;
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
    postalCode: string;
    addressNumber: string;
    phone?: string;
  };
}

export interface CheckoutResponse {
  asaasSubscriptionId: string;
  plan: SubscriptionPlan;
  cycle: 'MONTHLY' | 'YEARLY';
  valueFormatted: string;
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  invoiceUrl: string | null;
  pixQr: { encodedImage: string; payload: string; expirationDate: string } | null;
  bankSlipUrl: string | null;
  nextDueDate: string;
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) =>
      api<CheckoutResponse>('/api/billing/checkout', { method: 'POST', body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api('/api/billing/cancel', { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
