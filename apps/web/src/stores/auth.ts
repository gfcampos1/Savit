import { create } from 'zustand';
import type { MeResponse } from '@savit/shared';
import { api, configureApi, tryRefresh } from '@/lib/api';

interface AuthState {
  user: MeResponse | null;
  accessToken: string | null;
  status: 'unknown' | 'authed' | 'guest';
  setAuth: (user: MeResponse, accessToken: string) => void;
  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: MeResponse | null) => void;
  clear: () => void;
  bootstrap: () => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { email: string; password: string; name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  googleExchange: (code: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: 'unknown',

  setAuth: (user, accessToken) => set({ user, accessToken, status: 'authed' }),
  setAccessToken: (accessToken) =>
    set((s) => ({ accessToken, status: accessToken ? s.status : 'guest' })),
  setUser: (user) => set({ user }),
  clear: () => set({ user: null, accessToken: null, status: 'guest' }),

  bootstrap: async () => {
    // Refresh silencioso ao abrir o app. Usa tryRefresh do lib/api pra
    // compartilhar in-flight cache com o auto-refresh em 401 — sem isso
    // duas chamadas simultâneas (bootstrap + retry de query) com o mesmo
    // cookie disparam o revoke-all do backend, deslogando o usuário.
    const data = await tryRefresh();
    if (data) {
      set({ user: data.user, accessToken: data.accessToken, status: 'authed' });
    } else {
      get().clear();
    }
  },

  login: async (input) => {
    const data = await api<{ accessToken: string; user: MeResponse }>('/api/auth/login', {
      method: 'POST',
      body: input,
    });
    set({ user: data.user, accessToken: data.accessToken, status: 'authed' });
  },

  register: async (input) => {
    const data = await api<{ accessToken: string; user: MeResponse }>('/api/auth/register', {
      method: 'POST',
      body: input,
    });
    set({ user: data.user, accessToken: data.accessToken, status: 'authed' });
  },

  logout: async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      /* segue limpando local mesmo se falhar */
    }
    get().clear();
  },

  googleLogin: async (credential: string) => {
    const data = await api<{ accessToken: string; user: MeResponse }>('/api/auth/google', {
      method: 'POST',
      body: { credential },
    });
    set({ user: data.user, accessToken: data.accessToken, status: 'authed' });
  },

  googleExchange: async (code: string) => {
    const data = await api<{ accessToken: string; user: MeResponse }>(
      '/api/auth/google/exchange',
      { method: 'POST', body: { code } },
    );
    set({ user: data.user, accessToken: data.accessToken, status: 'authed' });
  },
}));

// Conecta o store ao fetch wrapper.
configureApi({
  getAccessToken: () => useAuthStore.getState().accessToken,
  setAccessToken: (token) => useAuthStore.getState().setAccessToken(token),
  onForcedLogout: () => useAuthStore.getState().clear(),
});
