import { NavLink, Outlet } from 'react-router-dom';

/** Shell mínima do app autenticado. F1 = só nav top + outlet. F2 redesenha. */
export function AppShell() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 border-b hairline bg-bg/80 backdrop-blur">
        <nav className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-4">
          <span className="display-serif text-lg text-ink">Savit</span>
          <div className="flex-1" />
          <ShellLink to="/">Inbox</ShellLink>
          <ShellLink to="/profile">Perfil</ShellLink>
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
        `text-sm transition-colors ${isActive ? 'text-ink font-medium' : 'text-ink-2 hover:text-ink'}`
      }
    >
      {children}
    </NavLink>
  );
}
