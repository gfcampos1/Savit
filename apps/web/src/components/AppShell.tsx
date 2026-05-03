import { NavLink, Outlet } from 'react-router-dom';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { PaywallBanner } from '@/components/PaywallBanner';

/**
 * Shell do app autenticado.
 * - Header sticky em todas as resoluções com logo "Savit" e nav.
 * - Em mobile: nav rolagem horizontal (overflow-x-auto) — não quebra layout.
 * - Em desktop: nav alinhada à direita.
 */
export function AppShell() {
  const openPalette = useUIStore((s) => s.openPalette);
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  return (
    <div className="min-h-full flex flex-col">
      <PaywallBanner />
      <header className="sticky top-0 z-30 border-b hairline bg-bg/85 backdrop-blur">
        <nav className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-3 md:gap-5">
          <span className="display-serif text-lg text-ink shrink-0">Savit</span>
          <div className="flex-1 flex items-center gap-3 md:gap-4 overflow-x-auto md:overflow-visible md:justify-end no-scrollbar">
            <ShellLink to="/">Inbox</ShellLink>
            <ShellLink to="/tasks">Tarefas</ShellLink>
            <ShellLink to="/categories">Categorias</ShellLink>
            <ShellLink to="/chat">Chat ✦</ShellLink>
            <ShellLink to="/dashboard">Dashboard</ShellLink>
            {isAdmin ? <ShellLink to="/admin">Admin</ShellLink> : null}
            <ShellLink to="/profile">Perfil</ShellLink>
          </div>
          <button
            type="button"
            onClick={openPalette}
            aria-label="abrir comandos"
            title="Comandos (⌘K)"
            className="hidden md:inline-flex items-center gap-1.5 rounded-md border hairline bg-surface px-2 py-1 text-[11px] font-mono text-ink-3 hover:text-ink shrink-0"
          >
            <span>⌘</span>
            <span>K</span>
          </button>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function ShellLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `text-sm whitespace-nowrap transition-colors ${
          isActive ? 'text-ink font-medium' : 'text-ink-2 hover:text-ink'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
