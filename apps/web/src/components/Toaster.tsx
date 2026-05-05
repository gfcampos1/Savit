// Renderiza a fila de toasts no canto inferior. Stacked, 3.5s auto-dismiss.

import { useUIStore } from '@/stores/ui';

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="notificações"
      // Mobile: bottom-52 (~208px) clareia o composer chat-style fixo da
      // Inbox/Tasks (bubble + tray de contexto + paddings ≈ 176-200px).
      // Desktop: vai pro canto inferior direito (composer central não bloqueia).
      className="fixed bottom-52 left-1/2 -translate-x-1/2 sm:bottom-4 sm:left-auto sm:right-4 sm:translate-x-0 z-40 flex flex-col gap-2 max-w-[calc(100%-2rem)] sm:max-w-xs"
    >
      {toasts.map((t) => {
        const cls =
          t.tone === 'success'
            ? 'bg-success/15 text-success border-success/30'
            : t.tone === 'danger'
            ? 'bg-danger/10 text-danger border-danger/30'
            : 'bg-ink text-bg border-transparent';
        return (
          <div
            key={t.id}
            role="status"
            className={`rounded-md border shadow-card px-3 py-2.5 text-sm flex items-center gap-3 ${cls}`}
          >
            <span className="flex-1">{t.message}</span>
            {t.actionLabel ? (
              <button
                type="button"
                onClick={() => {
                  t.onAction?.();
                  dismiss(t.id);
                }}
                className="font-mono text-[11px] uppercase tracking-mono opacity-90 hover:opacity-100"
              >
                {t.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="dispensar"
              className="opacity-60 hover:opacity-100 leading-none text-base"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
