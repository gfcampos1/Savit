// Banner sticky topo do AppShell mostrando o status de billing.
// Aparece em: trial (dias restantes), past_due, blocked. Esconde em ACTIVE.

import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export function PaywallBanner() {
  const user = useAuthStore((s) => s.user);
  if (!user || !user.status) return null;

  // Admin não vê banner — tem trial infinito por design.
  if (user.role === 'ADMIN') return null;

  const status = user.status;

  if (status === 'ACTIVE') return null;

  if (status === 'TRIALING') {
    const daysLeft = user.trialEndsAt
      ? Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000)
      : 0;
    if (daysLeft > 7) return null; // só sinaliza nos últimos 7 dias
    return (
      <Banner tone="warning">
        <strong>Trial</strong> · {daysLeft > 0 ? `${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'} restantes` : 'expirou'} ·{' '}
        <Link to="/billing" className="underline underline-offset-2">
          assinar agora
        </Link>
      </Banner>
    );
  }

  if (status === 'PAST_DUE') {
    return (
      <Banner tone="danger">
        <strong>Pagamento atrasado</strong> · regularize pra continuar usando ·{' '}
        <Link to="/billing" className="underline underline-offset-2">
          ir pra cobrança
        </Link>
      </Banner>
    );
  }

  if (status === 'BLOCKED') {
    return (
      <Banner tone="danger">
        <strong>Assinatura inativa</strong> · você só pode visualizar suas notas ·{' '}
        <Link to="/billing" className="underline underline-offset-2">
          reativar
        </Link>
      </Banner>
    );
  }

  if (status === 'CANCELED') {
    const endsAt = user.currentPeriodEndsAt ? new Date(user.currentPeriodEndsAt) : null;
    const stillActive = endsAt && endsAt.getTime() > Date.now();
    if (!stillActive) return null;
    const daysLeft = endsAt
      ? Math.ceil((endsAt.getTime() - Date.now()) / 86400000)
      : 0;
    return (
      <Banner tone="warning">
        <strong>Cancelada</strong> · acesso até {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} ·{' '}
        <Link to="/billing" className="underline underline-offset-2">
          reativar
        </Link>
      </Banner>
    );
  }

  return null;
}

function Banner({ tone, children }: { tone: 'warning' | 'danger'; children: React.ReactNode }) {
  const cls =
    tone === 'warning'
      ? 'bg-warning/15 text-warning'
      : 'bg-danger/15 text-danger';
  return (
    <div
      role="status"
      className={`px-4 py-1.5 text-center text-xs font-mono uppercase tracking-mono ${cls}`}
    >
      {children}
    </div>
  );
}
