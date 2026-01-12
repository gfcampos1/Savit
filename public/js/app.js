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
    editingMessageId: null,
    editingCategoryId: null,
    selectedColorForCategory: '#25D366',
    searchQuery: '',
    searchCategory: '',
    searchDate: '',
    viewingCategoryId: null,
    isLoading: false
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
    pagesContainer: document.getElementById('pagesContainer'),

    // Pages
    homePage: document.getElementById('homePage'),
    chatPage: document.getElementById('chatPage'),
    categoriesPage: document.getElementById('categoriesPage'),
    profilePage: document.getElementById('profilePage'),
    categoryMessagesPage: document.getElementById('categoryMessagesPage'),

    // Home Page
    userName: document.getElementById('userName'),
    headerDate: document.getElementById('headerDate'),
    statTotalMessages: document.getElementById('statTotalMessages'),
    statToday: document.getElementById('statToday'),
    statPendingTasks: document.getElementById('statPendingTasks'),
    statStreak: document.getElementById('statStreak'),
    activityChart: document.getElementById('activityChart'),
    taskProgress: document.getElementById('taskProgress'),
    completedTasks: document.getElementById('completedTasks'),
    pendingTasksDetail: document.getElementById('pendingTasksDetail'),
    taskAlerts: document.getElementById('taskAlerts'),
    topCategories: document.getElementById('topCategories'),
    recentMessages: document.getElementById('recentMessages'),
    upcomingTasks: document.getElementById('upcomingTasks'),
    quickAddBtn: document.getElementById('quickAddBtn'),
    viewAllMessages: document.getElementById('viewAllMessages'),

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
    selectedCategory: document.getElementById('selectedCategory'),
    categoryBadge: document.getElementById('categoryBadge'),
    removeCategoryBtn: document.getElementById('removeCategoryBtn'),
    taskOptions: document.getElementById('taskOptions'),
    removeTaskBtn: document.getElementById('removeTaskBtn'),
    taskDate: document.getElementById('taskDate'),
    taskTime: document.getElementById('taskTime'),

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
            DOM.userName.textContent = AppState.user.name.split(' ')[0];
            DOM.profileName.textContent = AppState.user.name;
            DOM.profileEmail.textContent = AppState.user.email;
        }

        DOM.headerDate.textContent = Utils.formatDateHeader();
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

        // Update nav
        DOM.bottomNav.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

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

        // Task progress
        DOM.taskProgress.style.width = `${stats.tasks.completionRate}%`;
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

        // Message text
        html += `<div class="message-text">${Utils.escapeHtml(msg.text)}</div>`;

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

    renderProfile() {
        if (AppState.user) {
            DOM.profileName.textContent = AppState.user.name;
            DOM.profileEmail.textContent = AppState.user.email;
        }
    },

    // Message operations
    async createMessage(text, categoryId, isTask, taskDate, taskTime) {
        try {
            const { message } = await API.messages.create({
                text,
                categoryId: categoryId || null,
                isTask: isTask || false,
                taskDate: taskDate || null,
                taskTime: taskTime || null
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
            showToast(error.message);
        }
    },

    async register(name, email, password) {
        try {
            const { user } = await API.auth.register(name, email, password);
            AppState.user = user;
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
            if (!text) return;

            await this.createMessage(
                text,
                AppState.selectedCategoryId,
                AppState.isTaskMode,
                AppState.isTaskMode ? DOM.taskDate.value : null,
                AppState.isTaskMode ? DOM.taskTime.value : null
            );

            DOM.messageInput.value = '';
            DOM.messageInput.style.height = 'auto';
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
