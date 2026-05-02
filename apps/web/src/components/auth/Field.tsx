import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  rightLink?: ReactNode;
  error?: string;
}

/**
 * Campo no estilo da SPEC §3.8: label MONO MAIÚSCULA acima da linha (sem caixa),
 * valor abaixo, hairline embaixo. Suporta um link à direita do label (ex: "esqueci").
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, rightLink, error, id, className = '', ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-1.5">
        <label htmlFor={inputId} className="label-mono">
          {label}
        </label>
        {rightLink ? <span className="text-xs">{rightLink}</span> : null}
      </div>
      <input
        id={inputId}
        ref={ref}
        {...rest}
        className={`w-full bg-transparent border-b hairline text-ink text-md py-2 outline-none focus:border-accent transition-colors ${className}`}
      />
      {error ? (
        <p className="text-xs text-danger mt-1.5" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-3 mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
});
