/**
 * SAVIT - API Client
 * Handles all API communication
 */

const API = {
    baseUrl: '/api',
    token: null,

    // Set auth token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('savit_token', token);
        } else {
            localStorage.removeItem('savit_token');
        }
    },

    // Get stored token
    getToken() {
        if (!this.token) {
            this.token = localStorage.getItem('savit_token');
        }
        return this.token;
    },

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            credentials: 'include',
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Handle 401 - redirect to login
                if (response.status === 401) {
                    this.setToken(null);
                    if (window.App && window.App.showAuthScreen) {
                        window.App.showAuthScreen();
                    }
                }
                throw new Error(data.error || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    auth: {
        async login(email, password) {
            const data = await API.request('/auth/login', {
                method: 'POST',
                body: { email, password }
            });
            API.setToken(data.token);
            return data;
        },

        async register(name, email, password) {
            const data = await API.request('/auth/register', {
                method: 'POST',
                body: { name, email, password }
            });
            API.setToken(data.token);
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
