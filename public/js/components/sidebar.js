/**
 * Savit Sidebar — P-B
 *
 * - Desktop ≥1024px: always visible, column 1 of 3-col grid
 * - Mobile <1024px: slide-in drawer with backdrop
 *
 * Source: Refactor/Savit (1)/prototype/sidebar.jsx
 *
 * Handles:
 *   - Nav-item active state (mirrors AppState.currentPage)
 *   - Inbox / Tasks / Cats counts in nav-item badges
 *   - Mobile drawer open/close + backdrop
 *
 * Note: cat-list rendering still lives in App.renderSidebarCategories
 * (existing); we just re-render counts when messages change.
 */
(function () {
    'use strict';

    let sidebarEl = null;
    let backdropEl = null;
    let countInbox = null;
    let countTasks = null;
    let countCats = null;
    let userEmailEl = null;

    function $(id) { return document.getElementById(id); }

    function ensureBackdrop() {
        if (backdropEl) return backdropEl;
        backdropEl = document.createElement('div');
        backdropEl.className = 'sidebar-backdrop';
        backdropEl.addEventListener('click', closeDrawer);
        document.body.appendChild(backdropEl);
        return backdropEl;
    }

    function isMobile() {
        return window.matchMedia('(max-width: 1023.98px)').matches;
    }

    function openDrawer() {
        if (!isMobile() || !sidebarEl) return;
        ensureBackdrop();
        sidebarEl.classList.add('open');
        backdropEl.classList.add('open');
    }

    function closeDrawer() {
        if (!sidebarEl) return;
        sidebarEl.classList.remove('open');
        if (backdropEl) backdropEl.classList.remove('open');
    }

    function toggleDrawer() {
        if (!sidebarEl) return;
        if (sidebarEl.classList.contains('open')) closeDrawer();
        else openDrawer();
    }

    function renderCounts() {
        if (typeof AppState === 'undefined') return;
        const messages = AppState.messages || [];
        const cats = AppState.categories || [];

        if (countInbox) {
            const total = messages.length;
            countInbox.textContent = total > 0 ? String(total) : '';
        }
        if (countTasks) {
            const pending = messages.filter(m => m.isTask && !m.taskCompleted).length;
            countTasks.textContent = pending > 0 ? String(pending) : '';
        }
        if (countCats) {
            const n = cats.length;
            countCats.textContent = n > 0 ? String(n) : '';
        }
    }

    function renderUser() {
        if (typeof AppState === 'undefined' || !AppState.user) return;
        if (userEmailEl) {
            userEmailEl.textContent = AppState.user.email || '';
        }
    }

    function bindNavClicks() {
        if (!sidebarEl) return;
        sidebarEl.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (isMobile()) closeDrawer();
            });
        });
        // Auto-close drawer on category-row click too.
        const catList = $('sidebarCategoryList');
        if (catList) {
            catList.addEventListener('click', () => {
                if (isMobile()) closeDrawer();
            });
        }
    }

    function init() {
        sidebarEl = $('sidebar');
        countInbox = $('navCountInbox');
        countTasks = $('navCountTasks');
        countCats = $('navCountCats');
        userEmailEl = $('sidebarUserEmail');
        if (!sidebarEl) return;

        bindNavClicks();
        renderCounts();
        renderUser();

        // Listen for storage / state changes (App will call Sidebar.refresh after data ops).
        window.addEventListener('resize', () => {
            // On grow to desktop, ensure drawer state is reset.
            if (!isMobile()) closeDrawer();
        });
    }

    document.addEventListener('DOMContentLoaded', init);

    window.Sidebar = {
        init,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        renderCounts,
        renderUser,
        refresh() { renderCounts(); renderUser(); },
    };
})();
