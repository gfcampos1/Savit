// Host do diálogo de confirmação custom. Mount uma vez em App.tsx;
// abre/fecha automaticamente conforme o store.

import { useEffect, useRef } from 'react';
import { useConfirmStore } from '@/stores/confirm';

export function ConfirmDialog() {
  const current = useConfirmStore((s) => s.current);
  const resolve = useConfirmStore((s) => s.resolve);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!current) return;
    confirmBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        resolve(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        resolve(true);
      }
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [current, resolve]);

  if (!current) return null;

  const tone = current.tone ?? 'neutral';
  const confirmClass =
    tone === 'danger'
      ? 'bg-danger text-bg hover:opacity-90'
      : 'bg-ink text-bg hover:opacity-90';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={() => resolve(false)}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-bg rounded-lg shadow-card border hairline p-5"
      >
        <h2 id="confirm-title" className="display-serif text-xl text-ink leading-tight">
          {current.title}
        </h2>
        {current.body ? (
          <p className="text-sm text-ink-2 mt-2 leading-relaxed">{current.body}</p>
        ) : null}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => resolve(false)}
            className="px-3 py-2 text-sm text-ink-2 hover:text-ink"
          >
            {current.cancelLabel ?? 'Cancelar'}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => resolve(true)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-opacity ${confirmClass}`}
          >
            {current.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
