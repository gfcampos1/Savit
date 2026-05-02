// Atalhos globais do app. Cmd/Ctrl+K abre command palette; Esc fecha.
// Ignoramos quando o foco está em campos editáveis (textarea/input/contenteditable)
// EXCETO ⌘K que sempre dispara.

import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui';

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useGlobalShortcuts() {
  const togglePalette = useUIStore((s) => s.togglePalette);
  const closePalette = useUIStore((s) => s.closePalette);
  const paletteOpen = useUIStore((s) => s.paletteOpen);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // ⌘K / Ctrl+K — sempre intercepta
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        togglePalette();
        return;
      }

      // Esc fecha palette quando aberto (qualquer foco)
      if (e.key === 'Escape' && paletteOpen) {
        e.preventDefault();
        closePalette();
        return;
      }

      // Atalhos sem-modifier (g i, /, etc) só fora de campos editáveis
      if (isEditable(e.target)) return;

      // / abre palette com modo busca (ainda usa o mesmo palette)
      if (e.key === '/' && !mod) {
        e.preventDefault();
        if (!paletteOpen) togglePalette();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePalette, closePalette, paletteOpen]);
}
