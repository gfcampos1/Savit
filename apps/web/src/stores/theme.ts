import { create } from 'zustand';
import { THEMES, type Theme } from '@savit/shared';

const STORAGE_KEY = 'savit_theme';

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.includes(stored as Theme)) return stored as Theme;
  } catch {
    /* indisponível */
  }
  return 'paper';
}

function applyToDom(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  // ajusta meta theme-color baseado no fundo do tema
  const colors: Record<Theme, string> = {
    paper: '#f6f1e8',
    snow: '#ffffff',
    playful: '#0e0a1a',
    linear: '#0a0c10',
  };
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = colors[theme];
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = readStoredTheme();
  applyToDom(initial);
  return {
    theme: initial,
    setTheme: (theme) => {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* indisponível */
      }
      applyToDom(theme);
      set({ theme });
    },
  };
});
