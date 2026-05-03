import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

/** Bloqueia rotas exigindo authed; redireciona pra /login mantendo `from`. */
export function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'unknown') {
    return <FullPageLoader label="carregando…" />;
  }
  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/** Bloqueia rotas de admin pra users sem role=ADMIN. */
export function RequireAdmin() {
  const status = useAuthStore((s) => s.status);
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const location = useLocation();

  if (status === 'unknown') {
    return <FullPageLoader label="carregando…" />;
  }
  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

/** Inverso: usuário logado não vê /login ou /register. */
export function RequireGuest() {
  const status = useAuthStore((s) => s.status);
  if (status === 'unknown') return <FullPageLoader label="carregando…" />;
  if (status === 'authed') return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Faz refresh silencioso ao carregar o app. */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);
  return <>{children}</>;
}

function FullPageLoader({ label }: { label: string }) {
  return (
    <div className="min-h-full grid place-items-center bg-bg text-ink-3">
      <p className="label-mono">{label}</p>
    </div>
  );
}
