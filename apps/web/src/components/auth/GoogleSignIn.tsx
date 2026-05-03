// Botão "Entrar com Google" via Google Identity Services.
//
// Lê o client_id de /api/auth/config em runtime (não depende de VITE_*).
// Em produção sem GOOGLE_OAUTH_CLIENT_ID o componente esconde silenciosamente.

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface GoogleSignInProps {
  /** Callback com o credential JWT do Google. */
  onCredential: (credential: string) => void | Promise<void>;
  /** Texto do botão. */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

// Fallback de build-time pra dev local. Em prod, sempre vence o /api/auth/config.
const BUILD_TIME_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleSignIn({ onCredential, text = 'continue_with' }: GoogleSignInProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [clientId, setClientId] = useState<string | null>(BUILD_TIME_CLIENT_ID ?? null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Busca client_id do servidor (runtime). Sobrescreve o BUILD_TIME se vier.
  useEffect(() => {
    let cancelled = false;
    api<{ googleClientId: string | null }>('/api/auth/config')
      .then((cfg) => {
        if (cancelled) return;
        if (cfg.googleClientId) setClientId(cfg.googleClientId);
        setConfigLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setConfigLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    let attempts = 0;

    function tryInit() {
      if (cancelled) return;
      const g = window.google?.accounts?.id;
      if (!g) {
        attempts++;
        if (attempts > 50) {
          setError('falha ao carregar Google Sign-In');
          return;
        }
        setTimeout(tryInit, 100);
        return;
      }
      try {
        g.initialize({
          client_id: clientId!,
          callback: (resp) => {
            if (resp?.credential) void onCredential(resp.credential);
          },
          auto_select: false,
          use_fedcm_for_prompt: true,
        });
        if (containerRef.current) {
          g.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text,
            shape: 'rectangular',
            logo_alignment: 'center',
            locale: 'pt-BR',
            width: 320,
          });
        }
        setReady(true);
      } catch (err) {
        console.error('GIS init failed', err);
        setError('não foi possível inicializar o login Google');
      }
    }
    tryInit();
    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential, text]);

  // Enquanto não confirmou config, não mostra nada (evita flash).
  if (!configLoaded) return null;
  // Sem client_id → esconde silenciosamente.
  if (!clientId) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} aria-label="entrar com Google" />
      {!ready && !error ? (
        <span className="text-xs text-ink-3">carregando…</span>
      ) : null}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}
