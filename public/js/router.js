/**
 * Savit Hash Router — S1
 * Bidirectional sync between location.hash and App.navigateTo(pageId, params).
 * No build step; loaded as a global before app.js.
 */
(function () {
    'use strict';

    // route -> { page, paramName? }
    // page IDs map to existing AppState.currentPage values used by App.navigateTo
    const ROUTES = [
        { hash: '#/dashboard', page: 'home' },
        { hash: '#/inbox',     page: 'chat' },
        { hash: '#/categories',page: 'categories' },
        { hash: '#/tasks',     page: 'kanban' },
        { hash: '#/today',     page: 'kanban', meta: { filter: 'today' } },
        { hash: '#/profile',   page: 'profile' },
        { hash: '#/focus',     page: '__focus' }, // handled inline
        // Dynamic: #/category/<id> -> categoryMessages with viewingCategoryId
    ];

    const PAGE_TO_HASH = {
        home: '#/dashboard',
        chat: '#/inbox',
        categories: '#/categories',
        kanban: '#/tasks',
        profile: '#/profile',
        categoryMessages: null, // built dynamically from id
    };

    const DEFAULT_HASH = '#/dashboard';

    let suppressNext = false; // avoid feedback loop when navigateTo triggered by hashchange

    function parseHash(hash) {
        if (!hash || hash === '#' || hash === '#/') return null;
        // Dynamic category route
        const m = hash.match(/^#\/category\/(.+)$/);
        if (m) return { page: 'categoryMessages', params: { categoryId: decodeURIComponent(m[1]) } };
        const route = ROUTES.find(r => r.hash === hash);
        if (route) return { page: route.page, params: route.meta ? { ...route.meta } : {} };
        return null;
    }

    function hashForPage(pageId, params) {
        if (pageId === 'categoryMessages' && params && params.categoryId) {
            return '#/category/' + encodeURIComponent(params.categoryId);
        }
        return PAGE_TO_HASH[pageId] || null;
    }

    function applyHash(force) {
        const parsed = parseHash(location.hash);
        if (!parsed) {
            // P1-N4 — unknown hash: redirect to default + toast.
            // On boot (force=true), replace silently. On runtime hashchange, notify.
            if (force) {
                location.replace(location.pathname + location.search + DEFAULT_HASH);
            } else if (location.hash && location.hash !== '#' && location.hash !== '#/') {
                if (window.Toast && typeof Toast.show === 'function') {
                    Toast.show('Página não encontrada', { type: 'info' });
                }
                history.replaceState(null, '', location.pathname + location.search + DEFAULT_HASH);
                applyHash(true);
            }
            return;
        }
        // Special-case: focus mode is an overlay, not a regular page
        if (parsed.page === '__focus') {
            if (typeof FocusMode !== 'undefined' && !FocusMode.isActive()) {
                FocusMode.start();
            }
            return;
        }
        // Leaving #/focus closes the overlay if open
        if (typeof FocusMode !== 'undefined' && FocusMode.isActive()) {
            FocusMode.exit();
        }
        if (typeof App === 'undefined' || typeof App.navigateTo !== 'function') return;
        suppressNext = true;
        try {
            // categoryMessages needs the id stored in AppState before navigation
            if (parsed.page === 'categoryMessages' && parsed.params && parsed.params.categoryId) {
                if (typeof AppState !== 'undefined') AppState.viewingCategoryId = parsed.params.categoryId;
                if (typeof App !== 'undefined' && typeof App.openCategoryMessages === 'function') {
                    App.openCategoryMessages(parsed.params.categoryId);
                    return;
                }
            }
            // P1-N5 — propagate route meta (e.g., #/today → tasksFilter="today")
            if (typeof AppState !== 'undefined') {
                AppState.tasksFilter = (parsed.params && parsed.params.filter) || null;
            }
            App.navigateTo(parsed.page);
        } finally {
            suppressNext = false;
        }
    }

    const Router = {
        init() {
            window.addEventListener('hashchange', () => applyHash(false));
            // First load
            if (!location.hash || location.hash === '#' || location.hash === '#/') {
                location.hash = DEFAULT_HASH;
            } else {
                applyHash(true);
            }
        },

        // Called from App.navigateTo to mirror current page in URL
        syncFromNavigate(pageId, params) {
            if (suppressNext) return;
            const next = hashForPage(pageId, params);
            if (!next) return;
            if (location.hash !== next) {
                history.pushState(null, '', next);
            }
        },

        go(path) {
            if (location.hash === path) return;
            location.hash = path;
        },
    };

    window.Router = Router;
})();
