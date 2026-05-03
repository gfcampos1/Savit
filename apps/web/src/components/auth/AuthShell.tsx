import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AuthShellProps {
  badge: string;
  title: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Casca compartilhada das telas de auth.
 * Segue SPEC §3.8: logo S 44px sobre fundo ink, título Instrument Serif,
 * trecho com itálico + accent ("sempre à mão.").
 */
export function AuthShell({ badge, title, subtitle, footer, children }: AuthShellProps) {
  return (
    <main className="min-h-full flex flex-col px-6 pt-10 pb-8 max-w-md mx-auto">
      <header className="mb-10">
        <Link to="/" aria-label="Savit" className="inline-block">
          <img
            src="/icons/logo-dark.png"
            alt="Savit"
            width={44}
            height={44}
            className="rounded-md"
          />
        </Link>
        <p className="label-mono mt-7">{badge}</p>
        <h1 className="display-serif text-display mt-2 leading-tight">{title}</h1>
        {subtitle ? <p className="text-ink-2 text-md mt-3 max-w-prose">{subtitle}</p> : null}
      </header>

      <section className="flex-1">{children}</section>

      {footer ? (
        <footer className="mt-10 border-t hairline pt-6 text-sm text-ink-2">{footer}</footer>
      ) : null}
    </main>
  );
}
