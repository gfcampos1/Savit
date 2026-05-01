/**
 * Savit TweaksPanel — P-D
 *
 * Cog launcher (fixed top-right) + popover panel with two sections:
 *   - ACCENT pills (citrus / terra / amber / mint / purple / blue)
 *   - DENSIDADE pills (comfortable / compact)
 *
 * State is delegated to ThemeManager (already persists to localStorage).
 *
 * Source: Refactor/Savit (1)/prototype/views.jsx + tweaks-panel.jsx
 */
(function () {
    'use strict';

    let launcherEl = null;
    let panelEl = null;
    let closeBtnEl = null;
    let outsideHandler = null;
    let escHandler = null;

    function $(id) { return document.getElementById(id); }

    function isOpen() { return !!(panelEl && !panelEl.hidden); }

    function syncPills() {
        if (typeof ThemeManager === 'undefined' || typeof ThemeManager.updateButtons !== 'function') return;
        ThemeManager.updateButtons();
    }

    function open() {
        if (!panelEl) return;
        panelEl.hidden = false;
        if (launcherEl) launcherEl.setAttribute('aria-expanded', 'true');
        syncPills();
        // Outside click closes
        outsideHandler = (e) => {
            if (!panelEl || panelEl.hidden) return;
            if (panelEl.contains(e.target)) return;
            if (launcherEl && launcherEl.contains(e.target)) return;
            close();
        };
        // Esc closes
        escHandler = (e) => {
            if (e.key === 'Escape' && isOpen()) {
                e.stopPropagation();
                close();
            }
        };
        // Defer so the click that opened it doesn't immediately close.
        setTimeout(() => {
            document.addEventListener('click', outsideHandler, true);
            document.addEventListener('keydown', escHandler);
        }, 0);
    }

    function close() {
        if (!panelEl) return;
        panelEl.hidden = true;
        if (launcherEl) launcherEl.setAttribute('aria-expanded', 'false');
        if (outsideHandler) {
            document.removeEventListener('click', outsideHandler, true);
            outsideHandler = null;
        }
        if (escHandler) {
            document.removeEventListener('keydown', escHandler);
            escHandler = null;
        }
    }

    function toggle() {
        if (isOpen()) close();
        else open();
    }

    function bindPills() {
        if (!panelEl) return;
        panelEl.querySelectorAll('[data-accent-pill]').forEach(btn => {
            btn.addEventListener('click', () => {
                const accent = btn.dataset.accentPill;
                if (accent && typeof ThemeManager !== 'undefined' && ThemeManager.setAccent) {
                    ThemeManager.setAccent(accent);
                }
            });
        });
        panelEl.querySelectorAll('[data-density-pill]').forEach(btn => {
            btn.addEventListener('click', () => {
                const density = btn.dataset.densityPill;
                if (density && typeof ThemeManager !== 'undefined' && ThemeManager.setDensity) {
                    ThemeManager.setDensity(density);
                    syncPills();
                }
            });
        });
    }

    function init() {
        launcherEl = $('tweaksLauncher');
        panelEl = $('tweaksPanel');
        closeBtnEl = $('tweaksCloseBtn');
        if (!launcherEl || !panelEl) return;

        launcherEl.addEventListener('click', toggle);
        if (closeBtnEl) closeBtnEl.addEventListener('click', close);

        bindPills();
        syncPills();
    }

    document.addEventListener('DOMContentLoaded', init);

    window.TweaksPanel = { init, open, close, toggle, isOpen };
})();
