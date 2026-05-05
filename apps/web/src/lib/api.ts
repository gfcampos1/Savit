// Fetch wrapper com auto-refresh em 401. Acesso ao access token via getter
// (definido pelo auth store) pra evitar import circular.
//
// Uso:
//   const data = await api<MeResponse>('/api/me');
//   const created = await api('/api/notes', { method: 'POST', body: { ... } });

import type { MeResponse } from '@savit/shared';

type AccessTokenGetter = () => string | null;
type AccessTokenSetter = (token: string | null) => void;
type LogoutHook = () => void;

let getAccessToken: AccessTokenGetter = () => null;
let setAccessToken: AccessTokenSetter = () => {};
let onForcedLogout: LogoutHook = () => {};

export function configureApi(opts: {
  getAccessToken: AccessTokenGetter;
  setAccessToken: AccessTokenSetter;
  onForcedLogout: LogoutHook;
}) {
  getAccessToken = opts.getAccessToken;
  setAccessToken = opts.setAccessToken;
  onForcedLogout = opts.onForcedLogout;
}

/**
 * Evento global emitido quando a API retorna 402 Payment Required em um write.
 * O componente PaywallModal escuta e abre.
 */
export interface PaywallEvent {
  status?: string;
  trialEndsAt?: string | null;
  currentPeriodEndsAt?: string | null;
}

export const PAYWALL_EVENT = 'savit:paywall';
export function emitPaywall(detail: PaywallEvent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<PaywallEvent>(PAYWALL_EVENT, { detail }));
}

export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
  }
}

interface RequestOpts {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** internal — usado pra evitar loop infinito no refresh */
  _retry?: boolean;
}

export interface RefreshResult {
  accessToken: string;
  user: MeResponse;
}

let refreshInFlight: Promise<RefreshResult | null> | null = null;

/**
 * Faz POST /api/auth/refresh com in-flight dedup: chamadas concorrentes
 * compartilham o MESMO request HTTP. Crítico pra evitar a race onde duas
 * chamadas simultâneas com o mesmo cookie de refresh disparam o
 * "revoke-all-tokens" no backend (ele detecta reuse do token).
 *
 * Setta o accessToken no store automaticamente em sucesso. Caller é
 * responsável por persistir o `user` se precisar (bootstrap faz).
 */
export async function tryRefresh(): Promise<RefreshResult | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as RefreshResult;
      setAccessToken(data.accessToken);
      return data;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function api<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers ?? {}),
  };

  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    credentials: 'include',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (res.status === 401 && !opts._retry && !path.startsWith('/api/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return api<T>(path, { ...opts, _retry: true });
    }
    onForcedLogout();
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    // 402 Payment Required = bloqueio de billing → emite evento global pra
    // PaywallModal abrir. Mantém o throw pra quem chamou ainda saber.
    if (res.status === 402 && typeof payload === 'object' && payload !== null) {
      const p = payload as Record<string, unknown> & { details?: Record<string, unknown> };
      const details = (p.details ?? {}) as Record<string, unknown>;
      emitPaywall({
        status: details.status as string | undefined,
        trialEndsAt: (details.trialEndsAt as string | null | undefined) ?? null,
        currentPeriodEndsAt: (details.currentPeriodEndsAt as string | null | undefined) ?? null,
      });
    }
    throw new ApiError(res.status, payload, typeof payload === 'object' && payload !== null && 'error' in payload ? String((payload as Record<string, unknown>).error) : undefined);
  }

  return payload as T;
}
