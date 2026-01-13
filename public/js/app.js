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
    theme: 'dark',
    pendingImages: [],
    categoryPendingImages: [],
    drawingForCategory: false,
    kanbanSearch: '',
    kanbanCategory: '',
    calendarDate: new Date(),
    calendarSelectedDay: null
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
                const currentText = input.value;
                const cursorPos = input.selectionStart || currentText.length;
                
                if (finalTranscript) {
                    // Add final transcript with proper spacing
                    const before = currentText.substring(0, cursorPos);
                    const after = currentText.substring(cursorPos);
                    const space = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
                    input.value = before + space + finalTranscript + after;
                    
                    // Trigger input event for auto-resize
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
    init() {
        // Load saved theme or detect system preference
        const savedTheme = localStorage.getItem('savit-theme') || 'system';
        this.setTheme(savedTheme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (AppState.theme === 'system') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    setTheme(theme) {
        AppState.theme = theme;
        localStorage.setItem('savit-theme', theme);
        
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
        } else {
            this.applyTheme(theme);
        }
        
        this.updateButtons();
    },

    applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    },

    updateButtons() {
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === AppState.theme);
        });
    }
};

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

    // Chat Page
    messagesContainer: document.getElementById('messagesContainer'),
    emptyState: document.getElementById('emptyState'),
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

    // Sidebar (Desktop)
    sidebarAvatar: document.getElementById('sidebarAvatar'),
    sidebarUsername: document.getElementById('sidebarUsername'),

    // Categories Page
    newCategoryBtn: document.getElementById('newCategoryBtn'),
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
    themeLightBtn: document.getElementById('themeLightBtn'),
    themeDarkBtn: document.getElementById('themeDarkBtn'),
    themeSystemBtn: document.getElementById('themeSystemBtn'),

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
    categoryModal: document.getElementById('categoryModal'),
    closeCategoryModal: document.getElementById('closeCategoryModal'),
    categoryModalTitle: document.getElementById('categoryModalTitle'),
    categoryName: document.getElementById('categoryName'),
    colorPicker: document.getElementById('colorPicker'),
    customColor: document.getElementById('customColor'),
    cancelCategoryBtn: document.getElementById('cancelCategoryBtn'),
    saveCategoryBtn: document.getElementById('saveCategoryBtn'),
    editMessageModal: document.getElementById('editMessageModal'),
    closeEditMessageModal: document.getElementById('closeEditMessageModal'),
    editMessageText: document.getElementById('editMessageText'),
    editMessageCategory: document.getElementById('editMessageCategory'),
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
    quickAddIsTask: document.getElementById('quickAddIsTask'),
    quickAddTaskFields: document.getElementById('quickAddTaskFields'),
    quickAddTaskDate: document.getElementById('quickAddTaskDate'),
    quickAddTaskTime: document.getElementById('quickAddTaskTime'),
    saveQuickAddBtn: document.getElementById('saveQuickAddBtn'),

    // Context Menu
    contextMenu: document.getElementById('contextMenu')
};

// =============================================
// App Controller
// =============================================

const App = {
    // Initialize app
    async init() {
        this.setupEventListeners();

        // Check if user is logged in
        const token = API.getToken();
        if (token) {
            try {
                const { user } = await API.auth.me();
                AppState.user = user;
                this.showMainApp();
                await this.loadInitialData();
            } catch (error) {
                console.error('Auth check failed:', error);
                this.showAuthScreen();
            }
        } else {
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
    },

    // Load initial data
    async loadInitialData() {
        try {
            // Load all data in parallel
            const [messagesData, categoriesData, statsData] = await Promise.all([
                API.messages.getAll(),
                API.categories.getAll(),
                API.stats.dashboard()
            ]);

            AppState.messages = messagesData.messages;
            AppState.categories = categoriesData.categories;
            AppState.stats = statsData.stats;

            // Render all
            this.renderDashboard();
            this.renderMessages();
            this.renderCategories();
            this.renderCategoryDropdowns();
            this.renderProfile();
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast('Erro ao carregar dados');
        }
    },

    // Navigation
    navigateTo(page) {
        AppState.currentPage = page;

        // Update bottom nav
        DOM.bottomNav.querySelectorAll('.nav-item').forEach(btn => {
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
            const { messages } = await API.messages.getAll();
            AppState.messages = messages;
            this.renderMessages();
        } catch (error) {
            console.error('Failed to refresh messages:', error);
        }
    },

    // Refresh categories
    async refreshCategories() {
        try {
            const { categories } = await API.categories.getAll();
            AppState.categories = categories;
            this.renderCategories();
            this.renderCategoryDropdowns();
        } catch (error) {
            console.error('Failed to refresh categories:', error);
        }
    },

    // Render dashboard
    renderDashboard() {
        const stats = AppState.stats;
        if (!stats) return;

        // Stats cards
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

    renderActivityChart(data) {
        let html = '';
        const maxCount = Math.max(...data.map(d => d.count), 1);

        data.forEach(day => {
            const height = (day.count / maxCount) * 100;
            html += `
                <div class="chart-bar-container">
                    <div class="chart-bar" style="height: ${Math.max(height, 5)}%">
                        <span class="chart-value">${day.count}</span>
                    </div>
                    <span class="chart-label">${day.day}</span>
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
            
            html += `
                <div class="calendar-task-item ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
                    <div class="calendar-task-checkbox ${isCompleted ? 'checked' : ''}" data-id="${task.id}">
                        <i class="fas fa-check"></i>
                    </div>
                    <span class="calendar-task-text">${Utils.escapeHtml(task.text)}</span>
                    ${task.taskTime ? `<span class="calendar-task-time">${task.taskTime}</span>` : ''}
                    ${category ? `<span class="calendar-task-category" style="background: ${category.color}">${Utils.escapeHtml(category.name)}</span>` : ''}
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
                <div class="category-bar" onclick="App.openCategoryMessages('${cat.id}')">
                    <div class="category-bar-info">
                        <span class="category-dot" style="background: ${cat.color}"></span>
                        <span class="category-bar-name">${Utils.escapeHtml(cat.name)}</span>
                    </div>
                    <span class="category-bar-count">${cat.count}</span>
                </div>
            `;
        });

        DOM.topCategories.innerHTML = html;
    },

    renderRecentMessages(messages) {
        if (messages.length === 0) {
            DOM.recentMessages.innerHTML = '<p class="text-muted">Nenhuma ideia ainda</p>';
            return;
        }

        let html = '';
        messages.forEach(msg => {
            html += `
                <div class="recent-message-item" onclick="App.navigateTo('chat')">
                    ${msg.category ? `<span class="category-dot" style="background: ${msg.category.color}"></span>` : ''}
                    <div class="recent-message-content">
                        <p class="recent-message-text">${Utils.escapeHtml(Utils.truncateText(msg.text, 60))}</p>
                        <span class="recent-message-time">${Utils.formatDate(msg.createdAt)} às ${Utils.formatTime(msg.createdAt)}</span>
                    </div>
                    ${msg.isTask ? `<i class="fas fa-check-square task-icon ${msg.taskCompleted ? 'completed' : ''}"></i>` : ''}
                </div>
            `;
        });

        DOM.recentMessages.innerHTML = html;
    },

    renderUpcomingTasks(tasks) {
        if (tasks.length === 0) {
            DOM.upcomingTasks.innerHTML = '<p class="text-muted">Nenhuma tarefa agendada</p>';
            return;
        }

        let html = '';
        tasks.forEach(task => {
            const isOverdue = Utils.isTaskOverdue(task.taskDate, task.taskTime, task.taskCompleted);
            html += `
                <div class="upcoming-task-item ${isOverdue ? 'overdue' : ''}" onclick="App.openEditMessageModal('${task.id}')">
                    <div class="task-checkbox ${task.taskCompleted ? 'completed' : ''}" onclick="event.stopPropagation(); App.toggleTask('${task.id}')">
                        ${task.taskCompleted ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="upcoming-task-content">
                        <p class="upcoming-task-text">${Utils.escapeHtml(Utils.truncateText(task.text, 50))}</p>
                        <span class="upcoming-task-date">
                            <i class="fas fa-calendar"></i> ${Utils.formatFullDate(task.taskDate)}
                            ${task.taskTime ? `<i class="fas fa-clock"></i> ${task.taskTime}` : ''}
                        </span>
                    </div>
                </div>
            `;
        });

        DOM.upcomingTasks.innerHTML = html;
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
                            <button class="admin-btn approve" onclick="App.approveUser('${user.id}')" title="Aprovar">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="admin-btn reject" onclick="App.deleteUser('${user.id}')" title="Rejeitar">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            DOM.pendingUsersList.innerHTML = html;
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
                                <button class="admin-btn toggle-admin" onclick="App.toggleUserRole('${user.id}')" title="${isAdmin ? 'Remover admin' : 'Tornar admin'}">
                                    <i class="fas fa-crown"></i>
                                </button>
                                <button class="admin-btn reject" onclick="App.deleteUser('${user.id}')" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            DOM.allUsersList.innerHTML = html;
        } catch (error) {
            console.error('Load users error:', error);
        }
    },

    async approveUser(userId) {
        try {
            const response = await fetch(`/api/auth/admin/approve/${userId}`, {
                method: 'POST'
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            showToast('Usuário aprovado!');
            await this.loadAdminData();
        } catch (error) {
            showToast(error.message || 'Erro ao aprovar usuário');
        }
    },

    async deleteUser(userId) {
        if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const response = await fetch(`/api/auth/admin/users/${userId}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            showToast('Usuário removido!');
            await this.loadAdminData();
        } catch (error) {
            showToast(error.message || 'Erro ao excluir usuário');
        }
    },

    async toggleUserRole(userId) {
        try {
            const response = await fetch(`/api/auth/admin/toggle-role/${userId}`, {
                method: 'POST'
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            showToast(`Cargo alterado para ${data.user.role === 'admin' ? 'administrador' : 'usuário'}!`);
            await this.loadAdminData();
        } catch (error) {
            showToast(error.message || 'Erro ao alterar cargo');
        }
    },

    // Render messages
    renderMessages(messages = null, container = DOM.messagesContainer) {
        const messagesToRender = messages || this.getFilteredMessages();

        if (messagesToRender.length === 0) {
            if (container === DOM.messagesContainer) {
                DOM.emptyState.style.display = 'flex';
                container.innerHTML = '';
                container.appendChild(DOM.emptyState);
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

        // Scroll to bottom if main container
        if (container === DOM.messagesContainer) {
            this.scrollToBottom();
        }

        // Add event listeners
        this.attachMessageEventListeners(container);
    },

    renderMessageBubble(msg) {
        const isOverdue = Utils.isTaskOverdue(msg.taskDate, msg.taskTime, msg.taskCompleted);

        let classNames = ['message'];
        if (msg.isTask && msg.taskCompleted) classNames.push('task-completed');
        if (isOverdue) classNames.push('task-overdue');

        let html = `<div class="${classNames.join(' ')}" data-id="${msg.id}">`;

        // Category badge
        if (msg.category) {
            html += `<span class="message-category" style="background: ${msg.category.color}">${Utils.escapeHtml(msg.category.name)}</span>`;
        }

        // Images
        if (msg.images && msg.images.length > 0) {
            html += '<div class="message-images">';
            msg.images.forEach(img => {
                html += `<img src="${img}" class="message-image" onclick="App.openImageViewer('${img}')" alt="Imagem anexada">`;
            });
            html += '</div>';
        }

        // Message text
        if (msg.text) {
            html += `<div class="message-text">${Utils.escapeHtml(msg.text)}</div>`;
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
                <span class="message-status"><i class="fas fa-check-double"></i></span>
            </div>
        `;

        html += '</div>';

        return html;
    },

    attachMessageEventListeners(container) {
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
            message.addEventListener('click', () => {
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
        });
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
        setTimeout(() => {
            DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
        }, 100);
    },

    // Render categories
    renderCategories() {
        const categories = AppState.categories;

        if (categories.length === 0) {
            DOM.categoriesList.innerHTML = `
                <div class="empty-state small">
                    <i class="fas fa-folder-open"></i>
                    <h3>Nenhuma categoria</h3>
                    <p>Crie sua primeira categoria</p>
                </div>
            `;
            return;
        }

        let html = '';

        categories.forEach(cat => {
            html += `
                <div class="category-item" data-id="${cat.id}">
                    <div class="category-color" style="background: ${cat.color}">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="category-info">
                        <div class="category-name">${Utils.escapeHtml(cat.name)}</div>
                        <div class="category-count">${cat.messageCount} ${cat.messageCount === 1 ? 'mensagem' : 'mensagens'}</div>
                    </div>
                    <div class="category-actions">
                        <button class="edit-category" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete delete-category" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        DOM.categoriesList.innerHTML = html;

        // Add event listeners
        DOM.categoriesList.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.category-actions')) {
                    this.openCategoryMessages(item.dataset.id);
                }
            });

            item.querySelector('.edit-category').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditCategoryModal(item.dataset.id);
            });

            item.querySelector('.delete-category').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCategory(item.dataset.id);
            });
        });
    },

    renderCategoryDropdowns() {
        const categories = AppState.categories;

        // Search filter
        let searchOptions = '<option value="">Todas categorias</option>';
        categories.forEach(cat => {
            searchOptions += `<option value="${cat.id}">${Utils.escapeHtml(cat.name)}</option>`;
        });
        DOM.searchCategoryFilter.innerHTML = searchOptions;

        // Edit message category
        let editOptions = '<option value="">Sem categoria</option>';
        categories.forEach(cat => {
            editOptions += `<option value="${cat.id}">${Utils.escapeHtml(cat.name)}</option>`;
        });
        DOM.editMessageCategory.innerHTML = editOptions;
        DOM.quickAddCategory.innerHTML = editOptions;

        // Category selector modal
        this.renderCategorySelector();
    },

    renderCategorySelector() {
        const categories = AppState.categories;

        let html = '';

        categories.forEach(cat => {
            html += `
                <div class="category-selector-item" data-id="${cat.id}">
                    <div class="category-color" style="background: ${cat.color}">
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
                    <div class="kanban-card-text">${Utils.escapeHtml(task.text)}</div>
                </div>
                ${category || dateText ? `
                    <div class="kanban-card-footer">
                        ${category ? `<span class="kanban-card-category" style="background: ${category.color}">${Utils.escapeHtml(category.name)}</span>` : '<span></span>'}
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
            const { message } = await API.messages.update(id, {
                text: DOM.editMessageText.value.trim(),
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
        if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

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
    async createCategory() {
        const name = DOM.categoryName.value.trim();

        if (!name) {
            showToast('Digite um nome para a categoria');
            return;
        }

        try {
            const { category } = await API.categories.create({
                name,
                color: AppState.selectedColorForCategory
            });

            AppState.categories.push(category);
            this.renderCategories();
            this.renderCategoryDropdowns();
            closeModal(DOM.categoryModal);
            resetCategoryModal();

            showToast('Categoria criada!');
        } catch (error) {
            showToast(error.message);
        }
    },

    async updateCategory(id) {
        const name = DOM.categoryName.value.trim();

        if (!name) {
            showToast('Digite um nome para a categoria');
            return;
        }

        try {
            const { category } = await API.categories.update(id, {
                name,
                color: AppState.selectedColorForCategory
            });

            // Update in state
            const index = AppState.categories.findIndex(c => c.id === id);
            if (index !== -1) {
                AppState.categories[index] = category;
            }

            this.renderCategories();
            this.renderCategoryDropdowns();
            this.renderMessages();
            closeModal(DOM.categoryModal);
            resetCategoryModal();

            showToast('Categoria atualizada!');
        } catch (error) {
            showToast(error.message);
        }
    },

    async deleteCategory(id) {
        if (!confirm('Tem certeza que deseja excluir esta categoria? As mensagens não serão excluídas.')) return;

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
        DOM.categoryBadge.style.background = category.color;
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
        DOM.categoryMessagesTitle.textContent = category.name;
        DOM.categoryMessagesTitle.style.color = category.color;

        this.renderCategoryMessagesView(categoryId);

        // Show category messages page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        DOM.categoryMessagesPage.classList.add('active');

        // Update nav
        DOM.bottomNav.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    },

    renderCategoryMessagesView(categoryId) {
        const messages = AppState.messages
            .filter(m => m.categoryId === categoryId)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        this.renderMessages(messages, DOM.categoryMessagesContainer);
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

        DOM.editMessageText.value = message.text;
        DOM.editMessageCategory.value = message.categoryId || '';
        DOM.editMessageIsTask.checked = message.isTask;
        DOM.editTaskDate.value = message.taskDate ? message.taskDate.split('T')[0] : '';
        DOM.editTaskTime.value = message.taskTime || '';

        DOM.editTaskFields.style.display = message.isTask ? 'block' : 'none';

        openModal(DOM.editMessageModal);
    },

    openEditCategoryModal(id) {
        const category = AppState.categories.find(c => c.id === id);
        if (!category) return;

        AppState.editingCategoryId = id;
        DOM.categoryModalTitle.textContent = 'Editar Categoria';
        DOM.categoryName.value = category.name;
        selectColorOption(category.color);

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
    async login(email, password) {
        try {
            const { user } = await API.auth.login(email, password);
            AppState.user = user;
            this.showMainApp();
            await this.loadInitialData();
            showToast('Bem-vindo de volta!');
        } catch (error) {
            if (error.pendingApproval) {
                showToast('Sua conta ainda não foi aprovada pelo admin.', 4000);
            } else {
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

        files.forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
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
                <button class="remove-image" onclick="App.removeImage(${index}, ${isCategory})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
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
        // Auth forms
        DOM.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login(DOM.loginEmail.value, DOM.loginPassword.value);
        });

        DOM.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.register(DOM.registerName.value, DOM.registerEmail.value, DOM.registerPassword.value);
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

        // Navigation
        DOM.bottomNav.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigateTo(btn.dataset.page);
            });
        });

        // Sidebar Navigation (Desktop)
        if (DOM.sidebar) {
            DOM.sidebar.querySelectorAll('.sidebar-nav-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.navigateTo(btn.dataset.page);
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
        DOM.sendBtn.addEventListener('click', async () => {
            const text = DOM.messageInput.value.trim();
            const hasImages = AppState.pendingImages.length > 0;
            
            if (!text && !hasImages) return;

            await this.createMessage(
                text,
                AppState.selectedCategoryId,
                AppState.isTaskMode,
                AppState.isTaskMode ? DOM.taskDate.value : null,
                AppState.isTaskMode ? DOM.taskTime.value : null,
                [...AppState.pendingImages]
            );

            DOM.messageInput.value = '';
            DOM.messageInput.style.height = 'auto';
            this.clearPendingImages(false);
            resetInputOptions();
        });

        DOM.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                DOM.sendBtn.click();
            }
        });

        DOM.messageInput.addEventListener('input', () => {
            DOM.messageInput.style.height = 'auto';
            DOM.messageInput.style.height = Math.min(DOM.messageInput.scrollHeight, 120) + 'px';
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

        // Search
        DOM.searchBtn.addEventListener('click', () => {
            DOM.searchBar.classList.toggle('active');
            if (DOM.searchBar.classList.contains('active')) {
                DOM.searchInput.focus();
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
            openModal(DOM.categoryModal);
        });

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

        // Color picker
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.addEventListener('click', () => selectColorOption(opt.dataset.color));
        });

        DOM.customColor.addEventListener('input', (e) => selectColorOption(e.target.value));

        // Category selector modal
        DOM.closeCategorySelectorModal.addEventListener('click', () => closeModal(DOM.categorySelectorModal));

        // Edit message modal
        DOM.closeEditMessageModal.addEventListener('click', () => closeModal(DOM.editMessageModal));
        DOM.editMessageIsTask.addEventListener('change', () => {
            DOM.editTaskFields.style.display = DOM.editMessageIsTask.checked ? 'block' : 'none';
        });
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

        // Category page input - Send message
        DOM.categorySendBtn.addEventListener('click', async () => {
            const text = DOM.categoryMessageInput.value.trim();
            const hasImages = AppState.categoryPendingImages.length > 0;
            
            if ((!text && !hasImages) || !AppState.viewingCategoryId) return;

            await this.createMessage(
                text,
                AppState.viewingCategoryId,
                AppState.isCategoryTaskMode,
                AppState.isCategoryTaskMode ? DOM.categoryTaskDate.value : null,
                AppState.isCategoryTaskMode ? DOM.categoryTaskTime.value : null,
                [...AppState.categoryPendingImages]
            );

            DOM.categoryMessageInput.value = '';
            DOM.categoryMessageInput.style.height = 'auto';
            this.clearPendingImages(true);
            
            // Reset task mode
            AppState.isCategoryTaskMode = false;
            DOM.categoryTaskOptions.style.display = 'none';
            DOM.categoryAddTaskBtn.classList.remove('active');
            
            // Re-render messages
            this.renderCategoryMessagesView(AppState.viewingCategoryId);
        });

        DOM.categoryMessageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                DOM.categorySendBtn.click();
            }
        });

        DOM.categoryMessageInput.addEventListener('input', () => {
            DOM.categoryMessageInput.style.height = 'auto';
            DOM.categoryMessageInput.style.height = Math.min(DOM.categoryMessageInput.scrollHeight, 120) + 'px';
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
        if (DOM.themeLightBtn) {
            DOM.themeLightBtn.addEventListener('click', () => ThemeManager.setTheme('light'));
        }
        if (DOM.themeDarkBtn) {
            DOM.themeDarkBtn.addEventListener('click', () => ThemeManager.setTheme('dark'));
        }
        if (DOM.themeSystemBtn) {
            DOM.themeSystemBtn.addEventListener('click', () => ThemeManager.setTheme('system'));
        }

        // Image attachment - Main chat
        if (DOM.attachImageBtn) {
            DOM.attachImageBtn.addEventListener('click', () => DOM.imageInput.click());
        }
        if (DOM.imageInput) {
            DOM.imageInput.addEventListener('change', (e) => this.handleImageSelect(e, false));
        }

        // Image attachment - Category page
        if (DOM.categoryAttachImageBtn) {
            DOM.categoryAttachImageBtn.addEventListener('click', () => DOM.categoryImageInput.click());
        }
        if (DOM.categoryImageInput) {
            DOM.categoryImageInput.addEventListener('change', (e) => this.handleImageSelect(e, true));
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
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
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
    }
};

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
    AppState.selectedColorForCategory = '#25D366';
    selectColorOption('#25D366');
}

function selectColorOption(color) {
    AppState.selectedColorForCategory = color;

    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === color) {
            opt.classList.add('selected');
        }
    });

    DOM.customColor.value = color;
}

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

// Make App globally available
window.App = App;

// Initialize app
document.addEventListener('DOMContentLoaded', () => App.init());
