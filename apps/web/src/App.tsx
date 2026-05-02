import { useEffect, useState } from 'react';
import { THEMES, type Theme } from '@savit/shared';

type HealthState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; data: { status: string; db: string; latencyMs: number } }
  | { kind: 'error'; message: string };

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('savit_theme', theme);
  } catch {
    /* storage indisponível */
  }
}

export function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('savit_theme')) as Theme | null;
    return stored && THEMES.includes(stored) ? stored : 'paper';
  });
  const [health, setHealth] = useState<HealthState>({ kind: 'idle' });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  async function pingHealth() {
    setHealth({ kind: 'loading' });
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth({ kind: 'ok', data });
    } catch (err) {
      setHealth({ kind: 'error', message: err instanceof Error ? err.message : 'erro desconhecido' });
    }
  }

  return (
    <main className="min-h-full px-6 py-10 max-w-2xl mx-auto">
      <header className="mb-10">
        <p className="label-mono">F0 · BOOTSTRAP</p>
        <h1 className="display-serif text-display mt-2">Savit está de pé.</h1>
        <p className="text-ink-2 text-md mt-3 max-w-prose">
          Monorepo, Vite, Express e Prisma prontos. As próximas fases adicionam auth, captura, kanban,
          editores, IA e PWA.
        </p>
      </header>

      <section className="mb-10">
        <p className="label-mono mb-3">Tema</p>
        <div className="inline-flex gap-1 rounded-pill bg-surface-2 p-1">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`rounded-pill px-4 py-1.5 text-sm font-medium transition-colors ${
                t === theme ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border hairline border bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="label-mono">/api/health</p>
            <p className="text-ink-2 text-sm mt-1">
              Verifica se o backend Express e o Postgres estão de pé.
            </p>
          </div>
          <button
            onClick={pingHealth}
            disabled={health.kind === 'loading'}
            className="rounded-md bg-ink text-bg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {health.kind === 'loading' ? 'pingando…' : 'ping'}
          </button>
        </div>

        <div className="mt-4 font-mono text-sm">
          {health.kind === 'idle' && <p className="text-ink-3">aguardando…</p>}
          {health.kind === 'ok' && (
            <pre className="rounded-sm bg-surface-2 p-3 overflow-auto text-ink">
              {JSON.stringify(health.data, null, 2)}
            </pre>
          )}
          {health.kind === 'error' && (
            <p className="text-danger">erro: {health.message}</p>
          )}
        </div>
      </section>
    </main>
  );
}
