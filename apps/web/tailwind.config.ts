import type { Config } from 'tailwindcss';

// Mapeia tokens da SPEC §1.2-1.4 (3 temas) via CSS vars definidas em tokens.css.
// Todos os componentes usam classes utilitárias (bg-surface, text-ink, etc.) e
// trocar `data-theme` no <html> reflete em todo o app sem JS.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-hi': 'var(--surface-hi, var(--surface-2))',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        hair: 'var(--hair)',
        'hair-hi': 'var(--hair-hi, var(--hair))',
        accent: 'var(--accent)',
        'accent-2': 'var(--accent-2, var(--accent))',
        'accent-3': 'var(--accent-3, var(--accent))',
        'accent-4': 'var(--accent-4, var(--accent))',
        'accent-soft': 'var(--accent-soft)',
        'accent-dim': 'var(--accent-dim, var(--accent))',
        success: 'var(--success, #3a8a6a)',
        warning: 'var(--warning, #e6b540)',
        danger: 'var(--danger, #c0563a)',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '1.4' }],
        sm: ['13px', { lineHeight: '1.5' }],
        md: ['14px', { lineHeight: '1.55' }],
        base: ['15px', { lineHeight: '1.55' }],
        lg: ['17px', { lineHeight: '1.4' }],
        xl: ['22px', { lineHeight: '1.25' }],
        '2xl': ['26px', { lineHeight: '1.2' }],
        display: ['40px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      letterSpacing: {
        mono: '0.14em',
        tight: '-0.02em',
      },
    },
  },
  plugins: [],
};

export default config;
