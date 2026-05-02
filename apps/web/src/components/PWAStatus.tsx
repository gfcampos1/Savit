// Banner offline + toast de update do PWA. Renderizado no topo de tudo
// (no AppShell, fora do <main>).
//
// - OfflineBanner: amber sticky no topo enquanto navigator.onLine === false.
//   Some 2s depois de voltar online com mensagem de sucesso.
// - UpdateToast: pop-up no canto inferior quando o SW baixou nova versão.
//   Botão "Atualizar" aplica o skipWaiting e recarrega.

import { useEffect, useState } from 'react';
import { onPWAState, type PWAState } from '@/lib/pwa';

export function PWAStatus() {
  return (
    <>
      <OfflineBanner />
      <UpdateToast />
    </>
  );
}

// ---------- Offline banner ----------

function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [recentlyOnline, setRecentlyOnline] = useState(false);

  useEffect(() => {
    function on() {
      setOnline(true);
      setRecentlyOnline(true);
      setTimeout(() => setRecentlyOnline(false), 2500);
    }
    function off() {
      setOnline(false);
    }
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online && !recentlyOnline) return null;

  return (
    <div
      role="status"
      className={`fixed top-0 inset-x-0 z-40 px-4 py-1.5 text-center text-xs font-mono uppercase tracking-mono ${
        online ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
      }`}
    >
      {online ? '· de volta online ✓' : '· sem conexão · alterações sincronizam quando voltar'}
    </div>
  );
}

// ---------- Update toast ----------

function UpdateToast() {
  const [state, setState] = useState<PWAState>({ needRefresh: false, offlineReady: false });
  const [installed, setInstalled] = useState(false);

  useEffect(() => onPWAState(setState), []);

  // toast "instalado offline-ready" some sozinho em 4s
  useEffect(() => {
    if (state.offlineReady && !installed) {
      setInstalled(true);
      const t = setTimeout(() => setInstalled(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state.offlineReady, installed]);

  if (state.needRefresh) {
    return (
      <div
        role="status"
        className="fixed bottom-4 right-4 z-40 max-w-xs bg-ink text-bg rounded-md shadow-lg px-3 py-2.5 text-sm flex items-center gap-3"
      >
        <span className="font-mono text-[10px] uppercase tracking-mono text-bg/60">novo</span>
        <span className="flex-1">Versão nova disponível.</span>
        <button
          type="button"
          onClick={() => void state.updateNow?.()}
          className="rounded bg-accent text-bg px-2 py-1 text-xs font-medium"
        >
          Atualizar
        </button>
      </div>
    );
  }

  if (installed) {
    return (
      <div
        role="status"
        className="fixed bottom-4 right-4 z-40 max-w-xs bg-surface border hairline rounded-md shadow-card px-3 py-2 text-xs text-ink-2"
      >
        ✦ Pronto pra usar offline.
      </div>
    );
  }

  return null;
}
