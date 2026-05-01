/**
 * Savit Toast — non-blocking feedback notifications.
 * S2 / Bug fix §7.13.
 */
(function () {
    'use strict';

    function ensureRoot() {
        let root = document.getElementById('toastRoot');
        if (!root) {
            root = document.createElement('div');
            root.id = 'toastRoot';
            root.className = 'toast-root';
            root.setAttribute('aria-live', 'polite');
            document.body.appendChild(root);
        }
        return root;
    }

    const MAX_VISIBLE = 3;

    function show(text, opts) {
        opts = opts || {};
        const type = opts.type || 'info';
        const action = opts.action || null;
        const duration = typeof opts.duration === 'number'
            ? opts.duration
            : (action ? 5000 : 3000);

        const root = ensureRoot();

        // Dedupe: if a toast with the same text + type is already visible, just
        // reset its timer (avoids spam from rapid identical actions).
        const existing = Array.from(root.children).find((el) => {
            const m = el.querySelector('.toast__msg');
            return m && m.textContent === text && el.classList.contains('toast--' + type);
        });
        if (existing && existing.__resetTimer) {
            existing.__resetTimer(duration);
            return { dismiss: existing.__dismiss };
        }

        // Cap visible toasts at MAX_VISIBLE — drop oldest non-leaving one.
        while (root.children.length >= MAX_VISIBLE) {
            const oldest = Array.from(root.children).find((el) => !el.classList.contains('toast--leaving'));
            if (!oldest) break;
            oldest.classList.add('toast--leaving');
            setTimeout(() => oldest.remove(), 200);
        }

        const toast = document.createElement('div');
        toast.className = 'toast toast--' + type;
        toast.setAttribute('role', 'status');

        const msg = document.createElement('span');
        msg.className = 'toast__msg';
        msg.textContent = text;
        toast.appendChild(msg);

        let timer = null;
        const dismiss = (skipAction) => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            toast.classList.add('toast--leaving');
            setTimeout(() => toast.remove(), 200);
        };
        const resetTimer = (ms) => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => dismiss(false), ms);
        };
        // Expose for dedupe path
        toast.__resetTimer = resetTimer;
        toast.__dismiss = dismiss;

        if (action && action.label && typeof action.onClick === 'function') {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'toast__action';
            btn.textContent = action.label;
            btn.addEventListener('click', () => {
                try { action.onClick(); }
                finally { dismiss(true); }
            });
            toast.appendChild(btn);
        }

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'toast__close';
        close.setAttribute('aria-label', 'Fechar');
        close.textContent = '×';
        close.addEventListener('click', () => dismiss(false));
        toast.appendChild(close);

        root.appendChild(toast);
        // Trigger enter animation on next frame
        requestAnimationFrame(() => toast.classList.add('toast--in'));

        timer = setTimeout(() => dismiss(false), duration);

        return { dismiss };
    }

    function success(text, opts) { return show(text, Object.assign({}, opts, { type: 'success' })); }
    function error(text, opts)   { return show(text, Object.assign({}, opts, { type: 'error' })); }

    window.Toast = { show, success, error };
})();
