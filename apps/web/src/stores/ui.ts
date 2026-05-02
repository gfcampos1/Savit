// UI state global pequeno: command palette aberto/fechado + fila de toasts.

import { create } from 'zustand';

export type ToastTone = 'success' | 'info' | 'danger';

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
  /** Label do botão de ação inline (ex: "Desfazer"). */
  actionLabel?: string;
  onAction?: () => void;
  /** ms até auto-dismiss. Default 3500. Use Infinity pra sticky. */
  ttl?: number;
}

interface UIState {
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;

  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
}

let nextToastId = 1;

export const useUIStore = create<UIState>((set, get) => ({
  paletteOpen: false,
  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),

  toasts: [],
  pushToast: (t) => {
    const id = `t-${nextToastId++}`;
    const next: Toast = { ttl: 3500, ...t, id };
    set((s) => ({ toasts: [...s.toasts, next] }));
    if (next.ttl !== Infinity) {
      setTimeout(() => get().dismissToast(id), next.ttl ?? 3500);
    }
    return id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Helper conveniente fora de componentes (ex: catch blocks): */
export function toast(t: Omit<Toast, 'id'>): string {
  return useUIStore.getState().pushToast(t);
}
