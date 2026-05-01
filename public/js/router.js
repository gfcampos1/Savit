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
            const isEmpty = !location.hash || location.hash === '#' || location.hash === '#/';
            if (force) {
                // Boot path with empty hash → silently replace to default
                history.replaceState(null, '', location.pathname + location.search + DEFAULT_HASH);
                applyHash(true);
                return;
            }
            // B3 — runtime hashchange with empty hash (e.g., back-beyond-app):
            // recover silently, no toast.
            if (isEmpty) {
                history.replaceState(null, '', location.pathname + location.search + DEFAULT_HASH);
                applyHash(true);
                return;
            }
            // P1-N4 — truly unknown hash → toast + redirect
            if (window.Toast && typeof Toast.show === 'function') {
                Toast.show('Página não encontrada', { type: 'info' });
            }
            history.replaceState(null, '', location.pathname + location.search + DEFAULT_HASH);
            applyHash(true);
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
            // B2 — initial hash setup uses replaceState (not location.hash =) so
            // we don't add an extra history entry. Back from /dashboard exits
            // the app naturally instead of getting stuck on an empty URL.
            if (!location.hash || location.hash === '#' || location.hash === '#/') {
                history.replaceState(null, '', location.pathname + location.search + DEFAULT_HASH);
            }
            applyHash(true);
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
