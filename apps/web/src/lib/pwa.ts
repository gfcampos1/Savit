// Registro do service worker via virtual:pwa-register (vite-plugin-pwa).
// Expõe um pequeno EventTarget que a UI escuta pra mostrar o toast de update.

type Listener = (state: PWAState) => void;

export interface PWAState {
  /** Service worker disponível pra instalar (uma versão nova baixou). */
  needRefresh: boolean;
  /** App pronto pra rodar offline (primeiro install do SW). */
  offlineReady: boolean;
  /** chama isso pra ativar o novo SW e recarregar. */
  updateNow?: () => Promise<void>;
}

const listeners = new Set<Listener>();
let state: PWAState = { needRefresh: false, offlineReady: false };

export function onPWAState(fn: Listener): () => void {
  listeners.add(fn);
  fn(state); // entrega o estado atual imediatamente
  return () => {
    listeners.delete(fn);
  };
}

function emit(next: Partial<PWAState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
}

/** Registra o SW. Chamar UMA vez no boot (em main.tsx). */
export async function registerSW(): Promise<void> {
  if (typeof window === 'undefined' || import.meta.env.DEV) return;
  try {
    const { registerSW } = await import('virtual:pwa-register');
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        emit({
          needRefresh: true,
          updateNow: async () => {
            await updateSW(true);
          },
        });
      },
      onOfflineReady() {
        emit({ offlineReady: true });
      },
    });
  } catch (err) {
    // virtual:pwa-register só existe quando vite-plugin-pwa rodou — em dev,
    // não. Não é erro real.
    console.debug('PWA registration skipped:', err);
  }
}
