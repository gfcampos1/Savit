// Fetch wrapper com auto-refresh em 401. Acesso ao access token via getter
// (definido pelo auth store) pra evitar import circular.
//
// Uso:
//   const data = await api<MeResponse>('/api/me');
//   const created = await api('/api/notes', { method: 'POST', body: { ... } });

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

let refreshInFlight: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      return data.accessToken;
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
    const newToken = await tryRefresh();
    if (newToken) {
      return api<T>(path, { ...opts, _retry: true });
    }
    onForcedLogout();
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, payload, typeof payload === 'object' && payload !== null && 'error' in payload ? String((payload as Record<string, unknown>).error) : undefined);
  }

  return payload as T;
}
