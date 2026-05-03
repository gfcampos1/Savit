// Modal global que abre quando a API retorna 402 (subscription_required).
// Não bloqueia a UI inteira — só explica e leva pra /billing.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAYWALL_EVENT, type PaywallEvent } from '@/lib/api';

export function PaywallModal() {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<PaywallEvent | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<PaywallEvent>).detail;
      setInfo(detail);
      setOpen(true);
    }
    window.addEventListener(PAYWALL_EVENT, handler);
    return () => window.removeEventListener(PAYWALL_EVENT, handler);
  }, []);

  if (!open) return null;

  const trialExpired =
    info?.status === 'TRIALING' && info?.trialEndsAt
      ? new Date(info.trialEndsAt).getTime() < Date.now()
      : false;

  const headline =
    info?.status === 'BLOCKED' || trialExpired
      ? 'Seu trial terminou.'
      : info?.status === 'PAST_DUE'
      ? 'Pagamento pendente.'
      : 'Assine pra continuar.';

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm grid place-items-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-bg rounded-lg shadow-card border hairline p-6"
      >
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">PRO</p>
        <h2 className="display-serif text-2xl mt-2">{headline}</h2>
        <p className="text-sm text-ink-2 mt-3">
          Pra criar, editar e usar IA, ative sua assinatura. Suas notas e tarefas existentes
          continuam acessíveis pra leitura.
        </p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 text-sm text-ink-2 hover:text-ink"
          >
            Depois
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/billing');
            }}
            className="rounded-md bg-ink text-bg px-4 py-2 text-sm font-medium"
          >
            Ver planos
          </button>
        </div>
      </div>
    </div>
  );
}
