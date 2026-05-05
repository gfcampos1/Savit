import { useNavigate } from 'react-router-dom';
import { THEMES, type Theme } from '@savit/shared';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const initials = (user?.name ?? user?.email ?? '?').slice(0, 1).toUpperCase();

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <section className="max-w-2xl mx-auto px-6 py-10">
      <header className="flex items-center gap-4 mb-10">
        <div className="grid h-20 w-20 place-items-center rounded-md bg-ink text-bg display-serif text-2xl">
          {initials}
        </div>
        <div>
          <h1 className="display-serif text-2xl text-ink">{user?.name ?? 'Sem nome'}</h1>
          <p className="text-sm text-ink-2 mt-0.5">{user?.email}</p>
        </div>
      </header>

      <section className="mb-10">
        <p className="label-mono mb-3">APARÊNCIA · TEMA</p>
        <div className="inline-flex gap-1 rounded-pill bg-surface-2 p-1">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              aria-pressed={t === theme}
              className={`rounded-pill px-4 py-1.5 text-sm font-medium transition-colors ${
                t === theme ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {labelFor(t)}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-3 mt-2">muda na hora · persiste entre sessões</p>
      </section>

      <section className="border-t hairline pt-6">
        <button
          type="button"
          onClick={onLogout}
          className="rounded-md border border-danger/30 text-danger px-4 py-2 text-sm font-medium hover:bg-danger/5 transition-colors"
        >
          Sair
        </button>
      </section>
    </section>
  );
}

function labelFor(t: Theme): string {
  switch (t) {
    case 'paper':
      return 'Paper';
    case 'snow':
      return 'Snow';
    case 'playful':
      return 'Playful';
    case 'linear':
      return 'Linear';
  }
}
