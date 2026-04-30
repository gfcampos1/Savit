/**
 * SAVIT - Main Application
 * Mobile-first WhatsApp-inspired UI with Dashboard
 */

// =============================================
// App State
// =============================================

const AppState = {
    user: null,
    messages: [],
    categories: [],
    categorySections: [],
    stats: null,
    currentPage: 'home',
    selectedCategoryId: null,
    isTaskMode: false,
    isCategoryTaskMode: false,
    editingMessageId: null,
    editingCategoryId: null,
    selectedColorForCategory: '#25D366',
    searchQuery: '',
    searchCategory: '',
    searchDate: '',
    viewingCategoryId: null,
    isLoading: false,
    theme: 'paper',
    pendingImages: [],
    categoryPendingImages: [],
    drawingForCategory: false,
    kanbanSearch: '',
    kanbanCategory: '',
    calendarDate: new Date(),
    calendarSelectedDay: null,
    sectionSortMode: 'manual',
    movingCategoryId: null,
    renamingSectionId: null,
    deletingSectionId: null,

    // Chat scroll behavior (WhatsApp-like)
    chatStickToBottom: true,
    chatUnreadBelow: 0,
    chatLastScrollTop: 0
};

// =============================================
// Utility Functions
// =============================================

const Utils = {
    formatTime(date) {
        return new Date(date).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatDate(date) {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (this.isSameDay(d, today)) {
            return 'Hoje';
        } else if (this.isSameDay(d, yesterday)) {
            return 'Ontem';
        } else {
            return d.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    },

    formatFullDate(date) {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    },

    formatDateHeader() {
        return new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    },

    isSameDay(d1, d2) {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    sanitizeCssColor(value, fallback = '#25D366') {
        const v = String(value || '').trim();
        if (/^#[0-9a-f]{3}$/i.test(v) || /^#[0-9a-f]{6}$/i.test(v)) return v;
        return fallback;
    },

    sanitizeImageSrc(value) {
        if (typeof value !== 'string') return null;
        const v = value.trim();
        if (!v) return null;

        // Disallow quotes/whitespace to avoid attribute breaking
        if (/[\s"'<>]/.test(v)) return null;

        // Allow common safe data URLs (no SVG)
        if (v.startsWith('data:image/png;base64,')) return v;
        if (v.startsWith('data:image/jpeg;base64,')) return v;
        if (v.startsWith('data:image/webp;base64,')) return v;

        // Allow https URLs
        if (v.startsWith('https://')) return v;

        return null;
    },

    isTaskOverdue(taskDate, taskTime, isCompleted) {
        if (isCompleted || !taskDate) return false;

        const now = new Date();
        const taskDateTime = new Date(taskDate + (taskTime ? 'T' + taskTime : 'T23:59:59'));
        return now > taskDateTime;
    },

    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};

// =============================================
// Speech-to-Text Module
// =============================================

const SpeechToText = {
    recognition: null,
    isRecording: false,
    isSupported: false,
    targetInput: null, // Dynamic target input

    init() {
        // Check if Speech Recognition is supported
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            this.isSupported = false;
            console.log('Speech Recognition not supported');
            // Hide voice button if not supported
            if (DOM.voiceInputBtn) {
                DOM.voiceInputBtn.style.display = 'none';
            }
            return;
        }

        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        
        // Configure
        this.recognition.lang = 'pt-BR';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        // Event handlers
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.updateUI(true);
            console.log('Speech recognition started');
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update input with transcription - use targetInput or default to messageInput
            const input = this.targetInput || DOM.messageInput;
            if (input) {
                if (finalTranscript) {
                    const t = String(finalTranscript || '');
                    if (!t) return;

                    // WYSIWYG editor
                    if (input.isContentEditable && input.tagName !== 'TEXTAREA') {
                        const current = RichText.getPlainText(input);
                        const needsSpace = current.trim().length > 0 && !current.endsWith(' ');
                        RichText.insertTextAtCursor(input, (needsSpace ? ' ' : '') + t);
                        input.dispatchEvent(new Event('input'));
                        return;
                    }

                    // Textarea fallback
                    const currentText = input.value || '';
                    const cursorPos = input.selectionStart || currentText.length;
                    const before = currentText.substring(0, cursorPos);
                    const after = currentText.substring(cursorPos);
                    const space = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
                    input.value = before + space + t + after;
                    input.dispatchEvent(new Event('input'));
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            let message = 'Erro no reconhecimento de voz';
            switch (event.error) {
                case 'no-speech':
                    message = 'Nenhuma fala detectada';
                    break;
                case 'audio-capture':
                    message = 'Microfone não encontrado';
                    break;
                case 'not-allowed':
                    message = 'Permissão de microfone negada';
                    break;
                case 'network':
                    message = 'Erro de conexão';
                    break;
            }
            
            showToast(message);
            this.stop();
        };

        this.recognition.onend = () => {
            // Restart if still supposed to be recording
            if (this.isRecording) {
                try {
                    this.recognition.start();
                } catch (e) {
                    this.stop();
                }
            }
        };
    },

    toggle() {
        if (!this.isSupported) {
            showToast('Reconhecimento de voz não suportado neste navegador');
            return;
        }

        if (this.isRecording) {
            this.stop();
        } else {
            this.start();
        }
    },

    async start() {
        if (!this.isSupported || this.isRecording) return;

        // Request microphone permission
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (error) {
            showToast('Permissão de microfone necessária');
            return;
        }

        try {
            this.recognition.start();
            showToast('Ouvindo... Fale sua ideia');
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            showToast('Erro ao iniciar reconhecimento de voz');
        }
    },

    stop() {
        if (!this.recognition) return;
        
        this.isRecording = false;
        try {
            this.recognition.stop();
        } catch (e) {
            // Ignore errors when stopping
        }
        this.updateUI(false);
    },

    updateUI(isRecording) {
        // Determine if we're in category page or main chat
        const isInCategoryPage = this.targetInput === DOM.categoryMessageInput;
        
        // Main chat voice button
        if (DOM.voiceInputBtn && !isInCategoryPage) {
            DOM.voiceInputBtn.classList.toggle('recording', isRecording);
            DOM.voiceInputBtn.querySelector('i').className = isRecording 
                ? 'fas fa-stop' 
                : 'fas fa-microphone';
        }
        
        // Category page voice button
        if (DOM.categoryVoiceInputBtn && isInCategoryPage) {
            DOM.categoryVoiceInputBtn.classList.toggle('recording', isRecording);
            DOM.categoryVoiceInputBtn.querySelector('i').className = isRecording 
                ? 'fas fa-stop' 
                : 'fas fa-microphone';
        }
        
        // Main chat voice recording UI
        if (DOM.voiceRecording && !isInCategoryPage) {
            DOM.voiceRecording.style.display = isRecording ? 'flex' : 'none';
        }
        
        // Category page voice recording UI
        if (DOM.categoryVoiceRecording && isInCategoryPage) {
            DOM.categoryVoiceRecording.style.display = isRecording ? 'flex' : 'none';
        }
        
        // Hide/show appropriate input
        if (!isInCategoryPage && DOM.messageInput) {
            DOM.messageInput.style.display = isRecording ? 'none' : 'block';
        }
        if (isInCategoryPage && DOM.categoryMessageInput) {
            DOM.categoryMessageInput.style.display = isRecording ? 'none' : 'block';
        }
    }
};

// =============================================
// Theme Manager
// =============================================

const ThemeManager = {
    VALID: ['paper', 'playful', 'linear'],
    DEFAULT: 'paper',
    LABELS: { paper: 'Papel', playful: 'Vibrante', linear: 'Linear' },
    META_BG: { paper: '#f6f1e8', playful: '#0e0a1a', linear: '#0a0c10' },

    init() {
        this.migrateLegacyKey();
        const stored = localStorage.getItem('savit_theme');
        const theme = this.VALID.includes(stored) ? stored : this.DEFAULT;
        this.setTheme(theme);
    },

    migrateLegacyKey() {
        try {
            const legacy = localStorage.getItem('savit-theme');
            const current = localStorage.getItem('savit_theme');
            if (legacy && !current) {
                const map = { light: 'paper', dark: 'linear', system: 'paper' };
                localStorage.setItem('savit_theme', map[legacy] || this.DEFAULT);
            }
            if (legacy) localStorage.removeItem('savit-theme');
        } catch {
            // ignore storage errors
        }
    },

    setTheme(theme) {
        if (!this.VALID.includes(theme)) theme = this.DEFAULT;
        AppState.theme = theme;
        try { localStorage.setItem('savit_theme', theme); } catch { /* ignore */ }
        this.applyTheme(theme);
        this.updateButtons();
    },

    applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', this.META_BG[theme] || this.META_BG.paper);
    },

    updateButtons() {
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === AppState.theme);
        });
        if (DOM.themeCurrentLabel) {
            DOM.themeCurrentLabel.textContent = this.LABELS[AppState.theme] || this.LABELS[this.DEFAULT];
        }
    }
};

// =============================================
// Smart Capture (S2 / F1) — wires ParseNatural to composer
// =============================================

const SmartCapture = {
    chipsEl: null,
    inputEl: null,
    last: null,

    init() {
        this.chipsEl = document.getElementById('composerChips');
        this.inputEl = DOM.messageInput;
        if (!this.chipsEl || !this.inputEl) return;

        const handler = () => this.refresh();
        this.inputEl.addEventListener('input', handler);
        this.inputEl.addEventListener('paste', () => setTimeout(handler, 0));
    },

    getRawText() {
        if (!this.inputEl) return '';
        if (this.inputEl.isContentEditable) {
            try {
                return (window.RichText && RichText.getPlainText)
                    ? RichText.getPlainText(this.inputEl)
                    : (this.inputEl.textContent || '');
            } catch {
                return this.inputEl.textContent || '';
            }
        }
        return this.inputEl.value || '';
    },

    refresh() {
        if (!window.ParseNatural) return;
        const text = this.getRawText();
        this.last = ParseNatural.parse(text, AppState.categories || []);
        this.render();
    },

    render() {
        const el = this.chipsEl;
        if (!el) return;
        const parts = (this.last && this.last.parts) || [];
        if (!parts.length) {
            el.innerHTML = '';
            el.hidden = true;
            return;
        }

        const isTask = !!(this.last && this.last.isTask);
        const escape = (s) => (window.Utils && Utils.escapeHtml ? Utils.escapeHtml(s) : String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
        let html = '';
        if (isTask) {
            html += '<span class="composer-chip composer-chip--task"><i class="fas fa-list-check" aria-hidden="true"></i>Tarefa</span>';
        }
        for (const p of parts) {
            const label = ParseNatural.chipLabel(p);
            const icon = ParseNatural.chipIcon(p);
            html += '<span class="composer-chip" data-kind="' + p.kind + '">' +
                '<i class="fas ' + icon + '" aria-hidden="true"></i>' +
                '<span>' + escape(label) + '</span>' +
                '<button type="button" class="composer-chip__remove" data-kind="' + p.kind + '" aria-label="Remover">×</button>' +
                '</span>';
        }
        el.innerHTML = html;
        el.hidden = false;

        el.querySelectorAll('.composer-chip__remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removePart(btn.dataset.kind);
            });
        });
    },

    removePart(kind) {
        if (!this.last || !this.last.parts) return;
        const part = this.last.parts.find(p => p.kind === kind);
        if (!part) return;
        const text = this.getRawText();
        const newText = (text.slice(0, part.range[0]) + text.slice(part.range[1])).replace(/\s+/g, ' ').trim();
        if (this.inputEl.isContentEditable) {
            this.inputEl.textContent = newText;
        } else {
            this.inputEl.value = newText;
        }
        this.refresh();
        this.inputEl.focus();
    },

    consume() {
        const r = this.last;
        return r;
    },

    clear() {
        this.last = null;
        if (this.chipsEl) {
            this.chipsEl.innerHTML = '';
            this.chipsEl.hidden = true;
        }
    }
};

// =============================================
// Swipe helper (S2 / F5) — pointer-driven horizontal swipes on cards
// =============================================

const Swipe = {
    THRESHOLD: 80,
    SUPPRESS_FLAG: '__savit_suppress_click',

    isMobile() {
        return window.matchMedia('(max-width: 768px)').matches;
    },

    attach(el, handlers) {
        if (!el || el.dataset.swipeAttached === '1') return;
        el.dataset.swipeAttached = '1';

        let startX = 0, startY = 0, dx = 0, dy = 0;
        let active = false, locked = false, axis = null;
        let pointerId = null;

        const reset = () => {
            active = false; locked = false; axis = null;
            el.classList.remove('is-swiping-right', 'is-swiping-left');
        };

        const onDown = (e) => {
            if (e.pointerType === 'mouse' && !Swipe.isMobile()) return;
            startX = e.clientX; startY = e.clientY; dx = 0; dy = 0;
            active = true; locked = false; axis = null;
            pointerId = e.pointerId;
        };

        const onMove = (e) => {
            if (!active || e.pointerId !== pointerId) return;
            dx = e.clientX - startX;
            dy = e.clientY - startY;
            if (!locked) {
                if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                    axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
                    locked = true;
                    if (axis === 'y') { active = false; return; }
                    try { el.setPointerCapture(pointerId); } catch {}
                }
            }
            if (axis === 'x') {
                el.style.transform = 'translateX(' + dx + 'px)';
                el.classList.toggle('is-swiping-right', dx > 0);
                el.classList.toggle('is-swiping-left', dx < 0);
            }
        };

        const onUp = (e) => {
            if (!active && axis !== 'x') return;
            const dxFinal = dx;
            const wasHoriz = axis === 'x';
            try { el.releasePointerCapture(pointerId); } catch {}
            reset();

            el.style.transition = 'transform 200ms ease';
            el.style.transform = '';
            setTimeout(() => { el.style.transition = ''; }, 220);

            if (wasHoriz && Math.abs(dxFinal) >= Swipe.THRESHOLD) {
                el[Swipe.SUPPRESS_FLAG] = true;
                setTimeout(() => { el[Swipe.SUPPRESS_FLAG] = false; }, 400);
                if (dxFinal > 0 && handlers && handlers.onRight) handlers.onRight();
                else if (dxFinal < 0 && handlers && handlers.onLeft) handlers.onLeft();
            }
        };

        el.addEventListener('pointerdown', onDown);
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        el.addEventListener('pointercancel', onUp);
    },

    suppressed(el) {
        return !!(el && el[Swipe.SUPPRESS_FLAG]);
    }
};

// =============================================
// Focus Mode (S3 / F3) — fullscreen "tarefa por vez"
// =============================================

const FocusMode = {
    STORAGE_KEY: 'savit_focus_idx',
    pageEl: null,
    queue: [],
    idx: 0,
    keyHandler: null,
    swipeBound: false,

    init() {
        this.pageEl = document.getElementById('focusPage');
        if (!this.pageEl) return;

        const close = () => this.exit();
        const closeBtn = document.getElementById('focusCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', close);
        const prev = document.getElementById('focusPrevBtn');
        const next = document.getElementById('focusNextBtn');
        const done = document.getElementById('focusDoneBtn');
        const snooze = document.getElementById('focusSnoozeBtn');
        if (prev) prev.addEventListener('click', () => this.prev());
        if (next) next.addEventListener('click', () => this.next());
        if (done) done.addEventListener('click', () => this.complete());
        if (snooze) snooze.addEventListener('click', () => this.snooze());

        // Swipe on the active card
        if (typeof Swipe !== 'undefined' && !this.swipeBound) {
            const card = document.getElementById('focusActiveCard');
            if (card) {
                Swipe.attach(card, {
                    onLeft: () => this.next(),
                    onRight: () => this.prev(),
                });
            }
            this.swipeBound = true;
        }
    },

    isActive() {
        return this.pageEl && this.pageEl.dataset.active === '1';
    },

    todayPending() {
        const today0 = new Date(); today0.setHours(0, 0, 0, 0);
        const tomorrow0 = new Date(today0); tomorrow0.setDate(tomorrow0.getDate() + 1);
        return (AppState.messages || []).filter(m => {
            if (!m.isTask || m.taskCompleted || !m.taskDate) return false;
            const d = new Date(m.taskDate + 'T00:00:00');
            return d >= today0 && d < tomorrow0;
        }).sort((a, b) => {
            const ta = a.taskTime || '23:59';
            const tb = b.taskTime || '23:59';
            return ta.localeCompare(tb);
        });
    },

    start() {
        if (!this.pageEl) return;
        this.queue = this.todayPending();
        const saved = parseInt(localStorage.getItem(this.STORAGE_KEY) || '0', 10);
        this.idx = (Number.isFinite(saved) && saved >= 0 && saved < this.queue.length) ? saved : 0;
        this.pageEl.dataset.active = '1';
        this.pageEl.hidden = false;
        // Mirror to URL hash
        if (typeof Router !== 'undefined' && location.hash !== '#/focus') {
            history.pushState(null, '', '#/focus');
        }
        this.bindKeys();
        this.render();
    },

    exit() {
        if (!this.pageEl) return;
        this.pageEl.dataset.active = '';
        this.pageEl.hidden = true;
        this.unbindKeys();
        // Drop the focus hash so router doesn't reopen on hashchange
        if (location.hash === '#/focus') {
            history.back();
        }
    },

    bindKeys() {
        if (this.keyHandler) return;
        this.keyHandler = (e) => {
            if (!this.isActive()) return;
            if (e.key === 'Escape') { e.preventDefault(); this.exit(); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); this.next(); }
            else if (e.key === 'ArrowLeft')  { e.preventDefault(); this.prev(); }
            else if (e.key === 'Enter')      { e.preventDefault(); this.complete(); }
        };
        document.addEventListener('keydown', this.keyHandler);
    },

    unbindKeys() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
    },

    render() {
        if (!this.pageEl) return;
        this.pageEl.dataset.empty = this.queue.length === 0 ? '1' : '';

        const counter = document.getElementById('focusCounter');
        const headline = document.getElementById('focusHeadline');
        const text = document.getElementById('focusTaskText');
        const cat = document.getElementById('focusTaskCat');
        const when = document.getElementById('focusTaskWhen');

        if (this.queue.length === 0) {
            if (counter) counter.textContent = '0 / 0';
            return;
        }

        if (this.idx >= this.queue.length) this.idx = this.queue.length - 1;
        if (this.idx < 0) this.idx = 0;

        const task = this.queue[this.idx];
        if (counter) counter.textContent = (this.idx + 1) + ' / ' + this.queue.length;
        if (headline) {
            const n = this.queue.length;
            headline.innerHTML = 'Hoje você quer fechar <strong>' + n + ' tarefa' + (n === 1 ? '' : 's') + '</strong>.';
        }
        if (text) {
            const tmp = document.createElement('div');
            tmp.innerHTML = String(task.text || '');
            const plain = (tmp.textContent || tmp.innerText || '').trim();
            text.textContent = plain || '—';
        }
        if (cat) {
            if (task.category) {
                cat.textContent = task.category.name || '';
                cat.style.background = Utils.sanitizeCssColor(task.category.color || '#888');
                cat.hidden = false;
            } else {
                cat.hidden = true;
            }
        }
        if (when) {
            if (task.taskTime) {
                when.textContent = 'Hoje · ' + task.taskTime;
                when.hidden = false;
            } else {
                when.textContent = 'Hoje';
                when.hidden = false;
            }
        }

        try { localStorage.setItem(this.STORAGE_KEY, String(this.idx)); } catch { /* ignore */ }
    },

    next() {
        if (!this.queue.length) return;
        this.idx = (this.idx + 1) % this.queue.length;
        this.render();
    },

    prev() {
        if (!this.queue.length) return;
        this.idx = (this.idx - 1 + this.queue.length) % this.queue.length;
        this.render();
    },

    async complete() {
        const task = this.queue[this.idx];
        if (!task) return;
        try {
            const { message: updated } = await API.messages.toggle(task.id);
            const j = AppState.messages.findIndex(m => m.id === task.id);
            if (j !== -1) AppState.messages[j] = updated;
            // Remove from queue
            this.queue.splice(this.idx, 1);
            if (this.idx >= this.queue.length) this.idx = Math.max(0, this.queue.length - 1);
            this.render();
            App.renderMessages();
            if (window.Toast) Toast.show('Concluída', { type: 'success' });
            if (this.queue.length === 0) {
                if (window.Toast) Toast.show('Tudo fechado por hoje', { type: 'success' });
            }
        } catch (err) {
            if (window.Toast) Toast.error('Erro ao concluir');
        }
    },

    async snooze() {
        const task = this.queue[this.idx];
        if (!task) return;
        // Bump taskTime by +1h (or set to now+1h if missing)
        let newTime;
        if (task.taskTime && /^\d{2}:\d{2}$/.test(task.taskTime)) {
            const [h, m] = task.taskTime.split(':').map(n => parseInt(n, 10));
            const d = new Date(); d.setHours(h, m, 0, 0); d.setHours(d.getHours() + 1);
            newTime = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        } else {
            const d = new Date(); d.setHours(d.getHours() + 1);
            newTime = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        }
        try {
            const { message: updated } = await API.messages.update(task.id, {
                text: task.text,
                categoryId: task.categoryId || null,
                isTask: true,
                taskDate: task.taskDate,
                taskTime: newTime
            });
            const j = AppState.messages.findIndex(m => m.id === task.id);
            if (j !== -1) AppState.messages[j] = updated;
            this.queue[this.idx] = updated;
            this.render();
            App.renderMessages();
            if (window.Toast) Toast.show('Adiada para ' + newTime, { type: 'info' });
        } catch (err) {
            if (window.Toast) Toast.error('Erro ao adiar');
        }
    }
};

// =============================================
// S5 — Polish & bug fixes (§7)
// =============================================

const S5Polish = {
    init() {
        this.bindOfflineBanner();
        this.bindGlobalKeys();
        this.bindCmdLaunchers();
        this.bindCategoryChipReopen();
        this.bindShowCompletedToggle();
        this.restoreScrollOnNavigate();
    },

    // §7.17 — Sticky offline banner
    bindOfflineBanner() {
        let banner = document.getElementById('offlineBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'offlineBanner';
            banner.className = 'offline-banner';
            banner.setAttribute('role', 'status');
            banner.textContent = 'Sem conexão · suas alterações estão salvas localmente';
            document.body.appendChild(banner);
        }
        const update = () => banner.classList.toggle('is-visible', !navigator.onLine);
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        update();
    },

    // §7.20 — Global keyboard shortcuts (Esc/arrows). ⌘K is in CommandPalette.
    bindGlobalKeys() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in a field or editor
            const t = e.target;
            const isEditable = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

            // Esc closes any open modal (.modal.active)
            if (e.key === 'Escape' && !isEditable) {
                const openModal = document.querySelector('.modal.active');
                if (openModal) {
                    openModal.classList.remove('active');
                    e.preventDefault();
                    return;
                }
            }
        });
    },

    // §F2 — open palette from sidebar Cmd btn / mobile FAB long-press
    bindCmdLaunchers() {
        const sidebarCmdBtn = document.getElementById('sidebarCmdBtn');
        if (sidebarCmdBtn && typeof CommandPalette !== 'undefined') {
            // Replace inbox-jump with palette open (S1 placeholder graduates here)
            const fresh = sidebarCmdBtn.cloneNode(true);
            sidebarCmdBtn.parentNode.replaceChild(fresh, sidebarCmdBtn);
            fresh.addEventListener('click', () => CommandPalette.open());
        }

        // Long-press on the mobile capture FAB opens the palette (per spec §3.11)
        const fab = document.getElementById('captureFab');
        if (fab && typeof CommandPalette !== 'undefined') {
            let timer = null;
            const start = () => {
                timer = setTimeout(() => { CommandPalette.open(); timer = null; }, 500);
            };
            const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
            fab.addEventListener('touchstart', start, { passive: true });
            fab.addEventListener('touchend', cancel);
            fab.addEventListener('touchmove', cancel);
            fab.addEventListener('touchcancel', cancel);
        }
    },

    // §7.4 — clicking the selected-category pill (not the X) reopens picker
    bindCategoryChipReopen() {
        const pill = document.getElementById('selectedCategory');
        const removeBtn = document.getElementById('removeCategoryBtn');
        if (!pill) return;
        pill.addEventListener('click', (e) => {
            if (e.target === removeBtn || (removeBtn && removeBtn.contains(e.target))) return;
            const modal = DOM && DOM.categorySelectorModal;
            if (modal && typeof openModal === 'function') openModal(modal);
        });
        pill.style.cursor = 'pointer';
    },

    // §7.16 — toggle "Mostrar concluídas" on the tasks page
    bindShowCompletedToggle() {
        const kanbanPage = document.getElementById('kanbanPage');
        if (!kanbanPage) return;
        const filtersRow = kanbanPage.querySelector('.kanban-filters');
        if (!filtersRow) return;
        if (kanbanPage.querySelector('.show-completed-toggle')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'show-completed-toggle';
        btn.innerHTML = '<i class="fas fa-eye" aria-hidden="true"></i><span>Concluídas</span>';
        const STORAGE = 'savit_show_completed';
        const apply = () => {
            const on = localStorage.getItem(STORAGE) === '1';
            btn.classList.toggle('is-on', on);
            kanbanPage.dataset.showCompleted = on ? '1' : '0';
        };
        btn.addEventListener('click', () => {
            const on = localStorage.getItem(STORAGE) === '1';
            try { localStorage.setItem(STORAGE, on ? '0' : '1'); } catch { /* ignore */ }
            apply();
            // Force re-render of mobile list to respect new preference
            if (typeof App !== 'undefined' && typeof App.renderTaskListMobile === 'function') {
                App.renderTaskListMobile();
            }
        });
        filtersRow.appendChild(btn);
        apply();
    },

    showCompletedEnabled() {
        try { return localStorage.getItem('savit_show_completed') === '1'; }
        catch { return false; }
    },

    // §7.14 — preserve feed scroll position per page (sessionStorage)
    SCROLL_KEY: (page) => 'savit_scroll_' + page,

    saveScroll(pageId) {
        if (!pageId) return;
        const containers = {
            chat: DOM && DOM.messagesContainer,
            categoryMessages: DOM && DOM.categoryMessagesContainer,
        };
        const c = containers[pageId];
        if (!c) return;
        try { sessionStorage.setItem(this.SCROLL_KEY(pageId), String(c.scrollTop || 0)); } catch { /* ignore */ }
    },

    restoreScroll(pageId) {
        const containers = {
            chat: DOM && DOM.messagesContainer,
            categoryMessages: DOM && DOM.categoryMessagesContainer,
        };
        const c = containers[pageId];
        if (!c) return;
        try {
            const saved = parseInt(sessionStorage.getItem(this.SCROLL_KEY(pageId)) || '', 10);
            if (Number.isFinite(saved)) {
                requestAnimationFrame(() => { c.scrollTop = saved; });
            }
        } catch { /* ignore */ }
    },

    restoreScrollOnNavigate() {
        // Wrap App.navigateTo to save/restore scroll
        if (typeof App === 'undefined' || App.__s5wrapped) return;
        App.__s5wrapped = true;
        const original = App.navigateTo.bind(App);
        App.navigateTo = (page) => {
            const prev = AppState.currentPage;
            S5Polish.saveScroll(prev);
            const ret = original(page);
            S5Polish.restoreScroll(page);
            return ret;
        };
    },

    // §F2 / PWA — handle ?share-target on first load
    handleShareTarget() {
        try {
            const params = new URLSearchParams(window.location.search);
            if (!params.has('share-target')) return;
            const text = [params.get('title'), params.get('text'), params.get('url')]
                .filter(Boolean)
                .join('\n')
                .trim();
            if (!text) return;
            // Defer until App is ready
            requestAnimationFrame(() => {
                if (typeof App === 'undefined') return;
                App.navigateTo('chat');
                requestAnimationFrame(() => {
                    if (!DOM.messageInput) return;
                    if (DOM.messageInput.isContentEditable) DOM.messageInput.textContent = text;
                    else DOM.messageInput.value = text;
                    DOM.messageInput.focus();
                    if (typeof SmartCapture !== 'undefined') SmartCapture.refresh();
                });
            });
            // Strip the query so reload doesn't re-trigger
            const cleanUrl = window.location.pathname + window.location.hash;
            history.replaceState(null, '', cleanUrl);
        } catch { /* ignore */ }
    }
};

function initThemeSectionCollapsible() {
    if (!DOM.themeSection || !DOM.themeSectionToggle) return;

    const storageKey = 'savit.themeSectionCollapsed';

    const readPref = () => {
        try {
            const v = localStorage.getItem(storageKey);
            if (v === '0') return false;
            if (v === '1') return true;
        } catch {
            // ignore
        }
        return true;
    };

    const writePref = (collapsed) => {
        try {
            localStorage.setItem(storageKey, collapsed ? '1' : '0');
        } catch {
            // ignore
        }
    };

    const setCollapsed = (collapsed) => {
        DOM.themeSection.classList.toggle('is-collapsed', !!collapsed);
        writePref(!!collapsed);

        if (!collapsed) {
            setTimeout(() => {
                try {
                    const activeBtn = DOM.themeSection.querySelector('.theme-option.active');
                    activeBtn?.focus?.();
                } catch {
                    // ignore
                }
            }, 0);
        }
    };

    setCollapsed(readPref());

    DOM.themeSectionToggle.addEventListener('click', () => {
        const isCollapsed = DOM.themeSection.classList.contains('is-collapsed');
        setCollapsed(!isCollapsed);
    });
}

// =============================================
// Drawing Canvas
// =============================================

const DrawingCanvas = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentColor: '#000000',
    currentSize: 5,
    isEraser: false,
    lastX: 0,
    lastY: 0,

    init() {
        this.canvas = DOM.drawCanvas;
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.bindEvents();
    },

    setupCanvas() {
        const container = DOM.canvasContainer;
        const rect = container.getBoundingClientRect();
        
        // Set canvas size
        this.canvas.width = rect.width || 500;
        this.canvas.height = rect.height || 400;
        
        // Fill with white background
        this.clear();
    },

    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
    },

    getPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    },

    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getPosition(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
    },

    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getPosition(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.strokeStyle = this.isEraser ? '#FFFFFF' : this.currentColor;
        this.ctx.lineWidth = this.currentSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    },

    stopDrawing() {
        this.isDrawing = false;
    },

    setColor(color) {
        this.currentColor = color;
        this.isEraser = false;
        DOM.drawPencil.classList.add('active');
        DOM.drawEraser.classList.remove('active');
    },

    setSize(size) {
        this.currentSize = size;
    },

    setEraser() {
        this.isEraser = true;
        DOM.drawEraser.classList.add('active');
        DOM.drawPencil.classList.remove('active');
    },

    setPencil() {
        this.isEraser = false;
        DOM.drawPencil.classList.add('active');
        DOM.drawEraser.classList.remove('active');
    },

    clear() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    getImage() {
        return this.canvas.toDataURL('image/png');
    },

    reset() {
        this.clear();
        this.currentColor = '#000000';
        this.currentSize = 5;
        this.isEraser = false;
        if (DOM.drawSize) DOM.drawSize.value = 5;
        document.querySelectorAll('.draw-color').forEach((btn, i) => {
            btn.classList.toggle('active', i === 0);
        });
        DOM.drawPencil?.classList.add('active');
        DOM.drawEraser?.classList.remove('active');
    }
};

// =============================================
// DOM Elements
// =============================================

const DOM = {
    // Screens
    loadingScreen: document.getElementById('loadingScreen'),
    authScreen: document.getElementById('authScreen'),
    mainApp: document.getElementById('mainApp'),

    // Auth
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginMfaGroup: document.getElementById('loginMfaGroup'),
    loginMfaCode: document.getElementById('loginMfaCode'),
    registerName: document.getElementById('registerName'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),

    // Navigation
    bottomNav: document.getElementById('bottomNav'),
    sidebar: document.getElementById('sidebar'),
    pagesContainer: document.getElementById('pagesContainer'),

    // Pages
    homePage: document.getElementById('homePage'),
    chatPage: document.getElementById('chatPage'),
    categoriesPage: document.getElementById('categoriesPage'),
    kanbanPage: document.getElementById('kanbanPage'),
    profilePage: document.getElementById('profilePage'),
    categoryMessagesPage: document.getElementById('categoryMessagesPage'),

    // Kanban
    kanbanBoard: document.getElementById('kanbanBoard'),
    kanbanPending: document.getElementById('kanbanPending'),
    kanbanCompleted: document.getElementById('kanbanCompleted'),
    kanbanPendingCount: document.getElementById('kanbanPendingCount'),
    kanbanCompletedCount: document.getElementById('kanbanCompletedCount'),
    kanbanSearch: document.getElementById('kanbanSearch'),
    kanbanCategoryFilter: document.getElementById('kanbanCategoryFilter'),

    // Home Page
    userName: document.getElementById('userName'),
    headerDate: document.getElementById('headerDate'),
    statTotalMessages: document.getElementById('statTotalMessages'),
    statToday: document.getElementById('statToday'),
    statPendingTasks: document.getElementById('statPendingTasks'),
    statStreak: document.getElementById('statStreak'),
    activityChart: document.getElementById('activityChart'),
    calendarDays: document.getElementById('calendarDays'),
    calendarMonth: document.getElementById('calendarMonth'),
    calendarPrev: document.getElementById('calendarPrev'),
    calendarNext: document.getElementById('calendarNext'),
    calendarTasks: document.getElementById('calendarTasks'),
    calendarTasksList: document.getElementById('calendarTasksList'),
    calendarSelectedDate: document.getElementById('calendarSelectedDate'),
    progressCircleFill: document.getElementById('progressCircleFill'),
    progressPercent: document.getElementById('progressPercent'),
    completedTasks: document.getElementById('completedTasks'),
    pendingTasksDetail: document.getElementById('pendingTasksDetail'),
    taskAlerts: document.getElementById('taskAlerts'),
    topCategories: document.getElementById('topCategories'),
    recentMessages: document.getElementById('recentMessages'),
    upcomingTasks: document.getElementById('upcomingTasks'),
    quickAddBtn: document.getElementById('quickAddBtn'),
    viewAllMessages: document.getElementById('viewAllMessages'),
    
    // Admin
    adminSection: document.getElementById('adminSection'),
    pendingUsersList: document.getElementById('pendingUsersList'),
    pendingCount: document.getElementById('pendingCount'),
    allUsersList: document.getElementById('allUsersList'),
    refreshUsersBtn: document.getElementById('refreshUsersBtn'),
    syncCategoryColorsBtn: document.getElementById('syncCategoryColorsBtn'),
    syncColorsOutput: document.getElementById('syncColorsOutput'),

    // Chat Page
    messagesContainer: document.getElementById('messagesContainer'),
    emptyState: document.getElementById('emptyState'),
    jumpToBottomBtn: document.getElementById('jumpToBottomBtn'),
    jumpToBottomBadge: document.getElementById('jumpToBottomBadge'),
    searchBtn: document.getElementById('searchBtn'),
    searchBar: document.getElementById('searchBar'),
    searchInput: document.getElementById('searchInput'),
    closeSearchBtn: document.getElementById('closeSearchBtn'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    searchCategoryFilter: document.getElementById('searchCategoryFilter'),
    searchDateFilter: document.getElementById('searchDateFilter'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    addCategoryBtn: document.getElementById('addCategoryBtn'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    voiceInputBtn: document.getElementById('voiceInputBtn'),
    voiceRecording: document.getElementById('voiceRecording'),
    voiceStopBtn: document.getElementById('voiceStopBtn'),
    selectedCategory: document.getElementById('selectedCategory'),
    categoryBadge: document.getElementById('categoryBadge'),
    removeCategoryBtn: document.getElementById('removeCategoryBtn'),
    taskOptions: document.getElementById('taskOptions'),
    removeTaskBtn: document.getElementById('removeTaskBtn'),
    taskDate: document.getElementById('taskDate'),
    taskTime: document.getElementById('taskTime'),

    // Formatting toolbars
    formatToolbar: document.getElementById('formatToolbar'),
    categoryFormatToolbar: document.getElementById('categoryFormatToolbar'),
    editFormatToolbar: document.getElementById('editFormatToolbar'),

    // Sidebar (Desktop)
    sidebarAvatar: document.getElementById('sidebarAvatar'),
    sidebarUsername: document.getElementById('sidebarUsername'),

    // Categories Page
    newCategoryBtn: document.getElementById('newCategoryBtn'),
    newSectionBtn: document.getElementById('newSectionBtn'),
    toggleSectionSortBtn: document.getElementById('toggleSectionSortBtn'),
    categoriesList: document.getElementById('categoriesList'),

    // Profile Page
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    profileTotalMessages: document.getElementById('profileTotalMessages'),
    profileTotalCategories: document.getElementById('profileTotalCategories'),
    profileTotalTasks: document.getElementById('profileTotalTasks'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    changePasswordBtn: document.getElementById('changePasswordBtn'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    logoutBtn: document.getElementById('logoutBtn'),

    // Category Messages
    backFromCategoryBtn: document.getElementById('backFromCategoryBtn'),
    categoryMessagesTitle: document.getElementById('categoryMessagesTitle'),
    categoryMessagesContainer: document.getElementById('categoryMessagesContainer'),
    categoryMessageInput: document.getElementById('categoryMessageInput'),
    categorySendBtn: document.getElementById('categorySendBtn'),
    categoryAddTaskBtn: document.getElementById('categoryAddTaskBtn'),
    categoryTaskOptions: document.getElementById('categoryTaskOptions'),
    categoryTaskDate: document.getElementById('categoryTaskDate'),
    categoryTaskTime: document.getElementById('categoryTaskTime'),
    categoryRemoveTaskBtn: document.getElementById('categoryRemoveTaskBtn'),
    categoryVoiceInputBtn: document.getElementById('categoryVoiceInputBtn'),
    categoryVoiceRecording: document.getElementById('categoryVoiceRecording'),
    categoryVoiceStopBtn: document.getElementById('categoryVoiceStopBtn'),
    categoryAttachImageBtn: document.getElementById('categoryAttachImageBtn'),
    categoryImageInput: document.getElementById('categoryImageInput'),
    categoryImagePreviewContainer: document.getElementById('categoryImagePreviewContainer'),
    categoryDrawMessageBtn: document.getElementById('categoryDrawMessageBtn'),

    // Theme
    themePaperBtn: document.getElementById('themePaperBtn'),
    themePlayfulBtn: document.getElementById('themePlayfulBtn'),
    themeLinearBtn: document.getElementById('themeLinearBtn'),

    // Theme section (collapsible)
    themeSection: document.getElementById('themeSection'),
    themeSectionToggle: document.getElementById('themeSectionToggle'),
    themeSectionContent: document.getElementById('themeSectionContent'),
    themeCurrentLabel: document.getElementById('themeCurrentLabel'),

    // Image & Drawing
    attachImageBtn: document.getElementById('attachImageBtn'),
    imageInput: document.getElementById('imageInput'),
    imagePreviewContainer: document.getElementById('imagePreviewContainer'),
    drawMessageBtn: document.getElementById('drawMessageBtn'),
    drawModal: document.getElementById('drawModal'),
    closeDrawModal: document.getElementById('closeDrawModal'),
    drawCanvas: document.getElementById('drawCanvas'),
    canvasContainer: document.getElementById('canvasContainer'),
    drawPencil: document.getElementById('drawPencil'),
    drawEraser: document.getElementById('drawEraser'),
    drawClear: document.getElementById('drawClear'),
    drawSize: document.getElementById('drawSize'),
    cancelDrawBtn: document.getElementById('cancelDrawBtn'),
    saveDrawBtn: document.getElementById('saveDrawBtn'),
    imageViewer: document.getElementById('imageViewer'),
    imageViewerImg: document.getElementById('imageViewerImg'),
    closeImageViewer: document.getElementById('closeImageViewer'),

    // Modals
    categorySelectorModal: document.getElementById('categorySelectorModal'),
    closeCategorySelectorModal: document.getElementById('closeCategorySelectorModal'),
    categorySelectorList: document.getElementById('categorySelectorList'),
    // Sections modal
    sectionsModal: document.getElementById('sectionsModal'),
    closeSectionsModal: document.getElementById('closeSectionsModal'),
    closeSectionsBtn: document.getElementById('closeSectionsBtn'),
    newSectionName: document.getElementById('newSectionName'),
    newSectionColorPicker: document.getElementById('newSectionColorPicker'),
    newSectionColorBtn: document.getElementById('newSectionColorBtn'),
    newSectionColorMenu: document.getElementById('newSectionColorMenu'),
    newSectionColor: document.getElementById('newSectionColor'),
    createSectionBtn: document.getElementById('createSectionBtn'),
    sectionsList: document.getElementById('sectionsList'),
    sectionsSortModeBtn: document.getElementById('sectionsSortModeBtn'),

    // Move category modal
    moveCategoryModal: document.getElementById('moveCategoryModal'),
    closeMoveCategoryModal: document.getElementById('closeMoveCategoryModal'),
    cancelMoveCategoryBtn: document.getElementById('cancelMoveCategoryBtn'),
    confirmMoveCategoryBtn: document.getElementById('confirmMoveCategoryBtn'),
    moveCategoryName: document.getElementById('moveCategoryName'),
    moveCategorySectionSelect: document.getElementById('moveCategorySectionSelect'),
    moveCategorySectionDropdown: document.getElementById('moveCategorySectionDropdown'),
    moveCategorySectionTrigger: document.getElementById('moveCategorySectionTrigger'),
    moveCategorySectionMenu: document.getElementById('moveCategorySectionMenu'),

    // Rename/delete section modals
    renameSectionModal: document.getElementById('renameSectionModal'),
    closeRenameSectionModal: document.getElementById('closeRenameSectionModal'),
    cancelRenameSectionBtn: document.getElementById('cancelRenameSectionBtn'),
    saveRenameSectionBtn: document.getElementById('saveRenameSectionBtn'),
    renameSectionInput: document.getElementById('renameSectionInput'),
    editSectionColorPicker: document.getElementById('editSectionColorPicker'),
    editSectionColor: document.getElementById('editSectionColor'),

    deleteSectionModal: document.getElementById('deleteSectionModal'),
    closeDeleteSectionModal: document.getElementById('closeDeleteSectionModal'),
    cancelDeleteSectionBtn: document.getElementById('cancelDeleteSectionBtn'),
    confirmDeleteSectionBtn: document.getElementById('confirmDeleteSectionBtn'),
    deleteSectionName: document.getElementById('deleteSectionName'),
    categoryModal: document.getElementById('categoryModal'),
    closeCategoryModal: document.getElementById('closeCategoryModal'),
    categoryModalTitle: document.getElementById('categoryModalTitle'),
    categoryName: document.getElementById('categoryName'),
    categorySectionSelect: document.getElementById('categorySectionSelect'),
    categorySectionDropdown: document.getElementById('categorySectionDropdown'),
    categorySectionTrigger: document.getElementById('categorySectionTrigger'),
    categorySectionMenu: document.getElementById('categorySectionMenu'),
    cancelCategoryBtn: document.getElementById('cancelCategoryBtn'),
    saveCategoryBtn: document.getElementById('saveCategoryBtn'),
    editMessageModal: document.getElementById('editMessageModal'),
    closeEditMessageModal: document.getElementById('closeEditMessageModal'),
    editMessageText: document.getElementById('editMessageText'),
    editMessageCategory: document.getElementById('editMessageCategory'),
    editMessageCategoryDropdown: document.getElementById('editMessageCategoryDropdown'),
    editMessageCategoryTrigger: document.getElementById('editMessageCategoryTrigger'),
    editMessageCategoryMenu: document.getElementById('editMessageCategoryMenu'),
    editMessageIsTask: document.getElementById('editMessageIsTask'),
    editTaskFields: document.getElementById('editTaskFields'),
    editTaskDate: document.getElementById('editTaskDate'),
    editTaskTime: document.getElementById('editTaskTime'),
    deleteMessageBtn: document.getElementById('deleteMessageBtn'),
    saveEditMessageBtn: document.getElementById('saveEditMessageBtn'),
    editProfileModal: document.getElementById('editProfileModal'),
    closeEditProfileModal: document.getElementById('closeEditProfileModal'),
    editProfileName: document.getElementById('editProfileName'),
    cancelEditProfileBtn: document.getElementById('cancelEditProfileBtn'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    changePasswordModal: document.getElementById('changePasswordModal'),
    closeChangePasswordModal: document.getElementById('closeChangePasswordModal'),
    currentPassword: document.getElementById('currentPassword'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    cancelChangePasswordBtn: document.getElementById('cancelChangePasswordBtn'),
    savePasswordBtn: document.getElementById('savePasswordBtn'),
    quickAddModal: document.getElementById('quickAddModal'),
    closeQuickAddModal: document.getElementById('closeQuickAddModal'),
    quickAddText: document.getElementById('quickAddText'),
    quickAddCategory: document.getElementById('quickAddCategory'),
    quickAddCategoryDropdown: document.getElementById('quickAddCategoryDropdown'),
    quickAddCategoryTrigger: document.getElementById('quickAddCategoryTrigger'),
    quickAddCategoryMenu: document.getElementById('quickAddCategoryMenu'),
    quickAddIsTask: document.getElementById('quickAddIsTask'),
    quickAddTaskFields: document.getElementById('quickAddTaskFields'),
    quickAddTaskDate: document.getElementById('quickAddTaskDate'),
    quickAddTaskTime: document.getElementById('quickAddTaskTime'),
    saveQuickAddBtn: document.getElementById('saveQuickAddBtn'),

    // Mind Map
    mindMapModal: document.getElementById('mindMapModal'),
    closeMindMapModal: document.getElementById('closeMindMapModal'),
    mindMapEditor: document.getElementById('mindMapEditor'),
    cancelMindMapBtn: document.getElementById('cancelMindMapBtn'),
    insertMindMapBtn: document.getElementById('insertMindMapBtn'),
    mindMapHelp: document.getElementById('mindMapHelp'),
    mindMapTitle: document.getElementById('mindMapTitle'),
    mindMapToggleCollapseBtn: document.getElementById('mindMapToggleCollapseBtn'),
    mindMapExpandAllBtn: document.getElementById('mindMapExpandAllBtn'),
    mindMapCollapseAllBtn: document.getElementById('mindMapCollapseAllBtn'),
    mindMapNodeTitle: document.getElementById('mindMapNodeTitle'),
    mindMapRenameBtn: document.getElementById('mindMapRenameBtn'),
    mindMapAddChildBtn: document.getElementById('mindMapAddChildBtn'),
    mindMapAddSiblingBtn: document.getElementById('mindMapAddSiblingBtn'),
    mindMapDeleteNodeBtn: document.getElementById('mindMapDeleteNodeBtn'),

    // Context Menu
    contextMenu: document.getElementById('contextMenu'),

    // System dialog (custom alert/confirm/prompt)
    systemDialogModal: document.getElementById('systemDialogModal'),
    closeSystemDialogModal: document.getElementById('closeSystemDialogModal'),
    systemDialogTitle: document.getElementById('systemDialogTitle'),
    systemDialogBody: document.getElementById('systemDialogBody'),
    systemDialogInputWrap: document.getElementById('systemDialogInputWrap'),
    systemDialogInput: document.getElementById('systemDialogInput'),
    systemDialogFooter: document.getElementById('systemDialogFooter')
};

// =============================================
// Markdown Helpers (safe, minimal)
// =============================================

const Markdown = {
    indentSize: 4,

    normalizeNewlines(text) {
        return String(text || '').replace(/\r\n?/g, '\n');
    },

    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    isSafeUrl(url) {
        const trimmed = String(url || '').trim();
        if (!trimmed) return false;

        // Allow http(s) and mailto only
        return /^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed);
    },

    formatInline(escapedText) {
        if (!escapedText) return '';

        let html = escapedText;

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Links: [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, linkText, url) => {
            const rawUrl = String(url || '').trim();
            if (!Markdown.isSafeUrl(rawUrl)) {
                return match;
            }
            const safeHref = Markdown.escapeHtml(rawUrl);
            return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        });

        // Bold
        html = html.replace(/\*\*([^\n*][^\n]*?)\*\*/g, '<strong>$1</strong>');

        // Highlight (==text==)
        html = html.replace(/==([^\n=][^\n]*?)==/g, '<mark>$1</mark>');

        // Italic (simple)
        html = html.replace(/(^|[^*])\*([^\n*][^\n]*?)\*(?!\*)/g, '$1<em>$2</em>');

        return html;
    },

    render(text) {
        const source = Markdown.normalizeNewlines(text);
        if (!source.trim()) return '';

        const lines = source.split('\n');
        const out = [];

        let inCode = false;
        let codeLines = [];

        let inMindMap = false;
        let mindMapLines = [];
        let paraLines = [];
        let listStack = []; // { type: 'ul'|'ol', indent: number, liOpen: boolean }

        const flushParagraph = () => {
            if (paraLines.length === 0) return;
            const escaped = paraLines.map(l => Markdown.escapeHtml(l));
            const joined = escaped.join('<br>');
            out.push(`<p>${Markdown.formatInline(joined)}</p>`);
            paraLines = [];
        };

        const closeTopLiIfOpen = () => {
            const top = listStack[listStack.length - 1];
            if (top && top.liOpen) {
                out.push('</li>');
                top.liOpen = false;
            }
        };

        const closeAllLists = () => {
            while (listStack.length > 0) {
                closeTopLiIfOpen();
                out.push(`</${listStack[listStack.length - 1].type}>`);
                listStack.pop();
            }
        };

        const closeListsToIndent = (targetIndent) => {
            while (listStack.length > 0 && listStack[listStack.length - 1].indent > targetIndent) {
                closeTopLiIfOpen();
                out.push(`</${listStack[listStack.length - 1].type}>`);
                listStack.pop();
            }
        };

        const openList = (type, indent) => {
            out.push(`<${type}>`);
            listStack.push({ type, indent, liOpen: false });
        };

        const ensureListForItem = (type, indent) => {
            // If there's no list yet, start one. If the user indents the first item,
            // still start at indent 0 to avoid orphan nesting.
            if (listStack.length === 0) {
                openList(type, 0);
            }

            let top = listStack[listStack.length - 1];

            // Deeper indent: create nested lists inside the current open <li>
            if (indent > top.indent) {
                if (!top.liOpen) {
                    out.push('<li>');
                    top.liOpen = true;
                }

                while (indent > top.indent) {
                    const nextIndent = top.indent + 1;
                    openList(type, nextIndent);
                    top = listStack[listStack.length - 1];

                    // If we still need to go deeper, open a container <li>
                    if (indent > top.indent) {
                        out.push('<li>');
                        top.liOpen = true;
                    }
                }
            }

            // Shallower indent: close deeper lists
            if (indent < top.indent) {
                closeListsToIndent(indent);
                top = listStack[listStack.length - 1];
                if (!top) {
                    openList(type, 0);
                    top = listStack[listStack.length - 1];
                }
            }

            // Same indent: ensure correct list type
            if (top.indent === indent && top.type !== type) {
                closeTopLiIfOpen();
                out.push(`</${top.type}>`);
                listStack.pop();
                openList(type, indent);
                top = listStack[listStack.length - 1];
            }

            // Same list level: close previous item before starting a new one
            if (top.indent === indent) {
                closeTopLiIfOpen();
            }
        };

        const flushCode = () => {
            const escaped = Markdown.escapeHtml(codeLines.join('\n'));
            out.push(`<pre><code>${escaped}</code></pre>`);
            codeLines = [];
        };

        const computeIndent = (line) => {
            const m = line.match(/^(\s*)/);
            const spaces = (m?.[1] || '').replace(/\t/g, ' '.repeat(Markdown.indentSize)).length;
            return Math.floor(spaces / Markdown.indentSize);
        };

        for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            const line = rawLine;

            // Mind map fences: ```savit-mindmap ... ```
            if (!inCode && /^\s*```\s*savit-mindmap\s*$/.test(line)) {
                flushParagraph();
                closeAllLists();
                inMindMap = true;
                mindMapLines = [];
                continue;
            }

            if (inMindMap) {
                if (/^\s*```\s*$/.test(line)) {
                    inMindMap = false;
                    const jsonRaw = mindMapLines.join('\n').trim();
                    let title = 'Mapa mental';
                    try {
                        const parsed = JSON.parse(jsonRaw);
                        title = String(parsed?.meta?.title || parsed?.title || parsed?.nodeData?.topic || 'Mapa mental');
                    } catch {
                        title = 'Mapa mental';
                    }
                    const encoded = Markdown.escapeHtml(encodeURIComponent(jsonRaw));
                    const safeTitle = Markdown.escapeHtml(title);
                    out.push(
                        `<div class="mindmap-embed" data-mindmap="${encoded}">` +
                        `<div class="mindmap-embed-toolbar">` +
                        `<div class="mindmap-embed-title">${safeTitle}</div>` +
                        `<button class="mindmap-embed-open" type="button">Abrir</button>` +
                        `</div>` +
                        `<div class="mindmap-embed-canvas" aria-label="${safeTitle}"></div>` +
                        `</div>`
                    );
                    mindMapLines = [];
                } else {
                    mindMapLines.push(line);
                }
                continue;
            }

            // Code fences
            if (/^\s*```/.test(line)) {
                if (inCode) {
                    inCode = false;
                    flushCode();
                } else {
                    flushParagraph();
                    closeAllLists();
                    inCode = true;
                }
                continue;
            }

            if (inCode) {
                codeLines.push(line);
                continue;
            }

            // Blank line
            if (!line.trim()) {
                flushParagraph();
                closeAllLists();
                continue;
            }

            // Headings
            const headingMatch = line.match(/^\s*(#{1,6})\s+(.*)$/);
            if (headingMatch) {
                flushParagraph();
                closeAllLists();
                const level = headingMatch[1].length;
                const content = Markdown.formatInline(Markdown.escapeHtml(headingMatch[2] || ''));
                out.push(`<h${level}>${content}</h${level}>`);
                continue;
            }

            // Blockquote (contiguous)
            if (/^\s*>\s?/.test(line)) {
                flushParagraph();
                closeAllLists();
                const quoteLines = [];
                let j = i;
                while (j < lines.length && /^\s*>\s?/.test(lines[j])) {
                    quoteLines.push(lines[j].replace(/^\s*>\s?/, ''));
                    j++;
                }
                i = j - 1;
                const escapedQuote = quoteLines.map(l => Markdown.escapeHtml(l)).join('<br>');
                out.push(`<blockquote>${Markdown.formatInline(escapedQuote)}</blockquote>`);
                continue;
            }

            // Lists
            const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
            const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
            if (ulMatch || olMatch) {
                flushParagraph();

                const indent = computeIndent(line);
                const type = ulMatch ? 'ul' : 'ol';
                const contentRaw = ulMatch ? ulMatch[3] : olMatch[3];

                ensureListForItem(type, indent);
                const content = Markdown.formatInline(Markdown.escapeHtml(contentRaw || ''));
                out.push(`<li>${content}`);
                if (listStack.length > 0) {
                    listStack[listStack.length - 1].liOpen = true;
                }
                continue;
            }

            // Normal paragraph line
            closeAllLists();
            paraLines.push(line);
        }

        if (inCode) {
            // Unclosed fence: still render as code.
            flushCode();
        }

        if (inMindMap) {
            // Unclosed mindmap fence: render as text paragraph.
            inMindMap = false;
            paraLines.push('```savit-mindmap');
            paraLines.push(...mindMapLines);
        }

        flushParagraph();
        closeAllLists();

        return out.join('');
    }
};

// =============================================
// Rich Text (WYSIWYG) Helpers
// =============================================

const RichText = {
    allowedTags: new Set([
        'P', 'BR', 'STRONG', 'EM', 'B', 'I', 'U', 'S', 'MARK',
        'H1', 'H2', 'H3',
        'UL', 'OL', 'LI',
        'BLOCKQUOTE',
        'CODE', 'PRE',
        'A',
        'DIV', 'SPAN',
        'BUTTON',
        'DETAILS', 'SUMMARY'
    ]),
    allowedClassRe: /^(mindmap-|details-content$)/i,

    isLikelyHtml(text) {
        const s = String(text || '');
        // Only treat as HTML if it contains tags we actually allow.
        return /<\s*\/?\s*(p|br|strong|em|b|i|u|s|mark|h1|h2|h3|ul|ol|li|blockquote|code|pre|a|div|span|button|details|summary)\b/i.test(s);
    },

    plainTextFromStored(text) {
        const s = String(text || '');
        if (!s.trim()) return '';
        if (!RichText.isLikelyHtml(s)) return s;

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${s}</div>`, 'text/html');
            const out = (doc.body?.textContent || '').replace(/\u00A0/g, ' ');
            return out.replace(/\s+/g, ' ').trim();
        } catch {
            return s;
        }
    },

    enforceEmbedsAtomic(editorEl) {
        if (!editorEl?.isContentEditable) return;
        editorEl.querySelectorAll?.('.mindmap-embed')?.forEach(el => {
            try {
                el.setAttribute('contenteditable', 'false');
            } catch {
                // ignore
            }
        });
    },

    sanitizeHtml(html) {
        const input = String(html || '');
        if (!input.trim()) return '';

        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${input}</div>`, 'text/html');
        const container = doc.body?.firstElementChild;
        if (!container) return '';

        const sanitizeElement = (el) => {
            // Remove event handler attrs and disallowed attrs.
            const tag = el.tagName;

            // Strip all attributes by default
            const attrs = Array.from(el.attributes || []);
            for (const attr of attrs) {
                const name = attr.name.toLowerCase();
                if (name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                    continue;
                }

                if (tag === 'A') {
                    if (name !== 'href' && name !== 'target' && name !== 'rel') {
                        el.removeAttribute(attr.name);
                    }
                    continue;
                }

                if (tag === 'DIV') {
                    if (name === 'data-mindmap') continue;
                    if (name === 'class') continue;
                    el.removeAttribute(attr.name);
                    continue;
                }

                if (tag === 'BUTTON') {
                    if (name === 'class') continue;
                    if (name === 'type') continue;
                    el.removeAttribute(attr.name);
                    continue;
                }

                if (tag === 'DETAILS') {
                    if (name === 'open') continue;
                    el.removeAttribute(attr.name);
                    continue;
                }

                // Remove any other attribute
                el.removeAttribute(attr.name);
            }

            // Normalize anchors
            if (tag === 'A') {
                const href = el.getAttribute('href') || '';
                if (!Markdown.isSafeUrl(href)) {
                    // Replace link with its text
                    const text = doc.createTextNode(el.textContent || '');
                    el.replaceWith(text);
                    return;
                }
                el.setAttribute('href', href.trim());
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener noreferrer');
            }

            // Limit classes (only allow mindmap-* for embeds)
            const cls = el.getAttribute('class');
            if (cls) {
                const kept = cls
                    .split(/\s+/g)
                    .map(c => c.trim())
                    .filter(Boolean)
                    .filter(c => RichText.allowedClassRe.test(c));
                if (kept.length) el.setAttribute('class', kept.join(' '));
                else el.removeAttribute('class');
            }

            if (tag === 'BUTTON') {
                // Avoid accidental form submits
                el.setAttribute('type', 'button');
            }
        };

        const walk = (node) => {
            if (!node) return;
            const children = Array.from(node.childNodes || []);
            for (const child of children) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    const el = child;
                    if (!RichText.allowedTags.has(el.tagName)) {
                        // Unwrap: replace element with its children
                        const frag = doc.createDocumentFragment();
                        while (el.firstChild) frag.appendChild(el.firstChild);
                        el.replaceWith(frag);
                        walk(node);
                        continue;
                    }

                    sanitizeElement(el);
                    walk(el);
                } else if (child.nodeType === Node.COMMENT_NODE) {
                    child.remove();
                } else {
                    // Text nodes ok
                }
            }
        };

        walk(container);
        return container.innerHTML;
    },

    normalizeEmptyHtml(html) {
        const s = String(html || '').trim();
        if (!s) return '';
        if (s === '<br>' || s === '<p><br></p>') return '';
        return s;
    },

    getPlainText(editorEl) {
        return String(editorEl?.innerText || '').replace(/\u00A0/g, ' ');
    },

    getHtml(editorEl) {
        if (!editorEl) return '';
        const cleaned = RichText.sanitizeHtml(editorEl.innerHTML || '');
        return RichText.normalizeEmptyHtml(cleaned);
    },

    setHtml(editorEl, html) {
        if (!editorEl) return;
        const cleaned = RichText.normalizeEmptyHtml(RichText.sanitizeHtml(html || ''));
        editorEl.innerHTML = cleaned;

        RichText.enforceEmbedsAtomic(editorEl);
        RichText.updateEmptyClass(editorEl);
    },

    clear(editorEl) {
        if (!editorEl) return;
        editorEl.innerHTML = '';
        RichText.updateEmptyClass(editorEl);
    },

    updateEmptyClass(editorEl) {
        if (!editorEl) return;
        const plain = RichText.getPlainText(editorEl).trim().length;
        const html = RichText.normalizeEmptyHtml(editorEl.innerHTML || '');
        const empty = plain === 0 && !html;
        editorEl.classList.toggle('is-empty', empty);
    },

    focusEnd(editorEl) {
        if (!editorEl) return;
        editorEl.focus();
        try {
            const range = document.createRange();
            range.selectNodeContents(editorEl);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } catch {
            // ignore
        }
    },

    insertTextAtCursor(editorEl, text) {
        if (!editorEl) return;
        editorEl.focus();
        const t = String(text || '');
        if (!t) return;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            editorEl.appendChild(document.createTextNode(t));
            RichText.updateEmptyClass(editorEl);
            return;
        }
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(t));
        // Move caret after inserted node
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        RichText.updateEmptyClass(editorEl);
    },

    insertHtmlAtCursor(editorEl, html) {
        if (!editorEl) return;
        editorEl.focus();
        const cleaned = RichText.normalizeEmptyHtml(RichText.sanitizeHtml(html || ''));
        if (!cleaned) return;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = cleaned;
            while (wrapper.firstChild) editorEl.appendChild(wrapper.firstChild);
            RichText.updateEmptyClass(editorEl);
            return;
        }
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const wrapper = document.createElement('div');
        wrapper.innerHTML = cleaned;
        const frag = document.createDocumentFragment();
        let last = null;
        while (wrapper.firstChild) {
            last = frag.appendChild(wrapper.firstChild);
        }
        range.insertNode(frag);
        if (last) {
            range.setStartAfter(last);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        RichText.enforceEmbedsAtomic(editorEl);
        RichText.updateEmptyClass(editorEl);
    },

    renderMessage(text) {
        const s = String(text || '');
        if (!s.trim()) return '';
        if (RichText.isLikelyHtml(s)) return RichText.sanitizeHtml(s);
        return Markdown.render(s);
    }
};

// =============================================
// Mind Map UI (MindElixirLite)
// =============================================

const MindMapUI = {
    mind: null,
    activeTextarea: null,
    activeEditor: null,
    activeEmbedEl: null,
    replaceRange: null,
    viewOnly: false,
    _pendingInit: null,
    _fallbackBound: false,
    _lastTapTs: 0,
    _renameUiBound: false,
    selectedNodeObj: null,
    _selectedTpcEl: null,
    _mindInteractionBoundForContainer: null,
    _getTitleFromData(data) {
        try {
            return String(data?.meta?.title || data?.title || data?.nodeData?.topic || 'Mapa mental');
        } catch {
            return 'Mapa mental';
        }
    },
    _getTitleFromUi() {
        return String(DOM.mindMapTitle?.value || '').trim();
    },
    _syncTitleUiFromData(data) {
        if (!DOM.mindMapTitle) return;
        const title = this._getTitleFromData(data);
        DOM.mindMapTitle.value = title === 'Mapa mental' ? '' : title;
    },
    _applyTitleToData(data) {
        if (!data) return;
        const title = this._getTitleFromUi();
        if (!data.meta) data.meta = {};
        if (title) {
            data.meta.title = title;
        } else {
            // If empty, remove the explicit title so we can fall back to nodeData.topic.
            try { delete data.meta.title; } catch {}
        }
    },
    _updateCollapseUi() {
        const btn = DOM.mindMapToggleCollapseBtn;
        if (!btn) return;
        if (!this.mind || !this.selectedNodeObj) {
            btn.disabled = true;
            btn.textContent = 'Colapsar nó';
            return;
        }
        const expanded = this.selectedNodeObj.expanded !== false;
        btn.disabled = false;
        btn.textContent = expanded ? 'Colapsar nó' : 'Expandir nó';
    },
    toggleCollapseSelected() {
        if (!this.mind || !this.selectedNodeObj || !DOM.mindMapEditor) return;
        try {
            const tpc = DOM.mindMapEditor.querySelector(`me-tpc[data-nodeid="me${this.selectedNodeObj.id}"]`);
            if (!tpc) return;
            const expanded = this.selectedNodeObj.expanded !== false;
            this.mind.expandNode?.(tpc, !expanded);
            this._tryRehighlightSelectedNode();
            this._updateCollapseUi();
        } catch {
            // ignore
        }
    },
    expandAll(expanded) {
        if (!this.mind || !DOM.mindMapEditor) return;
        try {
            const rootTpc = DOM.mindMapEditor.querySelector('me-tpc[data-nodeid="meroot"]')
                || DOM.mindMapEditor.querySelector('me-tpc');
            if (!rootTpc) return;
            this.mind.expandNodeAll?.(rootTpc, !!expanded);
            this._tryRehighlightSelectedNode();
            this._updateCollapseUi();
        } catch {
            // ignore
        }
    },

    isAvailable() {
        return typeof window.MindElixirLite === 'function';
    },

    supportsPlaintextOnly() {
        try {
            const el = document.createElement('div');
            el.contentEditable = 'plaintext-only';
            return el.contentEditable === 'plaintext-only';
        } catch {
            return false;
        }
    },

    _getNodeElFromEventTarget(target) {
        const el = target?.nodeType === Node.ELEMENT_NODE ? target : target?.parentElement;
        return el?.closest?.('me-tpc') || null;
    },

    _setSelectedNode(nodeObj) {
        this.selectedNodeObj = nodeObj || null;
        const input = DOM.mindMapNodeTitle;
        const btn = DOM.mindMapRenameBtn;
        const addChildBtn = DOM.mindMapAddChildBtn;
        const addSiblingBtn = DOM.mindMapAddSiblingBtn;
        const deleteBtn = DOM.mindMapDeleteNodeBtn;
        if (!input || !btn) return;

        if (!nodeObj) {
            input.value = '';
            btn.disabled = true;
            if (addChildBtn) addChildBtn.disabled = true;
            if (addSiblingBtn) addSiblingBtn.disabled = true;
            if (deleteBtn) deleteBtn.disabled = true;
            this._updateCollapseUi();
            return;
        }

        input.value = String(nodeObj.topic || '');
        this._updateCollapseUi();
        btn.disabled = !String(input.value).trim();

        if (addChildBtn) addChildBtn.disabled = false;
        if (addSiblingBtn) addSiblingBtn.disabled = false;
        if (deleteBtn) deleteBtn.disabled = String(nodeObj.id) === 'root';
    },

    _markSelectedTpc(tpcEl) {
        try {
            if (this._selectedTpcEl && this._selectedTpcEl !== tpcEl) {
                this._selectedTpcEl.classList.remove('savit-selected');
            }
        } catch {
            // ignore
        }

        this._selectedTpcEl = tpcEl || null;
        try {
            if (tpcEl) tpcEl.classList.add('savit-selected');
        } catch {
            // ignore
        }
    },

    _tryRehighlightSelectedNode() {
        const nodeObj = this.selectedNodeObj;
        if (!nodeObj || !DOM.mindMapEditor) return;
        try {
            const tpc = DOM.mindMapEditor.querySelector(`me-tpc[data-nodeid="me${nodeObj.id}"]`);
            if (tpc) this._markSelectedTpc(tpc);
        } catch {
            // ignore
        }
    },

    _ensureMindFocusable() {
        try {
            const container = this.mind?.container;
            if (container && !container.hasAttribute('tabindex')) {
                container.setAttribute('tabindex', '0');
            }
        } catch {
            // ignore
        }
    },

    _focusMind() {
        try {
            const container = this.mind?.container;
            if (container) {
                container.focus({ preventScroll: true });
                return;
            }
        } catch {
            // ignore
        }

        try {
            DOM.mindMapEditor?.focus?.({ preventScroll: true });
        } catch {
            // ignore
        }
    },

    _getDataNodeMaxId(node) {
        if (!node) return 0;
        const selfId = Number(node.id) || 0;
        const kids = Array.isArray(node.children) ? node.children : [];
        let maxId = selfId;
        for (const c of kids) {
            const m = this._getDataNodeMaxId(c);
            if (m > maxId) maxId = m;
        }
        return maxId;
    },

    _findNodeAndParentById(node, targetId, parent = null) {
        if (!node) return null;
        if (String(node.id) === String(targetId)) return { node, parent };
        const kids = Array.isArray(node.children) ? node.children : [];
        for (const c of kids) {
            const found = this._findNodeAndParentById(c, targetId, node);
            if (found) return found;
        }
        return null;
    },

    _selectNodeById(nodeId) {
        if (!DOM.mindMapEditor) return;
        try {
            const tpc = DOM.mindMapEditor.querySelector(`me-tpc[data-nodeid="me${nodeId}"]`);
            if (!tpc?.nodeObj) return;
            this._setSelectedNode(tpc.nodeObj);
            this._markSelectedTpc(tpc);
            try {
                this.mind?.selectNode?.(tpc, true);
            } catch {
                // ignore
            }
        } catch {
            // ignore
        }
    },

    _beginEditOrFocusRename(tpcEl) {
        if (!tpcEl?.nodeObj) return;
        // Always use our rename UI. The vendor's beginEdit path can throw in some builds.
        this._startInlineRename(tpcEl);
    },

    _addChildNodeAndRename() {
        if (!this.mind) return;
        const selected = this.selectedNodeObj;
        if (!selected?.id) return;

        const data = this.mind.getData();
        const root = data?.nodeData;
        if (!root) return;

        const found = this._findNodeAndParentById(root, selected.id);
        if (!found?.node) return;

        const maxId = this._getDataNodeMaxId(root);
        const newId = maxId + 1;
        const child = { id: newId, topic: 'Novo nó', children: [] };

        if (!Array.isArray(found.node.children)) found.node.children = [];
        found.node.children.push(child);

        try {
            this.mind.refresh({
                nodeData: root,
                arrows: data.arrows || [],
                summaries: data.summaries || [],
                direction: data.direction,
                theme: data.theme
            });
        } catch {
            try {
                this.mind.refresh({ nodeData: root });
            } catch {
                // ignore
            }
        }

        setTimeout(() => {
            this._selectNodeById(newId);
            try {
                const tpc = DOM.mindMapEditor?.querySelector?.(`me-tpc[data-nodeid="me${newId}"]`);
                if (tpc) this._beginEditOrFocusRename(tpc);
            } catch {
                // ignore
            }
        }, 0);
    },

    _addSiblingNodeAndRename() {
        if (!this.mind) return;
        const selected = this.selectedNodeObj;
        if (!selected?.id) return;

        const data = this.mind.getData();
        const root = data?.nodeData;
        if (!root) return;

        const found = this._findNodeAndParentById(root, selected.id);
        if (!found?.node) return;
        if (!found.parent) {
            this._addChildNodeAndRename();
            return;
        }

        if (!Array.isArray(found.parent.children)) found.parent.children = [];
        const idx = found.parent.children.findIndex(c => String(c.id) === String(selected.id));

        const maxId = this._getDataNodeMaxId(root);
        const newId = maxId + 1;
        const sibling = { id: newId, topic: 'Novo nó', children: [] };

        const insertAt = idx >= 0 ? idx + 1 : found.parent.children.length;
        found.parent.children.splice(insertAt, 0, sibling);

        try {
            this.mind.refresh({
                nodeData: root,
                arrows: data.arrows || [],
                summaries: data.summaries || [],
                direction: data.direction,
                theme: data.theme
            });
        } catch {
            try {
                this.mind.refresh({ nodeData: root });
            } catch {
                // ignore
            }
        }

        setTimeout(() => {
            this._selectNodeById(newId);
            try {
                const tpc = DOM.mindMapEditor?.querySelector?.(`me-tpc[data-nodeid="me${newId}"]`);
                if (tpc) this._beginEditOrFocusRename(tpc);
            } catch {
                // ignore
            }
        }, 0);
    },

    addChildSelected() {
        this._addChildNodeAndRename();
    },

    addSiblingSelected() {
        this._addSiblingNodeAndRename();
    },

    async deleteSelectedNode() {
        if (!this.mind) return;
        const selected = this.selectedNodeObj;
        if (!selected?.id) return;
        if (String(selected.id) === 'root') {
            showToast('Não é possível excluir o nó raiz.');
            return;
        }

        const ok = await SystemDialog.confirm(
            'Excluir nó',
            'Tem certeza que deseja excluir este nó (e todos os subtópicos)?'
        );
        if (!ok) return;

        const data = this.mind.getData();
        const root = data?.nodeData;
        if (!root) return;

        const found = this._findNodeAndParentById(root, selected.id);
        if (!found?.node) return;
        if (!found.parent) return;

        if (!Array.isArray(found.parent.children)) found.parent.children = [];
        found.parent.children = found.parent.children.filter(c => String(c.id) !== String(selected.id));

        // Best-effort cleanup for arrows that might reference removed nodes.
        const safeArrows = Array.isArray(data.arrows)
            ? data.arrows.filter(a => {
                const from = a?.from ?? a?.fromId ?? a?.fromNode;
                const to = a?.to ?? a?.toId ?? a?.toNode;
                if (from == null && to == null) return true;
                return String(from) !== String(selected.id) && String(to) !== String(selected.id);
            })
            : [];

        try {
            this.mind.refresh({
                nodeData: root,
                arrows: safeArrows,
                summaries: data.summaries || [],
                direction: data.direction,
                theme: data.theme
            });
        } catch {
            try {
                this.mind.refresh({ nodeData: root });
            } catch {
                // ignore
            }
        }

        setTimeout(() => {
            this.selectedNodeObj = null;
            this._markSelectedTpc(null);
            this._selectNodeById(found.parent.id);
        }, 0);
    },

    _bindMindInteractions({ editable }) {
        if (!editable) return;
        const container = this.mind?.container;
        if (!container) return;
        if (this._mindInteractionBoundForContainer === container) return;
        this._mindInteractionBoundForContainer = container;

        this._ensureMindFocusable();

        container.addEventListener('dblclick', (e) => {
            const tpc = e.target?.closest?.('me-tpc');
            if (!tpc?.nodeObj) return;
            e.preventDefault();
            e.stopPropagation();
            this._setSelectedNode(tpc.nodeObj);
            this._markSelectedTpc(tpc);
            this._beginEditOrFocusRename(tpc);
                // Click on +/- collapse icon (me-epd)
                container.addEventListener('click', (e) => {
                    const epd = e.target?.closest?.('me-epd');
                    if (!epd) return;
                    const parent = epd.closest?.('me-parent');
                    const tpc = parent?.querySelector?.('me-tpc') || epd.closest?.('me-wrapper')?.querySelector?.('me-tpc');
                    if (!tpc?.nodeObj) return;
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        this.mind?.expandNode?.(tpc);
                    } catch {
                        // ignore
                    }
                    this._setSelectedNode(tpc.nodeObj);
                    this._markSelectedTpc(tpc);
                    this._updateCollapseUi();
                }, true);
        });

        container.addEventListener('keydown', (e) => {
            if (!this.mind) return;
            if (!this.selectedNodeObj) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            if (e.key === 'Tab') {
                e.preventDefault();
                this._addChildNodeAndRename();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this._addSiblingNodeAndRename();
            }
        });
    },

    _focusRenameInput() {
        const input = DOM.mindMapNodeTitle;
        if (!input) return;
        try {
            input.focus({ preventScroll: true });
        } catch {
            input.focus();
        }
        try {
            input.select();
        } catch {
            // ignore
        }
    },

    _startInlineRename(nodeEl) {
        const obj = nodeEl?.nodeObj;
        if (!obj) return;
        this._setSelectedNode(obj);
        this._focusRenameInput();
    },

    applyRenameFromInput() {
        const input = DOM.mindMapNodeTitle;
        if (!input) return;
        const nodeObj = this.selectedNodeObj;
        if (!nodeObj) return;
        const trimmed = String(input.value || '').trim();
        if (!trimmed) return;

        nodeObj.topic = trimmed;

        // Re-render via library to keep lines/labels correct
        try {
            this.mind?.refresh?.();
        } catch {
            // ignore
        }

        // Refresh rebuilds DOM; re-highlight our selection.
        this._tryRehighlightSelectedNode();

        this._setSelectedNode(nodeObj);
    },

    _bindRenameUiOnce() {
        if (this._renameUiBound) return;
        this._renameUiBound = true;

        const input = DOM.mindMapNodeTitle;
        const btn = DOM.mindMapRenameBtn;

        btn?.addEventListener('click', () => this.applyRenameFromInput());

        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.applyRenameFromInput();
            }
        });

        input?.addEventListener('input', () => {
            const hasSel = !!this.selectedNodeObj;
            const ok = !!String(input.value || '').trim();
            if (btn) btn.disabled = !hasSel || !ok;
        });
    },

    _bindFallbackEditingIfNeeded({ editable }) {
        // iOS/WebKit doesn’t support contenteditable="plaintext-only"; MindElixirLite’s inline edit
        // relies on that and can become unusable. Provide an inline-rename fallback.
        if (!editable) return;
        if (this.supportsPlaintextOnly()) return;
        if (!this.mind?.container) return;
        if (this._fallbackBound) return;

        this._fallbackBound = true;
        this._lastTapTs = 0;

        const container = this.mind.container;

        // Desktop dblclick
        container.addEventListener('dblclick', (e) => {
            const nodeEl = this._getNodeElFromEventTarget(e.target);
            if (!nodeEl) return;
            e.preventDefault();
            e.stopPropagation();
            this._startInlineRename(nodeEl);
        }, true);

        // Mobile double-tap (pointerdown)
        container.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse') return;
            const nodeEl = this._getNodeElFromEventTarget(e.target);
            if (!nodeEl) return;
            const now = Date.now();
            const dt = now - (this._lastTapTs || 0);
            this._lastTapTs = now;
            if (dt > 0 && dt < 350) {
                e.preventDefault();
                e.stopPropagation();
                this._startInlineRename(nodeEl);
            }
        }, true);
    },

    getTheme() {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        return isLight ? window.MindElixirLite.THEME : window.MindElixirLite.DARK_THEME;
    },

    defaultData(topic = 'Ideia') {
        return {
            nodeData: {
                id: 'root',
                topic,
                children: []
            },
            direction: window.MindElixirLite.RIGHT,
            theme: this.getTheme()
        };
    },

    extractMindMapBlock(text, nearIndex) {
        const src = String(text || '');
        const fence = '```savit-mindmap';

        const before = src.lastIndexOf(fence, nearIndex);
        if (before === -1) return null;

        const startLine = src.lastIndexOf('\n', before);
        const blockStart = startLine === -1 ? 0 : startLine + 1;

        // Ensure this is exactly a fence line
        const afterFenceLine = src.indexOf('\n', before);
        if (afterFenceLine === -1) return null;
        const fenceLine = src.slice(before, afterFenceLine).trim();
        if (fenceLine !== fence) return null;

        const close = src.indexOf('\n```', afterFenceLine);
        if (close === -1) return null;

        const blockEnd = close + '\n```'.length;
        const json = src.slice(afterFenceLine + 1, close).trim();
        return { start: blockStart, end: blockEnd, json };
    },

    findMindMapBlockByJson(text, jsonString) {
        const src = String(text || '');
        const wanted = Markdown.normalizeNewlines(String(jsonString || '')).trim();
        if (!wanted) return null;

        const fence = '```savit-mindmap';
        let from = 0;
        while (from < src.length) {
            const idx = src.indexOf(fence, from);
            if (idx === -1) return null;

            // Fence must be on its own line
            const lineStart = src.lastIndexOf('\n', idx);
            const fenceLineStart = lineStart === -1 ? 0 : lineStart + 1;
            const fenceLineEnd = src.indexOf('\n', idx);
            if (fenceLineEnd === -1) return null;
            const fenceLine = src.slice(idx, fenceLineEnd).trim();
            if (fenceLine !== fence) {
                from = idx + fence.length;
                continue;
            }

            const close = src.indexOf('\n```', fenceLineEnd);
            if (close === -1) return null;
            const jsonRaw = src.slice(fenceLineEnd + 1, close);
            const json = Markdown.normalizeNewlines(jsonRaw).trim();
            if (json === wanted) {
                const blockEnd = close + '\n```'.length;
                return { start: fenceLineStart, end: blockEnd, json };
            }

            from = idx + fence.length;
        }

        return null;
    },

    openForTextarea(textarea) {
        if (!this.isAvailable()) {
            showToast('Mapa mental indisponível (biblioteca não carregou)');
            return;
        }
        if (!DOM.mindMapModal || !DOM.mindMapEditor) return;

        this.activeTextarea = textarea;
        this.activeEditor = null;
        this.viewOnly = false;

        const selStart = textarea.selectionStart ?? 0;
        const block = this.extractMindMapBlock(textarea.value, selStart);
        this.replaceRange = block ? { start: block.start, end: block.end } : null;

        let data;
        if (block?.json) {
            try {
                data = JSON.parse(block.json);
            } catch {
                data = this.defaultData('Ideia');
            }
        } else {
            const selectedText = (textarea.value || '').slice(selStart, textarea.selectionEnd ?? selStart).trim();
            data = this.defaultData(selectedText || 'Ideia');
        }

        DOM.insertMindMapBtn.textContent = this.replaceRange ? 'Atualizar na mensagem' : 'Inserir na mensagem';
        DOM.insertMindMapBtn.style.display = '';

        openModal(DOM.mindMapModal);
        this._scheduleInitMind(data, { editable: true });
    },

    openForTextareaFromJson(textarea, jsonString) {
        if (!this.isAvailable()) {
            showToast('Mapa mental indisponível (biblioteca não carregou)');
            return;
        }
        if (!DOM.mindMapModal || !DOM.mindMapEditor) return;

        this.activeTextarea = textarea;
        this.activeEditor = null;
        this.viewOnly = false;

        const block = this.findMindMapBlockByJson(textarea.value, jsonString) ||
            this.extractMindMapBlock(textarea.value, textarea.selectionStart ?? 0);
        this.replaceRange = block ? { start: block.start, end: block.end } : null;

        let data;
        try {
            data = JSON.parse(jsonString);
        } catch {
            data = this.defaultData('Ideia');
        }

        DOM.insertMindMapBtn.textContent = this.replaceRange ? 'Atualizar na mensagem' : 'Inserir na mensagem';
        DOM.insertMindMapBtn.style.display = '';

        openModal(DOM.mindMapModal);
        this._scheduleInitMind(data, { editable: true });
    },

    openViewerFromJson(jsonString) {
        if (!this.isAvailable()) {
            showToast('Mapa mental indisponível (biblioteca não carregou)');
            return;
        }
        if (!DOM.mindMapModal || !DOM.mindMapEditor) return;

        this.activeTextarea = null;
        this.activeEditor = null;
        this.replaceRange = null;
        this.viewOnly = true;

        let data;
        try {
            data = JSON.parse(jsonString);
        } catch {
            data = this.defaultData('Mapa');
        }

        DOM.insertMindMapBtn.style.display = 'none';
        openModal(DOM.mindMapModal);
        this._scheduleInitMind(data, { editable: false });
    },

    _scheduleInitMind(data, { editable }) {
        if (!DOM.mindMapEditor) return;
        if (this._pendingInit) {
            cancelAnimationFrame(this._pendingInit);
            this._pendingInit = null;
        }
        this._pendingInit = requestAnimationFrame(() => {
            this._pendingInit = null;
            this._initMind(data, { editable });
        });
    },

    _initMind(data, { editable }) {
        // Tear down any previous instance first
        try {
            this.mind?.destroy?.();
        } catch {
            // ignore
        }

        // Fully replace the container element to ensure stale event handlers are removed
        // (prevents errors like "beginEdit is not a function" from old closures).
        try {
            const oldEl = DOM.mindMapEditor;
            const parent = oldEl?.parentNode;
            if (oldEl && parent) {
                const fresh = oldEl.cloneNode(false);
                parent.replaceChild(fresh, oldEl);
                DOM.mindMapEditor = fresh;
            }
        } catch {
            // ignore
        }

        // Clean container
        DOM.mindMapEditor.innerHTML = '';
        this.mind = null;

        // Sync title UI early so it reflects the map being edited/viewed.
        this._syncTitleUiFromData(data);

        // Ensure the editor can receive focus (important for key bindings like Tab/Enter)
        try {
            DOM.mindMapEditor.setAttribute('tabindex', '0');
        } catch {
            // ignore
        }

        // NOTE: MindElixirLite's built-in edit/toolbar/keypress paths are flaky across environments
        // and have been throwing runtime errors (beginEdit/cancel). We keep the map interactive
        // (drag/select) but use our own rename UI + handlers for editing.
        this.mind = new window.MindElixirLite({
            el: DOM.mindMapEditor,
            direction: data.direction ?? window.MindElixirLite.RIGHT,
            draggable: false,
            editable: false,
            contextMenu: false,
            toolBar: false,
            keypress: false
        });

        // Ensure theme matches current UI
        if (!data.theme) data.theme = this.getTheme();
        this.mind.init(data);

        this._bindTapSelectionFix({ editable });

        this._ensureMindFocusable();
        this._bindMindInteractions({ editable });
        this._bindRenameUiOnce();
        this._setSelectedNode(null);
        try {
            this.mind?.bus?.addListener?.('selectNewNode', (nodeObj) => {
                this._setSelectedNode(nodeObj);
            });
        } catch {
            // ignore
        }

        this._bindFallbackEditingIfNeeded({ editable });

        // Focus the mindmap so keypress handlers work immediately
        setTimeout(() => {
            try {
                this._focusMind();
            } catch {
                // ignore
            }
        }, 0);

        // Center after first layout
        setTimeout(() => {
            try {
                this.mind?.toCenter?.();
            } catch {
                // ignore
            }
        }, 0);
    },

    _bindTapSelectionFix({ editable }) {
        if (!editable) return;
        if (!DOM.mindMapEditor || !DOM.mindMapModal) return;

        const el = DOM.mindMapEditor;
        if (el.__savitMindTapSelectFixBound) return;
        el.__savitMindTapSelectFixBound = true;

        let down = null;

        const isEventInsideMindMap = (evt) => {
            const t = evt.target;
            if (!t) return false;
            if (!DOM.mindMapModal.classList.contains('active')) return false;
            return !!t.closest?.('#mindMapEditor');
        };

        const findTpcAtPoint = (clientX, clientY) => {
            // Prefer normal hit-testing
            const direct = document.elementFromPoint(clientX, clientY);
            const tpcDirect = direct?.closest?.('me-tpc');
            if (tpcDirect) return tpcDirect;

            const parentDirect = direct?.closest?.('me-parent');
            const tpcFromParent = parentDirect?.querySelector?.('me-tpc');
            if (tpcFromParent) return tpcFromParent;

            // Fallback: bounding-box scan (works even if hit-testing is broken)
            const tpcs = el.querySelectorAll('me-tpc');
            for (const tpc of tpcs) {
                const r = tpc.getBoundingClientRect();
                if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
                    return tpc;
                }
            }
            return null;
        };

        const onDown = (e) => {
            if (!this.mind) return;
            if (!isEventInsideMindMap(e)) return;
            down = { x: e.clientX, y: e.clientY, t: Date.now() };
        };

        const onUp = (e) => {
            if (!this.mind) return;
            if (!down) return;
            if (!isEventInsideMindMap(e)) {
                down = null;
                return;
            }

            const dt = Date.now() - down.t;
            const dx = e.clientX - down.x;
            const dy = e.clientY - down.y;
            const dist = Math.hypot(dx, dy);
            down = null;

            // Treat as tap only
            if (dt > 600) return;
            if (dist > 14) return;

            const tpc = findTpcAtPoint(e.clientX, e.clientY);
            if (!tpc?.nodeObj) return;

            // Always update our own selection state/UI, regardless of library behavior.
            this._setSelectedNode(tpc.nodeObj);
            this._markSelectedTpc(tpc);
            this._focusMind();

            try {
                // Second arg = fire selectNewNode (keeps rename UI in sync)
                this.mind.selectNode(tpc, true);
            } catch {
                // ignore
            }
        };

        // Capture-phase listeners so library handlers can't block us.
        document.addEventListener('pointerdown', onDown, { capture: true, passive: true });
        document.addEventListener('pointerup', onUp, { capture: true, passive: true });

        // Mouse fallback (some environments still behave better with mouse events)
        document.addEventListener('mousedown', onDown, { capture: true, passive: true });
        document.addEventListener('mouseup', onUp, { capture: true, passive: true });

        // Click fallback (covers browsers that synthesize clicks differently)
        document.addEventListener('click', (e) => {
            if (!this.mind) return;
            if (!isEventInsideMindMap(e)) return;
            const tpc = findTpcAtPoint(e.clientX, e.clientY);
            if (!tpc?.nodeObj) return;
            this._setSelectedNode(tpc.nodeObj);
            this._markSelectedTpc(tpc);
            this._focusMind();
            try {
                this.mind.selectNode(tpc, true);
            } catch {
                // ignore
            }
        }, { capture: true, passive: true });
    },

    buildEmbedHtml(jsonRaw) {
        const encoded = Markdown.escapeHtml(encodeURIComponent(String(jsonRaw || '').trim()));
        let title = 'Mapa mental';
        try {
            const parsed = JSON.parse(String(jsonRaw || ''));
            title = String(parsed?.meta?.title || parsed?.title || parsed?.nodeData?.topic || 'Mapa mental');
        } catch {
            title = 'Mapa mental';
        }
        const safeTitle = Markdown.escapeHtml(title);
        return (
            `<div class="mindmap-embed" contenteditable="false" data-mindmap="${encoded}">` +
            `<div class="mindmap-embed-toolbar">` +
            `<div class="mindmap-embed-title">${safeTitle}</div>` +
            `<button class="mindmap-embed-open" type="button">Abrir</button>` +
            `</div>` +
            `<div class="mindmap-embed-canvas" aria-label="${safeTitle}"></div>` +
            `</div>`
        );
    },

    openForEditor(editorEl) {
        if (!this.isAvailable()) {
            showToast('Mapa mental indisponível (biblioteca não carregou)');
            return;
        }
        if (!DOM.mindMapModal || !DOM.mindMapEditor) return;

        this.activeTextarea = null;
        this.activeEditor = editorEl;
        this.activeEmbedEl = null;
        this.replaceRange = null;
        this.viewOnly = false;

        const selectedText = RichText.getPlainText(editorEl).trim();
        const data = this.defaultData(selectedText || 'Ideia');
        if (!data.meta) data.meta = {};
        if (!data.meta.title) data.meta.title = selectedText || data.nodeData?.topic || 'Mapa mental';

        DOM.insertMindMapBtn.textContent = 'Inserir na mensagem';
        DOM.insertMindMapBtn.style.display = '';
        openModal(DOM.mindMapModal);
        this._scheduleInitMind(data, { editable: true });
    },

    openForEditorFromEmbed(editorEl, embedEl) {
        if (!this.isAvailable()) {
            showToast('Mapa mental indisponível (biblioteca não carregou)');
            return;
        }
        if (!DOM.mindMapModal || !DOM.mindMapEditor) return;
        if (!embedEl) return;

        this.activeTextarea = null;
        this.activeEditor = editorEl;
        this.activeEmbedEl = embedEl;
        this.replaceRange = null;
        this.viewOnly = false;

        const encoded = embedEl.getAttribute('data-mindmap') || '';
        let jsonRaw = encoded;
        try {
            jsonRaw = decodeURIComponent(encoded);
        } catch {
            jsonRaw = encoded;
        }

        let data;
        try {
            data = JSON.parse(jsonRaw);
            if (!data.meta) data.meta = {};
            if (!data.meta.title) data.meta.title = data.nodeData?.topic || 'Mapa mental';
        } catch {
            data = this.defaultData('Ideia');
        }

        DOM.insertMindMapBtn.textContent = 'Atualizar na mensagem';
        DOM.insertMindMapBtn.style.display = '';
        openModal(DOM.mindMapModal);
        this._scheduleInitMind(data, { editable: true });
    },

    openForEditorFromJson(editorEl, jsonString) {
        if (!this.isAvailable()) {
            showToast('Mapa mental indisponível (biblioteca não carregou)');
            return;
        }
        if (!DOM.mindMapModal || !DOM.mindMapEditor) return;

        this.activeTextarea = null;
        this.activeEditor = editorEl;
        this.activeEmbedEl = null;
        this.replaceRange = null;
        this.viewOnly = false;

        let data;
        try {
            data = JSON.parse(jsonString);
        } catch {
            data = this.defaultData('Ideia');
        }

        if (!data.meta) data.meta = {};
        if (!data.meta.title) data.meta.title = data.nodeData?.topic || 'Mapa mental';

        DOM.insertMindMapBtn.textContent = 'Inserir na mensagem';
        DOM.insertMindMapBtn.style.display = '';
        openModal(DOM.mindMapModal);
        this._scheduleInitMind(data, { editable: true });
    },

    close() {
        if (DOM.mindMapModal) closeModal(DOM.mindMapModal);
        if (this._pendingInit) {
            cancelAnimationFrame(this._pendingInit);
            this._pendingInit = null;
        }
        try {
            this.mind?.destroy?.();
        } catch {
            // ignore
        }
        this.mind = null;
        this.activeTextarea = null;
        this.activeEditor = null;
        this.activeEmbedEl = null;
        this.replaceRange = null;
        this.viewOnly = false;
    },

    insertIntoActiveTextarea() {
        if (!this.mind || !this.activeTextarea) return;

        const data = this.mind.getData();
        data.theme = this.getTheme();
        this._applyTitleToData(data);
        const json = JSON.stringify(data);
        const block = `\n\n\`\`\`savit-mindmap\n${json}\n\`\`\`\n\n`;

        if (this.replaceRange) {
            TextareaFormat.replaceRange(this.activeTextarea, this.replaceRange.start, this.replaceRange.end, block);
            const cursor = this.replaceRange.start + block.length;
            TextareaFormat.setSelection(this.activeTextarea, cursor, cursor);
        } else {
            const start = this.activeTextarea.selectionStart ?? this.activeTextarea.value.length;
            const end = this.activeTextarea.selectionEnd ?? start;
            TextareaFormat.replaceRange(this.activeTextarea, start, end, block);
            const cursor = start + block.length;
            TextareaFormat.setSelection(this.activeTextarea, cursor, cursor);
        }

        this.activeTextarea.dispatchEvent(new Event('input'));
        this.close();
    },

    insertIntoActiveEditor() {
        if (!this.mind || !this.activeEditor) return;
        const data = this.mind.getData();
        data.theme = this.getTheme();
        this._applyTitleToData(data);
        const json = JSON.stringify(data);

        // Edit in-place when opening from an existing embed
        if (this.activeEmbedEl) {
            const encoded = encodeURIComponent(String(json || '').trim());
            this.activeEmbedEl.setAttribute('data-mindmap', encoded);
            this.activeEmbedEl.dataset.hydrated = '0';
            try {
                this.activeEmbedEl.setAttribute('contenteditable', 'false');
            } catch {
                // ignore
            }
            const canvas = this.activeEmbedEl.querySelector('.mindmap-embed-canvas');
            if (canvas) canvas.innerHTML = '';

            // Re-hydrate just this embed via its parent container
            this.hydrateEmbeds(this.activeEmbedEl.parentElement || this.activeEditor);
            RichText.enforceEmbedsAtomic(this.activeEditor);
        } else {
            const html = this.buildEmbedHtml(json);
            RichText.insertHtmlAtCursor(this.activeEditor, html);
        }
        this.close();
    },

    insert() {
        if (this.activeEditor) return this.insertIntoActiveEditor();
        return this.insertIntoActiveTextarea();
    },

    hydrateEmbeds(container) {
        if (!this.isAvailable() || !container) return;
        container.querySelectorAll('.mindmap-embed').forEach(embed => {
            if (embed.dataset.hydrated === '1') return;
            const encoded = embed.getAttribute('data-mindmap') || '';
            let jsonRaw = encoded;
            try {
                jsonRaw = decodeURIComponent(encoded);
            } catch {
                jsonRaw = encoded;
            }
            let data;
            try {
                data = JSON.parse(jsonRaw);
            } catch {
                data = this.defaultData('Mapa');
            }

            // Update title text from stored data
            const titleText = this._getTitleFromData(data);
            const titleEl = embed.querySelector('.mindmap-embed-title');
            if (titleEl) titleEl.textContent = titleText;
            const canvasLabel = embed.querySelector('.mindmap-embed-canvas');
            if (canvasLabel) {
                try { canvasLabel.setAttribute('aria-label', titleText); } catch {}
            }

            const canvas = embed.querySelector('.mindmap-embed-canvas');
            if (!canvas) return;
            canvas.innerHTML = '';

            const mind = new window.MindElixirLite({
                el: canvas,
                direction: data.direction ?? window.MindElixirLite.RIGHT,
                draggable: false,
                editable: false,
                contextMenu: false,
                toolBar: false,
                keypress: false
            });

            if (!data.theme) data.theme = this.getTheme();
            mind.init(data);
            embed.dataset.hydrated = '1';
        });
    }
};

// =============================================
// Textarea Formatting Helpers
// =============================================

const TextareaFormat = {
    getSelection(textarea) {
        const value = textarea.value;
        const start = textarea.selectionStart ?? 0;
        const end = textarea.selectionEnd ?? 0;
        return { value, start, end, selected: value.slice(start, end) };
    },

    setSelection(textarea, start, end) {
        textarea.focus();
        textarea.setSelectionRange(start, end);
    },

    replaceRange(textarea, start, end, replacement) {
        const value = textarea.value;
        textarea.value = value.slice(0, start) + replacement + value.slice(end);
    },

    wrap(textarea, left, right, placeholder = '') {
        const { start, end, selected } = TextareaFormat.getSelection(textarea);
        const content = selected || placeholder;
        const replacement = left + content + right;
        TextareaFormat.replaceRange(textarea, start, end, replacement);

        const cursorStart = start + left.length;
        const cursorEnd = start + left.length + content.length;
        TextareaFormat.setSelection(textarea, cursorStart, cursorEnd);
        textarea.dispatchEvent(new Event('input'));
    },

    prefixLines(textarea, prefix) {
        const { value, start, end } = TextareaFormat.getSelection(textarea);
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = value.indexOf('\n', end);
        const blockEnd = lineEnd === -1 ? value.length : lineEnd;

        const block = value.slice(lineStart, blockEnd);
        const replaced = block
            .split('\n')
            .map(line => (line.trim().length ? prefix + line : line))
            .join('\n');

        TextareaFormat.replaceRange(textarea, lineStart, blockEnd, replaced);
        TextareaFormat.setSelection(textarea, lineStart, lineStart + replaced.length);
        textarea.dispatchEvent(new Event('input'));
    },

    indent(textarea) {
        const indentStr = ' '.repeat(Markdown.indentSize);
        TextareaFormat.prefixLines(textarea, indentStr);
    },

    outdent(textarea) {
        const { value, start, end } = TextareaFormat.getSelection(textarea);
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = value.indexOf('\n', end);
        const blockEnd = lineEnd === -1 ? value.length : lineEnd;

        const block = value.slice(lineStart, blockEnd);
        const replaced = block
            .split('\n')
            .map(line => line.replace(new RegExp(`^ {1,${Markdown.indentSize}}`), ''))
            .join('\n');

        TextareaFormat.replaceRange(textarea, lineStart, blockEnd, replaced);
        TextareaFormat.setSelection(textarea, lineStart, lineStart + replaced.length);
        textarea.dispatchEvent(new Event('input'));
    },

    async insertLink(textarea) {
        const { start, end, selected } = TextareaFormat.getSelection(textarea);
        const text = selected || 'texto';
        const url = await SystemDialog.prompt('Cole o link (https://...)', {
            title: 'Inserir link',
            placeholder: 'https://...'
        });
        if (!url) return;

        const replacement = `[${text}](${url})`;
        TextareaFormat.replaceRange(textarea, start, end, replacement);

        // Select the URL for quick editing
        const urlStart = start + text.length + 3; // `[`.length + text + `](`
        const urlEnd = urlStart + String(url).length;
        TextareaFormat.setSelection(textarea, urlStart, urlEnd);
        textarea.dispatchEvent(new Event('input'));
    }
};

function setupFormattingToolbar(toolbarEl, textareaEl) {
    if (!toolbarEl || !textareaEl) return;

    // If this is a WYSIWYG editor (contenteditable), use rich-text commands.
    if (textareaEl.isContentEditable && textareaEl.tagName !== 'TEXTAREA') {
        setupWysiwygToolbar(toolbarEl, textareaEl);
        return;
    }

    const wrapperEl = textareaEl.closest('.input-wrapper') || null;
    const previewEl = wrapperEl?.querySelector('.format-preview') || null;

    const previewPrefKey = `savit.preview.${textareaEl.id || 'textarea'}`;
    const isMobile = window.matchMedia?.('(max-width: 768px)')?.matches;

    const readPreviewPref = () => {
        try {
            const raw = localStorage.getItem(previewPrefKey);
            if (raw === '1') return true;
            if (raw === '0') return false;
        } catch {
            // ignore
        }
        // Default: off on mobile (so preview doesn't push the input), on for larger screens.
        return !isMobile;
    };

    const writePreviewPref = (enabled) => {
        try {
            localStorage.setItem(previewPrefKey, enabled ? '1' : '0');
        } catch {
            // ignore
        }
    };

    let isPreviewing = readPreviewPref();
    let previewUpdateTimer = null;

    const updatePreview = () => {
        if (!previewEl) return;
        previewEl.innerHTML = `<div class="message-text">${Markdown.render(textareaEl.value)}</div>`;
        MindMapUI.hydrateEmbeds(previewEl);
    };

    const schedulePreviewUpdate = () => {
        if (!isPreviewing) return;
        if (!previewEl) return;
        if (previewUpdateTimer) {
            clearTimeout(previewUpdateTimer);
        }
        previewUpdateTimer = setTimeout(() => {
            previewUpdateTimer = null;
            updatePreview();
        }, 120);
    };

    const setPreviewMode = (enabled) => {
        if (!previewEl) return;
        isPreviewing = enabled;
        if (enabled) {
            updatePreview();
            previewEl.style.display = 'block';
        } else {
            previewEl.style.display = 'none';
            textareaEl.focus();
        }

        writePreviewPref(enabled);

        // Toggle icon (eye / eye-slash)
        const previewBtnIcon = toolbarEl.querySelector('button[data-format="preview"] i');
        if (previewBtnIcon) {
            // When preview is ON, show eye-slash (action = hide). When OFF, show eye (action = show).
            previewBtnIcon.classList.toggle('fa-eye', !enabled);
            previewBtnIcon.classList.toggle('fa-eye-slash', enabled);
        }
    };

    const isInCodeFence = (text, cursor) => {
        const before = String(text || '').slice(0, Math.max(0, cursor));
        const fences = before.match(/```/g);
        return (fences?.length || 0) % 2 === 1;
    };

    const isInsideInlineMark = (text, cursor, mark) => {
        if (!mark) return false;
        if (isInCodeFence(text, cursor)) return false;

        const before = String(text || '').slice(0, Math.max(0, cursor));

        // Very small heuristic: odd count of marks before cursor => "inside"
        // This keeps UX lightweight and avoids heavy parsing.
        const re = new RegExp(mark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = before.match(re);
        return (matches?.length || 0) % 2 === 1;
    };

    const getCurrentLineText = () => {
        const value = String(textareaEl.value || '');
        const pos = textareaEl.selectionStart ?? 0;
        const lineStart = value.lastIndexOf('\n', Math.max(0, pos) - 1) + 1;
        const lineEndIdx = value.indexOf('\n', pos);
        const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
        return value.slice(lineStart, lineEnd);
    };

    const setBtnActive = (action, active) => {
        const btn = toolbarEl.querySelector(`button[data-format="${action}"]`);
        if (!btn) return;
        btn.classList.toggle('is-active', !!active);
    };

    const updateActiveButtons = () => {
        const value = String(textareaEl.value || '');
        const cursor = textareaEl.selectionStart ?? 0;
        const line = getCurrentLineText();

        // Inline states
        setBtnActive('bold', isInsideInlineMark(value, cursor, '**'));

        // Italic: ignore bold markers when counting single '*'
        const italicActive = (() => {
            if (isInCodeFence(value, cursor)) return false;
            const before = value.slice(0, Math.max(0, cursor)).replace(/\*\*/g, '');
            const matches = before.match(/\*/g);
            return (matches?.length || 0) % 2 === 1;
        })();
        setBtnActive('italic', italicActive);

        setBtnActive('code', isInsideInlineMark(value, cursor, '`'));
        setBtnActive('highlight', isInsideInlineMark(value, cursor, '=='));

        // Block-ish states (current line)
        setBtnActive('quote', /^\s*>\s+/.test(line));
        setBtnActive('h2', /^\s*##\s+/.test(line));
        setBtnActive('ul', /^\s*[-*+]\s+/.test(line));
        setBtnActive('ol', /^\s*\d+\.\s+/.test(line));
    };

    const toggleInlineMark = (mark) => {
        const { value, start, end, selected } = TextareaFormat.getSelection(textareaEl);

        if (selected) {
            TextareaFormat.wrap(textareaEl, mark, mark);
            return;
        }

        // If we're right before a closing mark, "turn off" by skipping it.
        if (value.slice(start, start + mark.length) === mark) {
            const next = start + mark.length;
            TextareaFormat.setSelection(textareaEl, next, next);
            textareaEl.dispatchEvent(new Event('input'));
            return;
        }

        // Otherwise, insert an empty pair and keep cursor inside.
        const replacement = mark + mark;
        TextareaFormat.replaceRange(textareaEl, start, end, replacement);
        TextareaFormat.setSelection(textareaEl, start + mark.length, start + mark.length);
        textareaEl.dispatchEvent(new Event('input'));
    };

    toolbarEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-format]');
        if (!btn) return;
        e.preventDefault();
        const action = btn.dataset.format;

        switch (action) {
            case 'bold':
                toggleInlineMark('**');
                break;
            case 'italic':
                toggleInlineMark('*');
                break;
            case 'h2':
                TextareaFormat.prefixLines(textareaEl, '## ');
                break;
            case 'ul':
                TextareaFormat.prefixLines(textareaEl, '- ');
                break;
            case 'ol':
                TextareaFormat.prefixLines(textareaEl, '1. ');
                break;
            case 'indent':
                TextareaFormat.indent(textareaEl);
                break;
            case 'outdent':
                TextareaFormat.outdent(textareaEl);
                break;
            case 'quote':
                TextareaFormat.prefixLines(textareaEl, '> ');
                break;
            case 'code': {
                const sel = TextareaFormat.getSelection(textareaEl);
                if (sel.selected && sel.selected.includes('\n')) {
                    TextareaFormat.wrap(textareaEl, '```\n', '\n```');
                } else {
                    toggleInlineMark('`');
                }
                break;
            }
            case 'highlight':
                toggleInlineMark('==');
                break;
            case 'link':
                await TextareaFormat.insertLink(textareaEl);
                break;
            case 'mindmap':
                MindMapUI.openForTextarea(textareaEl);
                break;
            case 'preview':
                if (!previewEl) return;
                setPreviewMode(!isPreviewing);
                break;
        }

        updateActiveButtons();
    });

    textareaEl.addEventListener('keydown', async (e) => {
        // Tabs for indent/outdent
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                TextareaFormat.outdent(textareaEl);
            } else {
                TextareaFormat.indent(textareaEl);
            }
            return;
        }

        // Shortcuts
        if (!e.ctrlKey && !e.metaKey) return;

        const key = e.key.toLowerCase();
        if (key === 'b') {
            e.preventDefault();
            toggleInlineMark('**');
        } else if (key === 'i') {
            e.preventDefault();
            toggleInlineMark('*');
        } else if (key === 'k') {
            e.preventDefault();
            await TextareaFormat.insertLink(textareaEl);
        }
    });

    textareaEl.addEventListener('input', () => {
        schedulePreviewUpdate();
        updateActiveButtons();
    });

    textareaEl.addEventListener('keyup', updateActiveButtons);
    textareaEl.addEventListener('mouseup', updateActiveButtons);
    textareaEl.addEventListener('focus', updateActiveButtons);

    if (previewEl) {
        // Allow editing embedded mindmaps directly from the live preview
        previewEl.addEventListener('click', (e) => {
            const trigger = e.target.closest('.mindmap-embed-open, .mindmap-embed-canvas');
            if (!trigger) return;
            e.preventDefault();
            e.stopPropagation();
            const embed = trigger.closest('.mindmap-embed');
            if (!embed) return;
            const encoded = embed.getAttribute('data-mindmap') || '';
            let jsonRaw = encoded;
            try {
                jsonRaw = decodeURIComponent(encoded);
            } catch {
                jsonRaw = encoded;
            }
            MindMapUI.openForTextareaFromJson(textareaEl, jsonRaw);
        });
    }

    // Initialize preview state (persisted per textarea id)
    if (previewEl) {
        // On mobile we still respect the preference, but default is OFF.
        // If user previously enabled it, we render it.
        setPreviewMode(isPreviewing);
        // If there's no textarea id, avoid sticking preview on for mobile by mistake.
        if (!textareaEl.id && isMobile) {
            setPreviewMode(false);
        }
    }

    updateActiveButtons();
}

function setupWysiwygToolbar(toolbarEl, editorEl) {
    if (!toolbarEl || !editorEl) return;

    // Hide preview controls in WYSIWYG mode
    const previewBtn = toolbarEl.querySelector('button[data-format="preview"]');
    if (previewBtn) previewBtn.style.display = 'none';

    const exec = (cmd, value = null) => {
        editorEl.focus();
        try {
            document.execCommand(cmd, false, value);
        } catch {
            // ignore
        }
        RichText.enforceEmbedsAtomic(editorEl);
        RichText.updateEmptyClass(editorEl);
    };

    const closestLiInEditor = () => {
        const sel = window.getSelection();
        const node = sel?.anchorNode;
        const el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
        const li = el?.closest?.('li') || null;
        if (!li) return null;
        return editorEl.contains(li) ? li : null;
    };

    const placeCaretAtEnd = (el) => {
        try {
            editorEl.focus();
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        } catch {
            // ignore
        }
    };

    const placeCaretAfterNode = (node) => {
        try {
            if (!node) return;
            editorEl.focus();
            const range = document.createRange();
            range.setStartAfter(node);
            range.collapse(true);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        } catch {
            // ignore
        }
    };

    const unwrapElement = (el) => {
        if (!el) return;
        const parent = el.parentNode;
        if (!parent) return;
        const frag = document.createDocumentFragment();
        while (el.firstChild) frag.appendChild(el.firstChild);
        const last = frag.lastChild;
        try {
            parent.replaceChild(frag, el);
        } catch {
            // Fallback: if replaceChild with fragment fails, append then remove.
            while (frag.firstChild) parent.insertBefore(frag.firstChild, el);
            try { el.remove(); } catch {}
        }
        // Place caret near where we unwrapped
        if (last?.nodeType === Node.ELEMENT_NODE) placeCaretAtEnd(last);
        else if (last) placeCaretAfterNode(last);
        else editorEl.focus();
    };

    const toggleBlockWrapper = (tagName, createValue) => {
        const current = closestTag(tagName);
        if (current) {
            unwrapElement(current);
        } else {
            exec('formatBlock', createValue);
        }
        RichText.enforceEmbedsAtomic(editorEl);
        RichText.updateEmptyClass(editorEl);
    };

    const indentListItem = () => {
        const li = closestLiInEditor();
        if (!li) {
            showToast('Para criar subtópicos, use uma lista (• ou 1.)');
            return;
        }
        const list = li.parentElement;
        if (!list || (list.tagName !== 'UL' && list.tagName !== 'OL')) return;

        const prevLi = li.previousElementSibling;
        if (!prevLi || prevLi.tagName !== 'LI') return;

        // Find or create a nested list inside previous LI
        const listTag = list.tagName.toLowerCase();
        let nested = null;
        for (let i = prevLi.children.length - 1; i >= 0; i--) {
            const child = prevLi.children[i];
            if (child && child.tagName === list.tagName) {
                nested = child;
                break;
            }
        }
        if (!nested) {
            nested = document.createElement(listTag);
            prevLi.appendChild(nested);
        }

        nested.appendChild(li);
        placeCaretAtEnd(li);
        RichText.enforceEmbedsAtomic(editorEl);
        RichText.updateEmptyClass(editorEl);
    };

    const outdentListItem = () => {
        const li = closestLiInEditor();
        if (!li) return;
        const list = li.parentElement;
        if (!list || (list.tagName !== 'UL' && list.tagName !== 'OL')) return;

        const parentLi = list.closest('li');
        if (!parentLi) return; // already top-level in editor
        const outerList = parentLi.parentElement;
        if (!outerList || (outerList.tagName !== 'UL' && outerList.tagName !== 'OL')) return;

        outerList.insertBefore(li, parentLi.nextSibling);

        // Remove empty nested list container
        if (!list.querySelector('li')) {
            try { list.remove(); } catch {}
        }

        placeCaretAtEnd(li);
        RichText.enforceEmbedsAtomic(editorEl);
        RichText.updateEmptyClass(editorEl);
    };

    const setBtnActive = (action, active) => {
        const btn = toolbarEl.querySelector(`button[data-format="${action}"]`);
        if (!btn) return;
        btn.classList.toggle('is-active', !!active);
    };

    const selectionTag = () => {
        const sel = window.getSelection();
        const node = sel?.anchorNode;
        const el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
        return el;
    };

    const closestTag = (tag) => {
        const el = selectionTag();
        return el?.closest?.(tag) || null;
    };

    const updateActiveButtons = () => {
        setBtnActive('bold', !!document.queryCommandState?.('bold'));
        setBtnActive('italic', !!document.queryCommandState?.('italic'));
        setBtnActive('ul', !!document.queryCommandState?.('insertUnorderedList'));
        setBtnActive('ol', !!document.queryCommandState?.('insertOrderedList'));
        setBtnActive('quote', !!closestTag('blockquote'));
        setBtnActive('h2', !!closestTag('h2'));
        setBtnActive('code', !!closestTag('pre, code'));
        setBtnActive('highlight', !!closestTag('mark'));
        setBtnActive('details', !!closestTag('details'));
    };

    const insertDetailsBlock = async () => {
        // Check if already inside details
        const existing = closestTag('details');
        if (existing) {
            // Unwrap the details block
            unwrapElement(existing);
            RichText.enforceEmbedsAtomic(editorEl);
            RichText.updateEmptyClass(editorEl);
            return;
        }

        // Prompt for the summary text
        const summaryText = await SystemDialog.prompt('Título da seção (clique para expandir/recolher):', {
            title: 'Seção expansível',
            placeholder: 'Ex: Detalhes da reunião...'
        });
        if (!summaryText) return;

        // Get selected content or use placeholder
        const sel = window.getSelection();
        let content = '';
        if (sel && !sel.isCollapsed) {
            const range = sel.getRangeAt(0);
            const frag = range.extractContents();
            const temp = document.createElement('div');
            temp.appendChild(frag);
            content = temp.innerHTML || '';
        }
        if (!content.trim()) {
            content = '<p>Conteúdo aqui...</p>';
        }

        // Create details element
        const details = document.createElement('details');
        details.setAttribute('open', '');
        const summary = document.createElement('summary');
        summary.textContent = summaryText;
        details.appendChild(summary);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'details-content';
        contentDiv.innerHTML = content;
        details.appendChild(contentDiv);

        // Create a paragraph after details so user can continue typing
        const afterParagraph = document.createElement('p');
        afterParagraph.innerHTML = '<br>';

        // Insert at cursor
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(afterParagraph);
            range.insertNode(details);
            // Move cursor to the paragraph after details
            range.setStart(afterParagraph, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            editorEl.appendChild(details);
            editorEl.appendChild(afterParagraph);
        }

        RichText.enforceEmbedsAtomic(editorEl);
        RichText.updateEmptyClass(editorEl);
    };

    // Ensure there's always a paragraph at the end for typing after block elements
    const ensureTrailingParagraph = () => {
        const lastChild = editorEl.lastElementChild;
        if (lastChild && (lastChild.tagName === 'DETAILS' || lastChild.tagName === 'BLOCKQUOTE' || lastChild.tagName === 'PRE' || lastChild.tagName === 'UL' || lastChild.tagName === 'OL')) {
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            editorEl.appendChild(p);
        }
    };

    toolbarEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-format]');
        if (!btn) return;
        e.preventDefault();
        const action = btn.dataset.format;

        switch (action) {
            case 'bold':
                exec('bold');
                break;
            case 'italic':
                exec('italic');
                break;
            case 'h2':
                toggleBlockWrapper('h2', '<h2>');
                break;
            case 'ul':
                exec('insertUnorderedList');
                break;
            case 'ol':
                exec('insertOrderedList');
                break;
            case 'indent':
                indentListItem();
                break;
            case 'outdent':
                outdentListItem();
                break;
            case 'quote':
                toggleBlockWrapper('blockquote', '<blockquote>');
                break;
            case 'code':
                toggleBlockWrapper('pre', '<pre>');
                break;
            case 'highlight': {
                // Use hiliteColor command or wrap in <mark>
                const markEl = closestTag('mark');
                if (markEl) {
                    unwrapElement(markEl);
                } else {
                    const sel = window.getSelection();
                    if (sel && !sel.isCollapsed) {
                        const range = sel.getRangeAt(0);
                        const mark = document.createElement('mark');
                        try {
                            range.surroundContents(mark);
                        } catch {
                            // If selection spans multiple elements, extract and wrap
                            const frag = range.extractContents();
                            mark.appendChild(frag);
                            range.insertNode(mark);
                        }
                        // Place cursor after mark
                        placeCaretAfterNode(mark);
                    }
                }
                RichText.enforceEmbedsAtomic(editorEl);
                RichText.updateEmptyClass(editorEl);
                break;
            }
            case 'link': {
                const url = await SystemDialog.prompt('Cole o link (https://...)', {
                    title: 'Inserir link',
                    placeholder: 'https://...'
                });
                if (!url) return;
                if (!Markdown.isSafeUrl(url)) {
                    showToast('Link inválido (use https://)');
                    return;
                }
                exec('createLink', url.trim());
                break;
            }
            case 'mindmap':
                MindMapUI.openForEditor(editorEl);
                break;
            case 'details':
                await insertDetailsBlock();
                break;
        }

        updateActiveButtons();
    });

    // Tab / Shift+Tab for subtopics (indent/outdent)
    editorEl.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        // Don't indent inside atomic embeds
        if (e.target?.closest?.('.mindmap-embed')) return;
        e.preventDefault();
        if (e.shiftKey) outdentListItem();
        else indentListItem();
    });

    editorEl.addEventListener('input', () => {
        RichText.enforceEmbedsAtomic(editorEl);
        RichText.updateEmptyClass(editorEl);
        ensureTrailingParagraph();
        updateActiveButtons();
    });

    editorEl.addEventListener('focus', () => {
        RichText.updateEmptyClass(editorEl);
        ensureTrailingParagraph();
        updateActiveButtons();
    });

    editorEl.addEventListener('keyup', updateActiveButtons);
    editorEl.addEventListener('mouseup', updateActiveButtons);

    editorEl.addEventListener('paste', (e) => {
        // Safe default: paste as plain text.
        e.preventDefault();
        const text = e.clipboardData?.getData('text/plain') || '';
        RichText.insertTextAtCursor(editorEl, text);
    });

    // Allow editing embedded mindmaps directly from the editor
    editorEl.addEventListener('click', (e) => {
        const trigger = e.target.closest('.mindmap-embed-open, .mindmap-embed-canvas');
        if (!trigger) return;
        e.preventDefault();
        e.stopPropagation();
        const embed = trigger.closest('.mindmap-embed');
        if (!embed) return;
        MindMapUI.openForEditorFromEmbed(editorEl, embed);
    });

    RichText.updateEmptyClass(editorEl);
    updateActiveButtons();
}

// =============================================
// App Controller
// =============================================

const App = {
    // --- Chat scroll helpers (WhatsApp-like) ---
    getChatBottomThresholdPx() {
        return 120;
    },

    getScrollGapFromBottom(container) {
        if (!container) return 0;
        const gap = container.scrollHeight - (container.scrollTop + container.clientHeight);
        return Math.max(0, gap);
    },

    isNearBottom(container) {
        return this.getScrollGapFromBottom(container) <= this.getChatBottomThresholdPx();
    },

    updateJumpToBottomUI() {
        const btn = DOM.jumpToBottomBtn;
        if (!btn) return;

        const isChatPage = AppState.currentPage === 'chat';
        const shouldShow = isChatPage && !AppState.chatStickToBottom;

        btn.classList.toggle('show', shouldShow);
        btn.style.display = shouldShow ? '' : 'none';

        const badge = DOM.jumpToBottomBadge;
        if (badge) {
            const count = Number(AppState.chatUnreadBelow || 0);
            const showBadge = shouldShow && count > 0;
            badge.style.display = showBadge ? '' : 'none';
            badge.textContent = count > 99 ? '99+' : String(count);
        }
    },

    scrollToBottomImmediate(container = DOM.messagesContainer) {
        if (!container) return;
        container.scrollTop = container.scrollHeight;
    },

    // Initialize app
    async init() {
        this.setupEventListeners();

        // Cookie-based session check
        try {
            const { user } = await API.auth.me();
            AppState.user = user;
            this.showMainApp();
            await this.loadInitialData();
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuthScreen();
        }
    },

    // Show loading screen
    showLoading() {
        DOM.loadingScreen.style.display = 'flex';
        DOM.authScreen.style.display = 'none';
        DOM.mainApp.style.display = 'none';
    },

    // Show auth screen
    showAuthScreen() {
        DOM.loadingScreen.style.display = 'none';
        DOM.authScreen.style.display = 'flex';
        DOM.mainApp.style.display = 'none';
    },

    // Show main app
    showMainApp() {
        DOM.loadingScreen.style.display = 'none';
        DOM.authScreen.style.display = 'none';
        DOM.mainApp.style.display = 'flex';

        // Update UI with user info
        if (AppState.user) {
            const firstName = AppState.user.name.split(' ')[0];
            const initial = AppState.user.name.charAt(0).toUpperCase();
            
            DOM.userName.textContent = firstName;
            DOM.profileName.textContent = AppState.user.name;
            DOM.profileEmail.textContent = AppState.user.email;
            
            // Update sidebar (desktop)
            if (DOM.sidebarAvatar) {
                DOM.sidebarAvatar.textContent = initial;
            }
            if (DOM.sidebarUsername) {
                DOM.sidebarUsername.textContent = firstName;
            }
        }

        DOM.headerDate.textContent = Utils.formatDateHeader();
        
        // Initialize Speech-to-Text
        SpeechToText.init();
        
        // Initialize Drawing Canvas
        DrawingCanvas.init();
        
        // Initialize Theme Manager
        ThemeManager.init();

        // Initialize collapsible UI sections
        initThemeSectionCollapsible();

        // Initialize hash router (after DOM/state are ready)
        if (typeof Router !== 'undefined') {
            Router.init();
        }

        // Initialize Smart Capture (parser + chip preview)
        if (typeof SmartCapture !== 'undefined') {
            SmartCapture.init();
        }

        // Initialize Focus Mode (S3)
        if (typeof FocusMode !== 'undefined') {
            FocusMode.init();
        }

        // Initialize Command Palette (S5 / F2) — global ⌘K
        if (typeof CommandPalette !== 'undefined') {
            CommandPalette.init();
        }

        // Initialize S5 polish: offline banner, scroll restore, etc.
        S5Polish.init();

        // PWA share target — handle ?share-target on first load
        S5Polish.handleShareTarget();
    },

    // Load initial data
    async loadInitialData() {
        try {
            // Load all data in parallel
            const [messagesData, categoriesData, sectionsData, statsData] = await Promise.all([
                API.messages.getAll(),
                API.categories.getAll(),
                API.categories.getSections(),
                API.stats.dashboard()
            ]);

            AppState.messages = messagesData.messages;
            AppState.categories = categoriesData.categories;
            AppState.categorySections = sectionsData.sections || [];
            AppState.stats = statsData.stats;

            // UI preferences
            const savedSort = localStorage.getItem('sectionSortMode');
            if (savedSort === 'alpha' || savedSort === 'manual') {
                AppState.sectionSortMode = savedSort;
            }

            // Render all
            this.renderDashboard();
            this.renderMessages();
            this.renderCategories();
            this.renderCategoryDropdowns();
            this.renderCategorySectionSelect();
            this.renderSectionsManager();
            this.updateSectionSortButtons();
            this.renderProfile();
            this.renderSidebarCategories();
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast('Erro ao carregar dados');
        }
    },

    // Navigation
    navigateTo(page) {
        AppState.currentPage = page;

        // Mirror to URL hash
        if (typeof Router !== 'undefined' && Router.syncFromNavigate) {
            const params = page === 'categoryMessages' && AppState.viewingCategoryId
                ? { categoryId: AppState.viewingCategoryId }
                : null;
            Router.syncFromNavigate(page, params);
        }

        // Update bottom nav
        DOM.bottomNav.querySelectorAll('.nav-item[data-page]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Update sidebar nav (desktop)
        if (DOM.sidebar) {
            DOM.sidebar.querySelectorAll('.sidebar-nav-item').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.page === page);
            });
        }

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Hide category messages page if navigating away
        if (page !== 'categoryMessages') {
            DOM.categoryMessagesPage.classList.remove('active');
        }

        // Refresh data for specific pages
        if (page === 'home') {
            this.refreshDashboard();
        } else if (page === 'chat') {
            this.refreshMessages();
            this.updateJumpToBottomUI();
        } else if (page === 'categories') {
            this.refreshCategories();
        } else if (page === 'kanban') {
            this.renderKanban();
        } else if (page === 'profile') {
            this.loadAdminData();
        }
    },

    // Refresh dashboard
    async refreshDashboard() {
        try {
            const { stats } = await API.stats.dashboard();
            AppState.stats = stats;
            this.renderDashboard();
        } catch (error) {
            console.error('Failed to refresh dashboard:', error);
        }
    },

    // Refresh messages
    async refreshMessages() {
        try {
            const prevLast = Array.isArray(AppState.messages) && AppState.messages.length
                ? AppState.messages[AppState.messages.length - 1]
                : null;
            const prevLastTime = prevLast?.createdAt ? new Date(prevLast.createdAt).getTime() : 0;

            const { messages } = await API.messages.getAll();
            AppState.messages = messages;

            // If user is not at bottom, count incoming messages so the button can show a badge.
            if (!AppState.chatStickToBottom && Array.isArray(messages) && messages.length) {
                const newCount = messages.reduce((acc, m) => {
                    const t = m?.createdAt ? new Date(m.createdAt).getTime() : 0;
                    return t > prevLastTime ? acc + 1 : acc;
                }, 0);
                if (newCount > 0) {
                    AppState.chatUnreadBelow = Number(AppState.chatUnreadBelow || 0) + newCount;
                }
            }

            this.renderMessages();
        } catch (error) {
            console.error('Failed to refresh messages:', error);
        }
    },

    // Refresh categories
    async refreshCategories() {
        try {
            const [{ categories }, { sections }] = await Promise.all([
                API.categories.getAll(),
                API.categories.getSections()
            ]);
            AppState.categories = categories;
            AppState.categorySections = sections || [];
            this.renderCategories();
            this.renderCategoryDropdowns();
            this.renderCategorySectionSelect();
            this.renderSectionsManager();
            this.updateSectionSortButtons();
            this.renderSidebarCategories();
        } catch (error) {
            console.error('Failed to refresh categories:', error);
        }
    },

    updateSectionSortButtons() {
        const label = AppState.sectionSortMode === 'alpha' ? 'A-Z' : 'Manual';
        if (DOM.sectionsSortModeBtn) {
            DOM.sectionsSortModeBtn.textContent = label;
        }
        if (DOM.toggleSectionSortBtn) {
            DOM.toggleSectionSortBtn.title = `Ordenação das seções: ${label}`;
            const icon = DOM.toggleSectionSortBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-sort-alpha-down', AppState.sectionSortMode === 'alpha');
                icon.classList.toggle('fa-sort', AppState.sectionSortMode !== 'alpha');
            }
        }
    },

    setSectionSortMode(mode) {
        const next = mode === 'alpha' ? 'alpha' : 'manual';
        AppState.sectionSortMode = next;
        localStorage.setItem('sectionSortMode', next);
        this.updateSectionSortButtons();
        this.renderCategories();
        this.renderSectionsManager();
    },

    toggleSectionSortMode() {
        this.setSectionSortMode(AppState.sectionSortMode === 'alpha' ? 'manual' : 'alpha');
    },

    openSectionsModal() {
        if (!DOM.sectionsModal) return;
        this.renderSectionsManager();
        this.updateSectionSortButtons();
        openModal(DOM.sectionsModal);
        DOM.newSectionName?.focus();
    },

    closeSectionsModal() {
        if (!DOM.sectionsModal) return;
        closeModal(DOM.sectionsModal);
    },

    renderSectionsManager() {
        if (!DOM.sectionsList) return;

        const sections = Array.isArray(AppState.categorySections) ? [...AppState.categorySections] : [];
        const canReorder = AppState.sectionSortMode === 'manual';
        sections.sort((a, b) => {
            if (AppState.sectionSortMode === 'alpha') {
                return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
            }
            const pa = Number(a.position ?? 0);
            const pb = Number(b.position ?? 0);
            if (pa !== pb) return pa - pb;
            return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
        });

        if (sections.length === 0) {
            DOM.sectionsList.innerHTML = `
                <div class="empty-state small">
                    <i class="fas fa-layer-group"></i>
                    <h3>Nenhuma seção</h3>
                    <p>Crie sua primeira seção</p>
                </div>
            `;
            return;
        }

        DOM.sectionsList.innerHTML = sections
            .map((s) => {
                const count = Number(s.categoryCount ?? 0);
                const sectionColor = s.color || '#25D366';
                return `
                    <div class="section-item" data-id="${s.id}" draggable="${canReorder ? 'true' : 'false'}">
                        <div class="section-left">
                            <div class="section-grip" title="Arrastar para reordenar" style="${canReorder ? '' : 'opacity:0.45'}">
                                <i class="fas fa-grip-vertical"></i>
                            </div>
                            <div class="section-color-dot" style="background: ${Utils.sanitizeCssColor(sectionColor)}"></div>
                            <div class="section-name">${Utils.escapeHtml(s.name)}</div>
                            <div class="section-meta">${count}</div>
                        </div>
                        <div class="section-actions">
                            <button class="section-edit" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="section-delete" title="Excluir"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            })
            .join('');

        // rename/delete
        DOM.sectionsList.querySelectorAll('.section-item').forEach((row) => {
            const id = row.dataset.id;
            row.querySelector('.section-edit')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.renameSection(id);
            });
            row.querySelector('.section-delete')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.deleteSection(id);
            });
        });

        // drag reorder (manual only)
        if (!canReorder) return;

        let draggingId = null;

        const getOrderedIdsFromDom = () =>
            Array.from(DOM.sectionsList.querySelectorAll('.section-item'))
                .map((el) => el.dataset.id)
                .filter(Boolean);

        DOM.sectionsList.querySelectorAll('.section-item').forEach((row) => {
            row.addEventListener('dragstart', (e) => {
                draggingId = row.dataset.id;
                row.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                try { e.dataTransfer.setData('text/plain', draggingId); } catch { /* ignore */ }
            });
            row.addEventListener('dragend', () => {
                row.classList.remove('dragging');
                draggingId = null;
            });

            row.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!draggingId) return;
                const target = row;
                if (!target || target.dataset.id === draggingId) return;
                const draggingEl = DOM.sectionsList.querySelector(`.section-item[data-id="${draggingId}"]`);
                if (!draggingEl) return;
                const rect = target.getBoundingClientRect();
                const before = e.clientY < rect.top + rect.height / 2;
                if (before) {
                    DOM.sectionsList.insertBefore(draggingEl, target);
                } else {
                    DOM.sectionsList.insertBefore(draggingEl, target.nextSibling);
                }
            });

            row.addEventListener('drop', async (e) => {
                e.preventDefault();
                const orderedIds = getOrderedIdsFromDom();
                try {
                    await API.categories.reorderSections(orderedIds);
                    AppState.categorySections = orderedIds
                        .map((id, idx) => {
                            const found = AppState.categorySections.find((s) => s.id === id);
                            return found ? { ...found, position: idx } : null;
                        })
                        .filter(Boolean);
                    this.renderCategories();
                } catch (error) {
                    showToast(error.message);
                    await this.refreshCategories();
                }
            });
        });
    },

    openRenameSectionModal(sectionId) {
        const section = AppState.categorySections.find((s) => s.id === sectionId);
        if (!section || !DOM.renameSectionModal) return;

        AppState.renamingSectionId = sectionId;
        if (DOM.renameSectionInput) {
            DOM.renameSectionInput.value = section.name || '';
            // Put cursor at end
            try {
                DOM.renameSectionInput.setSelectionRange(DOM.renameSectionInput.value.length, DOM.renameSectionInput.value.length);
            } catch { /* ignore */ }
        }

        // Set section color
        const sectionColor = section.color || '#25D366';
        if (DOM.editSectionColor) {
            DOM.editSectionColor.value = sectionColor;
        }
        // Highlight selected color
        if (DOM.editSectionColorPicker) {
            DOM.editSectionColorPicker.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.color === sectionColor);
            });
        }

        openModal(DOM.renameSectionModal);
        DOM.renameSectionInput?.focus();
    },

    closeRenameSectionModal() {
        if (!DOM.renameSectionModal) return;
        closeModal(DOM.renameSectionModal);
        AppState.renamingSectionId = null;
    },

    async confirmRenameSection() {
        const sectionId = AppState.renamingSectionId;
        if (!sectionId) return;
        const name = String(DOM.renameSectionInput?.value || '').trim();
        const color = DOM.editSectionColor?.value || '#25D366';
        if (!name) {
            showToast('Digite um nome para a seção');
            return;
        }
        try {
            await API.categories.updateSection(sectionId, { name, color });
            await this.refreshCategories();
            this.closeRenameSectionModal();
            showToast('Seção atualizada!');
        } catch (error) {
            showToast(error.message);
        }
    },

    openDeleteSectionModal(sectionId) {
        const section = AppState.categorySections.find((s) => s.id === sectionId);
        if (!section || !DOM.deleteSectionModal) return;

        AppState.deletingSectionId = sectionId;
        if (DOM.deleteSectionName) {
            DOM.deleteSectionName.textContent = section.name || '';
        }
        openModal(DOM.deleteSectionModal);
    },

    closeDeleteSectionModal() {
        if (!DOM.deleteSectionModal) return;
        closeModal(DOM.deleteSectionModal);
        AppState.deletingSectionId = null;
    },

    async confirmDeleteSection() {
        const sectionId = AppState.deletingSectionId;
        if (!sectionId) return;
        try {
            await API.categories.deleteSection(sectionId);
            await this.refreshCategories();
            this.closeDeleteSectionModal();
            showToast('Seção excluída!');
        } catch (error) {
            showToast(error.message);
        }
    },

    async createSectionFromModal() {
        const name = String(DOM.newSectionName?.value || '').trim();
        const color = DOM.newSectionColor?.value || '#25D366';
        if (!name) {
            showToast('Digite um nome para a seção');
            return;
        }
        try {
            await API.categories.createSection({ name, color });
            DOM.newSectionName.value = '';
            // Reset color to default
            if (DOM.newSectionColor) DOM.newSectionColor.value = '#25D366';
            if (DOM.newSectionColorBtn) DOM.newSectionColorBtn.style.background = '#25D366';
            await this.refreshCategories();
            showToast('Seção criada!');
        } catch (error) {
            showToast(error.message);
        }
    },

    openMoveCategoryModal(categoryId) {
        const category = AppState.categories.find((c) => c.id === categoryId);
        if (!category || !DOM.moveCategoryModal) return;
        AppState.movingCategoryId = categoryId;

        if (DOM.moveCategoryName) {
            DOM.moveCategoryName.textContent = category.name || '';
        }

        // Render custom section dropdown
        this.renderCustomSectionDropdown(
            DOM.moveCategorySectionDropdown,
            DOM.moveCategorySectionTrigger,
            DOM.moveCategorySectionMenu,
            DOM.moveCategorySectionSelect,
            'Sem seção',
            category.sectionId || ''
        );

        openModal(DOM.moveCategoryModal);
    },

    closeMoveCategoryModal() {
        if (!DOM.moveCategoryModal) return;
        closeModal(DOM.moveCategoryModal);
        AppState.movingCategoryId = null;
    },

    async confirmMoveCategory() {
        const id = AppState.movingCategoryId;
        if (!id) return;
        const sectionIdRaw = DOM.moveCategorySectionSelect ? DOM.moveCategorySectionSelect.value : '';
        const sectionId = sectionIdRaw ? sectionIdRaw : null;

        // Get color from selected section
        let color = '#25D366'; // default
        if (sectionId) {
            const section = AppState.categorySections.find(s => s.id === sectionId);
            if (section && section.color) {
                color = section.color;
            }
        }

        try {
            await API.categories.update(id, { sectionId, color });
            await this.refreshCategories();
            this.closeMoveCategoryModal();
            showToast('Tema movido!');
        } catch (error) {
            showToast(error.message);
        }
    },

    // Render dashboard
    renderDashboard() {
        const stats = AppState.stats;
        if (!stats) return;

        // S4 — Editorial dashboard
        this.renderDashboardEditorial(stats);

        // Stats cards (legacy, hidden — kept to satisfy existing renderers)
        DOM.statTotalMessages.textContent = stats.messages.total;
        DOM.statToday.textContent = stats.messages.today;
        DOM.statPendingTasks.textContent = stats.tasks.pending;
        DOM.statStreak.textContent = stats.activity.streak;

        // Activity chart
        this.renderActivityChart(stats.activity.last7Days);

        // Task progress (circular)
        const completionRate = stats.tasks.completionRate || 0;
        if (DOM.progressCircleFill) {
            DOM.progressCircleFill.setAttribute('stroke-dasharray', `${completionRate}, 100`);
        }
        if (DOM.progressPercent) {
            DOM.progressPercent.textContent = `${Math.round(completionRate)}%`;
        }
        DOM.completedTasks.textContent = stats.tasks.completed;
        DOM.pendingTasksDetail.textContent = stats.tasks.pending;

        // Task alerts
        this.renderTaskAlerts(stats.tasks);

        // Top categories
        this.renderTopCategories(stats.categories.topCategories);

        // Recent messages
        this.renderRecentMessages(stats.recent.messages);

        // Upcoming tasks
        this.renderUpcomingTasks(stats.recent.upcomingTasks);

        // Calendar
        this.renderCalendar();

        // Profile stats
        DOM.profileTotalMessages.textContent = stats.messages.total;
        DOM.profileTotalCategories.textContent = stats.categories.total;
        DOM.profileTotalTasks.textContent = stats.tasks.total;
    },

    // -------------------------------------------------------------------
    // S4 — Editorial dashboard renderers
    // -------------------------------------------------------------------

    renderDashboardEditorial(stats) {
        // KPI strip
        const setKpi = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = (val == null ? 0 : val);
        };
        setKpi('kpiCaptured', stats.messages && stats.messages.thisWeek);
        setKpi('kpiCompleted', stats.tasks && stats.tasks.completed);
        setKpi('kpiPending', stats.tasks && stats.tasks.pending);
        setKpi('kpiStreak', stats.activity && stats.activity.streak);

        this.renderActivity30(stats.daily30);
        this.renderTopCats(stats.byCategory);
        this.renderHeatmap(stats.byHourDay);
        this.renderWeeklySummary(stats.weekSummary);
    },

    renderActivity30(daily) {
        const root = document.getElementById('activity30Chart');
        if (!root) return;
        const arr = Array.isArray(daily) ? daily : [];
        if (!arr.length) {
            root.innerHTML = '<div class="top-cats__empty">Sem atividade ainda</div>';
            return;
        }
        const max = Math.max(...arr.map(d => d.count || 0), 1);
        let html = '';
        for (const d of arr) {
            const pct = Math.max(2, Math.round(((d.count || 0) / max) * 100));
            const cls = d.count ? '' : ' activity-30__bar--zero';
            const title = (d.date || '') + ' · ' + (d.count || 0) + ' ideia' + (d.count === 1 ? '' : 's');
            html += '<div class="activity-30__bar' + cls + '" style="height:' + pct + '%" title="' + Utils.escapeHtml(title) + '"></div>';
        }
        root.innerHTML = html;
    },

    renderTopCats(cats) {
        const root = document.getElementById('topCatsList');
        if (!root) return;
        const arr = (cats || []).filter(c => c.count > 0).slice(0, 5);
        if (!arr.length) {
            root.innerHTML = '<div class="top-cats__empty">Sem categorias ainda</div>';
            return;
        }
        const max = Math.max(...arr.map(c => c.count));
        let html = '';
        for (const c of arr) {
            const safeColor = Utils.sanitizeCssColor(c.color || '#888');
            const widthPct = Math.max(8, Math.round((c.count / max) * 100));
            html += '<div class="top-cat-row">'
                + '<span class="top-cat-row__name">' + Utils.escapeHtml(c.name || '') + '</span>'
                + '<span class="top-cat-row__count">' + c.count + ' · ' + (c.pct || 0) + '%</span>'
                + '<div class="top-cat-row__bar"><div class="top-cat-row__fill" style="width:' + widthPct + '%; background:' + safeColor + '"></div></div>'
                + '</div>';
        }
        root.innerHTML = html;
    },

    renderHeatmap(byHourDay) {
        const root = document.getElementById('heatmapGrid');
        if (!root) return;
        const cells = {};
        let max = 1;
        for (const c of (byHourDay || [])) {
            const key = c.dow + ':' + c.hour;
            cells[key] = c.count;
            if (c.count > max) max = c.count;
        }
        const dows = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
        const level = (n) => {
            if (!n) return '';
            const ratio = n / max;
            if (ratio >= 0.75) return ' heatmap__cell--l4';
            if (ratio >= 0.50) return ' heatmap__cell--l3';
            if (ratio >= 0.25) return ' heatmap__cell--l2';
            return ' heatmap__cell--l1';
        };
        let html = '';
        for (let d = 0; d < 7; d++) {
            html += '<span class="heatmap__row-label">' + dows[d] + '</span>';
            for (let h = 0; h < 24; h++) {
                const cnt = cells[d + ':' + h] || 0;
                const tip = dows[d] + ' · ' + String(h).padStart(2, '0') + 'h · ' + cnt;
                html += '<span class="heatmap__cell' + level(cnt) + '" title="' + tip + '"></span>';
            }
        }
        root.innerHTML = html;
    },

    renderWeeklySummary(ws) {
        const section = document.getElementById('weeklySummary');
        const textEl = document.getElementById('weeklySummaryText');
        const tagsEl = document.getElementById('weeklySummaryTags');
        if (!section || !textEl) return;

        if (!ws || !ws.text) {
            section.hidden = true;
            return;
        }
        section.hidden = false;
        textEl.innerHTML = this.formatMarkdownInline(ws.text);

        if (tagsEl) {
            const tags = [];
            if (typeof ws.deltaVsLastWeek === 'number') {
                if (ws.deltaVsLastWeek > 0) tags.push('<span class="weekly-tag weekly-tag--up">+' + ws.deltaVsLastWeek + '% vs sem. anterior</span>');
                else if (ws.deltaVsLastWeek < 0) tags.push('<span class="weekly-tag weekly-tag--down">' + ws.deltaVsLastWeek + '% vs sem. anterior</span>');
            }
            if (typeof ws.becameTask === 'number') {
                tags.push('<span class="weekly-tag">' + ws.becameTask + ' viraram tarefa</span>');
            }
            if (ws.periodLabel) {
                tags.push('<span class="weekly-tag weekly-tag--accent">predomínio · ' + Utils.escapeHtml(ws.periodLabel) + '</span>');
            }
            tagsEl.innerHTML = tags.join('');
        }
    },

    // Convert **bold** markdown to <strong> for editorial copy
    formatMarkdownInline(s) {
        if (!s) return '';
        const escaped = Utils.escapeHtml(String(s));
        return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    },

    // Inbox banner: weekly summary on Mondays (dispensable per session)
    renderWeeklySummaryBanner() {
        const stats = AppState.stats;
        if (!stats || !stats.weekSummary || !stats.weekSummary.text) return;
        const isMonday = new Date().getDay() === 1;
        if (!isMonday) return;
        const weekKey = stats.weekSummary.weekStart || '';
        if (!weekKey) return;
        const dismissedKey = 'savit_summary_dismissed_' + weekKey;
        try { if (localStorage.getItem(dismissedKey)) return; } catch { /* ignore */ }

        const container = DOM.messagesContainer;
        if (!container) return;
        if (container.querySelector('.feed-banner')) return; // already rendered

        const banner = document.createElement('div');
        banner.className = 'feed-banner';
        banner.dataset.weekKey = weekKey;
        banner.innerHTML = '<span class="feed-banner__eyebrow">Resumo da semana</span>'
            + '<p class="feed-banner__text">' + this.formatMarkdownInline(stats.weekSummary.text) + '</p>'
            + '<button type="button" class="feed-banner__close" aria-label="Dispensar resumo">×</button>';
        const closeBtn = banner.querySelector('.feed-banner__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                try { localStorage.setItem(dismissedKey, '1'); } catch { /* ignore */ }
                banner.remove();
            });
        }
        container.insertBefore(banner, container.firstChild);
    },

    renderActivityChart(data) {
        let html = '';
        const maxCount = Math.max(...data.map(d => d.count), 1);

        data.forEach(day => {
            const height = (day.count / maxCount) * 100;
            html += `
                <div class="chart-bar-container">
                    <div class="chart-bar" style="height: ${Math.max(height, 5)}%">
                        <span class="chart-value">${Number.isFinite(day.count) ? day.count : 0}</span>
                    </div>
                    <span class="chart-label">${Utils.escapeHtml(String(day.day ?? ''))}</span>
                </div>
            `;
        });

        DOM.activityChart.innerHTML = html;
    },

    // Calendar
    renderCalendar() {
        const date = AppState.calendarDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // Update month display
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        DOM.calendarMonth.textContent = `${monthNames[month]} ${year}`;
        
        // Get first day of month and total days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        // Get tasks by date
        const tasksByDate = this.getTasksByDate();
        
        // Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let html = '';
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            html += `<div class="calendar-day other-month"><span class="calendar-day-number">${day}</span></div>`;
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayDate = new Date(year, month, day);
            dayDate.setHours(0, 0, 0, 0);
            
            const isToday = dayDate.getTime() === today.getTime();
            const isSelected = AppState.calendarSelectedDay === dateStr;
            const tasks = tasksByDate[dateStr] || [];
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            
            // Task dots
            let dots = '';
            if (tasks.length > 0) {
                const pending = tasks.filter(t => !t.taskCompleted);
                const completed = tasks.filter(t => t.taskCompleted);
                const overdue = pending.filter(t => dayDate < today);
                
                dots = '<div class="calendar-day-dots">';
                if (overdue.length > 0) dots += '<span class="calendar-day-dot overdue"></span>';
                else if (pending.length > 0) dots += '<span class="calendar-day-dot"></span>';
                if (completed.length > 0) dots += '<span class="calendar-day-dot completed"></span>';
                dots += '</div>';
            }
            
            html += `
                <div class="${classes}" data-date="${dateStr}">
                    <span class="calendar-day-number">${day}</span>
                    ${dots}
                </div>
            `;
        }
        
        // Next month days
        const totalCells = firstDay + daysInMonth;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month"><span class="calendar-day-number">${day}</span></div>`;
        }
        
        DOM.calendarDays.innerHTML = html;
        
        // Add click listeners
        DOM.calendarDays.querySelectorAll('.calendar-day:not(.other-month)').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const dateStr = dayEl.dataset.date;
                AppState.calendarSelectedDay = dateStr;
                this.renderCalendar();
                this.renderCalendarTasks(dateStr);
            });
        });
        
        // Show today's tasks by default if no selection
        if (!AppState.calendarSelectedDay) {
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            this.renderCalendarTasks(todayStr);
        } else {
            this.renderCalendarTasks(AppState.calendarSelectedDay);
        }
    },

    getTasksByDate() {
        const tasksByDate = {};
        
        AppState.messages.filter(m => m.isTask && m.taskDate).forEach(task => {
            const dateStr = task.taskDate.split('T')[0];
            if (!tasksByDate[dateStr]) tasksByDate[dateStr] = [];
            tasksByDate[dateStr].push(task);
        });
        
        return tasksByDate;
    },

    renderCalendarTasks(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        // Format date display
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        DOM.calendarSelectedDate.textContent = date.toLocaleDateString('pt-BR', options);
        
        // Get tasks for this date
        const tasksByDate = this.getTasksByDate();
        const tasks = tasksByDate[dateStr] || [];
        
        if (tasks.length === 0) {
            DOM.calendarTasksList.innerHTML = `
                <div class="calendar-no-tasks">
                    <i class="fas fa-calendar-check"></i>
                    <p>Nenhuma tarefa para este dia</p>
                </div>
            `;
            return;
        }
        
        // Sort: pending first, then by time
        tasks.sort((a, b) => {
            if (a.taskCompleted !== b.taskCompleted) return a.taskCompleted ? 1 : -1;
            if (a.taskTime && b.taskTime) return a.taskTime.localeCompare(b.taskTime);
            return 0;
        });
        
        let html = '';
        tasks.forEach(task => {
            const category = AppState.categories.find(c => c.id === task.categoryId);
            const isCompleted = task.taskCompleted;
            const plain = RichText.plainTextFromStored(task.text);
            
            html += `
                <div class="calendar-task-item ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
                    <div class="calendar-task-checkbox ${isCompleted ? 'checked' : ''}" data-id="${task.id}">
                        <i class="fas fa-check"></i>
                    </div>
                    <span class="calendar-task-text">${Utils.escapeHtml(plain)}</span>
                    ${task.taskTime ? `<span class="calendar-task-time">${task.taskTime}</span>` : ''}
                    ${category ? `<span class="calendar-task-category" style="background: ${Utils.sanitizeCssColor(category.color)}">${Utils.escapeHtml(category.name)}</span>` : ''}
                </div>
            `;
        });
        
        DOM.calendarTasksList.innerHTML = html;
        
        // Add event listeners
        DOM.calendarTasksList.querySelectorAll('.calendar-task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTaskComplete(checkbox.dataset.id);
            });
        });
        
        DOM.calendarTasksList.querySelectorAll('.calendar-task-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openEditMessageModal(item.dataset.id);
            });
        });
    },

    renderTaskAlerts(tasks) {
        let html = '';

        if (tasks.overdue > 0) {
            html += `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>${tasks.overdue} tarefa${tasks.overdue > 1 ? 's' : ''} atrasada${tasks.overdue > 1 ? 's' : ''}</span>
                </div>
            `;
        }

        if (tasks.dueToday > 0) {
            html += `
                <div class="alert alert-warning">
                    <i class="fas fa-clock"></i>
                    <span>${tasks.dueToday} tarefa${tasks.dueToday > 1 ? 's' : ''} para hoje</span>
                </div>
            `;
        }

        if (tasks.overdue === 0 && tasks.dueToday === 0 && tasks.pending > 0) {
            html += `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i>
                    <span>Nenhuma tarefa urgente!</span>
                </div>
            `;
        }

        DOM.taskAlerts.innerHTML = html;
    },

    renderTopCategories(categories) {
        if (categories.length === 0) {
            DOM.topCategories.innerHTML = '<p class="text-muted">Nenhuma categoria ainda</p>';
            return;
        }

        let html = '';
        categories.forEach(cat => {
            html += `
                <div class="category-bar" data-category-id="${cat.id}">
                    <div class="category-bar-info">
                        <span class="category-dot" style="background: ${Utils.sanitizeCssColor(cat.color)}"></span>
                        <span class="category-bar-name">${Utils.escapeHtml(cat.name)}</span>
                    </div>
                    <span class="category-bar-count">${cat.count}</span>
                </div>
            `;
        });

        DOM.topCategories.innerHTML = html;

        DOM.topCategories.querySelectorAll('.category-bar').forEach((el) => {
            el.addEventListener('click', () => {
                this.openCategoryMessages(el.dataset.categoryId);
            });
        });
    },

    renderRecentMessages(messages) {
        if (messages.length === 0) {
            DOM.recentMessages.innerHTML = '<p class="text-muted">Nenhuma ideia ainda</p>';
            return;
        }

        let html = '';
        messages.forEach(msg => {
            const plain = RichText.plainTextFromStored(msg.text);
            html += `
                <div class="recent-message-item">
                    ${msg.category ? `<span class="category-dot" style="background: ${Utils.sanitizeCssColor(msg.category.color)}"></span>` : ''}
                    <div class="recent-message-content">
                        <p class="recent-message-text">${Utils.escapeHtml(Utils.truncateText(plain, 60))}</p>
                        <span class="recent-message-time">${Utils.formatDate(msg.createdAt)} às ${Utils.formatTime(msg.createdAt)}</span>
                    </div>
                    ${msg.isTask ? `<i class="fas fa-check-square task-icon ${msg.taskCompleted ? 'completed' : ''}"></i>` : ''}
                </div>
            `;
        });

        DOM.recentMessages.innerHTML = html;

        DOM.recentMessages.querySelectorAll('.recent-message-item').forEach((el) => {
            el.addEventListener('click', () => {
                this.navigateTo('chat');
            });
        });
    },

    renderUpcomingTasks(tasks) {
        if (tasks.length === 0) {
            DOM.upcomingTasks.innerHTML = '<p class="text-muted">Nenhuma tarefa agendada</p>';
            return;
        }

        let html = '';
        tasks.forEach(task => {
            const isOverdue = Utils.isTaskOverdue(task.taskDate, task.taskTime, task.taskCompleted);
            const plain = RichText.plainTextFromStored(task.text);
            html += `
                <div class="upcoming-task-item ${isOverdue ? 'overdue' : ''}" data-task-id="${task.id}">
                    <div class="task-checkbox ${task.taskCompleted ? 'completed' : ''}" data-task-id="${task.id}">
                        ${task.taskCompleted ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="upcoming-task-content">
                        <p class="upcoming-task-text">${Utils.escapeHtml(Utils.truncateText(plain, 50))}</p>
                        <span class="upcoming-task-date">
                            <i class="fas fa-calendar"></i> ${Utils.formatFullDate(task.taskDate)}
                            ${task.taskTime ? `<i class="fas fa-clock"></i> ${task.taskTime}` : ''}
                        </span>
                    </div>
                </div>
            `;
        });

        DOM.upcomingTasks.innerHTML = html;

        DOM.upcomingTasks.querySelectorAll('.task-checkbox').forEach((checkbox) => {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTask(checkbox.dataset.taskId);
            });
        });

        DOM.upcomingTasks.querySelectorAll('.upcoming-task-item').forEach((item) => {
            item.addEventListener('click', () => {
                this.openEditMessageModal(item.dataset.taskId);
            });
        });
    },

    // Admin functions
    async loadAdminData() {
        if (!AppState.user || AppState.user.role !== 'admin') {
            DOM.adminSection.style.display = 'none';
            return;
        }

        DOM.adminSection.style.display = 'block';
        await Promise.all([this.loadPendingUsers(), this.loadAllUsers()]);
    },

    async loadPendingUsers() {
        try {
            const response = await fetch('/api/auth/admin/pending-users');
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            DOM.pendingCount.textContent = data.users.length;
            
            if (data.users.length === 0) {
                DOM.pendingUsersList.innerHTML = `
                    <div class="admin-empty">
                        <i class="fas fa-check-circle"></i>
                        <p>Nenhum usuário pendente</p>
                    </div>
                `;
                return;
            }

            let html = '';
            data.users.forEach(user => {
                html += `
                    <div class="admin-user-item" data-id="${user.id}">
                        <div class="admin-user-info">
                            <div class="admin-user-name">${Utils.escapeHtml(user.name)}</div>
                            <div class="admin-user-email">${Utils.escapeHtml(user.email)}</div>
                            <div class="admin-user-date">${Utils.formatDate(user.createdAt)}</div>
                        </div>
                        <div class="admin-user-actions">
                            <button class="admin-btn approve" data-action="approve" data-user-id="${user.id}" title="Aprovar">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="admin-btn reject" data-action="delete" data-user-id="${user.id}" title="Rejeitar">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            DOM.pendingUsersList.innerHTML = html;

            DOM.pendingUsersList.querySelectorAll('button[data-action][data-user-id]').forEach((btn) => {
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const userId = btn.dataset.userId;
                    if (!userId) return;

                    if (btn.dataset.action === 'approve') {
                        await this.approveUser(userId);
                    } else if (btn.dataset.action === 'delete') {
                        await this.deleteUser(userId);
                    }
                });
            });
        } catch (error) {
            console.error('Load pending users error:', error);
        }
    },

    async loadAllUsers() {
        try {
            const response = await fetch('/api/auth/admin/users');
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            let html = '';
            data.users.forEach(user => {
                const isCurrentUser = user.id === AppState.user.id;
                const isAdmin = user.role === 'admin';
                
                html += `
                    <div class="admin-user-item" data-id="${user.id}">
                        <div class="admin-user-info">
                            <div class="admin-user-name">
                                ${Utils.escapeHtml(user.name)}
                                ${isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
                                ${!user.approved ? '<span class="admin-badge" style="background:var(--warning)">PENDENTE</span>' : ''}
                            </div>
                            <div class="admin-user-email">${Utils.escapeHtml(user.email)}</div>
                            <div class="admin-user-date">${user._count.messages} ideias</div>
                        </div>
                        ${!isCurrentUser ? `
                            <div class="admin-user-actions">
                                <button class="admin-btn toggle-admin" data-action="toggle-role" data-user-id="${user.id}" title="${isAdmin ? 'Remover admin' : 'Tornar admin'}">
                                    <i class="fas fa-crown"></i>
                                </button>
                                <button class="admin-btn" data-action="reset-password" data-user-id="${user.id}" title="Resetar senha">
                                    <i class="fas fa-key"></i>
                                </button>
                                <button class="admin-btn reject" data-action="delete" data-user-id="${user.id}" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            DOM.allUsersList.innerHTML = html;

            DOM.allUsersList.querySelectorAll('button[data-action][data-user-id]').forEach((btn) => {
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const userId = btn.dataset.userId;
                    if (!userId) return;

                    if (btn.dataset.action === 'toggle-role') {
                        await this.toggleUserRole(userId);
                    } else if (btn.dataset.action === 'reset-password') {
                        await this.resetUserPassword(userId);
                    } else if (btn.dataset.action === 'delete') {
                        await this.deleteUser(userId);
                    }
                });
            });
        } catch (error) {
            console.error('Load users error:', error);
        }
    },

    async approveUser(userId) {
        try {
            await API.request(`/auth/admin/approve/${userId}`, {
                method: 'POST'
            });

            showToast('Usuário aprovado!');
            await this.loadAdminData();
        } catch (error) {
            showToast(error.message || 'Erro ao aprovar usuário');
        }
    },

    async deleteUser(userId) {
        const ok = await SystemDialog.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.', {
            title: 'Excluir usuário',
            okText: 'Excluir',
            danger: true
        });
        if (!ok) {
            return;
        }

        try {
            await API.request(`/auth/admin/users/${userId}`, {
                method: 'DELETE'
            });

            showToast('Usuário removido!');
            await this.loadAdminData();
        } catch (error) {
            showToast(error.message || 'Erro ao excluir usuário');
        }
    },

    async toggleUserRole(userId) {
        try {
            const data = await API.request(`/auth/admin/toggle-role/${userId}`, {
                method: 'POST'
            });

            showToast(`Cargo alterado para ${data.user.role === 'admin' ? 'administrador' : 'usuário'}!`);
            await this.loadAdminData();
        } catch (error) {
            showToast(error.message || 'Erro ao alterar cargo');
        }
    },

    async syncCategoryColors() {
        if (!AppState.user || AppState.user.role !== 'admin') {
            showToast('Apenas administradores.');
            return;
        }

        const ok = await SystemDialog.confirm('Sincronizar cores de todas as categorias com suas seções?', {
            title: 'Confirmar ação',
            okText: 'Sincronizar',
            cancelText: 'Cancelar'
        });
        if (!ok) {
            return;
        }

        try {
            if (DOM.syncColorsOutput) {
                DOM.syncColorsOutput.textContent = 'Executando...';
            }

            const data = await API.request('/auth/admin/sync-category-colors', {
                method: 'POST',
                body: {}
            });

            const output = data.output || '(sem saída)';
            if (DOM.syncColorsOutput) {
                DOM.syncColorsOutput.textContent = output;
            }
            showToast('Cores sincronizadas!');
            // Reload categories to reflect changes
            await this.refreshCategories();
        } catch (error) {
            const msg = error?.message || 'Erro ao sincronizar cores';
            showToast(msg);
            if (DOM.syncColorsOutput) {
                DOM.syncColorsOutput.textContent = `Erro: ${msg}`;
            }
        }
    },

    async resetUserPassword(userId) {
        const ok = await SystemDialog.confirm('Resetar a senha deste usuário? Uma senha temporária será gerada e exibida uma única vez.', {
            title: 'Resetar senha',
            okText: 'Resetar',
            danger: true
        });
        if (!ok) {
            return;
        }

        try {
            const data = await API.request(`/auth/admin/reset-password/${userId}`, {
                method: 'POST',
                body: {}
            });

            if (data.temporaryPassword) {
                await SystemDialog.prompt('Senha temporária (copie e envie ao usuário):', {
                    title: 'Senha temporária',
                    defaultValue: data.temporaryPassword,
                    readOnly: true,
                    showCopy: true,
                    okText: 'Fechar',
                    cancelText: null
                });
            }
            showToast('Senha redefinida!');
            await this.loadAdminData();
        } catch (error) {
            showToast(error.message || 'Erro ao redefinir senha');
        }
    },

    // Render messages
    renderMessages(messages = null, container = DOM.messagesContainer) {
        const messagesToRender = messages || this.getFilteredMessages();

        const isMainChat = container === DOM.messagesContainer;
        const prevGapFromBottom = isMainChat ? this.getScrollGapFromBottom(container) : 0;
        const shouldStick = isMainChat ? AppState.chatStickToBottom : false;

        if (messagesToRender.length === 0) {
            const hasSearch = !!(AppState.searchQuery || AppState.searchCategory || AppState.searchDate);
            if (container === DOM.messagesContainer) {
                if (hasSearch) {
                    // §7.8 — search-specific empty state with the query echoed back
                    const q = AppState.searchQuery || '';
                    container.innerHTML = '<div class="empty-state feed-empty">'
                        + '<h2 class="feed-empty__title">Nenhum resultado' + (q ? ' para <em>' + Utils.escapeHtml(q) + '</em>' : '') + '.</h2>'
                        + '<button type="button" class="feed-empty__cta" id="clearSearchInline">Limpar busca</button>'
                        + '</div>';
                    const clr = container.querySelector('#clearSearchInline');
                    if (clr) clr.addEventListener('click', () => {
                        if (typeof clearSearch === 'function') clearSearch();
                    });
                } else {
                    DOM.emptyState.style.display = 'flex';
                    container.innerHTML = '';
                    container.appendChild(DOM.emptyState);
                }
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h2>Nenhuma mensagem</h2>
                        <p>Esta categoria ainda não tem mensagens</p>
                    </div>
                `;
            }
            return;
        }

        if (container === DOM.messagesContainer) {
            DOM.emptyState.style.display = 'none';
        }

        // Group messages by date
        const groupedMessages = this.groupMessagesByDate(messagesToRender);

        let html = '';

        for (const [date, msgs] of Object.entries(groupedMessages)) {
            html += `<div class="date-separator"><span>${date}</span></div>`;

            msgs.forEach(msg => {
                html += this.renderMessageBubble(msg);
            });
        }

        container.innerHTML = html;

        // Hydrate mind maps
        MindMapUI.hydrateEmbeds(container);

        // WhatsApp-like scroll behavior:
        // - If user is anchored at the bottom, keep following the bottom.
        // - Otherwise, preserve the current viewport by keeping the same gap from bottom.
        if (isMainChat) {
            requestAnimationFrame(() => {
                if (shouldStick) {
                    this.scrollToBottomImmediate(container);
                    AppState.chatUnreadBelow = 0;
                } else {
                    const nextTop = container.scrollHeight - container.clientHeight - prevGapFromBottom;
                    container.scrollTop = Math.max(0, nextTop);
                }

                // Recompute stickiness after layout settles.
                AppState.chatStickToBottom = this.isNearBottom(container);
                if (AppState.chatStickToBottom) AppState.chatUnreadBelow = 0;
                this.updateJumpToBottomUI();
            });
        }

        // Add event listeners
        this.attachMessageEventListeners(container);

        // S4 — Inject weekly summary banner on Mondays (Inbox only)
        if (container === DOM.messagesContainer) {
            this.renderWeeklySummaryBanner();
        }
    },

    renderMessageBubble(msg) {
        const isOverdue = Utils.isTaskOverdue(msg.taskDate, msg.taskTime, msg.taskCompleted);

        let classNames = ['message'];
        if (msg.isTask && msg.taskCompleted) classNames.push('task-completed');
        if (isOverdue) classNames.push('task-overdue');

        let html = `<div class="${classNames.join(' ')}" data-id="${msg.id}">`;

        // Category badge
        if (msg.category) {
            html += `<span class="message-category" style="background: ${Utils.sanitizeCssColor(msg.category.color)}">${Utils.escapeHtml(msg.category.name)}</span>`;
        }

        // Images
        if (msg.images && msg.images.length > 0) {
            html += '<div class="message-images">';
            msg.images.forEach(img => {
                const safeImg = Utils.sanitizeImageSrc(img);
                if (!safeImg) return;
                html += `<img src="${safeImg}" class="message-image" data-img="${encodeURIComponent(safeImg)}" alt="Imagem anexada">`;
            });
            html += '</div>';
        }

        // Message text
        if (msg.text) {
            html += `<div class="message-text">${RichText.renderMessage(msg.text)}</div>`;
        }

        // Task section
        if (msg.isTask) {
            const taskDateFormatted = msg.taskDate ? Utils.formatFullDate(msg.taskDate) : '';
            html += `
                <div class="message-task">
                    <div class="task-checkbox ${msg.taskCompleted ? 'completed' : ''}" data-id="${msg.id}">
                        ${msg.taskCompleted ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="task-info">
                        <div class="task-label">${msg.taskCompleted ? 'Concluída' : 'Tarefa pendente'}</div>
                        ${msg.taskDate ? `
                            <div class="task-datetime">
                                <span><i class="fas fa-calendar"></i> ${taskDateFormatted}</span>
                                ${msg.taskTime ? `<span><i class="fas fa-clock"></i> ${msg.taskTime}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        // Footer with time
        html += `
            <div class="message-footer">
                <span class="message-time">${Utils.formatTime(msg.createdAt)}</span>
            </div>
        `;

        html += '</div>';

        return html;
    },

    attachMessageEventListeners(container) {
        // Image viewer (no inline onclick)
        container.querySelectorAll('.message-image').forEach(imgEl => {
            imgEl.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const encoded = imgEl.getAttribute('data-img') || '';
                let src = encoded;
                try {
                    src = decodeURIComponent(encoded);
                } catch {
                    src = encoded;
                }
                const safe = Utils.sanitizeImageSrc(src);
                if (!safe) return;
                App.openImageViewer(safe);
            });
        });

        // Mind map open button
        const openMindMapFromEmbed = (embed, e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (!embed) return;
            const encoded = embed.getAttribute('data-mindmap') || '';
            let jsonRaw = encoded;
            try {
                jsonRaw = decodeURIComponent(encoded);
            } catch {
                jsonRaw = encoded;
            }
            MindMapUI.openViewerFromJson(jsonRaw);
        };

        container.querySelectorAll('.mindmap-embed-open').forEach(btn => {
            btn.addEventListener('click', (e) => {
                openMindMapFromEmbed(btn.closest('.mindmap-embed'), e);
            });
        });

        container.querySelectorAll('.mindmap-embed-canvas').forEach(canvas => {
            canvas.addEventListener('click', (e) => {
                openMindMapFromEmbed(canvas.closest('.mindmap-embed'), e);
            });
        });

        // Task checkboxes
        container.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = checkbox.dataset.id || checkbox.closest('.message').dataset.id;
                this.toggleTask(messageId);
            });
        });

        // Message click (edit)
        container.querySelectorAll('.message').forEach(message => {
            message.addEventListener('click', (e) => {
                // Don't open edit when clicking on collapsible sections (details/summary)
                if (e.target.closest('details') || e.target.closest('summary')) {
                    return;
                }
                // Suppress click that follows a swipe gesture (S2 / F5)
                if (typeof Swipe !== 'undefined' && Swipe.suppressed(message)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                this.openEditMessageModal(message.dataset.id);
            });

            // Context menu (long press)
            let pressTimer;
            message.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    this.showContextMenu(e, message.dataset.id);
                }, 500);
            });

            message.addEventListener('touchend', () => clearTimeout(pressTimer));
            message.addEventListener('touchmove', () => clearTimeout(pressTimer));

            message.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, message.dataset.id);
            });

            // Swipe gestures (S2/F5 + S6 archive) — mobile-only by default
            if (typeof Swipe !== 'undefined') {
                Swipe.attach(message, {
                    onRight: () => App.handleSwipeRight(message.dataset.id),
                    onLeft:  () => App.handleSwipeLeft(message.dataset.id),
                });
            }
        });
    },

    // Swipe-left handler (S6 / F5) — archive with undo
    async handleSwipeLeft(messageId) {
        const msg = AppState.messages.find(m => m.id === messageId);
        if (!msg) return;
        try {
            const { message: updated } = await API.messages.archive(messageId);
            AppState.messages = AppState.messages.filter(m => m.id !== messageId);
            this.renderMessages();
            if (window.Toast) {
                Toast.show('Arquivada', {
                    type: 'info',
                    action: {
                        label: 'Desfazer',
                        onClick: async () => {
                            try {
                                const { message: reverted } = await API.messages.archive(messageId);
                                AppState.messages.push(reverted);
                                this.renderMessages();
                            } catch (err) {
                                Toast.error('Não foi possível restaurar');
                            }
                        }
                    }
                });
            }
        } catch (err) {
            if (window.Toast) Toast.error(err && err.message ? err.message : 'Erro ao arquivar');
        }
    },

    // Swipe-right handler (S2 / F5)
    async handleSwipeRight(messageId) {
        const msg = AppState.messages.find(m => m.id === messageId);
        if (!msg) return;

        try {
            if (msg.isTask) {
                // Toggle done <-> pending
                const wasCompleted = !!msg.taskCompleted;
                const { message: updated } = await API.messages.toggle(messageId);
                const idx = AppState.messages.findIndex(m => m.id === messageId);
                if (idx !== -1) AppState.messages[idx] = updated;
                this.renderMessages();
                if (window.Toast) {
                    Toast.show(wasCompleted ? 'Tarefa reaberta' : 'Concluída', {
                        type: 'success',
                        action: {
                            label: 'Desfazer',
                            onClick: async () => {
                                try {
                                    const { message: reverted } = await API.messages.toggle(messageId);
                                    const j = AppState.messages.findIndex(m => m.id === messageId);
                                    if (j !== -1) AppState.messages[j] = reverted;
                                    this.renderMessages();
                                } catch (err) {
                                    Toast.error('Não foi possível desfazer');
                                }
                            }
                        }
                    });
                }
            } else {
                // Convert note → task (no due date by default)
                const { message: updated } = await API.messages.update(messageId, {
                    text: msg.text,
                    categoryId: msg.categoryId || null,
                    isTask: true,
                    taskDate: null,
                    taskTime: null
                });
                const idx = AppState.messages.findIndex(m => m.id === messageId);
                if (idx !== -1) AppState.messages[idx] = updated;
                this.renderMessages();
                if (window.Toast) {
                    Toast.show('Virou tarefa', {
                        type: 'success',
                        action: {
                            label: 'Desfazer',
                            onClick: async () => {
                                try {
                                    const { message: reverted } = await API.messages.update(messageId, {
                                        text: msg.text,
                                        categoryId: msg.categoryId || null,
                                        isTask: false,
                                        taskDate: null,
                                        taskTime: null
                                    });
                                    const j = AppState.messages.findIndex(m => m.id === messageId);
                                    if (j !== -1) AppState.messages[j] = reverted;
                                    this.renderMessages();
                                } catch (err) {
                                    Toast.error('Não foi possível desfazer');
                                }
                            }
                        }
                    });
                }
            }
        } catch (err) {
            if (window.Toast) Toast.error(err && err.message ? err.message : 'Erro ao atualizar');
        }
    },

    groupMessagesByDate(messages) {
        const groups = {};

        messages.forEach(msg => {
            const dateKey = Utils.formatDate(msg.createdAt);
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(msg);
        });

        return groups;
    },

    getFilteredMessages() {
        let messages = [...AppState.messages];

        // Sort by date (newest last)
        messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Apply search filters
        if (AppState.searchQuery) {
            const query = AppState.searchQuery.toLowerCase();
            messages = messages.filter(m => {
                return m.text.toLowerCase().includes(query) ||
                    (m.category && m.category.name.toLowerCase().includes(query));
            });
        }

        if (AppState.searchCategory) {
            messages = messages.filter(m => m.categoryId === AppState.searchCategory);
        }

        if (AppState.searchDate) {
            messages = messages.filter(m => {
                const msgDate = new Date(m.createdAt).toISOString().split('T')[0];
                return msgDate === AppState.searchDate;
            });
        }

        return messages;
    },

    scrollToBottom() {
        // Backwards-compatible wrapper (some parts may still call this).
        setTimeout(() => {
            this.scrollToBottomImmediate(DOM.messagesContainer);
        }, 0);
    },

    // Get collapsed sections state from localStorage
    getCollapsedSections() {
        try {
            const saved = localStorage.getItem('savit_collapsed_sections');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    },

    // Save collapsed sections state to localStorage
    setCollapsedSections(state) {
        try {
            localStorage.setItem('savit_collapsed_sections', JSON.stringify(state));
        } catch {
            // ignore
        }
    },

    // Toggle section collapsed state
    toggleSectionCollapse(sectionId) {
        const state = this.getCollapsedSections();
        state[sectionId] = !state[sectionId];
        this.setCollapsedSections(state);
    },

    // Render categories
    renderCategories() {
        const categories = Array.isArray(AppState.categories) ? [...AppState.categories] : [];
        const sections = Array.isArray(AppState.categorySections) ? [...AppState.categorySections] : [];

        const sortedCategories = categories.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR'));
        const sortedSections = sections.sort((a, b) => {
            if (AppState.sectionSortMode === 'alpha') {
                return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
            }
            const pa = Number(a.position ?? 0);
            const pb = Number(b.position ?? 0);
            if (pa !== pb) return pa - pb;
            return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
        });

        if (sortedCategories.length === 0 && sortedSections.length === 0) {
            DOM.categoriesList.innerHTML = `
                <div class="empty-state small">
                    <i class="fas fa-folder-open"></i>
                    <h3>Nenhuma categoria</h3>
                    <p>Crie sua primeira categoria</p>
                </div>
            `;
            return;
        }

        const bySection = new Map();
        for (const cat of sortedCategories) {
            const key = cat.sectionId || '';
            if (!bySection.has(key)) bySection.set(key, []);
            bySection.get(key).push(cat);
        }

        const renderCategoryItem = (cat) => {
            return `
                <div class="category-item" data-id="${cat.id}">
                    <div class="category-color" style="background: ${Utils.sanitizeCssColor(cat.color)}">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="category-info">
                        <div class="category-name">${Utils.escapeHtml(cat.name)}</div>
                        <div class="category-count">${cat.messageCount} ${cat.messageCount === 1 ? 'mensagem' : 'mensagens'}</div>
                    </div>
                    <div class="category-actions">
                        <button class="move-category" title="Mover para seção">
                            <i class="fas fa-layer-group"></i>
                        </button>
                        <button class="edit-category" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete delete-category" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        };

        let html = '';

        const collapsedState = this.getCollapsedSections();

        const unsectioned = bySection.get('') || [];
        if (unsectioned.length > 0) {
            const isOpen = !collapsedState['unsectioned'];
            html += `
                <details class="category-section" data-section-id="" ${isOpen ? 'open' : ''}>
                    <summary class="category-section-header">
                        <div class="category-section-toggle"><i class="fas fa-chevron-right"></i></div>
                        <div class="category-section-title">Sem seção</div>
                        <div class="category-section-meta">${unsectioned.length}</div>
                    </summary>
                    <div class="category-section-body">
                        ${unsectioned.map(renderCategoryItem).join('')}
                    </div>
                </details>
            `;
        }

        for (const section of sortedSections) {
            const list = bySection.get(section.id) || [];
            const canReorder = AppState.sectionSortMode === 'manual';
            const isOpen = !collapsedState[section.id];
            html += `
                <details class="category-section" data-section-id="${section.id}" ${isOpen ? 'open' : ''}>
                    <summary class="category-section-header">
                        <div class="category-section-toggle"><i class="fas fa-chevron-right"></i></div>
                        <div class="category-section-title">${Utils.escapeHtml(section.name)}</div>
                        <div class="category-section-actions">
                            ${canReorder ? `<button class="section-btn section-up" data-id="${section.id}" title="Subir"><i class="fas fa-chevron-up"></i></button>` : ''}
                            ${canReorder ? `<button class="section-btn section-down" data-id="${section.id}" title="Descer"><i class="fas fa-chevron-down"></i></button>` : ''}
                            <button class="section-btn section-edit" data-id="${section.id}" title="Renomear"><i class="fas fa-edit"></i></button>
                            <button class="section-btn section-delete" data-id="${section.id}" title="Excluir"><i class="fas fa-trash"></i></button>
                            <span class="category-section-meta">${list.length}</span>
                        </div>
                    </summary>
                    <div class="category-section-body">
                        ${list.length ? list.map(renderCategoryItem).join('') : `<div class="category-section-empty">Sem categorias nesta seção</div>`}
                    </div>
                </details>
            `;
        }

        DOM.categoriesList.innerHTML = html;

        // Toggle collapse state handlers
        DOM.categoriesList.querySelectorAll('.category-section').forEach(section => {
            section.addEventListener('toggle', () => {
                const sectionId = section.dataset.sectionId || 'unsectioned';
                const state = this.getCollapsedSections();
                state[sectionId] = !section.open;
                this.setCollapsedSections(state);
            });
        });

        // Category item handlers
        DOM.categoriesList.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.category-actions')) {
                    this.openCategoryMessages(item.dataset.id);
                }
            });

            const moveBtn = item.querySelector('.move-category');
            moveBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openMoveCategoryModal(item.dataset.id);
            });

            item.querySelector('.edit-category')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditCategoryModal(item.dataset.id);
            });

            item.querySelector('.delete-category')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCategory(item.dataset.id);
            });
        });

        // Section handlers
        DOM.categoriesList.querySelectorAll('.section-up').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.moveSection(btn.dataset.id, -1);
            });
        });
        DOM.categoriesList.querySelectorAll('.section-down').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.moveSection(btn.dataset.id, +1);
            });
        });
        DOM.categoriesList.querySelectorAll('.section-edit').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.renameSection(btn.dataset.id);
            });
        });
        DOM.categoriesList.querySelectorAll('.section-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.deleteSection(btn.dataset.id);
            });
        });
    },

    renderCategoryDropdowns() {
        const categories = AppState.categories;

        // Build <option> via DOM APIs for native selects (search filter)
        const setOptions = (selectEl, firstLabel) => {
            if (!selectEl) return;
            selectEl.innerHTML = '';
            const first = document.createElement('option');
            first.value = '';
            first.textContent = firstLabel;
            selectEl.appendChild(first);
            categories.forEach((cat) => {
                const opt = document.createElement('option');
                opt.value = String(cat.id || '');
                opt.textContent = String(cat.name || '');
                selectEl.appendChild(opt);
            });
        };

        setOptions(DOM.searchCategoryFilter, 'Todas categorias');

        // Render custom dropdowns with colors
        this.renderCustomCategoryDropdown(
            DOM.editMessageCategoryDropdown,
            DOM.editMessageCategoryTrigger,
            DOM.editMessageCategoryMenu,
            DOM.editMessageCategory,
            'Sem categoria'
        );
        this.renderCustomCategoryDropdown(
            DOM.quickAddCategoryDropdown,
            DOM.quickAddCategoryTrigger,
            DOM.quickAddCategoryMenu,
            DOM.quickAddCategory,
            'Sem categoria'
        );

        // Category selector modal
        this.renderCategorySelector();
    },

    renderCustomCategoryDropdown(dropdown, trigger, menu, hiddenInput, placeholder) {
        if (!dropdown || !trigger || !menu || !hiddenInput) return;

        const categories = AppState.categories;

        // Build menu options
        let html = `
            <div class="category-dropdown-option" data-value="">
                <span class="option-color no-category"><i class="fas fa-ban" style="font-size: 10px;"></i></span>
                <span class="option-name">${Utils.escapeHtml(placeholder)}</span>
            </div>
        `;

        categories.forEach(cat => {
            const msgCount = AppState.messages.filter(m => m.categoryId === cat.id).length;
            html += `
                <div class="category-dropdown-option" data-value="${cat.id}">
                    <span class="option-color" style="background: ${Utils.sanitizeCssColor(cat.color)}">
                        <i class="fas fa-folder"></i>
                    </span>
                    <span class="option-name">${Utils.escapeHtml(cat.name)}</span>
                    ${msgCount > 0 ? `<span class="option-count">${msgCount}</span>` : ''}
                </div>
            `;
        });

        menu.innerHTML = html;

        // Update trigger display based on current value
        this.updateCategoryDropdownDisplay(trigger, hiddenInput.value, placeholder);

        // Remove old event listeners by cloning
        const newTrigger = trigger.cloneNode(true);
        trigger.parentNode.replaceChild(newTrigger, trigger);

        // Re-assign the trigger reference
        if (dropdown.id === 'editMessageCategoryDropdown') {
            DOM.editMessageCategoryTrigger = newTrigger;
        } else if (dropdown.id === 'quickAddCategoryDropdown') {
            DOM.quickAddCategoryTrigger = newTrigger;
        }

        // Toggle dropdown
        newTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            // Close all other dropdowns
            document.querySelectorAll('.category-dropdown.open').forEach(d => d.classList.remove('open'));
            if (!isOpen) {
                dropdown.classList.add('open');
            }
        });

        // Handle option selection
        menu.querySelectorAll('.category-dropdown-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = opt.dataset.value;
                hiddenInput.value = value;
                this.updateCategoryDropdownDisplay(newTrigger, value, placeholder);
                dropdown.classList.remove('open');

                // Mark selected
                menu.querySelectorAll('.category-dropdown-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });
    },

    updateCategoryDropdownDisplay(trigger, value, placeholder) {
        const colorSpan = trigger.querySelector('.category-dropdown-color');
        const textSpan = trigger.querySelector('.category-dropdown-text');

        if (!value) {
            colorSpan.style.background = 'var(--text-muted)';
            textSpan.textContent = placeholder;
        } else {
            const cat = AppState.categories.find(c => c.id === value);
            if (cat) {
                colorSpan.style.background = Utils.sanitizeCssColor(cat.color);
                textSpan.textContent = cat.name;
            } else {
                colorSpan.style.background = 'var(--text-muted)';
                textSpan.textContent = placeholder;
            }
        }
    },

    renderCategorySectionSelect(selectedSectionId = '') {
        // For hidden input (keeps compatibility)
        if (DOM.categorySectionSelect) {
            DOM.categorySectionSelect.value = selectedSectionId || '';
        }

        // Render custom dropdown for category modal
        this.renderCustomSectionDropdown(
            DOM.categorySectionDropdown,
            DOM.categorySectionTrigger,
            DOM.categorySectionMenu,
            DOM.categorySectionSelect,
            'Sem seção',
            selectedSectionId
        );

        // Render custom dropdown for move category modal
        this.renderCustomSectionDropdown(
            DOM.moveCategorySectionDropdown,
            DOM.moveCategorySectionTrigger,
            DOM.moveCategorySectionMenu,
            DOM.moveCategorySectionSelect,
            'Sem seção',
            selectedSectionId
        );
    },

    renderCustomSectionDropdown(dropdown, trigger, menu, hiddenInput, placeholder, selectedValue = '') {
        if (!dropdown || !trigger || !menu || !hiddenInput) return;

        const sections = Array.isArray(AppState.categorySections) ? [...AppState.categorySections] : [];
        sections.sort((a, b) => {
            const pa = Number(a.position ?? 0);
            const pb = Number(b.position ?? 0);
            if (pa !== pb) return pa - pb;
            return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
        });

        // Build menu options
        let html = `
            <div class="category-dropdown-option" data-value="" data-color="">
                <span class="option-color no-category"><i class="fas fa-ban" style="font-size: 10px;"></i></span>
                <span class="option-name">${Utils.escapeHtml(placeholder)}</span>
            </div>
        `;

        sections.forEach(section => {
            const catCount = AppState.categories.filter(c => c.sectionId === section.id).length;
            html += `
                <div class="category-dropdown-option" data-value="${section.id}" data-color="${Utils.sanitizeCssColor(section.color)}">
                    <span class="option-color" style="background: ${Utils.sanitizeCssColor(section.color)}">
                        <i class="fas fa-layer-group"></i>
                    </span>
                    <span class="option-name">${Utils.escapeHtml(section.name)}</span>
                    ${catCount > 0 ? `<span class="option-count">${catCount}</span>` : ''}
                </div>
            `;
        });

        menu.innerHTML = html;

        // Set hidden input value
        hiddenInput.value = selectedValue || '';

        // Update trigger display
        this.updateSectionDropdownDisplay(trigger, selectedValue, placeholder);

        // Mark selected
        menu.querySelectorAll('.category-dropdown-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === (selectedValue || ''));
        });

        // Remove old event listeners by cloning
        const newTrigger = trigger.cloneNode(true);
        trigger.parentNode.replaceChild(newTrigger, trigger);

        // Re-assign the trigger reference
        if (dropdown.id === 'categorySectionDropdown') {
            DOM.categorySectionTrigger = newTrigger;
        } else if (dropdown.id === 'moveCategorySectionDropdown') {
            DOM.moveCategorySectionTrigger = newTrigger;
        }

        // Toggle dropdown
        newTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            // Close all other dropdowns
            document.querySelectorAll('.category-dropdown.open').forEach(d => d.classList.remove('open'));
            if (!isOpen) {
                dropdown.classList.add('open');
            }
        });

        // Handle option selection
        menu.querySelectorAll('.category-dropdown-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = opt.dataset.value;
                hiddenInput.value = value;
                this.updateSectionDropdownDisplay(newTrigger, value, placeholder);
                dropdown.classList.remove('open');

                // Mark selected
                menu.querySelectorAll('.category-dropdown-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });
    },

    updateSectionDropdownDisplay(trigger, value, placeholder) {
        if (!trigger) return;
        const colorSpan = trigger.querySelector('.category-dropdown-color');
        const textSpan = trigger.querySelector('.category-dropdown-text');
        if (!colorSpan || !textSpan) return;

        if (!value) {
            colorSpan.style.background = 'var(--text-muted)';
            textSpan.textContent = placeholder;
        } else {
            const section = AppState.categorySections.find(s => s.id === value);
            if (section) {
                colorSpan.style.background = Utils.sanitizeCssColor(section.color);
                textSpan.textContent = section.name;
            } else {
                colorSpan.style.background = 'var(--text-muted)';
                textSpan.textContent = placeholder;
            }
        }
    },

    renderCategorySelector() {
        const categories = AppState.categories;

        let html = '';

        categories.forEach(cat => {
            html += `
                <div class="category-selector-item" data-id="${cat.id}">
                    <div class="category-color" style="background: ${Utils.sanitizeCssColor(cat.color)}">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="category-name">${Utils.escapeHtml(cat.name)}</div>
                </div>
            `;
        });

        if (categories.length === 0) {
            html = `
                <div class="empty-state small">
                    <p>Nenhuma categoria disponível</p>
                </div>
            `;
        }

        DOM.categorySelectorList.innerHTML = html;

        // Add event listeners
        DOM.categorySelectorList.querySelectorAll('.category-selector-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectCategory(item.dataset.id);
                closeModal(DOM.categorySelectorModal);
            });
        });
    },

    // Kanban
    renderKanban() {
        // S3: render mobile grouped list and focus card alongside the desktop board
        this.renderTaskListMobile();
        this.renderFocusCard();
        // S6: render calendar (only visible when view-toggle is on calendar)
        this.renderTaskCalendar();

        const search = AppState.kanbanSearch.toLowerCase();
        const categoryFilter = AppState.kanbanCategory;

        // Get all tasks
        let tasks = AppState.messages.filter(m => m.isTask);

        // Apply filters
        if (search) {
            tasks = tasks.filter(t => t.text.toLowerCase().includes(search));
        }
        if (categoryFilter) {
            tasks = tasks.filter(t => t.categoryId === categoryFilter);
        }

        // Separate by status
        const pending = tasks.filter(t => !t.taskCompleted);
        const completed = tasks.filter(t => t.taskCompleted);

        // Update counts
        DOM.kanbanPendingCount.textContent = pending.length;
        DOM.kanbanCompletedCount.textContent = completed.length;

        // Render pending
        if (pending.length === 0) {
            DOM.kanbanPending.innerHTML = `
                <div class="kanban-empty">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Nenhuma tarefa pendente</p>
                </div>
            `;
        } else {
            DOM.kanbanPending.innerHTML = pending
                .sort((a, b) => {
                    // Sort by date (closest first)
                    if (a.taskDate && b.taskDate) return new Date(a.taskDate) - new Date(b.taskDate);
                    if (a.taskDate) return -1;
                    if (b.taskDate) return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                })
                .map(t => this.renderKanbanCard(t))
                .join('');
        }

        // Render completed
        if (completed.length === 0) {
            DOM.kanbanCompleted.innerHTML = `
                <div class="kanban-empty">
                    <i class="fas fa-check-circle"></i>
                    <p>Nenhuma tarefa concluída</p>
                </div>
            `;
        } else {
            DOM.kanbanCompleted.innerHTML = completed
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map(t => this.renderKanbanCard(t))
                .join('');
        }

        // Add event listeners
        document.querySelectorAll('.kanban-card-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = checkbox.closest('.kanban-card').dataset.id;
                this.toggleTaskComplete(id);
            });
        });

        document.querySelectorAll('.kanban-card').forEach(card => {
            card.addEventListener('click', () => {
                this.openEditMessageModal(card.dataset.id);
            });
        });

        // Update category filter options
        this.updateKanbanCategoryFilter();
    },

    renderKanbanCard(task) {
        const category = AppState.categories.find(c => c.id === task.categoryId);
        const isCompleted = task.taskCompleted;
        const plain = RichText.plainTextFromStored(task.text);
        
        let dateClass = '';
        let dateText = '';
        
        if (task.taskDate) {
            const taskDate = new Date(task.taskDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            taskDate.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((taskDate - today) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0 && !isCompleted) {
                dateClass = 'overdue';
                dateText = `Atrasada ${Math.abs(diffDays)} dia(s)`;
            } else if (diffDays === 0) {
                dateClass = 'today';
                dateText = 'Hoje';
            } else if (diffDays === 1) {
                dateText = 'Amanhã';
            } else {
                dateText = taskDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            }
            
            if (task.taskTime) {
                dateText += ` às ${task.taskTime}`;
            }
        }

        return `
            <div class="kanban-card ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
                <div class="kanban-card-header">
                    <div class="kanban-card-checkbox ${isCompleted ? 'checked' : ''}">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="kanban-card-text">${Utils.escapeHtml(plain)}</div>
                </div>
                ${category || dateText ? `
                    <div class="kanban-card-footer">
                        ${category ? `<span class="kanban-card-category" style="background: ${Utils.sanitizeCssColor(category.color)}">${Utils.escapeHtml(category.name)}</span>` : '<span></span>'}
                        ${dateText ? `<span class="kanban-card-date ${dateClass}"><i class="fas fa-calendar"></i> ${dateText}</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    },

    updateKanbanCategoryFilter() {
        const categories = AppState.categories;
        let html = '<option value="">Todos os temas</option>';
        
        categories.forEach(cat => {
            const selected = AppState.kanbanCategory === cat.id ? 'selected' : '';
            html += `<option value="${cat.id}" ${selected}>${Utils.escapeHtml(cat.name)}</option>`;
        });
        
        DOM.kanbanCategoryFilter.innerHTML = html;
    },

    async toggleTaskComplete(id) {
        try {
            const message = AppState.messages.find(m => m.id === id);
            if (!message) return;

            const { message: updated } = await API.messages.update(id, {
                taskCompleted: !message.taskCompleted
            });

            // Update in state
            const index = AppState.messages.findIndex(m => m.id === id);
            if (index !== -1) {
                AppState.messages[index] = updated;
            }

            this.renderKanban();
            this.renderMessages();
            this.refreshDashboard();
            
            showToast(updated.taskCompleted ? 'Tarefa concluída!' : 'Tarefa reaberta');
        } catch (error) {
            showToast(error.message);
        }
    },

    renderProfile() {
        if (AppState.user) {
            DOM.profileName.textContent = AppState.user.name;
            DOM.profileEmail.textContent = AppState.user.email;
        }
    },

    // Message operations
    async createMessage(text, categoryId, isTask, taskDate, taskTime, images = []) {
        try {
            const { message } = await API.messages.create({
                text,
                categoryId: categoryId || null,
                isTask: isTask || false,
                taskDate: taskDate || null,
                taskTime: taskTime || null,
                images: images || []
            });

            AppState.messages.push(message);
            this.renderMessages();
            showToast('Ideia salva!');
            return message;
        } catch (error) {
            showToast(error.message);
            throw error;
        }
    },

    async updateMessage(id) {
        try {
            const isWysiwyg = DOM.editMessageText?.isContentEditable && DOM.editMessageText.tagName !== 'TEXTAREA';
            const rawText = isWysiwyg ? RichText.getPlainText(DOM.editMessageText) : (DOM.editMessageText.value || '');
            const textForCheck = rawText.trim();
            if (!textForCheck) {
                showToast('Digite uma mensagem');
                return;
            }

            const { message } = await API.messages.update(id, {
                text: isWysiwyg ? RichText.getHtml(DOM.editMessageText) : rawText.trimEnd(),
                categoryId: DOM.editMessageCategory.value || null,
                isTask: DOM.editMessageIsTask.checked,
                taskDate: DOM.editMessageIsTask.checked ? DOM.editTaskDate.value : null,
                taskTime: DOM.editMessageIsTask.checked ? DOM.editTaskTime.value : null
            });

            // Update in state
            const index = AppState.messages.findIndex(m => m.id === id);
            if (index !== -1) {
                AppState.messages[index] = message;
            }

            this.renderMessages();

            // Update category messages if viewing
            if (AppState.viewingCategoryId) {
                this.renderCategoryMessagesView(AppState.viewingCategoryId);
            }

            showToast('Mensagem atualizada!');
        } catch (error) {
            showToast(error.message);
        }
    },

    async deleteMessage(id) {
        const ok = await SystemDialog.confirm('Tem certeza que deseja excluir esta mensagem?', {
            title: 'Excluir mensagem',
            okText: 'Excluir',
            danger: true
        });
        if (!ok) return;

        try {
            await API.messages.delete(id);

            AppState.messages = AppState.messages.filter(m => m.id !== id);
            this.renderMessages();
            this.refreshCategories();

            if (AppState.viewingCategoryId) {
                this.renderCategoryMessagesView(AppState.viewingCategoryId);
            }

            showToast('Mensagem excluída!');
        } catch (error) {
            showToast(error.message);
        }
    },

    async toggleTask(id) {
        try {
            const { message } = await API.messages.toggle(id);

            // Update in state
            const index = AppState.messages.findIndex(m => m.id === id);
            if (index !== -1) {
                AppState.messages[index] = message;
            }

            this.renderMessages();

            if (AppState.viewingCategoryId) {
                this.renderCategoryMessagesView(AppState.viewingCategoryId);
            }

            showToast(message.taskCompleted ? 'Tarefa concluída!' : 'Tarefa reaberta');
        } catch (error) {
            showToast(error.message);
        }
    },

    // Category operations
    // Legacy (kept for backward compatibility; UI uses openMoveCategoryModal now)
    async promptMoveCategory(categoryId) {
        const category = AppState.categories.find(c => c.id === categoryId);
        if (!category) return;

        // Use the themed modal UI (preferred path) instead of browser prompt.
        this.openMoveCategoryModal(categoryId);
    },

    async moveSection(sectionId, delta) {
        const sections = Array.isArray(AppState.categorySections) ? [...AppState.categorySections] : [];
        sections.sort((a, b) => {
            const pa = Number(a.position ?? 0);
            const pb = Number(b.position ?? 0);
            if (pa !== pb) return pa - pb;
            return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
        });

        const index = sections.findIndex(s => s.id === sectionId);
        if (index === -1) return;
        const nextIndex = index + delta;
        if (nextIndex < 0 || nextIndex >= sections.length) return;

        const reordered = [...sections];
        const tmp = reordered[index];
        reordered[index] = reordered[nextIndex];
        reordered[nextIndex] = tmp;

        const orderedIds = reordered.map(s => s.id);

        try {
            await API.categories.reorderSections(orderedIds);
            // optimistic update to avoid flicker
            AppState.categorySections = reordered.map((s, idx) => ({ ...s, position: idx }));
            this.renderCategories();
            this.renderCategorySectionSelect(DOM.categorySectionSelect?.value || '');
        } catch (error) {
            showToast(error.message);
        }
    },

    async renameSection(sectionId) {
        this.openRenameSectionModal(sectionId);
    },

    async deleteSection(sectionId) {
        this.openDeleteSectionModal(sectionId);
    },

    async createCategory() {
        const name = DOM.categoryName.value.trim();

        if (!name) {
            showToast('Digite um nome para o tema');
            return;
        }

        try {
            const sectionIdRaw = DOM.categorySectionSelect ? DOM.categorySectionSelect.value : '';
            const sectionId = sectionIdRaw ? sectionIdRaw : null;

            // Get color from selected section
            let color = '#25D366'; // default
            if (sectionId) {
                const section = AppState.categorySections.find(s => s.id === sectionId);
                if (section && section.color) {
                    color = section.color;
                }
            }

            await API.categories.create({
                name,
                color,
                sectionId
            });

            await this.refreshCategories();
            closeModal(DOM.categoryModal);
            resetCategoryModal();

            showToast('Tema criado!');
        } catch (error) {
            showToast(error.message);
        }
    },

    async updateCategory(id) {
        const name = DOM.categoryName.value.trim();

        if (!name) {
            showToast('Digite um nome para o tema');
            return;
        }

        try {
            const sectionIdRaw = DOM.categorySectionSelect ? DOM.categorySectionSelect.value : '';
            const sectionId = sectionIdRaw ? sectionIdRaw : null;

            // Get color from selected section
            let color = '#25D366'; // default
            if (sectionId) {
                const section = AppState.categorySections.find(s => s.id === sectionId);
                if (section && section.color) {
                    color = section.color;
                }
            }

            await API.categories.update(id, {
                name,
                color,
                sectionId
            });

            await this.refreshCategories();
            this.renderMessages();
            closeModal(DOM.categoryModal);
            resetCategoryModal();

            showToast('Tema atualizado!');
        } catch (error) {
            showToast(error.message);
        }
    },

    async deleteCategory(id) {
        const ok = await SystemDialog.confirm('Tem certeza que deseja excluir esta categoria? As mensagens não serão excluídas.', {
            title: 'Excluir categoria',
            okText: 'Excluir',
            danger: true
        });
        if (!ok) return;

        try {
            await API.categories.delete(id);

            AppState.categories = AppState.categories.filter(c => c.id !== id);

            // Update messages that had this category
            AppState.messages.forEach(msg => {
                if (msg.categoryId === id) {
                    msg.categoryId = null;
                    msg.category = null;
                }
            });

            this.renderCategories();
            this.renderCategoryDropdowns();
            this.renderMessages();

            showToast('Categoria excluída!');
        } catch (error) {
            showToast(error.message);
        }
    },

    selectCategory(id) {
        const category = AppState.categories.find(c => c.id === id);
        if (!category) return;

        AppState.selectedCategoryId = id;
        DOM.categoryBadge.textContent = category.name;
        DOM.categoryBadge.style.background = Utils.sanitizeCssColor(category.color);
        DOM.selectedCategory.style.display = 'flex';
        DOM.addCategoryBtn.classList.add('active');
    },

    clearSelectedCategory() {
        AppState.selectedCategoryId = null;
        DOM.selectedCategory.style.display = 'none';
        DOM.addCategoryBtn.classList.remove('active');
    },

    // Category messages view
    openCategoryMessages(categoryId) {
        const category = AppState.categories.find(c => c.id === categoryId);
        if (!category) return;

        AppState.viewingCategoryId = categoryId;
        this.renderCategorySpaceHeader(category);
        this.renderCategoryMessagesView(categoryId);

        // Mirror to URL hash and switch the page
        if (typeof Router !== 'undefined' && Router.syncFromNavigate) {
            Router.syncFromNavigate('categoryMessages', { categoryId });
        }
        AppState.currentPage = 'categoryMessages';
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        DOM.categoryMessagesPage.classList.add('active');
        DOM.bottomNav.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    },

    renderCategorySpaceHeader(category) {
        if (!category) return;
        const colorEl = document.getElementById('catSpaceColor');
        const titleEl = DOM.categoryMessagesTitle;
        const notesEl = document.getElementById('catSpaceCountNotes');
        const tasksEl = document.getElementById('catSpaceCountTasks');
        const bannerEl = document.getElementById('catSpaceBanner');

        const safeColor = Utils.sanitizeCssColor(category.color);
        if (colorEl) colorEl.style.background = safeColor;
        if (titleEl) {
            titleEl.textContent = category.name;
            titleEl.style.color = '';
        }

        const msgs = AppState.messages.filter(m => m.categoryId === category.id);
        const notesCount = msgs.filter(m => !m.isTask).length;
        const tasksPending = msgs.filter(m => m.isTask && !m.taskCompleted).length;
        if (notesEl) notesEl.textContent = notesCount + ' nota' + (notesCount === 1 ? '' : 's');
        if (tasksEl) tasksEl.textContent = tasksPending + ' tarefa' + (tasksPending === 1 ? '' : 's');

        // Editorial banner: first line of latest note (Paper only — CSS hides on other themes)
        const latestNote = msgs
            .filter(m => !m.isTask && m.text)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        if (bannerEl) {
            if (latestNote) {
                const tmp = document.createElement('div');
                tmp.innerHTML = String(latestNote.text || '');
                const plain = (tmp.textContent || tmp.innerText || '').trim();
                const firstLine = plain.split(/\r?\n/)[0].trim();
                if (firstLine) {
                    const trimmed = firstLine.length > 140 ? firstLine.slice(0, 140) + '…' : firstLine;
                    bannerEl.textContent = trimmed;
                    bannerEl.hidden = false;
                } else {
                    bannerEl.hidden = true;
                }
            } else {
                bannerEl.hidden = true;
            }
        }
    },

    openComposerForCategory(categoryId) {
        const cat = AppState.categories.find(c => c.id === categoryId);
        if (!cat) return;
        AppState.selectedCategoryId = cat.id;
        this.navigateTo('chat');
        // Update visible "selected category" pill if present
        if (DOM.selectedCategory && DOM.selectedCategoryName) {
            DOM.selectedCategoryName.textContent = cat.name;
            DOM.selectedCategory.style.background = Utils.sanitizeCssColor(cat.color);
            DOM.selectedCategory.style.display = 'flex';
        }
        if (DOM.addCategoryBtn) DOM.addCategoryBtn.classList.add('active');
        requestAnimationFrame(() => {
            if (DOM.messageInput && typeof DOM.messageInput.focus === 'function') {
                DOM.messageInput.focus();
            }
        });
    },

    renderCategoryMessagesView(categoryId) {
        const messages = AppState.messages
            .filter(m => m.categoryId === categoryId)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        this.renderMessages(messages, DOM.categoryMessagesContainer);

        // Refresh the header counters/banner whenever the view re-renders
        const cat = AppState.categories.find(c => c.id === categoryId);
        if (cat) this.renderCategorySpaceHeader(cat);
    },

    // Sidebar dynamic categories (S3 / F4)
    renderSidebarCategories() {
        const list = document.getElementById('sidebarCategoryList');
        if (!list) return;
        const cats = (AppState.categories || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
        if (!cats.length) {
            list.innerHTML = '';
            return;
        }
        const counts = {};
        for (const m of (AppState.messages || [])) {
            if (!m.categoryId) continue;
            counts[m.categoryId] = (counts[m.categoryId] || 0) + 1;
        }
        let html = '';
        for (const c of cats) {
            const safeColor = Utils.sanitizeCssColor(c.color || '#888');
            const safeName = Utils.escapeHtml(c.name || '');
            const cnt = counts[c.id] || 0;
            html += '<button type="button" class="sidebar-cat-item" data-cat-id="' + Utils.escapeHtml(c.id) + '">'
                + '<span class="sidebar-cat-item__swatch" style="background:' + safeColor + '"></span>'
                + '<span class="sidebar-cat-item__name">' + safeName + '</span>'
                + '<span class="sidebar-cat-item__count">' + cnt + '</span>'
                + '</button>';
        }
        list.innerHTML = html;
        list.querySelectorAll('.sidebar-cat-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.catId;
                if (id) this.openCategoryMessages(id);
            });
        });
    },

    // Tasks: mobile grouped list + Focus card (S3)
    renderTaskListMobile() {
        const root = document.getElementById('taskListMobile');
        if (!root) return;

        const now = new Date();
        const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
        const tomorrow0 = new Date(today0); tomorrow0.setDate(tomorrow0.getDate() + 1);
        const weekEnd = new Date(today0); weekEnd.setDate(weekEnd.getDate() + 7);

        const showCompleted = (typeof S5Polish !== 'undefined') && S5Polish.showCompletedEnabled();
        const pending = (AppState.messages || []).filter(m => m.isTask && (showCompleted || !m.taskCompleted));

        const groups = {
            today:    { label: 'Hoje',          items: [] },
            tomorrow: { label: 'Amanhã',        items: [] },
            week:     { label: 'Esta semana',   items: [] },
            none:     { label: 'Sem prazo',     items: [] },
        };

        for (const m of pending) {
            if (!m.taskDate) { groups.none.items.push(m); continue; }
            const d = new Date(m.taskDate + 'T00:00:00');
            if (d < tomorrow0) groups.today.items.push(m);
            else if (d < new Date(today0.getTime() + 2 * 86400000)) groups.tomorrow.items.push(m);
            else if (d < weekEnd) groups.week.items.push(m);
            else groups.none.items.push(m); // far future, treat as no near deadline
        }

        const renderGroup = (g) => {
            let html = '<section class="task-group">'
                + '<div class="task-group__label"><span>' + Utils.escapeHtml(g.label) + '</span><span class="task-group__count">' + g.items.length + '</span></div>'
                + '<div class="task-group__list">';
            if (!g.items.length) {
                html += '<div class="task-group__empty">— vazio</div>';
            } else {
                for (const m of g.items) {
                    html += this.renderMessageBubble(m);
                }
            }
            html += '</div></section>';
            return html;
        };

        let out = '';
        out += renderGroup(groups.today);
        out += renderGroup(groups.tomorrow);
        out += renderGroup(groups.week);
        if (groups.none.items.length) out += renderGroup(groups.none);
        root.innerHTML = out;

        this.attachMessageEventListeners(root);
    },

    // S6 — Task calendar (desktop only)
    renderTaskCalendar() {
        const grid = document.getElementById('calGrid');
        const titleEl = document.getElementById('calTitle');
        if (!grid || !titleEl) return;

        const ref = AppState.calendarDate instanceof Date ? AppState.calendarDate : new Date();
        AppState.calendarDate = ref;
        const year = ref.getFullYear();
        const month = ref.getMonth();
        const firstOfMonth = new Date(year, month, 1);
        const startWeekday = firstOfMonth.getDay(); // 0..6 (sun..sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today0 = new Date(); today0.setHours(0, 0, 0, 0);

        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        titleEl.textContent = monthNames[month] + ' ' + year;

        // Bucket tasks by ISO date (YYYY-MM-DD)
        const buckets = {};
        for (const m of (AppState.messages || [])) {
            if (!m.isTask || !m.taskDate) continue;
            const key = String(m.taskDate).split('T')[0];
            if (!buckets[key]) buckets[key] = [];
            buckets[key].push(m);
        }

        // Build 6×7 grid (or 5×7 if fits) starting from Sunday before first
        const cellCount = startWeekday + daysInMonth;
        const rows = Math.ceil(cellCount / 7);
        const totalCells = rows * 7;
        let html = '';
        for (let i = 0; i < totalCells; i++) {
            const dayOffset = i - startWeekday + 1;
            const cellDate = new Date(year, month, dayOffset);
            const isOut = dayOffset < 1 || dayOffset > daysInMonth;
            const isoKey = cellDate.getFullYear() + '-'
                + String(cellDate.getMonth() + 1).padStart(2, '0') + '-'
                + String(cellDate.getDate()).padStart(2, '0');
            const isToday = !isOut && cellDate.getTime() === today0.getTime();
            const tasks = (!isOut && buckets[isoKey]) || [];

            const classes = ['cal-day'];
            if (isOut) classes.push('cal-day--out');
            if (isToday) classes.push('cal-day--today');

            let dots = '';
            const maxDots = 6;
            tasks.slice(0, maxDots).forEach(t => {
                const color = (t.category && t.category.color) ? Utils.sanitizeCssColor(t.category.color) : 'var(--ink-3)';
                const overdue = !t.taskCompleted && cellDate < today0;
                dots += '<span class="cal-dot' + (overdue ? ' cal-dot--overdue' : '') + '" style="background:' + color + '" title="' + Utils.escapeHtml(stripHtmlText(t.text)) + '"></span>';
            });
            const more = tasks.length > maxDots ? ('<span class="cal-day__more">+' + (tasks.length - maxDots) + '</span>') : '';

            html += '<div class="' + classes.join(' ') + '">'
                + '<span class="cal-day__num">' + cellDate.getDate() + '</span>'
                + '<div class="cal-day__dots">' + dots + more + '</div>'
                + '</div>';
        }
        grid.innerHTML = html;

        function stripHtmlText(s) {
            const tmp = document.createElement('div');
            tmp.innerHTML = String(s || '');
            return (tmp.textContent || tmp.innerText || '').trim().slice(0, 60);
        }
    },

    setTaskView(view) {
        const page = document.getElementById('kanbanPage');
        if (!page) return;
        page.dataset.view = view;
        const board = document.getElementById('kanbanBoard');
        const cal = document.getElementById('taskCalendar');
        if (board) board.style.display = view === 'kanban' ? '' : 'none';
        if (cal) cal.hidden = view !== 'calendar';
        document.querySelectorAll('#kanbanPage .view-toggle__btn').forEach(btn => {
            const isActive = btn.dataset.view === view;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    },

    renderFocusCard() {
        const card = document.getElementById('focusCard');
        if (!card) return;
        const today0 = new Date(); today0.setHours(0, 0, 0, 0);
        const tomorrow0 = new Date(today0); tomorrow0.setDate(tomorrow0.getDate() + 1);
        const todayPending = (AppState.messages || []).filter(m => {
            if (!m.isTask || m.taskCompleted || !m.taskDate) return false;
            const d = new Date(m.taskDate + 'T00:00:00');
            return d >= today0 && d < tomorrow0;
        });
        const cnt = todayPending.length;
        if (cnt === 0) {
            card.hidden = true;
            return;
        }
        card.hidden = false;
        const cntEl = document.getElementById('focusCardCount');
        if (cntEl) cntEl.textContent = cnt + ' tarefa' + (cnt === 1 ? '' : 's');
    },

    closeCategoryMessages() {
        AppState.viewingCategoryId = null;
        DOM.categoryMessagesPage.classList.remove('active');
        this.navigateTo('categories');
    },

    // Modal handlers
    openEditMessageModal(id) {
        const message = AppState.messages.find(m => m.id === id);
        if (!message) return;

        AppState.editingMessageId = id;

        if (DOM.editMessageText?.isContentEditable && DOM.editMessageText.tagName !== 'TEXTAREA') {
            RichText.setHtml(DOM.editMessageText, RichText.renderMessage(message.text));
            RichText.focusEnd(DOM.editMessageText);
        } else {
            DOM.editMessageText.value = message.text;
        }
        DOM.editMessageCategory.value = message.categoryId || '';
        this.updateCategoryDropdownDisplay(DOM.editMessageCategoryTrigger, message.categoryId || '', 'Sem categoria');
        // Mark selected in menu
        if (DOM.editMessageCategoryMenu) {
            DOM.editMessageCategoryMenu.querySelectorAll('.category-dropdown-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.value === (message.categoryId || ''));
            });
        }
        DOM.editMessageIsTask.checked = message.isTask;
        DOM.editTaskDate.value = message.taskDate ? message.taskDate.split('T')[0] : '';
        DOM.editTaskTime.value = message.taskTime || '';

        // §7.5 — sync visual toggle pill + datetime-local input
        const togglePill = document.getElementById('editMessageIsTaskToggle');
        if (togglePill) {
            togglePill.classList.toggle('is-on', !!message.isTask);
            togglePill.setAttribute('aria-pressed', message.isTask ? 'true' : 'false');
            const lbl = togglePill.querySelector('span');
            if (lbl) lbl.textContent = message.isTask ? 'É uma tarefa' : 'Tornar tarefa';
        }
        const dtInput = document.getElementById('editTaskDateTime');
        if (dtInput) {
            const date = DOM.editTaskDate.value || '';
            const time = DOM.editTaskTime.value || '';
            dtInput.value = (date && time) ? (date + 'T' + time) : (date || '');
        }

        DOM.editTaskFields.style.display = message.isTask ? 'block' : 'none';

        openModal(DOM.editMessageModal);
    },

    openEditCategoryModal(id) {
        const category = AppState.categories.find(c => c.id === id);
        if (!category) return;

        AppState.editingCategoryId = id;
        DOM.categoryModalTitle.textContent = 'Editar Categoria';
        DOM.categoryName.value = category.name;
        // Pre-select the current section
        this.renderCategorySectionSelect(category.sectionId || '');

        openModal(DOM.categoryModal);
    },

    // Context menu
    showContextMenu(e, messageId) {
        AppState.contextMenuMessageId = messageId;

        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);

        DOM.contextMenu.style.left = `${Math.min(x, window.innerWidth - 160)}px`;
        DOM.contextMenu.style.top = `${Math.min(y, window.innerHeight - 150)}px`;

        DOM.contextMenu.classList.add('active');
    },

    hideContextMenu() {
        DOM.contextMenu.classList.remove('active');
        AppState.contextMenuMessageId = null;
    },

    async copyMessage(id) {
        const message = AppState.messages.find(m => m.id === id);
        if (!message) return;

        try {
            await navigator.clipboard.writeText(message.text);
            showToast('Mensagem copiada!');
        } catch (error) {
            showToast('Erro ao copiar');
        }
    },

    // Auth handlers
    async login(email, password, mfaCode) {
        try {
            const { user } = await API.auth.login(email, password, mfaCode);
            AppState.user = user;
            this.showMainApp();
            await this.loadInitialData();
            showToast('Bem-vindo de volta!');

            if (DOM.loginMfaGroup) DOM.loginMfaGroup.style.display = 'none';
            if (DOM.loginMfaCode) DOM.loginMfaCode.value = '';
        } catch (error) {
            if (error.pendingApproval) {
                showToast('Sua conta ainda não foi aprovada pelo admin.', 4000);
            } else {
                if (String(error.message || '').toLowerCase().includes('mfa')) {
                    if (DOM.loginMfaGroup) DOM.loginMfaGroup.style.display = 'block';
                    DOM.loginMfaCode?.focus();
                }
                showToast(error.message);
            }
        }
    },

    async register(name, email, password) {
        try {
            const response = await API.auth.register(name, email, password);
            
            // Check if pending approval
            if (response.pendingApproval) {
                showToast('Conta criada! Aguarde aprovação do admin.', 4000);
                DOM.registerForm.style.display = 'none';
                DOM.loginForm.style.display = 'block';
                return;
            }
            
            AppState.user = response.user;
            this.showMainApp();
            await this.loadInitialData();
            showToast('Conta criada com sucesso!');
        } catch (error) {
            showToast(error.message);
        }
    },

    async logout() {
        try {
            await API.auth.logout();
            AppState.user = null;
            AppState.messages = [];
            AppState.categories = [];
            AppState.stats = null;
            this.showAuthScreen();
            showToast('Até logo!');
        } catch (error) {
            // Even if logout fails, clear local state
            API.setToken(null);
            this.showAuthScreen();
        }
    },

    async updateProfile() {
        const name = DOM.editProfileName.value.trim();
        if (!name) {
            showToast('Digite seu nome');
            return;
        }

        try {
            const { user } = await API.auth.updateProfile({ name });
            AppState.user = user;
            this.renderProfile();
            DOM.userName.textContent = user.name.split(' ')[0];
            closeModal(DOM.editProfileModal);
            showToast('Perfil atualizado!');
        } catch (error) {
            showToast(error.message);
        }
    },

    async changePassword() {
        const current = DOM.currentPassword.value;
        const newPass = DOM.newPassword.value;
        const confirm = DOM.confirmPassword.value;

        if (!current || !newPass || !confirm) {
            showToast('Preencha todos os campos');
            return;
        }

        if (newPass !== confirm) {
            showToast('As senhas não coincidem');
            return;
        }

        if (newPass.length < 6) {
            showToast('A nova senha deve ter pelo menos 6 caracteres');
            return;
        }

        try {
            await API.auth.changePassword(current, newPass);
            closeModal(DOM.changePasswordModal);
            DOM.currentPassword.value = '';
            DOM.newPassword.value = '';
            DOM.confirmPassword.value = '';
            showToast('Senha alterada com sucesso!');
        } catch (error) {
            showToast(error.message);
        }
    },

    // Export data
    async exportData() {
        try {
            const data = {
                user: AppState.user,
                messages: AppState.messages,
                categories: AppState.categories,
                exportedAt: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `savit_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();

            URL.revokeObjectURL(url);
            showToast('Dados exportados!');
        } catch (error) {
            showToast('Erro ao exportar dados');
        }
    },

    // Image handling
    handleImageSelect(e, isCategory = false) {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const pendingImages = isCategory ? AppState.categoryPendingImages : AppState.pendingImages;
        const container = isCategory ? DOM.categoryImagePreviewContainer : DOM.imagePreviewContainer;

        const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

        files.forEach(file => {
            // Mirror backend: block SVG and other image types.
            if (!allowedTypes.has(file.type)) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                pendingImages.push(event.target.result);
                this.renderImagePreviews(isCategory);
            };
            reader.readAsDataURL(file);
        });

        // Clear input
        e.target.value = '';
    },

    renderImagePreviews(isCategory = false) {
        const pendingImages = isCategory ? AppState.categoryPendingImages : AppState.pendingImages;
        const container = isCategory ? DOM.categoryImagePreviewContainer : DOM.imagePreviewContainer;

        if (!container) return;

        if (pendingImages.length === 0) {
            container.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = pendingImages.map((img, index) => `
            <div class="image-preview">
                <img src="${img}" alt="Preview">
                <button class="remove-image" type="button" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        container.querySelectorAll('.remove-image[data-index]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = Number(btn.dataset.index);
                if (!Number.isFinite(idx)) return;
                this.removeImage(idx, isCategory);
            });
        });
    },

    removeImage(index, isCategory = false) {
        if (isCategory) {
            AppState.categoryPendingImages.splice(index, 1);
        } else {
            AppState.pendingImages.splice(index, 1);
        }
        this.renderImagePreviews(isCategory);
    },

    clearPendingImages(isCategory = false) {
        if (isCategory) {
            AppState.categoryPendingImages = [];
        } else {
            AppState.pendingImages = [];
        }
        this.renderImagePreviews(isCategory);
    },

    // Handle paste event for images (screenshots, copied images)
    handleImagePaste(e, isCategory = false) {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return false;

        const items = clipboardData.items;
        if (!items) return false;

        const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
        let hasImage = false;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file' && allowedTypes.has(item.type)) {
                const file = item.getAsFile();
                if (!file) continue;

                hasImage = true;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const pendingImages = isCategory ? AppState.categoryPendingImages : AppState.pendingImages;
                    pendingImages.push(event.target.result);
                    this.renderImagePreviews(isCategory);
                };
                reader.readAsDataURL(file);
            }
        }

        return hasImage;
    },

    // Image viewer
    openImageViewer(src) {
        DOM.imageViewerImg.src = src;
        DOM.imageViewer.classList.add('active');
    },

    // Drawing
    openDrawModal() {
        openModal(DOM.drawModal);
        // Wait for modal to be visible, then setup canvas
        setTimeout(() => {
            DrawingCanvas.setupCanvas();
            DrawingCanvas.reset();
        }, 100);
    },

    async saveDrawing() {
        const imageData = DrawingCanvas.getImage();
        
        if (AppState.drawingForCategory) {
            // Send to category
            await this.createMessage(
                '',
                AppState.viewingCategoryId,
                false,
                null,
                null,
                [imageData]
            );
            this.renderCategoryMessagesView(AppState.viewingCategoryId);
        } else {
            // Send to main chat
            await this.createMessage(
                '',
                AppState.selectedCategoryId,
                AppState.isTaskMode,
                AppState.isTaskMode ? DOM.taskDate.value : null,
                AppState.isTaskMode ? DOM.taskTime.value : null,
                [imageData]
            );
        }

        closeModal(DOM.drawModal);
        DrawingCanvas.reset();
    },

    // Event listeners setup
    setupEventListeners() {
        // Auth forms (§7.19 — explicit client-side guard before API call)
        DOM.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = (DOM.loginEmail.value || '').trim();
            const pass = DOM.loginPassword.value || '';
            if (!email || !pass) {
                showToast('Preencha email e senha');
                return;
            }
            this.login(email, pass, DOM.loginMfaCode?.value);
        });

        DOM.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = (DOM.registerName.value || '').trim();
            const email = (DOM.registerEmail.value || '').trim();
            const pass = DOM.registerPassword.value || '';
            if (!name || !email || !pass) {
                showToast('Preencha todos os campos');
                return;
            }
            if (pass.length < 10) {
                showToast('Senha deve ter no mínimo 10 caracteres');
                return;
            }
            this.register(name, email, pass);
        });

        DOM.showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            DOM.loginForm.style.display = 'none';
            DOM.registerForm.style.display = 'block';
        });

        DOM.showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            DOM.registerForm.style.display = 'none';
            DOM.loginForm.style.display = 'block';
        });

        // Navigation (mobile bottom nav — only items with data-page are nav-targets)
        DOM.bottomNav.querySelectorAll('.nav-item[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigateTo(btn.dataset.page);
            });
        });

        // Mobile capture FAB — opens inbox and focuses composer (real composer in S2)
        const captureFab = document.getElementById('captureFab');
        if (captureFab) {
            captureFab.addEventListener('click', () => {
                this.navigateTo('chat');
                requestAnimationFrame(() => {
                    if (DOM.messageInput && typeof DOM.messageInput.focus === 'function') {
                        DOM.messageInput.focus();
                    }
                });
            });
        }

        // Sidebar Navigation (Desktop)
        if (DOM.sidebar) {
            DOM.sidebar.querySelectorAll('[data-page]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.navigateTo(btn.dataset.page);
                });
            });
        }

        // Sidebar command button — placeholder for command palette (S5).
        // For now, navigate to inbox + focus composer.
        const sidebarCmdBtn = document.getElementById('sidebarCmdBtn');
        if (sidebarCmdBtn) {
            sidebarCmdBtn.addEventListener('click', () => {
                this.navigateTo('chat');
                requestAnimationFrame(() => {
                    if (DOM.messageInput && typeof DOM.messageInput.focus === 'function') {
                        DOM.messageInput.focus();
                    }
                });
            });
        }

        DOM.viewAllMessages.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateTo('chat');
        });

        // Quick add
        DOM.quickAddBtn.addEventListener('click', () => {
            DOM.quickAddText.value = '';
            DOM.quickAddCategory.value = '';
            this.updateCategoryDropdownDisplay(DOM.quickAddCategoryTrigger, '', 'Sem categoria');
            // Reset selected in menu
            if (DOM.quickAddCategoryMenu) {
                DOM.quickAddCategoryMenu.querySelectorAll('.category-dropdown-option').forEach(opt => {
                    opt.classList.toggle('selected', opt.dataset.value === '');
                });
            }
            DOM.quickAddIsTask.checked = false;
            DOM.quickAddTaskFields.style.display = 'none';
            DOM.quickAddTaskDate.value = new Date().toISOString().split('T')[0];
            DOM.quickAddTaskTime.value = '';
            openModal(DOM.quickAddModal);
        });

        DOM.closeQuickAddModal.addEventListener('click', () => closeModal(DOM.quickAddModal));

        DOM.quickAddIsTask.addEventListener('change', () => {
            DOM.quickAddTaskFields.style.display = DOM.quickAddIsTask.checked ? 'block' : 'none';
        });

        DOM.saveQuickAddBtn.addEventListener('click', async () => {
            const text = DOM.quickAddText.value.trim();
            if (!text) {
                showToast('Digite sua ideia');
                return;
            }

            await this.createMessage(
                text,
                DOM.quickAddCategory.value,
                DOM.quickAddIsTask.checked,
                DOM.quickAddIsTask.checked ? DOM.quickAddTaskDate.value : null,
                DOM.quickAddIsTask.checked ? DOM.quickAddTaskTime.value : null
            );

            closeModal(DOM.quickAddModal);
            this.refreshDashboard();
        });

        // Chat page
        setupFormattingToolbar(DOM.formatToolbar, DOM.messageInput);

        // WhatsApp-like scroll behavior (main chat)
        if (DOM.messagesContainer) {
            AppState.chatLastScrollTop = DOM.messagesContainer.scrollTop || 0;
            AppState.chatStickToBottom = this.isNearBottom(DOM.messagesContainer);
            this.updateJumpToBottomUI();

            DOM.messagesContainer.addEventListener('scroll', () => {
                const st = DOM.messagesContainer.scrollTop;
                AppState.chatLastScrollTop = st;

                // User-driven scroll decides whether we should keep following the bottom.
                AppState.chatStickToBottom = this.isNearBottom(DOM.messagesContainer);
                if (AppState.chatStickToBottom) {
                    AppState.chatUnreadBelow = 0;
                }
                this.updateJumpToBottomUI();
            }, { passive: true });
        }

        if (DOM.jumpToBottomBtn) {
            DOM.jumpToBottomBtn.addEventListener('click', () => {
                AppState.chatStickToBottom = true;
                AppState.chatUnreadBelow = 0;
                this.scrollToBottomImmediate(DOM.messagesContainer);
                this.updateJumpToBottomUI();
            });
        }

        DOM.sendBtn.addEventListener('click', async () => {
            const isWysiwyg = DOM.messageInput?.isContentEditable && DOM.messageInput.tagName !== 'TEXTAREA';
            const rawText = isWysiwyg ? RichText.getPlainText(DOM.messageInput) : (DOM.messageInput.value || '');
            const textForCheck = rawText.trim();
            const textToSend = isWysiwyg ? RichText.getHtml(DOM.messageInput) : rawText.trimEnd();
            const hasImages = AppState.pendingImages.length > 0;

            if (!textForCheck && !hasImages) return;

            // Smart Capture: merge parsed metadata (additive — explicit user choices win)
            const parsed = (typeof SmartCapture !== 'undefined') ? SmartCapture.consume() : null;
            let categoryId = AppState.selectedCategoryId;
            let isTask = AppState.isTaskMode;
            let taskDate = AppState.isTaskMode ? DOM.taskDate.value : null;
            let taskTime = AppState.isTaskMode ? DOM.taskTime.value : null;

            if (parsed) {
                if (!categoryId && parsed.categoryId) categoryId = parsed.categoryId;
                if (parsed.dueAt && !AppState.isTaskMode) {
                    isTask = true;
                    const d = parsed.dueAt;
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    taskDate = `${yyyy}-${mm}-${dd}`;
                    taskTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                }
            }

            await this.createMessage(
                textToSend,
                categoryId,
                isTask,
                taskDate,
                taskTime,
                [...AppState.pendingImages]
            );

            if (isWysiwyg) {
                RichText.clear(DOM.messageInput);
            } else {
                DOM.messageInput.value = '';
                DOM.messageInput.style.height = 'auto';
            }
            this.clearPendingImages(false);
            resetInputOptions();
            if (typeof SmartCapture !== 'undefined') SmartCapture.clear();
        });

        DOM.messageInput.addEventListener('keydown', (e) => {
            const isWysiwyg = DOM.messageInput?.isContentEditable && DOM.messageInput.tagName !== 'TEXTAREA';
            if (!isWysiwyg) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    DOM.sendBtn.click();
                }
                return;
            }

            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                DOM.sendBtn.click();
                return;
            }

            if (e.key === 'Enter' && e.shiftKey) {
                // Insert a line break
                e.preventDefault();
                try {
                    document.execCommand('insertLineBreak');
                } catch {
                    RichText.insertHtmlAtCursor(DOM.messageInput, '<br>');
                }
                return;
            }
        });

        DOM.messageInput.addEventListener('input', () => {
            if (DOM.messageInput?.isContentEditable) {
                RichText.updateEmptyClass(DOM.messageInput);
            }
        });

        // Input options
        DOM.addCategoryBtn.addEventListener('click', () => {
            if (AppState.selectedCategoryId) {
                this.clearSelectedCategory();
            } else {
                openModal(DOM.categorySelectorModal);
            }
        });

        DOM.addTaskBtn.addEventListener('click', () => {
            AppState.isTaskMode = !AppState.isTaskMode;
            DOM.taskOptions.style.display = AppState.isTaskMode ? 'block' : 'none';
            DOM.addTaskBtn.classList.toggle('active', AppState.isTaskMode);
            if (AppState.isTaskMode) {
                DOM.taskDate.value = new Date().toISOString().split('T')[0];
            }
        });

        DOM.removeCategoryBtn.addEventListener('click', () => this.clearSelectedCategory());
        DOM.removeTaskBtn.addEventListener('click', () => {
            AppState.isTaskMode = false;
            DOM.taskOptions.style.display = 'none';
            DOM.addTaskBtn.classList.remove('active');
        });

        // Voice Input (Speech-to-Text)
        if (DOM.voiceInputBtn) {
            DOM.voiceInputBtn.addEventListener('click', () => {
                // Set target to main message input
                SpeechToText.targetInput = DOM.messageInput;
                SpeechToText.toggle();
            });
        }
        if (DOM.voiceStopBtn) {
            DOM.voiceStopBtn.addEventListener('click', () => SpeechToText.stop());
        }

        // Search (§7.7 — autofocus reliably via rAF)
        DOM.searchBtn.addEventListener('click', () => {
            DOM.searchBar.classList.toggle('active');
            if (DOM.searchBar.classList.contains('active')) {
                requestAnimationFrame(() => DOM.searchInput.focus());
            } else {
                clearSearch();
            }
        });

        DOM.closeSearchBtn.addEventListener('click', () => {
            DOM.searchBar.classList.remove('active');
            clearSearch();
        });

        DOM.clearSearchBtn.addEventListener('click', () => {
            DOM.searchInput.value = '';
            performSearch();
        });

        DOM.searchInput.addEventListener('input', performSearch);
        DOM.searchCategoryFilter.addEventListener('change', performSearch);
        DOM.searchDateFilter.addEventListener('change', performSearch);

        // Categories page
        DOM.newCategoryBtn.addEventListener('click', () => {
            AppState.editingCategoryId = null;
            DOM.categoryModalTitle.textContent = 'Nova Categoria';
            resetCategoryModal();
            this.renderCategorySectionSelect('');
            openModal(DOM.categoryModal);
        });

        if (DOM.newSectionBtn) {
            DOM.newSectionBtn.addEventListener('click', () => this.openSectionsModal());
        }

        if (DOM.toggleSectionSortBtn) {
            DOM.toggleSectionSortBtn.addEventListener('click', () => this.toggleSectionSortMode());
        }

        // Sections modal
        if (DOM.closeSectionsModal) {
            DOM.closeSectionsModal.addEventListener('click', () => this.closeSectionsModal());
        }
        if (DOM.closeSectionsBtn) {
            DOM.closeSectionsBtn.addEventListener('click', () => this.closeSectionsModal());
        }
        if (DOM.sectionsSortModeBtn) {
            DOM.sectionsSortModeBtn.addEventListener('click', () => this.toggleSectionSortMode());
        }
        if (DOM.createSectionBtn) {
            DOM.createSectionBtn.addEventListener('click', () => this.createSectionFromModal());
        }
        if (DOM.newSectionName) {
            DOM.newSectionName.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.createSectionFromModal();
                }
            });
        }

        // New section color picker
        if (DOM.newSectionColorBtn) {
            DOM.newSectionColorBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                DOM.newSectionColorPicker?.classList.toggle('open');
            });
        }
        if (DOM.newSectionColorMenu) {
            DOM.newSectionColorMenu.querySelectorAll('.color-option').forEach(opt => {
                opt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const color = opt.dataset.color;
                    if (DOM.newSectionColor) DOM.newSectionColor.value = color;
                    if (DOM.newSectionColorBtn) DOM.newSectionColorBtn.style.background = color;
                    DOM.newSectionColorPicker?.classList.remove('open');
                    // Mark selected
                    DOM.newSectionColorMenu.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                });
            });
        }

        // Edit section color picker
        if (DOM.editSectionColorPicker) {
            DOM.editSectionColorPicker.querySelectorAll('.color-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const color = opt.dataset.color;
                    if (DOM.editSectionColor) DOM.editSectionColor.value = color;
                    // Mark selected
                    DOM.editSectionColorPicker.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                });
            });
        }

        // Move category modal
        if (DOM.closeMoveCategoryModal) {
            DOM.closeMoveCategoryModal.addEventListener('click', () => this.closeMoveCategoryModal());
        }
        if (DOM.cancelMoveCategoryBtn) {
            DOM.cancelMoveCategoryBtn.addEventListener('click', () => this.closeMoveCategoryModal());
        }
        if (DOM.confirmMoveCategoryBtn) {
            DOM.confirmMoveCategoryBtn.addEventListener('click', () => this.confirmMoveCategory());
        }

        // Rename section modal
        if (DOM.closeRenameSectionModal) {
            DOM.closeRenameSectionModal.addEventListener('click', () => this.closeRenameSectionModal());
        }
        if (DOM.cancelRenameSectionBtn) {
            DOM.cancelRenameSectionBtn.addEventListener('click', () => this.closeRenameSectionModal());
        }
        if (DOM.saveRenameSectionBtn) {
            DOM.saveRenameSectionBtn.addEventListener('click', () => this.confirmRenameSection());
        }
        if (DOM.renameSectionInput) {
            DOM.renameSectionInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.confirmRenameSection();
                }
            });
        }

        // Delete section modal
        if (DOM.closeDeleteSectionModal) {
            DOM.closeDeleteSectionModal.addEventListener('click', () => this.closeDeleteSectionModal());
        }
        if (DOM.cancelDeleteSectionBtn) {
            DOM.cancelDeleteSectionBtn.addEventListener('click', () => this.closeDeleteSectionModal());
        }
        if (DOM.confirmDeleteSectionBtn) {
            DOM.confirmDeleteSectionBtn.addEventListener('click', () => this.confirmDeleteSection());
        }

        // Category modal
        DOM.closeCategoryModal.addEventListener('click', () => closeModal(DOM.categoryModal));
        DOM.cancelCategoryBtn.addEventListener('click', () => closeModal(DOM.categoryModal));
        DOM.saveCategoryBtn.addEventListener('click', () => {
            if (AppState.editingCategoryId) {
                this.updateCategory(AppState.editingCategoryId);
            } else {
                this.createCategory();
            }
        });

        // Category selector modal
        DOM.closeCategorySelectorModal.addEventListener('click', () => closeModal(DOM.categorySelectorModal));

        // Edit message modal
        DOM.closeEditMessageModal.addEventListener('click', () => closeModal(DOM.editMessageModal));
        setupFormattingToolbar(DOM.editFormatToolbar, DOM.editMessageText);
        DOM.editMessageIsTask.addEventListener('change', () => {
            DOM.editTaskFields.style.display = DOM.editMessageIsTask.checked ? 'block' : 'none';
        });

        // §7.5 — visual toggle pill drives the hidden checkbox
        const editTaskToggle = document.getElementById('editMessageIsTaskToggle');
        if (editTaskToggle) {
            editTaskToggle.addEventListener('click', () => {
                const next = !DOM.editMessageIsTask.checked;
                DOM.editMessageIsTask.checked = next;
                DOM.editMessageIsTask.dispatchEvent(new Event('change'));
                editTaskToggle.classList.toggle('is-on', next);
                editTaskToggle.setAttribute('aria-pressed', next ? 'true' : 'false');
                const lbl = editTaskToggle.querySelector('span');
                if (lbl) lbl.textContent = next ? 'É uma tarefa' : 'Tornar tarefa';
            });
        }

        // §7.6 / §7.5 — single datetime-local input mirrors split fields
        const editDt = document.getElementById('editTaskDateTime');
        if (editDt) {
            editDt.addEventListener('change', () => {
                const v = editDt.value || '';
                if (v.includes('T')) {
                    const [d, t] = v.split('T');
                    DOM.editTaskDate.value = d || '';
                    DOM.editTaskTime.value = (t || '').slice(0, 5);
                } else {
                    DOM.editTaskDate.value = v;
                    DOM.editTaskTime.value = '';
                }
            });
        }
        DOM.saveEditMessageBtn.addEventListener('click', () => {
            this.updateMessage(AppState.editingMessageId);
            closeModal(DOM.editMessageModal);
        });
        DOM.deleteMessageBtn.addEventListener('click', () => {
            this.deleteMessage(AppState.editingMessageId);
            closeModal(DOM.editMessageModal);
        });

        // Category messages page
        DOM.backFromCategoryBtn.addEventListener('click', () => this.closeCategoryMessages());

        // Category space "+ Adicionar nota" (S3 / F4)
        const catSpaceAddBtn = document.getElementById('catSpaceAddBtn');
        if (catSpaceAddBtn) {
            catSpaceAddBtn.addEventListener('click', () => {
                if (AppState.viewingCategoryId) {
                    this.openComposerForCategory(AppState.viewingCategoryId);
                }
            });
        }

        // Kanban: Focus card "Iniciar foco" (S3 / F3)
        const focusCardBtn = document.getElementById('focusCard');
        if (focusCardBtn) {
            focusCardBtn.addEventListener('click', () => {
                if (typeof FocusMode !== 'undefined') FocusMode.start();
            });
        }

        // S6 — Tasks view toggle (Kanban ↔ Calendar)
        const TASK_VIEW_KEY = 'savit_task_view';
        document.querySelectorAll('#kanbanPage .view-toggle__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view || 'kanban';
                try { localStorage.setItem(TASK_VIEW_KEY, view); } catch { /* ignore */ }
                this.setTaskView(view);
                if (view === 'calendar') this.renderTaskCalendar();
            });
        });
        const savedView = (() => { try { return localStorage.getItem(TASK_VIEW_KEY); } catch { return null; } })();
        if (savedView === 'calendar' || savedView === 'kanban') {
            this.setTaskView(savedView);
        }

        const calPrev = document.getElementById('calPrevBtn');
        const calNext = document.getElementById('calNextBtn');
        if (calPrev) calPrev.addEventListener('click', () => {
            const d = AppState.calendarDate || new Date();
            AppState.calendarDate = new Date(d.getFullYear(), d.getMonth() - 1, 1);
            this.renderTaskCalendar();
        });
        if (calNext) calNext.addEventListener('click', () => {
            const d = AppState.calendarDate || new Date();
            AppState.calendarDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            this.renderTaskCalendar();
        });

        setupFormattingToolbar(DOM.categoryFormatToolbar, DOM.categoryMessageInput);

        // Category page input - Send message
        DOM.categorySendBtn.addEventListener('click', async () => {
            const isWysiwyg = DOM.categoryMessageInput?.isContentEditable && DOM.categoryMessageInput.tagName !== 'TEXTAREA';
            const rawText = isWysiwyg ? RichText.getPlainText(DOM.categoryMessageInput) : (DOM.categoryMessageInput.value || '');
            const textForCheck = rawText.trim();
            const textToSend = isWysiwyg ? RichText.getHtml(DOM.categoryMessageInput) : rawText.trimEnd();
            const hasImages = AppState.categoryPendingImages.length > 0;
            
            if ((!textForCheck && !hasImages) || !AppState.viewingCategoryId) return;

            await this.createMessage(
                textToSend,
                AppState.viewingCategoryId,
                AppState.isCategoryTaskMode,
                AppState.isCategoryTaskMode ? DOM.categoryTaskDate.value : null,
                AppState.isCategoryTaskMode ? DOM.categoryTaskTime.value : null,
                [...AppState.categoryPendingImages]
            );

            if (isWysiwyg) {
                RichText.clear(DOM.categoryMessageInput);
            } else {
                DOM.categoryMessageInput.value = '';
                DOM.categoryMessageInput.style.height = 'auto';
            }
            this.clearPendingImages(true);
            
            // Reset task mode
            AppState.isCategoryTaskMode = false;
            DOM.categoryTaskOptions.style.display = 'none';
            DOM.categoryAddTaskBtn.classList.remove('active');
            
            // Re-render messages
            this.renderCategoryMessagesView(AppState.viewingCategoryId);
        });

        DOM.categoryMessageInput.addEventListener('keydown', (e) => {
            const isWysiwyg = DOM.categoryMessageInput?.isContentEditable && DOM.categoryMessageInput.tagName !== 'TEXTAREA';
            if (!isWysiwyg) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    DOM.categorySendBtn.click();
                }
                return;
            }

            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                DOM.categorySendBtn.click();
                return;
            }

            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                try {
                    document.execCommand('insertLineBreak');
                } catch {
                    RichText.insertHtmlAtCursor(DOM.categoryMessageInput, '<br>');
                }
                return;
            }
        });

        DOM.categoryMessageInput.addEventListener('input', () => {
            if (DOM.categoryMessageInput?.isContentEditable) {
                RichText.updateEmptyClass(DOM.categoryMessageInput);
            }
        });

        // Category page - Task mode toggle
        DOM.categoryAddTaskBtn.addEventListener('click', () => {
            AppState.isCategoryTaskMode = !AppState.isCategoryTaskMode;
            DOM.categoryTaskOptions.style.display = AppState.isCategoryTaskMode ? 'block' : 'none';
            DOM.categoryAddTaskBtn.classList.toggle('active', AppState.isCategoryTaskMode);
            if (AppState.isCategoryTaskMode) {
                DOM.categoryTaskDate.value = new Date().toISOString().split('T')[0];
            }
        });

        DOM.categoryRemoveTaskBtn.addEventListener('click', () => {
            AppState.isCategoryTaskMode = false;
            DOM.categoryTaskOptions.style.display = 'none';
            DOM.categoryAddTaskBtn.classList.remove('active');
        });

        // Category page - Voice input
        if (DOM.categoryVoiceInputBtn) {
            DOM.categoryVoiceInputBtn.addEventListener('click', () => {
                // Switch to category input mode for speech
                SpeechToText.targetInput = DOM.categoryMessageInput;
                SpeechToText.toggle();
            });
        }
        if (DOM.categoryVoiceStopBtn) {
            DOM.categoryVoiceStopBtn.addEventListener('click', () => SpeechToText.stop());
        }

        // Theme buttons
        if (DOM.themePaperBtn) {
            DOM.themePaperBtn.addEventListener('click', () => ThemeManager.setTheme('paper'));
        }
        if (DOM.themePlayfulBtn) {
            DOM.themePlayfulBtn.addEventListener('click', () => ThemeManager.setTheme('playful'));
        }
        if (DOM.themeLinearBtn) {
            DOM.themeLinearBtn.addEventListener('click', () => ThemeManager.setTheme('linear'));
        }

        // Image attachment - Main chat
        if (DOM.attachImageBtn) {
            DOM.attachImageBtn.addEventListener('click', () => DOM.imageInput.click());
        }
        if (DOM.imageInput) {
            DOM.imageInput.addEventListener('change', (e) => this.handleImageSelect(e, false));
        }

        // Paste image support - Main chat
        if (DOM.messageInput) {
            DOM.messageInput.addEventListener('paste', (e) => {
                if (this.handleImagePaste(e, false)) {
                    // If image was pasted, prevent default only for the image
                    // Text paste should still work normally
                }
            });
        }

        // Image attachment - Category page
        if (DOM.categoryAttachImageBtn) {
            DOM.categoryAttachImageBtn.addEventListener('click', () => DOM.categoryImageInput.click());
        }
        if (DOM.categoryImageInput) {
            DOM.categoryImageInput.addEventListener('change', (e) => this.handleImageSelect(e, true));
        }

        // Paste image support - Category page
        if (DOM.categoryMessageInput) {
            DOM.categoryMessageInput.addEventListener('paste', (e) => {
                if (this.handleImagePaste(e, true)) {
                    // If image was pasted, prevent default only for the image
                    // Text paste should still work normally
                }
            });
        }

        // Drawing - Main chat
        if (DOM.drawMessageBtn) {
            DOM.drawMessageBtn.addEventListener('click', () => {
                AppState.drawingForCategory = false;
                this.openDrawModal();
            });
        }

        // Drawing - Category page
        if (DOM.categoryDrawMessageBtn) {
            DOM.categoryDrawMessageBtn.addEventListener('click', () => {
                AppState.drawingForCategory = true;
                this.openDrawModal();
            });
        }

        // Draw modal controls
        if (DOM.closeDrawModal) {
            DOM.closeDrawModal.addEventListener('click', () => closeModal(DOM.drawModal));
        }
        if (DOM.cancelDrawBtn) {
            DOM.cancelDrawBtn.addEventListener('click', () => closeModal(DOM.drawModal));
        }
        if (DOM.saveDrawBtn) {
            DOM.saveDrawBtn.addEventListener('click', () => this.saveDrawing());
        }
        if (DOM.drawPencil) {
            DOM.drawPencil.addEventListener('click', () => DrawingCanvas.setPencil());
        }
        if (DOM.drawEraser) {
            DOM.drawEraser.addEventListener('click', () => DrawingCanvas.setEraser());
        }
        if (DOM.drawClear) {
            DOM.drawClear.addEventListener('click', () => DrawingCanvas.clear());
        }
        if (DOM.drawSize) {
            DOM.drawSize.addEventListener('input', (e) => DrawingCanvas.setSize(parseInt(e.target.value)));
        }

        // Draw colors
        document.querySelectorAll('.draw-color').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.draw-color').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                DrawingCanvas.setColor(btn.dataset.color);
            });
        });

        // Image viewer
        if (DOM.closeImageViewer) {
            DOM.closeImageViewer.addEventListener('click', () => {
                DOM.imageViewer.classList.remove('active');
            });
        }
        if (DOM.imageViewer) {
            DOM.imageViewer.addEventListener('click', (e) => {
                if (e.target === DOM.imageViewer) {
                    DOM.imageViewer.classList.remove('active');
                }
            });
        }

        // Kanban filters
        DOM.kanbanSearch.addEventListener('input', (e) => {
            AppState.kanbanSearch = e.target.value;
            this.renderKanban();
        });

        DOM.kanbanCategoryFilter.addEventListener('change', (e) => {
            AppState.kanbanCategory = e.target.value;
            this.renderKanban();
        });

        // Profile page
        DOM.editProfileBtn.addEventListener('click', () => {
            DOM.editProfileName.value = AppState.user?.name || '';
            openModal(DOM.editProfileModal);
        });

        DOM.closeEditProfileModal.addEventListener('click', () => closeModal(DOM.editProfileModal));
        DOM.cancelEditProfileBtn.addEventListener('click', () => closeModal(DOM.editProfileModal));
        DOM.saveProfileBtn.addEventListener('click', () => this.updateProfile());

        DOM.changePasswordBtn.addEventListener('click', () => {
            DOM.currentPassword.value = '';
            DOM.newPassword.value = '';
            DOM.confirmPassword.value = '';
            openModal(DOM.changePasswordModal);
        });

        DOM.closeChangePasswordModal.addEventListener('click', () => closeModal(DOM.changePasswordModal));
        DOM.cancelChangePasswordBtn.addEventListener('click', () => closeModal(DOM.changePasswordModal));
        DOM.savePasswordBtn.addEventListener('click', () => this.changePassword());

        DOM.exportDataBtn.addEventListener('click', () => this.exportData());
        DOM.logoutBtn.addEventListener('click', () => this.logout());

        // Context menu
        DOM.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                const id = AppState.contextMenuMessageId;

                if (action === 'edit') {
                    this.openEditMessageModal(id);
                } else if (action === 'copy') {
                    this.copyMessage(id);
                } else if (action === 'delete') {
                    this.deleteMessage(id);
                }

                this.hideContextMenu();
            });
        });

        // Close menus on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu') && !e.target.closest('.message')) {
                this.hideContextMenu();
            }
            // Close custom category dropdowns
            if (!e.target.closest('.category-dropdown')) {
                document.querySelectorAll('.category-dropdown.open').forEach(d => d.classList.remove('open'));
            }
            // Close section color pickers
            if (!e.target.closest('.section-color-picker')) {
                document.querySelectorAll('.section-color-picker.open').forEach(p => p.classList.remove('open'));
            }
        });

        // Close modals on backdrop click (only if mousedown AND mouseup both on backdrop)
        document.querySelectorAll('.modal').forEach(modal => {
            let mouseDownOnBackdrop = false;

            modal.addEventListener('mousedown', (e) => {
                mouseDownOnBackdrop = (e.target === modal);
            });

            modal.addEventListener('click', (e) => {
                // Only close if both mousedown and click happened on the backdrop
                if (!mouseDownOnBackdrop || e.target !== modal) {
                    mouseDownOnBackdrop = false;
                    return;
                }
                mouseDownOnBackdrop = false;

                // System dialog must resolve its promise
                if (DOM.systemDialogModal && modal === DOM.systemDialogModal) {
                    SystemDialog.cancel();
                    return;
                }

                closeModal(modal);
            });
        });

        // Calendar navigation
        if (DOM.calendarPrev) {
            DOM.calendarPrev.addEventListener('click', () => {
                AppState.calendarDate.setMonth(AppState.calendarDate.getMonth() - 1);
                this.renderCalendar();
            });
        }

        if (DOM.calendarNext) {
            DOM.calendarNext.addEventListener('click', () => {
                AppState.calendarDate.setMonth(AppState.calendarDate.getMonth() + 1);
                this.renderCalendar();
            });
        }

        // Admin refresh button
        if (DOM.refreshUsersBtn) {
            DOM.refreshUsersBtn.addEventListener('click', () => this.loadAdminData());
        }

        if (DOM.syncCategoryColorsBtn) {
            DOM.syncCategoryColorsBtn.addEventListener('click', () => this.syncCategoryColors());
        }
    }
};

// Mind map modal wiring
if (DOM.closeMindMapModal) {
    DOM.closeMindMapModal.addEventListener('click', () => MindMapUI.close());
}
if (DOM.cancelMindMapBtn) {
    DOM.cancelMindMapBtn.addEventListener('click', () => MindMapUI.close());
}
if (DOM.insertMindMapBtn) {
    DOM.insertMindMapBtn.addEventListener('click', () => MindMapUI.insert());
}

if (DOM.mindMapToggleCollapseBtn) {
    DOM.mindMapToggleCollapseBtn.addEventListener('click', () => MindMapUI.toggleCollapseSelected());
}
if (DOM.mindMapExpandAllBtn) {
    DOM.mindMapExpandAllBtn.addEventListener('click', () => MindMapUI.expandAll(true));
}
if (DOM.mindMapCollapseAllBtn) {
    DOM.mindMapCollapseAllBtn.addEventListener('click', () => MindMapUI.expandAll(false));
}

if (DOM.mindMapAddChildBtn) {
    DOM.mindMapAddChildBtn.addEventListener('click', () => MindMapUI.addChildSelected());
}
if (DOM.mindMapAddSiblingBtn) {
    DOM.mindMapAddSiblingBtn.addEventListener('click', () => MindMapUI.addSiblingSelected());
}
if (DOM.mindMapDeleteNodeBtn) {
    DOM.mindMapDeleteNodeBtn.addEventListener('click', () => { void MindMapUI.deleteSelectedNode(); });
}

// =============================================
// Helper Functions
// =============================================

function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function resetCategoryModal() {
    DOM.categoryName.value = '';
    // Reset section dropdown
    if (DOM.categorySectionTrigger) {
        DOM.categorySectionTrigger.innerHTML = '<span>Selecione uma seção</span><i class="fas fa-chevron-down"></i>';
    }
    AppState.selectedSectionIdForCategory = null;
}

// Color is now inherited from sections, no longer selected per category

function resetInputOptions() {
    AppState.selectedCategoryId = null;
    AppState.isTaskMode = false;

    DOM.selectedCategory.style.display = 'none';
    DOM.taskOptions.style.display = 'none';
    DOM.addCategoryBtn.classList.remove('active');
    DOM.addTaskBtn.classList.remove('active');
    DOM.taskDate.value = '';
    DOM.taskTime.value = '';
}

function performSearch() {
    AppState.searchQuery = DOM.searchInput.value;
    AppState.searchCategory = DOM.searchCategoryFilter.value;
    AppState.searchDate = DOM.searchDateFilter.value;

    App.renderMessages();
}

function clearSearch() {
    DOM.searchInput.value = '';
    DOM.searchCategoryFilter.value = '';
    DOM.searchDateFilter.value = '';
    AppState.searchQuery = '';
    AppState.searchCategory = '';
    AppState.searchDate = '';

    App.renderMessages();
}

function showToast(message, duration = 2500) {
    // Delegate to the new Toast component (S2). Fallback to legacy DOM toast if unavailable.
    if (window.Toast && typeof Toast.show === 'function') {
        Toast.show(message, { duration });
        return;
    }
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// =============================================
// System Dialog (themed alert/confirm/prompt)
// =============================================

const SystemDialog = (() => {
    let active = null;
    let keyHandler = null;

    const clearFooter = () => {
        if (!DOM.systemDialogFooter) return;
        DOM.systemDialogFooter.innerHTML = '';
    };

    const setInputVisible = (visible) => {
        if (!DOM.systemDialogInputWrap || !DOM.systemDialogInput) return;
        DOM.systemDialogInputWrap.style.display = visible ? 'block' : 'none';
    };

    const cleanup = () => {
        if (keyHandler) {
            document.removeEventListener('keydown', keyHandler, true);
            keyHandler = null;
        }
        active = null;
    };

    const close = (result) => {
        if (!DOM.systemDialogModal) return;
        closeModal(DOM.systemDialogModal);
        DOM.systemDialogModal.setAttribute('aria-hidden', 'true');
        const toResolve = active?.resolve;
        const returnFocus = active?.returnFocusEl;
        cleanup();
        try {
            returnFocus?.focus?.();
        } catch {
            // ignore
        }
        if (toResolve) toResolve(result);
    };

    const cancel = () => {
        if (!active) {
            if (DOM.systemDialogModal) closeModal(DOM.systemDialogModal);
            return;
        }
        close(active.cancelValue);
    };

    const copyToClipboard = async (text) => {
        const value = String(text ?? '');
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(value);
                return true;
            }
        } catch {
            // ignore
        }

        // Fallback: select input and try execCommand
        try {
            if (DOM.systemDialogInput) {
                DOM.systemDialogInput.focus();
                DOM.systemDialogInput.select();
            }
            // eslint-disable-next-line deprecation/deprecation
            return !!document.execCommand?.('copy');
        } catch {
            return false;
        }
    };

    const open = (config) => {
        if (!DOM.systemDialogModal || !DOM.systemDialogTitle || !DOM.systemDialogBody || !DOM.systemDialogFooter) {
            // Fallback to native dialogs if markup is missing
            if (config?.type === 'confirm') return Promise.resolve(window.confirm(config.message || ''));
            if (config?.type === 'prompt') return Promise.resolve(window.prompt(config.message || '', config.defaultValue || ''));
            window.alert(config?.message || '');
            return Promise.resolve(true);
        }

        if (active) {
            // Close any previous dialog to avoid deadlocks
            try { close(active.cancelValue); } catch { /* ignore */ }
        }

        const {
            type,
            title,
            message,
            okText,
            cancelText,
            danger,
            showInput,
            defaultValue,
            placeholder,
            readOnly,
            showCopy,
            cancelValue
        } = config;

        DOM.systemDialogTitle.textContent = title || (type === 'confirm' ? 'Confirmar' : type === 'prompt' ? 'Digite' : 'Aviso');
        DOM.systemDialogBody.textContent = String(message ?? '');
        clearFooter();

        setInputVisible(!!showInput);
        if (showInput && DOM.systemDialogInput) {
            DOM.systemDialogInput.value = String(defaultValue ?? '');
            DOM.systemDialogInput.placeholder = String(placeholder ?? '');
            DOM.systemDialogInput.readOnly = !!readOnly;
        }

        const returnFocusEl = document.activeElement;

        const promise = new Promise((resolve) => {
            active = {
                resolve,
                cancelValue: cancelValue,
                returnFocusEl
            };

            const primaryBtn = document.createElement('button');
            primaryBtn.type = 'button';
            primaryBtn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
            primaryBtn.textContent = okText || (type === 'confirm' ? 'Confirmar' : 'OK');

            const onOk = async () => {
                if (type === 'prompt') {
                    const value = DOM.systemDialogInput ? DOM.systemDialogInput.value : '';
                    close(value);
                    return;
                }
                close(true);
            };

            primaryBtn.addEventListener('click', () => { void onOk(); });

            let cancelBtn = null;
            if (cancelText !== null && (type === 'confirm' || type === 'prompt')) {
                cancelBtn = document.createElement('button');
                cancelBtn.type = 'button';
                cancelBtn.className = 'btn btn-secondary';
                cancelBtn.textContent = cancelText || 'Cancelar';
                cancelBtn.addEventListener('click', () => cancel());
            }

            let copyBtn = null;
            if (showCopy && showInput) {
                copyBtn = document.createElement('button');
                copyBtn.type = 'button';
                copyBtn.className = 'btn btn-secondary';
                copyBtn.textContent = 'Copiar';
                copyBtn.addEventListener('click', async () => {
                    const value = DOM.systemDialogInput ? DOM.systemDialogInput.value : '';
                    const ok = await copyToClipboard(value);
                    showToast(ok ? 'Copiado!' : 'Não foi possível copiar');
                });
            }

            // Order: cancel (left) then copy then ok (right)
            if (cancelBtn) DOM.systemDialogFooter.appendChild(cancelBtn);
            if (copyBtn) DOM.systemDialogFooter.appendChild(copyBtn);
            DOM.systemDialogFooter.appendChild(primaryBtn);

            // Close button in header
            if (DOM.closeSystemDialogModal) {
                DOM.closeSystemDialogModal.onclick = () => cancel();
            }

            keyHandler = (e) => {
                if (!active) return;
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancel();
                    return;
                }

                if (e.key === 'Enter') {
                    // Enter submits when prompt input is focused (or on confirm/alert)
                    if (type === 'prompt') {
                        if (document.activeElement === DOM.systemDialogInput) {
                            e.preventDefault();
                            void onOk();
                        }
                        return;
                    }
                    e.preventDefault();
                    void onOk();
                }
            };

            document.addEventListener('keydown', keyHandler, true);

            DOM.systemDialogModal.setAttribute('aria-hidden', 'false');
            openModal(DOM.systemDialogModal);

            // Focus management
            setTimeout(() => {
                try {
                    if (showInput && DOM.systemDialogInput) {
                        DOM.systemDialogInput.focus();
                        DOM.systemDialogInput.select?.();
                    } else {
                        primaryBtn.focus();
                    }
                } catch {
                    // ignore
                }
            }, 0);
        });

        return promise;
    };

    return {
        isOpen: () => !!active,
        cancel,
        alert: (message, opts = {}) => open({
            type: 'alert',
            title: opts.title || 'Aviso',
            message,
            okText: opts.okText || 'OK',
            cancelText: null,
            cancelValue: true
        }),
        confirm: (message, opts = {}) => open({
            type: 'confirm',
            title: opts.title || 'Confirmar',
            message,
            okText: opts.okText || 'Confirmar',
            cancelText: Object.prototype.hasOwnProperty.call(opts, 'cancelText') ? opts.cancelText : 'Cancelar',
            danger: !!opts.danger,
            cancelValue: false
        }),
        prompt: (message, opts = {}) => open({
            type: 'prompt',
            title: opts.title || 'Digite',
            message,
            okText: opts.okText || 'OK',
            cancelText: Object.prototype.hasOwnProperty.call(opts, 'cancelText') ? opts.cancelText : 'Cancelar',
            showInput: true,
            defaultValue: opts.defaultValue || '',
            placeholder: opts.placeholder || '',
            readOnly: !!opts.readOnly,
            showCopy: !!opts.showCopy,
            cancelValue: null
        })
    };
})();

// If something blows up during startup, don't leave the user stuck on the loader.
window.addEventListener('error', (event) => {
    try {
        // MindElixirLite can throw internal errors in some builds/browsers even when our
        // fallback editing flow works. Avoid breaking the app with global error handling.
        const msg = String(event?.message || event?.error?.message || '');
        const src = String(event?.filename || '');
        if (src.includes('MindElixirLite') && (msg.includes('beginEdit is not a function') || msg.includes("reading 'cancel'") || msg.includes('reading \"cancel\"'))) {
            try { event.preventDefault(); } catch {}
            return;
        }

        console.error('Unhandled error:', event?.error || event);
        if (DOM?.loadingScreen) DOM.loadingScreen.style.display = 'none';
        if (window.App?.showAuthScreen) window.App.showAuthScreen();
        showToast('Erro ao iniciar. Recarregue a página.');
    } catch {
        // best-effort
    }
});

window.addEventListener('unhandledrejection', (event) => {
    try {
        console.error('Unhandled rejection:', event?.reason || event);
        if (DOM?.loadingScreen) DOM.loadingScreen.style.display = 'none';
        if (window.App?.showAuthScreen) window.App.showAuthScreen();
        showToast('Erro ao iniciar. Recarregue a página.');
    } catch {
        // best-effort
    }
});

// Make App globally available
window.App = App;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Keep the app viewport vars in sync with the *actual* viewport.
    // Mobile browsers (especially iOS Safari) can report stale values during/after rotation,
    // so we refresh in a short burst.
    const syncViewportVars = () => {
        const vv = window.visualViewport;
        const h = vv?.height || window.innerHeight;
        const w = vv?.width || window.innerWidth;
        document.documentElement.style.setProperty('--app-height', `${Math.round(h)}px`);
        document.documentElement.style.setProperty('--app-width', `${Math.round(w)}px`);
    };

    const scheduleViewportSyncBurst = () => {
        syncViewportVars();

        // A few frames to catch intermediate values while rotating
        let frames = 0;
        const tick = () => {
            frames += 1;
            syncViewportVars();
            if (frames < 10) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);

        // And a couple delayed checks for browsers that settle late
        setTimeout(syncViewportVars, 250);
        setTimeout(syncViewportVars, 600);
        setTimeout(syncViewportVars, 1000);
    };

    scheduleViewportSyncBurst();
    window.addEventListener('resize', scheduleViewportSyncBurst, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(scheduleViewportSyncBurst, 50), { passive: true });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) scheduleViewportSyncBurst();
    }, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', scheduleViewportSyncBurst, { passive: true });
        window.visualViewport.addEventListener('scroll', scheduleViewportSyncBurst, { passive: true });
    }

    // Register Service Worker (PWA) - keep this in external JS to satisfy CSP.
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            // §7.9 — surface waiting workers as a "Recarregar?" toast
            const promptUpdate = (worker) => {
                if (!worker || !window.Toast) return;
                Toast.show('Nova versão disponível', {
                    type: 'info',
                    duration: 20000,
                    action: {
                        label: 'Recarregar',
                        onClick: () => {
                            worker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    }
                });
            };

            if (registration.waiting) {
                promptUpdate(registration.waiting);
            }

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        promptUpdate(newWorker);
                    }
                });
            });
        }).catch(() => {});

        // Reload once when the controlling service worker changes.
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            try {
                if (sessionStorage.getItem('savit_sw_reloaded') === '1') return;
                sessionStorage.setItem('savit_sw_reloaded', '1');
                window.location.reload();
            } catch {
                window.location.reload();
            }
        });
    }

    App.init().catch((err) => {
        console.error('App.init failed:', err);
        try { showToast(err?.message || 'Erro ao iniciar'); } catch {}
        try { App.showAuthScreen(); } catch {}
    });
});
