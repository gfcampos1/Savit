// Botão "Entrar com Google" via Google Identity Services.
//
// Polling leve até o script GIS carregar (max 5s); depois inicializa,
// renderiza o botão e dispara callback com o ID token quando o usuário escolhe
// uma conta. Em produção sem VITE_GOOGLE_CLIENT_ID o componente esconde
// silenciosamente — não polui a UI.

import { useEffect, useRef, useState } from 'react';

interface GoogleSignInProps {
  /** Callback com o credential JWT do Google. */
  onCredential: (credential: string) => void | Promise<void>;
  /** Texto do botão. */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleSignIn({ onCredential, text = 'continue_with' }: GoogleSignInProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
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
          client_id: CLIENT_ID!,
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
  }, [onCredential, text]);

  if (!CLIENT_ID) {
    // Em dev sem CLIENT_ID, esconder silenciosamente
    return null;
  }
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
