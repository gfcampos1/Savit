import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { ApiError } from '@/lib/api';
import { AuthShell } from '@/components/auth/AuthShell';
import { Field } from '@/components/auth/Field';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';

interface LocationStateMaybe {
  from?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const googleExchange = useAuthStore((s) => s.googleExchange);

  const from = (location.state as LocationStateMaybe | null)?.from ?? '/';

  const rememberDefault = useAuthStore((s) => s.rememberMe);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(rememberDefault);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password, rememberMe });
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Email ou senha incorretos.');
      } else {
        setError('Não foi possível entrar agora. Tente de novo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      badge="ENTRAR"
      title={
        <>
          Suas ideias, <em className="text-accent not-italic font-normal italic">sempre à mão.</em>
        </>
      }
      tagline="sua segunda memória."
      footer={
        <p>
          Sem conta?{' '}
          <Link to="/register" className="underline underline-offset-2 text-ink">
            Criar uma
          </Link>
        </p>
      }
    >
      <div className="mb-6">
        <GoogleSignIn
          label="Entrar com Google"
          onCode={async (code) => {
            try {
              await googleExchange(code, rememberMe);
              navigate(from, { replace: true });
            } catch (err) {
              setError(
                err instanceof ApiError && err.status === 503
                  ? 'Login com Google não está disponível agora.'
                  : 'Não foi possível entrar com Google.',
              );
            }
          }}
        />
        <div className="flex items-center gap-3 mt-4 text-xs text-ink-3">
          <span className="flex-1 border-t hairline" aria-hidden />
          <span className="font-mono uppercase tracking-mono">ou</span>
          <span className="flex-1 border-t hairline" aria-hidden />
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <Field
          label="EMAIL"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="SENHA"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightLink={
            <a
              href="#"
              className="text-accent border-b border-dashed border-current"
              onClick={(e) => e.preventDefault()}
            >
              esqueci
            </a>
          }
        />

        <label className="flex items-center gap-2.5 mb-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 accent-accent cursor-pointer"
          />
          <span className="text-sm text-ink-2">Mantenha-me conectado</span>
        </label>

        {error ? (
          <p className="text-sm text-danger mb-4" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !email || !password}
          className="w-full rounded-md bg-ink text-bg py-3 text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          {submitting ? 'entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  );
}
