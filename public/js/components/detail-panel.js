/**
 * Savit DetailPanel — P-B
 *
 * Always-rendered right column on desktop ≥1024px (3-col grid).
 * Slide-up bottom sheet on mobile <1024px.
 *
 * Source: Refactor/Savit (1)/prototype/detail.jsx
 *
 * Public API:
 *   DetailPanel.open(messageId)  — open with given message
 *   DetailPanel.close()          — back to empty state
 *   DetailPanel.refresh()        — re-render current selection (after AppState update)
 *   DetailPanel.isOpen()
 */
(function () {
    'use strict';

    const SAVE_DEBOUNCE_MS = 350;

    let panelEl = null;
    let emptyEl = null;
    let contentEl = null;
    let badgeEl = null;
    let priorityEl = null;
    let idEl = null;
    let textEl = null;
    let segNoteBtn = null;
    let segTaskBtn = null;
    let fieldCatEl = null;
    let fieldDueEl = null;
    let fieldPriorityEl = null;
    let fieldDueRow = null;
    let fieldPriorityRow = null;
    let activityCreatedRow = null;
    let activityDoneRow = null;
    let archiveBtn = null;
    let deleteBtn = null;
    let closeBtn = null;

    let currentId = null;
    let saveTimer = null;

    function $(id) { return document.getElementById(id); }

    function getMessage(id) {
        if (typeof AppState === 'undefined' || !AppState.messages) return null;
        return AppState.messages.find(m => m.id === id) || null;
    }

    function getCategory(catId) {
        if (!catId || typeof AppState === 'undefined' || !AppState.categories) return null;
        return AppState.categories.find(c => c.id === catId) || null;
    }

    function formatDateTime(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return '—';
        const today = new Date();
        const isSameDay = d.getFullYear() === today.getFullYear()
            && d.getMonth() === today.getMonth()
            && d.getDate() === today.getDate();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        if (isSameDay) return `Hoje, ${hh}:${mm}`;
        return `${d.getDate()}/${d.getMonth() + 1}, ${hh}:${mm}`;
    }

    function formatTaskDue(taskDate, taskTime) {
        if (!taskDate) return null;
        const time = taskTime || '09:00';
        const iso = `${taskDate}T${time}:00`;
        return formatDateTime(iso);
    }

    function shortId(id) {
        if (!id) return '';
        const s = String(id);
        return ('#' + s.slice(0, 6)).toUpperCase();
    }

    function setDataState(state) {
        if (!panelEl) return;
        panelEl.dataset.state = state;
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.dataset.detail = state === 'open' ? 'open' : 'closed';
        }
    }

    function render(message) {
        if (!message || !panelEl) return;

        const isTask = !!message.isTask;
        const cat = getCategory(message.categoryId);

        // Header
        if (badgeEl) badgeEl.textContent = isTask ? 'TAREFA' : 'NOTA';
        if (priorityEl) priorityEl.hidden = !(isTask && message.priority === 'high');
        if (idEl) idEl.textContent = shortId(message.id);

        // Segment toggle
        if (segNoteBtn) segNoteBtn.classList.toggle('on', !isTask);
        if (segTaskBtn) segTaskBtn.classList.toggle('on', isTask);

        // Text
        if (textEl) {
            textEl.classList.toggle('task-mode', isTask);
            // Use plain text from `text` field (strip HTML if needed for edit).
            const plain = (message.text || '').replace(/<[^>]+>/g, '');
            if (document.activeElement !== textEl) {
                textEl.value = plain;
            }
        }

        // Category field
        if (fieldCatEl) {
            if (cat) {
                fieldCatEl.innerHTML = '';
                const sw = document.createElement('span');
                sw.className = 'swatch';
                sw.style.background = cat.color || '#888';
                const lbl = document.createElement('span');
                lbl.textContent = cat.name || '';
                fieldCatEl.appendChild(sw);
                fieldCatEl.appendChild(lbl);
            } else {
                fieldCatEl.innerHTML = '<span class="detail-field__muted">— sem categoria</span>';
            }
        }

        // Task-only fields
        if (fieldDueRow) fieldDueRow.hidden = !isTask;
        if (fieldPriorityRow) fieldPriorityRow.hidden = !isTask;

        if (isTask) {
            const dueLabel = formatTaskDue(message.taskDate, message.taskTime);
            if (fieldDueEl) {
                if (dueLabel) {
                    fieldDueEl.innerHTML = '';
                    fieldDueEl.textContent = dueLabel;
                } else {
                    fieldDueEl.innerHTML = '<span class="detail-field__muted">— sem prazo</span>';
                }
            }
            if (fieldPriorityEl) {
                if (message.priority === 'high') {
                    fieldPriorityEl.innerHTML = '<span style="color: var(--accent)">Urgente</span>';
                } else {
                    fieldPriorityEl.innerHTML = '<span class="detail-field__muted">— normal</span>';
                }
            }
        }

        // Activity log
        if (activityCreatedRow) {
            const created = message.createdAt ? new Date(message.createdAt) : null;
            if (created && !Number.isNaN(created.getTime())) {
                const hh = String(created.getHours()).padStart(2, '0');
                const mm = String(created.getMinutes()).padStart(2, '0');
                activityCreatedRow.innerHTML = `<span class="mono">${hh}:${mm}</span> · capturado`;
            } else {
                activityCreatedRow.textContent = '';
            }
        }
        if (activityDoneRow) {
            activityDoneRow.hidden = !(isTask && message.taskCompleted);
            if (isTask && message.taskCompleted) {
                activityDoneRow.innerHTML = '<span class="mono">agora</span> · concluído';
            }
        }
    }

    function bindEvents() {
        if (closeBtn) closeBtn.addEventListener('click', close);

        if (textEl) {
            textEl.addEventListener('input', () => {
                if (!currentId) return;
                if (saveTimer) clearTimeout(saveTimer);
                saveTimer = setTimeout(() => saveText(), SAVE_DEBOUNCE_MS);
            });
            textEl.addEventListener('blur', () => {
                if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
                saveText();
            });
        }

        if (segNoteBtn) segNoteBtn.addEventListener('click', () => setKind(false));
        if (segTaskBtn) segTaskBtn.addEventListener('click', () => setKind(true));

        if (fieldCatEl) {
            const catBtn = fieldCatEl.closest('.detail-field');
            if (catBtn) catBtn.addEventListener('click', () => {
                if (!currentId || typeof App === 'undefined' || typeof App.openEditMessageModal !== 'function') return;
                App.openEditMessageModal(currentId, { force: true });
            });
        }

        if (fieldDueRow) {
            fieldDueRow.addEventListener('click', () => {
                if (!currentId || typeof App === 'undefined' || typeof App.openEditMessageModal !== 'function') return;
                App.openEditMessageModal(currentId, { force: true });
            });
        }

        if (fieldPriorityRow) {
            fieldPriorityRow.addEventListener('click', () => togglePriority());
        }

        if (archiveBtn) archiveBtn.addEventListener('click', archiveCurrent);
        if (deleteBtn) deleteBtn.addEventListener('click', deleteCurrent);
    }

    async function saveText() {
        if (!currentId || !textEl) return;
        const message = getMessage(currentId);
        if (!message) return;
        const newText = textEl.value;
        const plainOld = (message.text || '').replace(/<[^>]+>/g, '');
        if (plainOld === newText) return;
        try {
            const updated = await API.messages.update(currentId, { text: newText });
            // Reflect into AppState
            const idx = AppState.messages.findIndex(m => m.id === currentId);
            if (idx >= 0) AppState.messages[idx] = { ...AppState.messages[idx], ...(updated || { text: newText }) };
            // Re-render lists
            if (typeof App !== 'undefined' && typeof App.renderMessages === 'function' && DOM && DOM.messagesContainer) {
                App.renderMessages(AppState.messages, DOM.messagesContainer);
            }
        } catch (err) {
            console.warn('[DetailPanel] saveText failed', err);
            if (window.Toast && typeof Toast.show === 'function') {
                Toast.show('Não foi possível salvar', { type: 'error' });
            }
        }
    }

    async function setKind(toTask) {
        if (!currentId) return;
        const message = getMessage(currentId);
        if (!message) return;
        if (!!message.isTask === toTask) return;
        try {
            const patch = toTask
                ? { isTask: true }
                : { isTask: false, taskCompleted: false, taskDate: null, taskTime: null };
            const updated = await API.messages.update(currentId, patch);
            const idx = AppState.messages.findIndex(m => m.id === currentId);
            if (idx >= 0) AppState.messages[idx] = { ...AppState.messages[idx], ...(updated || patch) };
            render(getMessage(currentId));
            if (typeof App !== 'undefined' && typeof App.renderMessages === 'function' && DOM && DOM.messagesContainer) {
                App.renderMessages(AppState.messages, DOM.messagesContainer);
            }
        } catch (err) {
            console.warn('[DetailPanel] setKind failed', err);
        }
    }

    async function togglePriority() {
        if (!currentId) return;
        const message = getMessage(currentId);
        if (!message || !message.isTask) return;
        const next = message.priority === 'high' ? null : 'high';
        try {
            const updated = await API.messages.update(currentId, { priority: next });
            const idx = AppState.messages.findIndex(m => m.id === currentId);
            if (idx >= 0) AppState.messages[idx] = { ...AppState.messages[idx], ...(updated || { priority: next }) };
            render(getMessage(currentId));
            if (typeof App !== 'undefined' && typeof App.renderMessages === 'function' && DOM && DOM.messagesContainer) {
                App.renderMessages(AppState.messages, DOM.messagesContainer);
            }
        } catch (err) {
            console.warn('[DetailPanel] togglePriority failed', err);
        }
    }

    async function archiveCurrent() {
        if (!currentId) return;
        try {
            await API.messages.archive(currentId);
            const idx = AppState.messages.findIndex(m => m.id === currentId);
            if (idx >= 0) AppState.messages.splice(idx, 1);
            close();
            if (typeof App !== 'undefined' && typeof App.renderMessages === 'function' && DOM && DOM.messagesContainer) {
                App.renderMessages(AppState.messages, DOM.messagesContainer);
            }
            if (window.Toast) Toast.show('Item arquivado', { type: 'info' });
        } catch (err) {
            console.warn('[DetailPanel] archive failed', err);
        }
    }

    async function deleteCurrent() {
        if (!currentId) return;
        if (typeof App !== 'undefined' && typeof App.deleteMessage === 'function') {
            // Delegate to App.deleteMessage so existing confirm flow + toast undo apply.
            const id = currentId;
            close();
            App.deleteMessage(id);
            return;
        }
        // Fallback
        try {
            await API.messages.delete(currentId);
            close();
        } catch (err) {
            console.warn('[DetailPanel] delete failed', err);
        }
    }

    function open(messageId) {
        if (!panelEl) init();
        if (!panelEl) return;
        const message = getMessage(messageId);
        if (!message) return;
        currentId = messageId;
        if (emptyEl) emptyEl.hidden = true;
        if (contentEl) contentEl.hidden = false;
        render(message);
        setDataState('open');
        AppState.editingMessageId = messageId;

        // Mobile: also lock body scroll while sheet is up
        if (window.matchMedia('(max-width: 1023.98px)').matches) {
            document.body.classList.add('detail-sheet-open');
        }
    }

    function close() {
        currentId = null;
        if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
        if (emptyEl) emptyEl.hidden = false;
        if (contentEl) contentEl.hidden = true;
        setDataState('empty');
        AppState.editingMessageId = null;
        document.body.classList.remove('detail-sheet-open');
    }

    function refresh() {
        if (!currentId) return;
        const message = getMessage(currentId);
        if (!message) { close(); return; }
        render(message);
    }

    function isOpen() { return !!currentId; }

    function init() {
        panelEl = $('detailPanel');
        emptyEl = $('detailEmpty');
        contentEl = $('detailContent');
        badgeEl = $('detailBadge');
        priorityEl = $('detailPriority');
        idEl = $('detailId');
        textEl = $('detailText');
        fieldCatEl = $('detailFieldCat');
        fieldDueEl = $('detailFieldDue');
        fieldPriorityEl = $('detailFieldPriority');
        activityCreatedRow = $('detailCreatedRow');
        activityDoneRow = $('detailDoneRow');
        archiveBtn = $('detailArchiveBtn');
        deleteBtn = $('detailDeleteBtn');
        closeBtn = $('detailCloseBtn');

        if (!panelEl) return;
        const segs = panelEl.querySelectorAll('.detail-seg__btn');
        segs.forEach(b => {
            if (b.dataset.kind === 'note') segNoteBtn = b;
            if (b.dataset.kind === 'task') segTaskBtn = b;
        });
        const fields = panelEl.querySelectorAll('.detail-field');
        fields.forEach(b => {
            if (b.dataset.field === 'due') fieldDueRow = b;
            if (b.dataset.field === 'priority') fieldPriorityRow = b;
        });

        bindEvents();
        setDataState('empty');
    }

    document.addEventListener('DOMContentLoaded', init);

    window.DetailPanel = { open, close, refresh, isOpen, init };
})();
