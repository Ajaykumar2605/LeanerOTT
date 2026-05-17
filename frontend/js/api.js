const API_BASE = '/api';

const api = {
    async request(endpoint, method = 'GET', body = null) {
            // Show global progress bar
            const progressBar = document.getElementById('globalProgress');
            if (progressBar) {
                progressBar.classList.add('active');
                progressBar.style.width = '0%';
                // Trigger a tiny animation to start filling
                setTimeout(() => { progressBar.style.width = '80%'; }, 10);
            }
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = { method, headers };
        if (body) {
            // If body is FormData (for uploads), browser sets Content-Type automatically
            if (body instanceof FormData) {
                delete headers['Content-Type'];
                options.body = body;
            } else {
                options.body = JSON.stringify(body);
            }
        }

        const cleanup = () => {
            if (progressBar) {
                progressBar.style.width = '100%';
                setTimeout(() => { progressBar.classList.remove('active'); }, 300);
            }
        };

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, options);
            let data;
            try {
                data = await response.json();
            } catch (e) {
                cleanup();
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }
            
            cleanup();
            if (!response.ok) throw new Error(data.error || 'API Error');
            return data;
        } catch (error) {
            cleanup();
            console.error('API Request failed:', error);
            throw error;
        }
    },

    auth: {
        login: (username, password) => api.request('/auth/login', 'POST', { username, password }),
        register: (username, password, role) => api.request('/auth/register', 'POST', { username, password, role })
    },

    files: {
        getFiles: (params) => {
            const query = new URLSearchParams(params).toString();
            return api.request(`/files?${query}`);
        },
        uploadFile: (formData) => api.request('/files/upload', 'POST', formData),
        deleteFile: (id) => api.request(`/files/${id}`, 'DELETE'),
        updateFile: (id, data) => api.request(`/files/${id}`, 'PUT', data)
    },

    favorites: {
        toggle: (fileId) => api.request(`/favorites/${fileId}`, 'POST'),
        getFavorites: () => api.request('/favorites', 'GET'),
        getFavoriteIds: () => api.request('/favorites/ids', 'GET')
    }
};
