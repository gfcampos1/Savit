// Botão "Entrar com Google" — UI custom + OAuth code flow (popup).
//
// Lê o client_id de /api/auth/config em runtime (não depende de VITE_*).
// No clique abre popup do Google, recebe authorization code e devolve via
// onCode pra ser trocado por tokens no backend.

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface GoogleSignInProps {
  /** Callback com o code do OAuth — backend faz o exchange. */
  onCode: (code: string) => void | Promise<void>;
  /** Texto do botão. */
  label?: string;
}

const BUILD_TIME_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleSignIn({ onCode, label = 'Continuar com Google' }: GoogleSignInProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [clientId, setClientId] = useState<string | null>(BUILD_TIME_CLIENT_ID ?? null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const codeClientRef = useRef<{ requestCode: () => void } | null>(null);

  // 1. Busca client_id (runtime).
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

  // 2. Aguarda script GIS carregar.
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    let attempts = 0;
    function check() {
      if (cancelled) return;
      if (window.google?.accounts?.oauth2) {
        setScriptReady(true);
        return;
      }
      attempts++;
      if (attempts > 50) {
        setError('falha ao carregar Google Sign-In');
        return;
      }
      setTimeout(check, 100);
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  // 3. Inicializa o code client uma vez quando script + clientId prontos.
  useEffect(() => {
    if (!scriptReady || !clientId) return;
    try {
      codeClientRef.current = window.google!.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (resp) => {
          if (resp.error || !resp.code) {
            setBusy(false);
            setError('Login cancelado.');
            return;
          }
          try {
            await onCode(resp.code);
          } catch {
            setError('Não foi possível entrar com Google.');
          } finally {
            setBusy(false);
          }
        },
        error_callback: (err) => {
          setBusy(false);
          if (err.type !== 'popup_closed') {
            setError('Login cancelado.');
          }
        },
      });
    } catch (err) {
      console.error('GIS oauth2 init failed', err);
      setError('não foi possível inicializar o login Google');
    }
  }, [scriptReady, clientId, onCode]);

  function handleClick() {
    if (!codeClientRef.current || busy) return;
    setError(null);
    setBusy(true);
    codeClientRef.current.requestCode();
  }

  if (!configLoaded) return null;
  if (!clientId) return null;

  return (
    <div className="flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || !scriptReady}
        className="w-full flex items-center justify-center gap-3 rounded-md border hairline bg-surface text-ink py-3 text-sm font-medium hover:bg-surface-2 disabled:opacity-50 transition-colors"
      >
        <GoogleLogo />
        <span>{busy ? 'abrindo…' : label}</span>
      </button>
      {error ? (
        <p className="text-xs text-danger text-center" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
