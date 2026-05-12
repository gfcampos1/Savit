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

  // Limpa cache órfão do SW antigo (NetworkFirst em /api/* podia ter cacheado
  // 401 do /api/auth/refresh, deslogando o usuário em loop). Roda 1x por boot,
  // antes do registro novo. Idempotente — se o cache não existir, não faz nada.
  await wipeStaleApiCache();

  try {
    const { registerSW } = await import('virtual:pwa-register');
    // Sem `immediate: true`: o registro aguarda window.onload, e o SW novo
    // fica em waiting (registerType: 'prompt') até `updateNow` chamar
    // updateSW(true) — sem reload-surpresa zerando access token em memória.
    const updateSW = registerSW({
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

async function wipeStaleApiCache(): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n === 'savit-api' || n.startsWith('savit-api-'))
        .map((n) => caches.delete(n)),
    );
  } catch {
    /* navegadores raros sem CacheStorage — ignora */
  }
}
