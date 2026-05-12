import { create } from 'zustand';
import type { MeResponse } from '@savit/shared';
import { api, configureApi, tryRefresh } from '@/lib/api';

// Chaves de localStorage. Guardamos só dados públicos do user (sem tokens).
const STORAGE_KEY = 'savit:last-user';
const REMEMBER_KEY = 'savit:remember-me';

// Quanto antes da expiração disparar o refresh proativo.
const REFRESH_LEAD_MS = 60_000;
// Janela mínima entre refreshes disparados por visibility/online.
const VISIBILITY_REFRESH_GAP_MS = 5 * 60_000;
// Backoff do bootstrap em erro de rede.
const BOOTSTRAP_BACKOFF_MS = [1_000, 3_000, 8_000];

interface AuthResponseShape {
  user: MeResponse;
  accessToken: string;
  accessExpiresInMs: number;
}

interface AuthState {
  user: MeResponse | null;
  accessToken: string | null;
  accessExpiresAt: number | null;
  lastRefreshAt: number | null;
  status: 'unknown' | 'authed' | 'guest';
  rememberMe: boolean;
  setAuth: (user: MeResponse, accessToken: string, accessExpiresInMs: number) => void;
  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: MeResponse | null) => void;
  clear: () => void;
  hydrate: () => void;
  bootstrap: () => Promise<void>;
  login: (input: { email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name?: string;
    rememberMe?: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: (credential: string, rememberMe?: boolean) => Promise<void>;
  googleExchange: (code: string, rememberMe?: boolean) => Promise<void>;
}

function readLastUser(): MeResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MeResponse;
  } catch {
    return null;
  }
}

function writeLastUser(user: MeResponse | null): void {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode / quota — ignora */
  }
}

function readRememberMe(): boolean {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    // default ON: na ausência de preferência, mantemos conectado.
    if (raw === null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}

function writeRememberMe(value: boolean): void {
  try {
    localStorage.setItem(REMEMBER_KEY, value ? '1' : '0');
  } catch {
    /* ignora */
  }
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function clearRefreshTimer(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  accessExpiresAt: null,
  lastRefreshAt: null,
  status: 'unknown',
  rememberMe: typeof window !== 'undefined' ? readRememberMe() : true,

  setAuth: (user, accessToken, accessExpiresInMs) => {
    set({
      user,
      accessToken,
      accessExpiresAt: Date.now() + accessExpiresInMs,
      lastRefreshAt: Date.now(),
      status: 'authed',
    });
    writeLastUser(user);
    scheduleProactiveRefresh();
  },

  setAccessToken: (accessToken) => {
    // Atualização interna pelo tryRefresh — não mexe em status pra não derrubar
    // sessão entre refreshes (auto-refresh roda em background).
    set({ accessToken });
  },

  setUser: (user) => {
    set({ user });
    writeLastUser(user);
  },

  clear: () => {
    clearRefreshTimer();
    set({
      user: null,
      accessToken: null,
      accessExpiresAt: null,
      lastRefreshAt: null,
      status: 'guest',
    });
    writeLastUser(null);
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const last = readLastUser();
    if (last) {
      // Otimista: mostra app autenticado de cara enquanto bootstrap roda.
      // Se o cookie tiver expirado de verdade, bootstrap retorna unauthorized
      // e cai pra /login. Mas em 90% dos casos refresh funciona e UI nunca
      // mostra "deslogado".
      set({ user: last, status: 'authed' });
    }
  },

  bootstrap: async () => {
    // Refresh silencioso ao abrir o app, resiliente a falhas de rede.
    // Só desloga em 401/403 explícito do backend — erro de rede mantém o
    // estado hidratado (se houver lastUser) ou unknown→guest se for primeira vez.
    for (let attempt = 0; attempt <= BOOTSTRAP_BACKOFF_MS.length; attempt++) {
      const outcome = await tryRefresh();
      if (outcome.ok) {
        const { user, accessToken, accessExpiresInMs } = outcome.data;
        set({
          user,
          accessToken,
          accessExpiresAt: Date.now() + accessExpiresInMs,
          lastRefreshAt: Date.now(),
          status: 'authed',
        });
        writeLastUser(user);
        scheduleProactiveRefresh();
        return;
      }
      if (outcome.reason === 'unauthorized') {
        get().clear();
        return;
      }
      const delay = BOOTSTRAP_BACKOFF_MS[attempt];
      if (delay === undefined) break;
      await sleep(delay);
    }
    // Esgotou retries por erro de rede. Se já hidratamos com lastUser, mantém
    // UI autenticada — próximas requests vão tentar refresh on-demand. Sem
    // lastUser, vira guest (primeira vez no app, sem cache).
    const current = get();
    if (current.user) {
      set({ status: 'authed', accessToken: null });
    } else {
      get().clear();
    }
  },

  login: async ({ email, password, rememberMe }) => {
    const remember = rememberMe ?? get().rememberMe;
    const data = await api<AuthResponseShape>('/api/auth/login', {
      method: 'POST',
      body: { email, password, rememberMe: remember },
    });
    writeRememberMe(remember);
    set({ rememberMe: remember });
    get().setAuth(data.user, data.accessToken, data.accessExpiresInMs);
  },

  register: async ({ email, password, name, rememberMe }) => {
    const remember = rememberMe ?? get().rememberMe;
    const data = await api<AuthResponseShape>('/api/auth/register', {
      method: 'POST',
      body: { email, password, name, rememberMe: remember },
    });
    writeRememberMe(remember);
    set({ rememberMe: remember });
    get().setAuth(data.user, data.accessToken, data.accessExpiresInMs);
  },

  logout: async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      /* segue limpando local mesmo se falhar */
    }
    get().clear();
  },

  googleLogin: async (credential, rememberMe) => {
    const remember = rememberMe ?? get().rememberMe;
    const data = await api<AuthResponseShape>('/api/auth/google', {
      method: 'POST',
      body: { credential, rememberMe: remember },
    });
    writeRememberMe(remember);
    set({ rememberMe: remember });
    get().setAuth(data.user, data.accessToken, data.accessExpiresInMs);
  },

  googleExchange: async (code, rememberMe) => {
    const remember = rememberMe ?? get().rememberMe;
    const data = await api<AuthResponseShape>('/api/auth/google/exchange', {
      method: 'POST',
      body: { code, rememberMe: remember },
    });
    writeRememberMe(remember);
    set({ rememberMe: remember });
    get().setAuth(data.user, data.accessToken, data.accessExpiresInMs);
  },
}));

function scheduleProactiveRefresh(): void {
  clearRefreshTimer();
  const { accessExpiresAt } = useAuthStore.getState();
  if (accessExpiresAt === null) return;
  const ms = accessExpiresAt - Date.now() - REFRESH_LEAD_MS;
  if (ms <= 0) {
    void doProactiveRefresh();
    return;
  }
  refreshTimer = setTimeout(() => {
    void doProactiveRefresh();
  }, ms);
}

async function doProactiveRefresh(): Promise<void> {
  const outcome = await tryRefresh();
  if (outcome.ok) {
    const { user, accessToken, accessExpiresInMs } = outcome.data;
    useAuthStore.setState({
      user,
      accessToken,
      accessExpiresAt: Date.now() + accessExpiresInMs,
      lastRefreshAt: Date.now(),
      status: 'authed',
    });
    writeLastUser(user);
    scheduleProactiveRefresh();
    return;
  }
  if (outcome.reason === 'unauthorized') {
    useAuthStore.getState().clear();
  }
  // network — silencia; visibility/online ou próxima request do user tentam de novo.
}

// Listeners de ciclo de vida — idempotentes, registrados 1x por boot do módulo.
function installLifecycleListeners(): void {
  if (typeof window === 'undefined') return;
  type WindowMarker = Window & { __savitAuthLifecycle?: boolean };
  const w = window as WindowMarker;
  if (w.__savitAuthLifecycle) return;
  w.__savitAuthLifecycle = true;

  const maybeRefresh = (): void => {
    const state = useAuthStore.getState();
    if (state.status !== 'authed') return;
    const last = state.lastRefreshAt ?? 0;
    if (Date.now() - last < VISIBILITY_REFRESH_GAP_MS) return;
    void doProactiveRefresh();
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') maybeRefresh();
  });
  window.addEventListener('online', maybeRefresh);
}

// Hydrate síncrono + listeners no boot. O AuthBootstrap (React) dispara o
// bootstrap async em useEffect logo depois — esse hydrate só evita o flash de
// "loader/login" entre o boot e a primeira resposta do refresh.
if (typeof window !== 'undefined') {
  useAuthStore.getState().hydrate();
  installLifecycleListeners();
}

configureApi({
  getAccessToken: () => useAuthStore.getState().accessToken,
  setAccessToken: (token) => useAuthStore.getState().setAccessToken(token),
  onForcedLogout: () => useAuthStore.getState().clear(),
});
