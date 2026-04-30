/**
 * Savit Command Palette — S5 / F2
 * Quick-action overlay accessible via ⌘K / Ctrl+K.
 * Searches across actions, categories and recent messages,
 * with a smart-preview line for parser-detected intent.
 */
(function () {
    'use strict';

    let overlay = null;
    let inputEl = null;
    let listEl = null;
    let smartEl = null;
    let activeItem = -1;
    let items = []; // current rendered items
    let opened = false;

    function ensureOverlay() {
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = 'commandPalette';
        overlay.className = 'cmd-palette';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Paleta de comandos');
        overlay.hidden = true;
        overlay.innerHTML = ''
            + '<div class="cmd-palette__backdrop" data-cmd-close="1"></div>'
            + '<div class="cmd-palette__panel">'
            +   '<div class="cmd-palette__input-row">'
            +     '<i class="fas fa-magnifying-glass" aria-hidden="true"></i>'
            +     '<input type="text" id="cmdPaletteInput" class="cmd-palette__input" placeholder="Capturar, buscar, ir para…" autocomplete="off" />'
            +     '<kbd class="cmd-palette__kbd">esc</kbd>'
            +   '</div>'
            +   '<div class="cmd-palette__smart" id="cmdPaletteSmart" hidden></div>'
            +   '<div class="cmd-palette__list" id="cmdPaletteList" role="listbox"></div>'
            +   '<div class="cmd-palette__footer">'
            +     '<span><kbd>↑↓</kbd> navegar</span>'
            +     '<span><kbd>↵</kbd> selecionar</span>'
            +     '<span><kbd>esc</kbd> fechar</span>'
            +   '</div>'
            + '</div>';
        document.body.appendChild(overlay);

        inputEl = overlay.querySelector('#cmdPaletteInput');
        listEl = overlay.querySelector('#cmdPaletteList');
        smartEl = overlay.querySelector('#cmdPaletteSmart');

        overlay.addEventListener('click', (e) => {
            if (e.target.dataset && e.target.dataset.cmdClose === '1') close();
        });

        inputEl.addEventListener('input', () => render());
        inputEl.addEventListener('keydown', onKeydown);

        return overlay;
    }

    function getActions() {
        const isApp = !!(typeof App !== 'undefined' && typeof App.navigateTo === 'function');
        const a = [];
        if (isApp) {
            a.push({ id: 'capture',   icon: 'fa-plus',          label: 'Capturar nova ideia',          group: 'Ações',
                run: () => { App.navigateTo('chat'); requestAnimationFrame(() => DOM.messageInput && DOM.messageInput.focus && DOM.messageInput.focus()); } });
            a.push({ id: 'go-inbox',  icon: 'fa-inbox',         label: 'Ir para Inbox',                group: 'Ações',
                run: () => App.navigateTo('chat') });
            a.push({ id: 'go-tasks',  icon: 'fa-list-check',    label: 'Ir para Tarefas',              group: 'Ações',
                run: () => App.navigateTo('kanban') });
            a.push({ id: 'go-dash',   icon: 'fa-chart-simple',  label: 'Ir para Dashboard',            group: 'Ações',
                run: () => App.navigateTo('home') });
            a.push({ id: 'go-cats',   icon: 'fa-folder-open',   label: 'Ir para Categorias',           group: 'Ações',
                run: () => App.navigateTo('categories') });
            a.push({ id: 'go-profile',icon: 'fa-user',          label: 'Ir para Perfil',               group: 'Ações',
                run: () => App.navigateTo('profile') });
            a.push({ id: 'go-focus',  icon: 'fa-bolt',          label: 'Iniciar modo foco',            group: 'Ações',
                run: () => { if (typeof FocusMode !== 'undefined') FocusMode.start(); } });
            a.push({ id: 'theme-paper',  icon: 'fa-file-lines',           label: 'Tema · Papel',     group: 'Aparência',
                run: () => { if (typeof ThemeManager !== 'undefined') ThemeManager.setTheme('paper'); } });
            a.push({ id: 'theme-playful',icon: 'fa-wand-magic-sparkles',  label: 'Tema · Vibrante',  group: 'Aparência',
                run: () => { if (typeof ThemeManager !== 'undefined') ThemeManager.setTheme('playful'); } });
            a.push({ id: 'theme-linear', icon: 'fa-grip-lines',           label: 'Tema · Linear',    group: 'Aparência',
                run: () => { if (typeof ThemeManager !== 'undefined') ThemeManager.setTheme('linear'); } });
        }
        return a;
    }

    function getCategoryItems() {
        if (typeof AppState === 'undefined' || !Array.isArray(AppState.categories)) return [];
        return AppState.categories.map(c => ({
            id: 'cat-' + c.id,
            icon: 'fa-folder',
            iconColor: c.color,
            label: c.name,
            group: 'Categorias',
            run: () => App.openCategoryMessages(c.id)
        }));
    }

    function getRecentItems(query) {
        if (typeof AppState === 'undefined' || !Array.isArray(AppState.messages)) return [];
        const messages = AppState.messages.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const matches = messages
            .filter(m => {
                const text = stripHtml(m.text || '').toLowerCase();
                return text.includes((query || '').toLowerCase());
            })
            .slice(0, 6);
        return matches.map(m => {
            const plain = stripHtml(m.text || '');
            const label = plain.length > 80 ? plain.slice(0, 80) + '…' : plain;
            return {
                id: 'msg-' + m.id,
                icon: m.isTask ? 'fa-list-check' : 'fa-comment',
                label: label || 'Sem texto',
                group: query ? 'Resultados' : 'Recentes',
                run: () => {
                    close();
                    App.openEditMessageModal(m.id);
                }
            };
        });
    }

    function stripHtml(s) {
        const tmp = document.createElement('div');
        tmp.innerHTML = String(s || '');
        return (tmp.textContent || tmp.innerText || '').trim();
    }

    function fuzzyScore(needle, hay) {
        if (!needle) return 1;
        needle = needle.toLowerCase();
        hay = (hay || '').toLowerCase();
        if (hay.includes(needle)) return 0.9 - (hay.indexOf(needle) / Math.max(hay.length, 1)) * 0.1;
        return 0;
    }

    function render() {
        const q = (inputEl.value || '').trim();
        // Smart preview via parser
        if (q && window.ParseNatural) {
            const parsed = ParseNatural.parse(q, AppState.categories || []);
            if (parsed && (parsed.isTask || parsed.parts.length > 0)) {
                const bits = [];
                bits.push('<i class="fas fa-bolt" aria-hidden="true"></i>');
                bits.push('<span class="cmd-smart__label">Smart</span>');
                bits.push('<span class="cmd-smart__text">' + escapeHtml(parsed.cleanText || q) + '</span>');
                if (parsed.isTask) bits.push('<span class="cmd-smart__chip">Tarefa</span>');
                for (const p of parsed.parts) {
                    bits.push('<span class="cmd-smart__chip">' + escapeHtml(ParseNatural.chipLabel(p)) + '</span>');
                }
                smartEl.innerHTML = bits.join('');
                smartEl.hidden = false;
                smartEl.dataset.parsedText = q;
            } else {
                smartEl.hidden = true;
            }
        } else {
            smartEl.hidden = true;
        }

        const all = [].concat(getActions(), getCategoryItems(), getRecentItems(q));
        const filtered = q
            ? all.map(it => ({ it, score: fuzzyScore(q, it.label) })).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.it)
            : all.filter(it => it.group === 'Ações' || it.group === 'Recentes').slice(0, 12);

        items = filtered;
        activeItem = filtered.length ? 0 : -1;

        // Group rendering
        let html = '';
        let lastGroup = null;
        items.forEach((it, idx) => {
            if (it.group !== lastGroup) {
                html += '<div class="cmd-palette__group">' + escapeHtml(it.group) + '</div>';
                lastGroup = it.group;
            }
            const colorStyle = it.iconColor ? (' style="color:' + escapeHtml(it.iconColor) + '"') : '';
            html += '<button type="button" class="cmd-palette__item" role="option" data-idx="' + idx + '">'
                + '<i class="fas ' + escapeHtml(it.icon || 'fa-circle') + '"' + colorStyle + ' aria-hidden="true"></i>'
                + '<span class="cmd-palette__label">' + escapeHtml(it.label) + '</span>'
                + '</button>';
        });

        if (!items.length) {
            html = '<div class="cmd-palette__empty">Nenhum resultado para <em>' + escapeHtml(q) + '</em></div>';
            // If smart preview is active, offer "create" as fallback
            if (q && smartEl && !smartEl.hidden) {
                html += '<button type="button" class="cmd-palette__item cmd-palette__item--create" data-idx="create">'
                    + '<i class="fas fa-plus" aria-hidden="true"></i>'
                    + '<span class="cmd-palette__label">Criar com este texto</span>'
                    + '</button>';
            }
        }

        listEl.innerHTML = html;
        listEl.querySelectorAll('.cmd-palette__item').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = btn.dataset.idx;
                if (idx === 'create') {
                    runCreate();
                } else {
                    runItem(parseInt(idx, 10));
                }
            });
        });
        updateActive();
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function updateActive() {
        listEl.querySelectorAll('.cmd-palette__item').forEach((el, i) => {
            const idxAttr = el.dataset.idx;
            const isActive = idxAttr === 'create' ? false : (parseInt(idxAttr, 10) === activeItem);
            el.classList.toggle('is-active', isActive);
            if (isActive) el.scrollIntoView({ block: 'nearest' });
        });
    }

    function onKeydown(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) { activeItem = (activeItem + 1) % items.length; updateActive(); } return; }
        if (e.key === 'ArrowUp')   { e.preventDefault(); if (items.length) { activeItem = (activeItem - 1 + items.length) % items.length; updateActive(); } return; }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (items.length && activeItem >= 0) runItem(activeItem);
            else if (smartEl && !smartEl.hidden) runCreate();
            return;
        }
    }

    function runItem(idx) {
        const it = items[idx];
        if (!it) return;
        try { it.run(); } finally { close(); }
    }

    function runCreate() {
        const q = (inputEl.value || '').trim();
        if (!q) return;
        close();
        if (typeof App === 'undefined') return;
        App.navigateTo('chat');
        requestAnimationFrame(() => {
            if (DOM.messageInput) {
                if (DOM.messageInput.isContentEditable) {
                    DOM.messageInput.textContent = q;
                } else {
                    DOM.messageInput.value = q;
                }
                DOM.messageInput.focus();
                if (typeof SmartCapture !== 'undefined') SmartCapture.refresh();
            }
        });
    }

    function open(initialQuery) {
        ensureOverlay();
        opened = true;
        overlay.hidden = false;
        overlay.dataset.active = '1';
        if (typeof initialQuery === 'string') inputEl.value = initialQuery;
        render();
        requestAnimationFrame(() => inputEl.focus());
    }

    function close() {
        if (!overlay) return;
        opened = false;
        overlay.dataset.active = '';
        overlay.hidden = true;
        inputEl.value = '';
        if (smartEl) smartEl.hidden = true;
        listEl.innerHTML = '';
    }

    function isOpen() { return opened; }

    function init() {
        ensureOverlay();
        document.addEventListener('keydown', (e) => {
            const meta = e.metaKey || e.ctrlKey;
            if (meta && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                if (opened) close(); else open();
            } else if (meta && (e.key === 'n' || e.key === 'N')) {
                e.preventDefault();
                if (typeof App === 'undefined') return;
                App.navigateTo('chat');
                requestAnimationFrame(() => DOM.messageInput && DOM.messageInput.focus && DOM.messageInput.focus());
            } else if (meta && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                if (typeof ThemeManager === 'undefined' || !AppState) return;
                const order = ['paper', 'playful', 'linear'];
                const idx = order.indexOf(AppState.theme);
                ThemeManager.setTheme(order[(idx + 1) % order.length]);
            }
        });
    }

    window.CommandPalette = { init, open, close, isOpen };
})();
