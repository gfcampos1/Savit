// Diálogo de confirmação custom — substitui window.confirm() com um modal
// que casa com o design do app. API imperativa: chama confirm({...}) e
// recebe Promise<boolean>.

import { create } from 'zustand';

export type ConfirmTone = 'neutral' | 'danger';

export interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface PendingConfirm extends ConfirmOptions {
  id: number;
  resolve: (ok: boolean) => void;
}

interface ConfirmState {
  current: PendingConfirm | null;
  ask: (opts: ConfirmOptions) => Promise<boolean>;
  resolve: (ok: boolean) => void;
}

let nextId = 1;

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  current: null,
  ask: (opts) => {
    return new Promise<boolean>((resolve) => {
      // Se já tem um aberto, fecha como cancelado pra evitar fila confusa.
      const existing = get().current;
      if (existing) existing.resolve(false);
      set({ current: { ...opts, id: nextId++, resolve } });
    });
  },
  resolve: (ok) => {
    const c = get().current;
    if (!c) return;
    c.resolve(ok);
    set({ current: null });
  },
}));

/** Helper imperativo pra usar fora de componentes (substitui window.confirm). */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().ask(opts);
}
