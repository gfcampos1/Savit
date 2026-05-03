import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AuthShellProps {
  badge: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Frase curta editorial em Fraunces itálico, abaixo do subtitle. */
  tagline?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Casca compartilhada das telas de auth (SPEC §3.8).
 * - Logo hero (96px mobile / 144px desktop), shadow-card.
 * - Marca-d'água "S" em Fraunces gigante no canto inferior direito.
 * - Tema Paper forçado independente da preferência do usuário (regra do SPEC
 *   pra contrato visual fixo: logo dark sobre fundo cream).
 */
export function AuthShell({ badge, title, subtitle, tagline, footer, children }: AuthShellProps) {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'paper');
    return () => {
      if (prev) root.setAttribute('data-theme', prev);
      else root.removeAttribute('data-theme');
    };
  }, []);

  return (
    <div className="relative overflow-hidden min-h-svh flex flex-col">
      <span aria-hidden className="auth-watermark">S</span>
      <main className="relative z-10 flex flex-col px-6 pt-12 pb-8 max-w-md mx-auto w-full flex-1">
        <header className="mb-12">
          <Link to="/" aria-label="Savit" className="inline-block">
            <img
              src="/icons/logo-dark.png"
              alt="Savit"
              width={144}
              height={144}
              className="h-24 w-24 sm:h-36 sm:w-36 rounded-lg shadow-card"
            />
          </Link>
          <p className="label-mono mt-8">{badge}</p>
          <h1 className="display-serif text-[44px] sm:text-[64px] leading-[1.02] tracking-tight mt-3">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-ink-2 text-md mt-4 max-w-prose">{subtitle}</p>
          ) : null}
          {tagline ? (
            <p className="font-serif italic text-ink-2 text-base mt-2">{tagline}</p>
          ) : null}
        </header>

        <section className="flex-1">{children}</section>

        {footer ? (
          <footer className="mt-10 border-t hairline pt-6 text-sm text-ink-2">{footer}</footer>
        ) : null}
      </main>
    </div>
  );
}
