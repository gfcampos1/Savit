/**
 * SAVIT - API Client
 * Handles all API communication
 */

const API = {
    baseUrl: '/api',
    token: null,
    _refreshPromise: null,

    async fetchWithTimeout(url, config, timeoutMs) {
        const ms = typeof timeoutMs === 'number' && timeoutMs > 0 ? timeoutMs : 15000;

        // AbortController is supported by modern browsers (including iOS 15+).
        if (typeof AbortController !== 'undefined') {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), ms);
            try {
                const res = await fetch(url, { ...config, signal: controller.signal });
                return res;
            } finally {
                clearTimeout(timeoutId);
            }
        }

        // Fallback: no abort support; just do a normal fetch.
        return fetch(url, config);
    },

    // Set auth token
    setToken(token) {
        // Deprecated: auth is cookie-based (httpOnly).
        this.token = null;
    },

    // Get stored token
    getToken() {
        return null;
    },

    getCookie(name) {
        const cookies = document.cookie ? document.cookie.split(';') : [];
        for (const cookie of cookies) {
            const [k, ...rest] = cookie.trim().split('=');
            if (k === name) return decodeURIComponent(rest.join('='));
        }
        return null;
    },

    async ensureCsrf() {
        // If CSRF cookie isn't present yet, request one.
        const existing = this.getCookie('csrf_token');
        if (existing) return;
        try {
            await fetch(`${this.baseUrl}/auth/csrf`, {
                method: 'GET',
                credentials: 'include'
            });
        } catch {
            // Ignore; server may be offline
        }
    },

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        await this.ensureCsrf();
        const csrf = this.getCookie('csrf_token');

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(csrf && { 'X-CSRF-Token': csrf }),
                ...options.headers
            },
            credentials: 'include',
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await this.fetchWithTimeout(url, config, options.timeoutMs);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                // Handle 401: try refresh once (except for auth endpoints)
                if (response.status === 401 && !options._retry) {
                    const isAuthEndpoint = endpoint.startsWith('/auth/login')
                        || endpoint.startsWith('/auth/register')
                        || endpoint.startsWith('/auth/refresh');

                    if (!isAuthEndpoint) {
                        try {
                            if (!this._refreshPromise) {
                                this._refreshPromise = this.request('/auth/refresh', { method: 'POST', body: {}, _retry: true })
                                    .finally(() => { this._refreshPromise = null; });
                            }
                            await this._refreshPromise;
                            return this.request(endpoint, { ...options, _retry: true });
                        } catch {
                            // fallthrough to redirect
                        }
                    }

                    this.setToken(null);
                    if (window.App && window.App.showAuthScreen) {
                        window.App.showAuthScreen();
                    }
                }
                // Preserve pendingApproval flag for login errors
                const error = new Error(data.error || 'Erro na requisição');
                if (data.pendingApproval) {
                    error.pendingApproval = true;
                }
                throw error;
            }

            return data;
        } catch (error) {
            // Normalize AbortError into a friendly message.
            if (error && (error.name === 'AbortError' || String(error).includes('AbortError'))) {
                throw new Error('Tempo esgotado. Verifique sua conexão e tente novamente.');
            }
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    auth: {
        async login(email, password, mfaCode) {
            const data = await API.request('/auth/login', {
                method: 'POST',
                body: { email, password, ...(mfaCode ? { mfaCode } : {}) }
            });
            return data;
        },

        async refresh() {
            return API.request('/auth/refresh', { method: 'POST', body: {} });
        },

        async register(name, email, password) {
            const data = await API.request('/auth/register', {
                method: 'POST',
                body: { name, email, password }
            });
            return data;
        },

        async logout() {
            await API.request('/auth/logout', { method: 'POST' });
            API.setToken(null);
        },

        async me() {
            return API.request('/auth/me');
        },

        async updateProfile(data) {
            return API.request('/auth/profile', {
                method: 'PUT',
                body: data
            });
        },

        async changePassword(currentPassword, newPassword) {
            return API.request('/auth/password', {
                method: 'PUT',
                body: { currentPassword, newPassword }
            });
        },

        async logoutAll() {
            return API.request('/auth/logout-all', { method: 'POST', body: {} });
        }
    },

    // Messages endpoints
    messages: {
        async getAll(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return API.request(`/messages${queryString ? '?' + queryString : ''}`);
        },

        async get(id) {
            return API.request(`/messages/${id}`);
        },

        async create(data) {
            return API.request('/messages', {
                method: 'POST',
                body: data
            });
        },

        async update(id, data) {
            return API.request(`/messages/${id}`, {
                method: 'PUT',
                body: data
            });
        },

        async toggle(id) {
            return API.request(`/messages/${id}/toggle`, {
                method: 'PATCH'
            });
        },

        async delete(id) {
            return API.request(`/messages/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // Categories endpoints
    categories: {
        async getAll() {
            return API.request('/categories');
        },

        async getSections() {
            return API.request('/categories/sections');
        },

        async createSection(data) {
            return API.request('/categories/sections', {
                method: 'POST',
                body: data
            });
        },

        async updateSection(id, data) {
            return API.request(`/categories/sections/${id}`, {
                method: 'PUT',
                body: data
            });
        },

        async deleteSection(id) {
            return API.request(`/categories/sections/${id}`, {
                method: 'DELETE'
            });
        },

        async reorderSections(orderedIds) {
            return API.request('/categories/sections/reorder', {
                method: 'POST',
                body: { orderedIds: Array.isArray(orderedIds) ? orderedIds : [] }
            });
        },

        async get(id) {
            return API.request(`/categories/${id}`);
        },

        async create(data) {
            return API.request('/categories', {
                method: 'POST',
                body: data
            });
        },

        async update(id, data) {
            return API.request(`/categories/${id}`, {
                method: 'PUT',
                body: data
            });
        },

        async delete(id) {
            return API.request(`/categories/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // Stats endpoints
    stats: {
        async dashboard() {
            return API.request('/stats/dashboard');
        },

        async activity(days = 30) {
            return API.request(`/stats/activity?days=${days}`);
        }
    }
};

// Make API globally available
window.API = API;
