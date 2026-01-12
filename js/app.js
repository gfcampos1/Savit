/**
 * SAVIT - App de Ideias e Notas
 * Aplicação mobile-first inspirada no WhatsApp
 */

// =============================================
// Data Models & Storage
// =============================================

const Storage = {
    MESSAGES_KEY: 'savit_messages',
    CATEGORIES_KEY: 'savit_categories',
    
    getMessages() {
        const data = localStorage.getItem(this.MESSAGES_KEY);
        return data ? JSON.parse(data) : [];
    },
    
    saveMessages(messages) {
        localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(messages));
    },
    
    getCategories() {
        const data = localStorage.getItem(this.CATEGORIES_KEY);
        return data ? JSON.parse(data) : this.getDefaultCategories();
    },
    
    saveCategories(categories) {
        localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
    },
    
    getDefaultCategories() {
        return [
            { id: 'cat_1', name: 'Pessoal', color: '#25D366' },
            { id: 'cat_2', name: 'Trabalho', color: '#34B7F1' },
            { id: 'cat_3', name: 'Ideias', color: '#9C27B0' }
        ];
    },
    
    exportData() {
        return {
            messages: this.getMessages(),
            categories: this.getCategories(),
            exportedAt: new Date().toISOString()
        };
    },
    
    importData(data) {
        if (data.messages) this.saveMessages(data.messages);
        if (data.categories) this.saveCategories(data.categories);
    },
    
    clearAll() {
        localStorage.removeItem(this.MESSAGES_KEY);
        localStorage.removeItem(this.CATEGORIES_KEY);
    }
};

// =============================================
// Utility Functions
// =============================================

const Utils = {
    generateId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    generateCategoryId() {
        return 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
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
    }
};

// =============================================
// App State
// =============================================

const AppState = {
    messages: [],
    categories: [],
    selectedCategoryId: null,
    isTaskMode: false,
    editingMessageId: null,
    editingCategoryId: null,
    selectedColorForCategory: '#25D366',
    searchQuery: '',
    searchCategory: '',
    searchDate: '',
    viewingCategoryId: null
};

// =============================================
// DOM Elements
// =============================================

const DOM = {
    // Containers
    messagesContainer: document.getElementById('messagesContainer'),
    emptyState: document.getElementById('emptyState'),
    
    // Header
    searchBtn: document.getElementById('searchBtn'),
    categoriesBtn: document.getElementById('categoriesBtn'),
    menuBtn: document.getElementById('menuBtn'),
    
    // Search
    searchBar: document.getElementById('searchBar'),
    searchInput: document.getElementById('searchInput'),
    closeSearchBtn: document.getElementById('closeSearchBtn'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    searchCategoryFilter: document.getElementById('searchCategoryFilter'),
    searchDateFilter: document.getElementById('searchDateFilter'),
    
    // Input
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
    
    // Panels
    categoriesPanel: document.getElementById('categoriesPanel'),
    closeCategoriesBtn: document.getElementById('closeCategoriesBtn'),
    newCategoryBtn: document.getElementById('newCategoryBtn'),
    categoriesList: document.getElementById('categoriesList'),
    categoryMessagesPanel: document.getElementById('categoryMessagesPanel'),
    closeCategoryMessagesBtn: document.getElementById('closeCategoryMessagesBtn'),
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
    
    // Context & Dropdown Menus
    contextMenu: document.getElementById('contextMenu'),
    dropdownMenu: document.getElementById('dropdownMenu'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    importDataBtn: document.getElementById('importDataBtn'),
    importFileInput: document.getElementById('importFileInput'),
    clearAllBtn: document.getElementById('clearAllBtn')
};

// =============================================
// Render Functions
// =============================================

function renderMessages(messages = null, container = DOM.messagesContainer) {
    const messagesToRender = messages || getFilteredMessages();
    
    if (messagesToRender.length === 0) {
        if (container === DOM.messagesContainer) {
            DOM.emptyState.style.display = 'flex';
        }
        container.innerHTML = '';
        if (container === DOM.messagesContainer) {
            container.appendChild(DOM.emptyState);
        }
        return;
    }
    
    if (container === DOM.messagesContainer) {
        DOM.emptyState.style.display = 'none';
    }
    
    // Group messages by date
    const groupedMessages = groupMessagesByDate(messagesToRender);
    
    let html = '';
    
    for (const [date, msgs] of Object.entries(groupedMessages)) {
        html += `<div class="date-separator"><span>${date}</span></div>`;
        
        msgs.forEach(msg => {
            html += renderMessageBubble(msg);
        });
    }
    
    container.innerHTML = html;
    
    // Scroll to bottom if main container
    if (container === DOM.messagesContainer) {
        scrollToBottom();
    }
    
    // Add event listeners to task checkboxes
    container.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            const messageId = checkbox.closest('.message').dataset.id;
            toggleTaskComplete(messageId);
        });
    });
    
    // Add event listeners to messages
    container.querySelectorAll('.message').forEach(message => {
        message.addEventListener('click', () => {
            openEditMessageModal(message.dataset.id);
        });
        
        message.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, message.dataset.id);
        });
        
        // Long press for mobile
        let pressTimer;
        message.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                showContextMenu(e, message.dataset.id);
            }, 500);
        });
        
        message.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
        
        message.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        });
    });
}

function renderMessageBubble(msg) {
    const category = AppState.categories.find(c => c.id === msg.categoryId);
    const isOverdue = Utils.isTaskOverdue(msg.taskDate, msg.taskTime, msg.taskCompleted);
    
    let classNames = ['message'];
    if (msg.isTask && msg.taskCompleted) classNames.push('task-completed');
    if (isOverdue) classNames.push('task-overdue');
    
    let html = `<div class="${classNames.join(' ')}" data-id="${msg.id}">`;
    
    // Category badge
    if (category) {
        html += `<span class="message-category" style="background: ${category.color}">${Utils.escapeHtml(category.name)}</span>`;
    }
    
    // Message text
    html += `<div class="message-text">${Utils.escapeHtml(msg.text)}</div>`;
    
    // Task section
    if (msg.isTask) {
        html += `
            <div class="message-task">
                <div class="task-checkbox ${msg.taskCompleted ? 'completed' : ''}">
                    ${msg.taskCompleted ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-info">
                    <div class="task-label">${msg.taskCompleted ? 'Concluída' : 'Tarefa pendente'}</div>
                    ${msg.taskDate ? `
                        <div class="task-datetime">
                            <span><i class="fas fa-calendar"></i> ${Utils.formatFullDate(msg.taskDate)}</span>
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
}

function groupMessagesByDate(messages) {
    const groups = {};
    
    messages.forEach(msg => {
        const dateKey = Utils.formatDate(msg.createdAt);
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(msg);
    });
    
    return groups;
}

function renderCategories() {
    const categories = AppState.categories;
    
    if (categories.length === 0) {
        DOM.categoriesList.innerHTML = `
            <div class="no-categories">
                <i class="fas fa-folder-open"></i>
                <p>Nenhuma categoria criada</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    categories.forEach(cat => {
        const messageCount = AppState.messages.filter(m => m.categoryId === cat.id).length;
        
        html += `
            <div class="category-item" data-id="${cat.id}">
                <div class="category-color" style="background: ${cat.color}">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="category-info">
                    <div class="category-name">${Utils.escapeHtml(cat.name)}</div>
                    <div class="category-count">${messageCount} ${messageCount === 1 ? 'mensagem' : 'mensagens'}</div>
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
                openCategoryMessages(item.dataset.id);
            }
        });
        
        item.querySelector('.edit-category').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditCategoryModal(item.dataset.id);
        });
        
        item.querySelector('.delete-category').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCategory(item.dataset.id);
        });
    });
}

function renderCategorySelector() {
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
            <div class="no-categories">
                <p>Nenhuma categoria disponível</p>
                <p class="text-muted">Crie uma categoria primeiro</p>
            </div>
        `;
    }
    
    DOM.categorySelectorList.innerHTML = html;
    
    // Add event listeners
    DOM.categorySelectorList.querySelectorAll('.category-selector-item').forEach(item => {
        item.addEventListener('click', () => {
            selectCategory(item.dataset.id);
            closeModal(DOM.categorySelectorModal);
        });
    });
}

function renderCategoryDropdowns() {
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
}

// =============================================
// Message Functions
// =============================================

function createMessage() {
    const text = DOM.messageInput.value.trim();
    
    if (!text) return;
    
    const message = {
        id: Utils.generateId(),
        text: text,
        categoryId: AppState.selectedCategoryId,
        isTask: AppState.isTaskMode,
        taskDate: AppState.isTaskMode ? DOM.taskDate.value : null,
        taskTime: AppState.isTaskMode ? DOM.taskTime.value : null,
        taskCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    AppState.messages.push(message);
    Storage.saveMessages(AppState.messages);
    
    // Reset input
    DOM.messageInput.value = '';
    DOM.messageInput.style.height = 'auto';
    resetInputOptions();
    
    renderMessages();
}

function updateMessage(id) {
    const message = AppState.messages.find(m => m.id === id);
    if (!message) return;
    
    message.text = DOM.editMessageText.value.trim();
    message.categoryId = DOM.editMessageCategory.value || null;
    message.isTask = DOM.editMessageIsTask.checked;
    message.taskDate = DOM.editMessageIsTask.checked ? DOM.editTaskDate.value : null;
    message.taskTime = DOM.editMessageIsTask.checked ? DOM.editTaskTime.value : null;
    message.updatedAt = new Date().toISOString();
    
    Storage.saveMessages(AppState.messages);
    renderMessages();
    
    // If viewing category messages, update that too
    if (AppState.viewingCategoryId) {
        renderCategoryMessages(AppState.viewingCategoryId);
    }
}

function deleteMessage(id) {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;
    
    AppState.messages = AppState.messages.filter(m => m.id !== id);
    Storage.saveMessages(AppState.messages);
    
    renderMessages();
    renderCategories();
    
    // If viewing category messages, update that too
    if (AppState.viewingCategoryId) {
        renderCategoryMessages(AppState.viewingCategoryId);
    }
}

function toggleTaskComplete(id) {
    const message = AppState.messages.find(m => m.id === id);
    if (!message || !message.isTask) return;
    
    message.taskCompleted = !message.taskCompleted;
    message.updatedAt = new Date().toISOString();
    
    Storage.saveMessages(AppState.messages);
    renderMessages();
    
    // If viewing category messages, update that too
    if (AppState.viewingCategoryId) {
        renderCategoryMessages(AppState.viewingCategoryId);
    }
    
    showToast(message.taskCompleted ? 'Tarefa concluída!' : 'Tarefa reaberta');
}

function copyMessage(id) {
    const message = AppState.messages.find(m => m.id === id);
    if (!message) return;
    
    navigator.clipboard.writeText(message.text).then(() => {
        showToast('Mensagem copiada!');
    }).catch(() => {
        showToast('Erro ao copiar');
    });
}

// =============================================
// Category Functions
// =============================================

function createCategory() {
    const name = DOM.categoryName.value.trim();
    
    if (!name) {
        showToast('Digite um nome para a categoria');
        return;
    }
    
    const category = {
        id: Utils.generateCategoryId(),
        name: name,
        color: AppState.selectedColorForCategory
    };
    
    AppState.categories.push(category);
    Storage.saveCategories(AppState.categories);
    
    renderCategories();
    renderCategoryDropdowns();
    closeModal(DOM.categoryModal);
    resetCategoryModal();
    
    showToast('Categoria criada!');
}

function updateCategory(id) {
    const category = AppState.categories.find(c => c.id === id);
    if (!category) return;
    
    const name = DOM.categoryName.value.trim();
    if (!name) {
        showToast('Digite um nome para a categoria');
        return;
    }
    
    category.name = name;
    category.color = AppState.selectedColorForCategory;
    
    Storage.saveCategories(AppState.categories);
    
    renderCategories();
    renderCategoryDropdowns();
    renderMessages();
    closeModal(DOM.categoryModal);
    resetCategoryModal();
    
    showToast('Categoria atualizada!');
}

function deleteCategory(id) {
    if (!confirm('Tem certeza que deseja excluir esta categoria? As mensagens não serão excluídas.')) return;
    
    AppState.categories = AppState.categories.filter(c => c.id !== id);
    Storage.saveCategories(AppState.categories);
    
    // Remove category from messages
    AppState.messages.forEach(msg => {
        if (msg.categoryId === id) {
            msg.categoryId = null;
        }
    });
    Storage.saveMessages(AppState.messages);
    
    renderCategories();
    renderCategoryDropdowns();
    renderMessages();
    
    showToast('Categoria excluída!');
}

function selectCategory(id) {
    const category = AppState.categories.find(c => c.id === id);
    if (!category) return;
    
    AppState.selectedCategoryId = id;
    DOM.categoryBadge.textContent = category.name;
    DOM.categoryBadge.style.background = category.color;
    DOM.selectedCategory.style.display = 'flex';
    DOM.addCategoryBtn.classList.add('active');
}

function clearSelectedCategory() {
    AppState.selectedCategoryId = null;
    DOM.selectedCategory.style.display = 'none';
    DOM.addCategoryBtn.classList.remove('active');
}

// =============================================
// Search & Filter Functions
// =============================================

function getFilteredMessages() {
    let messages = [...AppState.messages];
    
    // Sort by date (newest last)
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Apply search filters
    if (AppState.searchQuery) {
        const query = AppState.searchQuery.toLowerCase();
        messages = messages.filter(m => {
            const category = AppState.categories.find(c => c.id === m.categoryId);
            return m.text.toLowerCase().includes(query) ||
                   (category && category.name.toLowerCase().includes(query));
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
}

function performSearch() {
    AppState.searchQuery = DOM.searchInput.value;
    AppState.searchCategory = DOM.searchCategoryFilter.value;
    AppState.searchDate = DOM.searchDateFilter.value;
    
    renderMessages();
}

function clearSearch() {
    DOM.searchInput.value = '';
    DOM.searchCategoryFilter.value = '';
    DOM.searchDateFilter.value = '';
    AppState.searchQuery = '';
    AppState.searchCategory = '';
    AppState.searchDate = '';
    
    renderMessages();
}

// =============================================
// Panel Functions
// =============================================

function openCategoriesPanel() {
    DOM.categoriesPanel.classList.add('active');
    renderCategories();
}

function closeCategoriesPanel() {
    DOM.categoriesPanel.classList.remove('active');
}

function openCategoryMessages(categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    AppState.viewingCategoryId = categoryId;
    DOM.categoryMessagesTitle.textContent = category.name;
    DOM.categoryMessagesTitle.style.color = category.color;
    
    renderCategoryMessages(categoryId);
    
    DOM.categoryMessagesPanel.classList.add('active');
}

function renderCategoryMessages(categoryId) {
    const messages = AppState.messages
        .filter(m => m.categoryId === categoryId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    if (messages.length === 0) {
        DOM.categoryMessagesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h2>Nenhuma mensagem</h2>
                <p>Esta categoria ainda não tem mensagens</p>
            </div>
        `;
        return;
    }
    
    renderMessages(messages, DOM.categoryMessagesContainer);
}

function closeCategoryMessagesPanel() {
    DOM.categoryMessagesPanel.classList.remove('active');
    AppState.viewingCategoryId = null;
}

// =============================================
// Modal Functions
// =============================================

function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function openCategorySelectorModal() {
    renderCategorySelector();
    openModal(DOM.categorySelectorModal);
}

function openNewCategoryModal() {
    AppState.editingCategoryId = null;
    DOM.categoryModalTitle.textContent = 'Nova Categoria';
    resetCategoryModal();
    openModal(DOM.categoryModal);
}

function openEditCategoryModal(id) {
    const category = AppState.categories.find(c => c.id === id);
    if (!category) return;
    
    AppState.editingCategoryId = id;
    DOM.categoryModalTitle.textContent = 'Editar Categoria';
    DOM.categoryName.value = category.name;
    selectColorOption(category.color);
    
    openModal(DOM.categoryModal);
}

function resetCategoryModal() {
    DOM.categoryName.value = '';
    AppState.selectedColorForCategory = '#25D366';
    selectColorOption('#25D366');
}

function selectColorOption(color) {
    AppState.selectedColorForCategory = color;
    
    // Update UI
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === color) {
            opt.classList.add('selected');
        }
    });
    
    DOM.customColor.value = color;
}

function openEditMessageModal(id) {
    const message = AppState.messages.find(m => m.id === id);
    if (!message) return;
    
    AppState.editingMessageId = id;
    
    DOM.editMessageText.value = message.text;
    DOM.editMessageCategory.value = message.categoryId || '';
    DOM.editMessageIsTask.checked = message.isTask;
    DOM.editTaskDate.value = message.taskDate || '';
    DOM.editTaskTime.value = message.taskTime || '';
    
    DOM.editTaskFields.style.display = message.isTask ? 'block' : 'none';
    
    openModal(DOM.editMessageModal);
}

// =============================================
// Context Menu Functions
// =============================================

let contextMenuMessageId = null;

function showContextMenu(e, messageId) {
    contextMenuMessageId = messageId;
    
    const x = e.clientX || e.touches[0].clientX;
    const y = e.clientY || e.touches[0].clientY;
    
    DOM.contextMenu.style.left = `${Math.min(x, window.innerWidth - 160)}px`;
    DOM.contextMenu.style.top = `${Math.min(y, window.innerHeight - 150)}px`;
    
    DOM.contextMenu.classList.add('active');
}

function hideContextMenu() {
    DOM.contextMenu.classList.remove('active');
    contextMenuMessageId = null;
}

// =============================================
// Dropdown Menu Functions
// =============================================

function toggleDropdownMenu() {
    DOM.dropdownMenu.classList.toggle('active');
}

function hideDropdownMenu() {
    DOM.dropdownMenu.classList.remove('active');
}

// =============================================
// Data Export/Import Functions
// =============================================

function exportData() {
    const data = Storage.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `savit_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    hideDropdownMenu();
    showToast('Dados exportados!');
}

function importData(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.messages && !data.categories) {
                showToast('Arquivo inválido');
                return;
            }
            
            if (confirm('Isso irá substituir todos os dados atuais. Continuar?')) {
                Storage.importData(data);
                loadData();
                showToast('Dados importados!');
            }
        } catch (err) {
            showToast('Erro ao importar arquivo');
        }
    };
    
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('Tem certeza que deseja excluir TODOS os dados? Esta ação não pode ser desfeita.')) {
        Storage.clearAll();
        loadData();
        hideDropdownMenu();
        showToast('Todos os dados foram excluídos');
    }
}

// =============================================
// UI Helper Functions
// =============================================

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

function toggleTaskMode() {
    AppState.isTaskMode = !AppState.isTaskMode;
    
    DOM.taskOptions.style.display = AppState.isTaskMode ? 'block' : 'none';
    DOM.addTaskBtn.classList.toggle('active', AppState.isTaskMode);
    
    if (AppState.isTaskMode) {
        // Set default date to today
        DOM.taskDate.value = new Date().toISOString().split('T')[0];
    }
}

function scrollToBottom() {
    setTimeout(() => {
        DOM.messagesContainer.scrollTop = DOM.messagesContainer.scrollHeight;
    }, 100);
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function showToast(message, duration = 2000) {
    // Remove existing toast
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
// Event Listeners
// =============================================

function setupEventListeners() {
    // Send message
    DOM.sendBtn.addEventListener('click', createMessage);
    
    DOM.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            createMessage();
        }
    });
    
    DOM.messageInput.addEventListener('input', () => {
        autoResizeTextarea(DOM.messageInput);
    });
    
    // Input options
    DOM.addCategoryBtn.addEventListener('click', () => {
        if (AppState.selectedCategoryId) {
            clearSelectedCategory();
        } else {
            openCategorySelectorModal();
        }
    });
    
    DOM.addTaskBtn.addEventListener('click', toggleTaskMode);
    DOM.removeCategoryBtn.addEventListener('click', clearSelectedCategory);
    DOM.removeTaskBtn.addEventListener('click', toggleTaskMode);
    
    // Header buttons
    DOM.searchBtn.addEventListener('click', () => {
        DOM.searchBar.classList.toggle('active');
        if (DOM.searchBar.classList.contains('active')) {
            DOM.searchInput.focus();
        } else {
            clearSearch();
        }
    });
    
    DOM.categoriesBtn.addEventListener('click', openCategoriesPanel);
    DOM.menuBtn.addEventListener('click', toggleDropdownMenu);
    
    // Search
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
    
    // Categories panel
    DOM.closeCategoriesBtn.addEventListener('click', closeCategoriesPanel);
    DOM.newCategoryBtn.addEventListener('click', openNewCategoryModal);
    
    // Category messages panel
    DOM.closeCategoryMessagesBtn.addEventListener('click', closeCategoryMessagesPanel);
    
    // Category selector modal
    DOM.closeCategorySelectorModal.addEventListener('click', () => {
        closeModal(DOM.categorySelectorModal);
    });
    
    // Category modal
    DOM.closeCategoryModal.addEventListener('click', () => {
        closeModal(DOM.categoryModal);
    });
    
    DOM.cancelCategoryBtn.addEventListener('click', () => {
        closeModal(DOM.categoryModal);
    });
    
    DOM.saveCategoryBtn.addEventListener('click', () => {
        if (AppState.editingCategoryId) {
            updateCategory(AppState.editingCategoryId);
        } else {
            createCategory();
        }
    });
    
    // Color picker
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
            selectColorOption(opt.dataset.color);
        });
    });
    
    DOM.customColor.addEventListener('input', (e) => {
        selectColorOption(e.target.value);
    });
    
    // Edit message modal
    DOM.closeEditMessageModal.addEventListener('click', () => {
        closeModal(DOM.editMessageModal);
    });
    
    DOM.editMessageIsTask.addEventListener('change', () => {
        DOM.editTaskFields.style.display = DOM.editMessageIsTask.checked ? 'block' : 'none';
    });
    
    DOM.saveEditMessageBtn.addEventListener('click', () => {
        updateMessage(AppState.editingMessageId);
        closeModal(DOM.editMessageModal);
    });
    
    DOM.deleteMessageBtn.addEventListener('click', () => {
        deleteMessage(AppState.editingMessageId);
        closeModal(DOM.editMessageModal);
    });
    
    // Context menu
    DOM.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            
            if (action === 'edit') {
                openEditMessageModal(contextMenuMessageId);
            } else if (action === 'copy') {
                copyMessage(contextMenuMessageId);
            } else if (action === 'delete') {
                deleteMessage(contextMenuMessageId);
            }
            
            hideContextMenu();
        });
    });
    
    // Dropdown menu
    DOM.exportDataBtn.addEventListener('click', exportData);
    
    DOM.importDataBtn.addEventListener('click', () => {
        DOM.importFileInput.click();
        hideDropdownMenu();
    });
    
    DOM.importFileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importData(e.target.files[0]);
        }
    });
    
    DOM.clearAllBtn.addEventListener('click', clearAllData);
    
    // Close menus on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu') && !e.target.closest('.message')) {
            hideContextMenu();
        }
        
        if (!e.target.closest('.dropdown-menu') && !e.target.closest('#menuBtn')) {
            hideDropdownMenu();
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
    
    // Handle back button on mobile (close panels)
    window.addEventListener('popstate', () => {
        if (DOM.categoryMessagesPanel.classList.contains('active')) {
            closeCategoryMessagesPanel();
        } else if (DOM.categoriesPanel.classList.contains('active')) {
            closeCategoriesPanel();
        }
    });
}

// =============================================
// Initialization
// =============================================

function loadData() {
    AppState.messages = Storage.getMessages();
    AppState.categories = Storage.getCategories();
    
    renderMessages();
    renderCategories();
    renderCategoryDropdowns();
}

function init() {
    loadData();
    setupEventListeners();
    
    // Set default date for task
    DOM.taskDate.value = new Date().toISOString().split('T')[0];
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
