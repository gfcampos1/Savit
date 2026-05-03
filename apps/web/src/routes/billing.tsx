// Tela /billing — status atual + cards de plano + sheet de checkout.
// Pix/Boleto: redirect pra invoiceUrl Asaas. Cartão: form inline.

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import {
  useBillingStatus,
  useCancelSubscription,
  useCheckout,
  usePlans,
  type CheckoutInput,
  type PlanInfo,
} from '@/hooks/useBilling';
import { Sheet } from '@/components/Sheet';
import { ApiError } from '@/lib/api';
import { toast } from '@/stores/ui';
import type { SubscriptionPlan } from '@savit/shared';

export function BillingPage() {
  const user = useAuthStore((s) => s.user);
  const status = useBillingStatus();
  const plans = usePlans();
  const cancel = useCancelSubscription();
  const [checkoutPlan, setCheckoutPlan] = useState<PlanInfo | null>(null);

  async function onCancel() {
    if (!confirm('Cancelar assinatura? Você mantém acesso até o fim do período pago.')) return;
    try {
      await cancel.mutateAsync();
      toast({ message: 'Assinatura cancelada.', tone: 'success' });
    } catch {
      toast({ message: 'Não foi possível cancelar.', tone: 'danger' });
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pt-8 pb-32">
      <header className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">Assinatura</p>
        <h1 className="display-serif text-2xl mt-1">Plano</h1>
      </header>

      <CurrentStatusCard
        status={status.data ?? null}
        userEmail={user?.email ?? ''}
        onCancel={() => void onCancel()}
        canceling={cancel.isPending}
      />

      <h2 className="display-serif text-xl mt-10 mb-4">Planos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.data?.items.map((p) => (
          <PlanCard key={p.id} plan={p} onChoose={() => setCheckoutPlan(p)} />
        ))}
      </div>

      <p className="text-xs text-ink-3 mt-6 text-center">
        Pagamento processado por Asaas · Pix · cartão · boleto
      </p>

      {checkoutPlan ? (
        <CheckoutSheet
          plan={checkoutPlan}
          email={user?.email ?? ''}
          name={user?.name ?? ''}
          onClose={() => setCheckoutPlan(null)}
        />
      ) : null}
    </div>
  );
}

// ---------- Status atual ----------

function CurrentStatusCard({
  status,
  userEmail,
  onCancel,
  canceling,
}: {
  status: ReturnType<typeof useBillingStatus>['data'] | null;
  userEmail: string;
  onCancel: () => void;
  canceling: boolean;
}) {
  if (!status) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">
        carregando…
      </p>
    );
  }

  const labels: Record<string, { title: string; tone: string; sub?: string }> = {
    TRIALING: { title: 'Trial gratuito', tone: 'text-warning' },
    ACTIVE: { title: 'PRO ativo', tone: 'text-success' },
    PAST_DUE: { title: 'Pagamento atrasado', tone: 'text-danger' },
    CANCELED: { title: 'Cancelada', tone: 'text-ink-2' },
    BLOCKED: { title: 'Inativa', tone: 'text-danger' },
  };
  const meta = labels[status.status] ?? { title: status.status, tone: 'text-ink' };

  return (
    <article className="rounded-lg border hairline bg-surface p-5 shadow-card">
      <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3">{userEmail}</p>
      <p className={`display-serif text-2xl mt-1 ${meta.tone}`}>{meta.title}</p>
      {status.status === 'TRIALING' && status.trialEndsAt ? (
        <p className="text-sm text-ink-2 mt-2">
          Trial termina em <strong>{formatDate(status.trialEndsAt)}</strong>
        </p>
      ) : null}
      {status.status === 'ACTIVE' && status.currentPeriodEndsAt ? (
        <p className="text-sm text-ink-2 mt-2">
          Próxima renovação em <strong>{formatDate(status.currentPeriodEndsAt)}</strong>
        </p>
      ) : null}
      {status.status === 'CANCELED' && status.currentPeriodEndsAt ? (
        <p className="text-sm text-ink-2 mt-2">
          Acesso liberado até <strong>{formatDate(status.currentPeriodEndsAt)}</strong>
        </p>
      ) : null}

      {status.status === 'ACTIVE' || status.status === 'PAST_DUE' ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={canceling}
            className="text-xs text-danger hover:underline underline-offset-2"
          >
            {canceling ? 'cancelando…' : 'cancelar assinatura'}
          </button>
        </div>
      ) : null}
    </article>
  );
}

// ---------- Plan card ----------

function PlanCard({ plan, onChoose }: { plan: PlanInfo; onChoose: () => void }) {
  return (
    <article className="rounded-lg border hairline bg-surface p-5 shadow-card flex flex-col">
      <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3">
        {plan.cycle === 'MONTHLY' ? 'mensal' : 'anual'}
      </p>
      <p className="display-serif text-display text-ink mt-1 leading-none">
        {plan.priceFormatted}
        <span className="text-ink-3 text-base font-sans ml-1">
          /{plan.cycle === 'MONTHLY' ? 'mês' : 'ano'}
        </span>
      </p>
      {plan.cycle === 'YEARLY' ? (
        <p className="text-xs text-success mt-2">
          {plan.perMonthFormatted}/mês{plan.yearlySavings ? ` · economiza ${plan.yearlySavings}%` : ''}
        </p>
      ) : null}

      <ul className="text-sm text-ink-2 mt-4 space-y-1.5 flex-1">
        <li>· Notas, tarefas, kanban ilimitados</li>
        <li>· Voz, fotos, desenho, mind maps</li>
        <li>· Chat IA</li>
        <li>· Pagamento por Pix, cartão ou boleto</li>
      </ul>

      <button
        type="button"
        onClick={onChoose}
        className="mt-5 rounded-md bg-ink text-bg py-2.5 text-sm font-medium"
      >
        Assinar {plan.cycle === 'MONTHLY' ? 'mensal' : 'anual'}
      </button>
    </article>
  );
}

// ---------- Checkout Sheet ----------

function CheckoutSheet({
  plan,
  email,
  name,
  onClose,
}: {
  plan: PlanInfo;
  email: string;
  name: string;
  onClose: () => void;
}) {
  const checkout = useCheckout();
  const [billingType, setBillingType] = useState<'PIX' | 'CREDIT_CARD' | 'BOLETO'>('PIX');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Cartão
  const [cardName, setCardName] = useState(name);
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [ccv, setCcv] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [phone, setPhone] = useState('');

  async function submit() {
    setError(null);
    if (!cpf || cpf.replace(/\D/g, '').length < 11) {
      setError('CPF/CNPJ obrigatório.');
      return;
    }

    const input: CheckoutInput = {
      plan: plan.id as SubscriptionPlan,
      billingType,
      cpfCnpj: cpf,
      ...(billingType === 'CREDIT_CARD' && {
        creditCard: {
          holderName: cardName,
          number: cardNumber.replace(/\s/g, ''),
          expiryMonth: expMonth,
          expiryYear: expYear,
          ccv,
        },
        creditCardHolderInfo: {
          name: cardName,
          email,
          postalCode: postalCode.replace(/\D/g, ''),
          addressNumber,
          phone: phone || undefined,
        },
      }),
    };

    try {
      const res = await checkout.mutateAsync(input);
      onClose();
      // Pra Pix/Boleto, abrir invoiceUrl em nova aba
      if (res.invoiceUrl) {
        window.open(res.invoiceUrl, '_blank', 'noopener');
      }
      toast({
        message: billingType === 'CREDIT_CARD' ? 'Cobrança criada — aguardando processamento.' : 'Cobrança gerada — abra o link pra pagar.',
        tone: 'success',
        ttl: 6000,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setError('Pagamentos não estão disponíveis no momento.');
      } else if (err instanceof ApiError && err.status === 400) {
        setError('Verifique os dados.');
      } else {
        setError('Não foi possível processar agora.');
      }
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`Assinar ${plan.cycle === 'MONTHLY' ? 'mensal' : 'anual'}`}
      footer={
        <>
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-ink-2 hover:text-ink">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={checkout.isPending}
            className="rounded-md bg-ink text-bg px-4 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {checkout.isPending ? 'processando…' : `pagar ${plan.priceFormatted}`}
          </button>
        </>
      }
    >
      <div className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3 mb-2">
          Forma de pagamento
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(['PIX', 'CREDIT_CARD', 'BOLETO'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setBillingType(t)}
              aria-pressed={billingType === t}
              className={`rounded-md border py-2 text-xs font-medium transition-colors ${
                billingType === t
                  ? 'border-ink bg-ink text-bg'
                  : 'hairline text-ink-2 hover:text-ink'
              }`}
            >
              {t === 'PIX' ? 'Pix' : t === 'CREDIT_CARD' ? 'Cartão' : 'Boleto'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <label className="font-mono text-[11px] uppercase tracking-mono text-ink-3 block mb-1.5">
          CPF ou CNPJ
        </label>
        <input
          type="text"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          placeholder="000.000.000-00"
          className="w-full bg-transparent border-b hairline text-ink text-md py-2 outline-none focus:border-accent"
        />
      </div>

      {billingType === 'CREDIT_CARD' ? (
        <CardFields
          cardName={cardName}
          setCardName={setCardName}
          cardNumber={cardNumber}
          setCardNumber={setCardNumber}
          expMonth={expMonth}
          setExpMonth={setExpMonth}
          expYear={expYear}
          setExpYear={setExpYear}
          ccv={ccv}
          setCcv={setCcv}
          postalCode={postalCode}
          setPostalCode={setPostalCode}
          addressNumber={addressNumber}
          setAddressNumber={setAddressNumber}
          phone={phone}
          setPhone={setPhone}
        />
      ) : (
        <p className="text-xs text-ink-3 mt-4">
          Após confirmar, abrimos o link de pagamento no Asaas (Pix QR ou boleto).
          Seu acesso libera assim que o pagamento for confirmado.
        </p>
      )}

      {error ? (
        <p className="text-sm text-danger mt-4" role="alert">
          {error}
        </p>
      ) : null}
    </Sheet>
  );
}

function CardFields(props: {
  cardName: string;
  setCardName: (v: string) => void;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  expMonth: string;
  setExpMonth: (v: string) => void;
  expYear: string;
  setExpYear: (v: string) => void;
  ccv: string;
  setCcv: (v: string) => void;
  postalCode: string;
  setPostalCode: (v: string) => void;
  addressNumber: string;
  setAddressNumber: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
}) {
  return (
    <>
      <Field label="NOME NO CARTÃO" value={props.cardName} onChange={props.setCardName} />
      <Field
        label="NÚMERO DO CARTÃO"
        value={props.cardNumber}
        onChange={props.setCardNumber}
        placeholder="0000 0000 0000 0000"
        maxLength={19}
      />
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Field label="MÊS" value={props.expMonth} onChange={props.setExpMonth} placeholder="MM" maxLength={2} />
        <Field label="ANO" value={props.expYear} onChange={props.setExpYear} placeholder="AAAA" maxLength={4} />
        <Field label="CCV" value={props.ccv} onChange={props.setCcv} placeholder="123" maxLength={4} />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Field label="CEP" value={props.postalCode} onChange={props.setPostalCode} placeholder="00000-000" />
        <Field label="NÚMERO" value={props.addressNumber} onChange={props.setAddressNumber} placeholder="123" />
      </div>
      <Field label="TELEFONE (opcional)" value={props.phone} onChange={props.setPhone} placeholder="(11) 90000-0000" />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="mb-5">
      <label className="font-mono text-[11px] uppercase tracking-mono text-ink-3 block mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-transparent border-b hairline text-ink text-md py-2 outline-none focus:border-accent"
      />
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
