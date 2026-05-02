import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { ApiError } from '@/lib/api';
import { AuthShell } from '@/components/auth/AuthShell';
import { Field } from '@/components/auth/Field';

// Política mínima do backend: ≥10 chars, letra+número.
function strengthScore(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 14) score++;
  return Math.min(score, 5);
}

const STRENGTH_COPY = ['muito fraca', 'fraca', 'razoável', 'boa', 'ótima'];

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = useMemo(() => strengthScore(password), [password]);
  const valid = password.length >= 10 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, name: name.trim() || undefined });
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Esse email já está em uso.');
      } else if (err instanceof ApiError && err.status === 400) {
        setError('Verifique seus dados e tente de novo.');
      } else {
        setError('Não conseguimos criar a conta agora. Tente de novo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      badge="CRIAR CONTA"
      title={
        <>
          Comece em <em className="text-accent not-italic italic">menos de um minuto.</em>
        </>
      }
      footer={
        <p>
          Já tem conta?{' '}
          <Link to="/login" className="underline underline-offset-2 text-ink">
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <Field
          label="NOME"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hint="aparece nas suas notas. opcional."
        />
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
          autoComplete="new-password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="ao menos 10 caracteres, com letras e números."
        />

        {/* barra de força (5 segmentos) */}
        <div className="flex gap-1 mb-1.5" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="h-1 flex-1 rounded-pill transition-colors"
              style={{
                background:
                  i < score
                    ? score >= 4
                      ? 'var(--success, #3a8a6a)'
                      : score >= 3
                      ? 'var(--accent)'
                      : 'var(--warning, #e6b540)'
                    : 'rgba(29,26,20,0.18)',
              }}
            />
          ))}
        </div>
        <p className="text-xs text-ink-3 mb-6">
          {password ? `força · ${STRENGTH_COPY[Math.max(0, score - 1)] ?? '—'}` : ' '}
        </p>

        {error ? (
          <p className="text-sm text-danger mb-4" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !email || !valid}
          className="w-full rounded-md bg-ink text-bg py-3 text-sm font-medium disabled:opacity-50 transition-opacity"
        >
          {submitting ? 'criando…' : 'Criar conta'}
        </button>
      </form>
    </AuthShell>
  );
}
