// Bottom-sheet em mobile, modal centrado em desktop. Backdrop com blur.
// Fecha por: clicar no backdrop, Esc, ou botão X.

import { useEffect, type ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Footer fixo (ex: botões salvar/cancelar). */
  footer?: ReactNode;
}

export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-bg rounded-t-lg sm:rounded-lg shadow-card border-t hairline sm:border max-h-[90vh] flex flex-col"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b hairline">
          <h2 className="display-serif text-lg text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="fechar"
            className="text-ink-3 hover:text-ink text-xl leading-none"
          >
            ×
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? (
          <footer className="border-t hairline p-3 flex items-center justify-end gap-2">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
