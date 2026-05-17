class App {
    constructor() {
        this.user = null;
        this.currentView = 'home';
        this.currentParams = { page: 1, limit: 10, search: '', sort: 'newest', type: '', tags: '' };
        this.favoriteIds = [];
        
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        
        if (!this.user) {
            this.navigateAuth('Login');
        } else {
            this.loadFavoriteIds().then(() => {
                this.renderNavbar();
                this.renderSidebar();
                this.navigate(this.user.role === 'admin' ? 'admin' : 'home');
            });
        }
        
        // Scroll to top logic
        window.addEventListener('scroll', () => {
            const btn = document.getElementById('scrollToTopBtn');
            if (window.scrollY > 300) btn.style.display = 'block';
            else btn.style.display = 'none';
        });
        document.getElementById('scrollToTopBtn').addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            try {
                this.user = JSON.parse(userStr);
            } catch(e) {
                this.logout();
            }
        }
    }

    renderNavbar() {
        const authSection = document.getElementById('authSection');
        if (this.user) {
            authSection.innerHTML = `
                <span style="color:var(--text-muted); margin-right: 15px;">Hi, ${this.user.username}</span>
                <button class="btn btn-secondary" onclick="window.app.logout()">Logout</button>
            `;
        } else {
            authSection.innerHTML = `
                <button class="btn btn-secondary" onclick="window.app.navigateAuth('Login')">Login</button>
                <button class="btn primary-btn glow-btn" onclick="window.app.navigateAuth('Register')">Register</button>
            `;
        }
    }

    renderSidebar() {
        const adminLinks = document.getElementById('adminLinks');
        if (this.user && this.user.role === 'admin') {
            adminLinks.innerHTML = `<li data-view="admin" onclick="window.app.navigate('admin')"><i class="fa-solid fa-shield-halved"></i> Admin Panel</li>`;
        } else {
            adminLinks.innerHTML = '';
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.user = null;
        this.navigateAuth('Login');
    }

    navigate(view) {
        if (!this.user && view !== 'login') {
            return this.navigateAuth('Login');
        }
        
        if (view === 'login') {
            document.body.classList.add('login-mode');
        } else {
            document.body.classList.remove('login-mode');
        }

        this.currentView = view;
        const viewContainer = document.getElementById('viewContainer');
        
        // Update sidebar active state
        document.querySelectorAll('.sidebar-menu li').forEach(li => {
            li.classList.remove('active');
            if(li.dataset.view === view) li.classList.add('active');
        });

        // Set content
        viewContainer.innerHTML = views[view] || views.home;
        window.appAnimations.pageTransition('viewContainer');

        if (view === 'home') {
            this.loadHome();
        } else if (view === 'allFiles') {
            // Show only 8 cards on All Files view
            this.currentParams.limit = 8;
            this.currentParams.page = 1; // Reset pagination on nav
            this.loadFiles();
        } else if (view === 'favorites') {
            this.loadFavorites();
        } else if (view === 'admin') {
            if(!this.user || this.user.role !== 'admin') return this.navigate('home');
            this.loadAdminFiles();
            this.setupAdminForms();
        } else if (view === 'login') {
            this.setupAuthForms();
        }

        // Close mobile sidebar on navigate
        document.getElementById('sidebar').classList.remove('open');
    }

    async loadHome() {
        try {
            document.getElementById('loadingIndicator').style.display = 'block';
            
            // Fetch Trending (Newest, limit 4)
            const trendingData = await api.files.getFiles({ limit: 4, sort: 'newest', search: this.currentParams.search, type: this.currentParams.type });
            const trendingGrid = document.getElementById('trendingGrid');
            if (trendingGrid) {
                trendingGrid.innerHTML = trendingData.files.map(renderOTTCard).join('');
            }
            
            // Fetch All Docs (limit 12)
            const allDocsData = await api.files.getFiles({ limit: 12, sort: 'a-z', search: this.currentParams.search, type: this.currentParams.type });
            const allDocsGrid = document.getElementById('allDocsGrid');
            if (allDocsGrid) {
                allDocsGrid.innerHTML = allDocsData.files.map(renderOTTCard).join('');
            }
            
            document.getElementById('loadingIndicator').style.display = 'none';
            window.appAnimations.staggerCards();
        } catch(err) {
            document.getElementById('loadingIndicator').style.display = 'none';
            console.error(err);
        }
    }

    async loadFiles(page = null) {
        if (page) this.currentParams.page = page;
        
        try {
            document.getElementById('loadingIndicator').style.display = 'block';
            const data = await api.files.getFiles(this.currentParams);
            document.getElementById('loadingIndicator').style.display = 'none';
            
            const grid = document.getElementById('fileGrid');
            if (grid) {
                grid.innerHTML = data.files.map(renderOTTCard).join('');
                window.appAnimations.staggerCards();
            }

            const pageCont = document.getElementById('paginationContainer');
            if (pageCont) {
                pageCont.innerHTML = renderPagination(data.currentPage, data.totalPages);
            }
        } catch(err) {
            document.getElementById('loadingIndicator').style.display = 'none';
            console.error(err);
        }
    }

    async loadAdminFiles() {
        try {
            const data = await api.files.getFiles({ limit: 100 });
            const tbody = document.querySelector('#adminFilesTable tbody');
            if(!tbody) return;

            tbody.innerHTML = data.files.map(f => `
                <tr>
                    <td>${f.title}</td>
                    <td><span class="file-badge" style="position:static">${f.type}</span></td>
                    <td>${f.category}</td>
                    <td>
                        <button class="btn" style="background:var(--accent); color:white; padding:5px 10px; margin-right: 5px;" onclick="window.app.renameFile('${f.id}', '${f.title.replace(/'/g, "\\'")}', '${(f.category || '').replace(/'/g, "\\'")}')">Edit</button>
                        <button class="btn" style="background:var(--primary); color:white; padding:5px 10px;" onclick="window.app.deleteFile('${f.id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch(err) {
            console.error(err);
        }
    }

    setupAdminForms() {
        const form = document.getElementById('uploadForm');
        if(!form) return;
        form.onsubmit = async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('fileInput');
            const titleInput = document.getElementById('uploadTitle');
            const catInput = document.getElementById('uploadCategory');
            
            if(fileInput.files.length === 0) return;

            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('title', titleInput.value);
            formData.append('category', catInput.value);

            try {
                await api.files.uploadFile(formData);
                alert('File uploaded successfully');
                fileInput.value = '';
                titleInput.value = '';
                catInput.value = '';
                this.loadAdminFiles();
            } catch(err) {
                alert('Upload failed: ' + err.message);
            }
        };
    }

    async deleteFile(id) {
        if(!confirm('Are you sure?')) return;
        try {
            await api.files.deleteFile(id);
            this.loadAdminFiles();
        } catch(err) {
            alert('Delete failed: ' + err.message);
        }
    }

    viewFile(filename, type) {
        if(!this.user) return this.navigateAuth('Login');
        
        const overlay = document.getElementById('fileViewerOverlay');
        const title = document.getElementById('fileViewerTitle');
        const content = document.getElementById('fileViewerContent');
        const downloadBtn = document.getElementById('fileViewerDownloadBtn');
        
        title.innerText = filename;
        downloadBtn.onclick = () => this.downloadFile(filename);
        
        const fileUrl = `/Source/${filename}`;
        const fileType = type.toLowerCase();
        
        // Media Handlers
        if (fileType === 'pdf') {
            content.innerHTML = `<iframe src="${fileUrl}#toolbar=0" class="dedicated-iframe"></iframe>`;
        } 
        else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileType)) {
            content.innerHTML = `<div class="image-viewer"><img src="${fileUrl}" alt="${filename}"></div>`;
        }
        else if (fileType === 'txt') {
            // Fetch text content for better styling
            content.innerHTML = '<div class="spinner"></div>';
            fetch(fileUrl)
                .then(r => r.text())
                .then(text => {
                    content.innerHTML = `<div class="text-viewer"><pre><code>${text.replace(/</g, '&lt;')}</code></pre></div>`;
                })
                .catch(() => {
                    content.innerHTML = `<iframe src="${fileUrl}"></iframe>`;
                });
        }
        else if (['mp4', 'webm'].includes(fileType)) {
            content.innerHTML = `
                <div class="video-viewer">
                    <video controls autoplay>
                        <source src="${fileUrl}" type="video/${fileType}">
                        Your browser does not support the video tag.
                    </video>
                </div>`;
        }
        else if (['mp3', 'wav', 'ogg'].includes(fileType)) {
            content.innerHTML = `
                <div class="audio-viewer">
                    <div class="audio-icon"><i class="fa-solid fa-music"></i></div>
                    <audio controls autoplay>
                        <source src="${fileUrl}" type="audio/${fileType}">
                    </audio>
                </div>`;
        }
        else {
            // Fallback for docx, pptx, etc.
            let iconClass = 'fa-file';
            let color = 'var(--primary-light)';
            if (fileType === 'docx' || fileType === 'doc') { iconClass = 'fa-file-word'; color = '#2b579a'; }
            if (fileType === 'pptx' || fileType === 'ppt') { iconClass = 'fa-file-powerpoint'; color = '#d24726'; }
            if (fileType === 'xlsx' || fileType === 'xls') { iconClass = 'fa-file-excel'; color = '#1d6f42'; }
            
            content.innerHTML = `
                <div class="fallback-viewer">
                    <div class="fallback-icon" style="color: ${color}"><i class="fa-solid ${iconClass}"></i></div>
                    <h2>Preview Not Available</h2>
                    <p>The <strong>.${fileType.toUpperCase()}</strong> format is not natively supported for browser preview.</p>
                    <div class="fallback-actions">
                        <button class="btn btn-download glow-btn" onclick="window.app.downloadFile('${filename.replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-download"></i> Download to View
                        </button>
                    </div>
                </div>
            `;
        }
        
        overlay.style.display = 'flex';
        if (window.appAnimations) window.appAnimations.modalEnter(overlay);
    }

    closeFileViewer() {
        const overlay = document.getElementById('fileViewerOverlay');
        overlay.style.display = 'none';
        document.getElementById('fileViewerContent').innerHTML = ''; // Clear iframe
    }

    downloadFile(filename) {
        const a = document.createElement('a');
        a.href = `/Source/${filename}`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    async renameFile(id, currentTitle, currentCategory) {
        const newTitle = prompt('Enter new title:', currentTitle);
        if (newTitle === null) return;
        const newCategory = prompt('Enter new category (Linux, Cloud, CI/CD, RedHat, Networking, DevOps, Uncategorized):', currentCategory);
        if (newCategory === null) return;
        
        try {
            await api.files.updateFile(id, { title: newTitle, category: newCategory });
            this.loadAdminFiles();
        } catch(err) {
            alert('Update failed: ' + err.message);
        }
    }

    async loadFavoriteIds() {
        if (!this.user) return;
        try {
            const data = await api.favorites.getFavoriteIds();
            this.favoriteIds = data.favoriteIds;
        } catch (err) {
            console.error('Failed to load favorite IDs', err);
        }
    }

    async loadFavorites() {
        if (!this.user) return;
        try {
            document.getElementById('loadingIndicator').style.display = 'block';
            const data = await api.favorites.getFavorites();
            document.getElementById('loadingIndicator').style.display = 'none';
            
            const grid = document.getElementById('fileGrid');
            if (grid) {
                grid.innerHTML = data.files.map(renderOTTCard).join('');
                window.appAnimations.staggerCards();
            }
        } catch(err) {
            document.getElementById('loadingIndicator').style.display = 'none';
            console.error(err);
        }
    }

    async toggleFavorite(id) {
        if(!this.user) return this.navigateAuth('Login');
        try {
            const data = await api.favorites.toggle(id);
            if (data.isFavorite) {
                this.favoriteIds.push(id);
            } else {
                this.favoriteIds = this.favoriteIds.filter(fid => fid !== id);
            }
            
            // Re-render current view to update heart icon
            if (this.currentView === 'home') this.loadHome();
            else if (this.currentView === 'allFiles') this.loadFiles();
            else if (this.currentView === 'favorites') this.loadFavorites();
        } catch(err) {
            alert('Failed to toggle favorite');
        }
    }

    // --- Auth Page Logic ---
    navigateAuth(mode) {
        this.navigate('login');
        // Give time for DOM to render view before manipulating it
        setTimeout(() => {
            const title = document.getElementById('authPageTitle');
            const submitBtn = document.getElementById('authPageSubmitBtn');
            const switchText = document.getElementById('switchAuthPageMode');
            const roleGroup = document.getElementById('rolePageGroup');
            
            this.authMode = mode || 'Login';
            if(title) {
                title.innerText = this.authMode;
                submitBtn.innerText = this.authMode;
                switchText.innerText = this.authMode === 'Login' ? "Don't have an account? Register here" : "Already have an account? Login here";
                roleGroup.style.display = this.authMode === 'Register' ? 'block' : 'none';
            }
        }, 50);
    }

    setupAuthForms() {
        const form = document.getElementById('authPageForm');
        if(!form) return;
        
        document.getElementById('switchAuthPageMode').onclick = () => {
            this.navigateAuth(this.authMode === 'Login' ? 'Register' : 'Login');
        };

        form.onsubmit = async (e) => {
            e.preventDefault();
            const u = document.getElementById('authPageUsername').value;
            const p = document.getElementById('authPagePassword').value;
            const isAdmin = document.getElementById('authPageAdminRole').checked;

            try {
                if (this.authMode === 'Login') {
                    const data = await api.auth.login(u, p);
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    this.user = data.user;
                } else {
                    await api.auth.register(u, p, isAdmin ? 'admin' : 'learner');
                    alert('Registration successful. Please login.');
                    this.navigateAuth('Login');
                    return;
                }
                
                this.renderNavbar();
                this.renderSidebar();
                this.navigate(this.user.role === 'admin' ? 'admin' : 'home');
            } catch (err) {
                alert(err.message);
            }
        };
    }

    setupEventListeners() {
        // Sidebar Navigation
        document.querySelectorAll('.sidebar-menu li[data-view]').forEach(li => {
            li.addEventListener('click', () => this.navigate(li.dataset.view));
        });

        // Mobile Menu
        document.querySelector('.mobile-menu-btn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const icon = document.querySelector('#themeToggle i');
            if (document.body.classList.contains('light-theme')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentParams.search = e.target.value;
                if(this.currentView === 'home') this.loadHome();
                else if(this.currentView === 'allFiles') this.loadFiles(1);
            }, 500);
        });

        // Filters
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentParams.sort = e.target.value;
            if(this.currentView === 'home') this.loadHome();
            else if(this.currentView === 'allFiles') this.loadFiles(1);
        });
        document.getElementById('typeSelect').addEventListener('change', (e) => {
            this.currentParams.type = e.target.value;
            if(this.currentView === 'home') this.loadHome();
            else if(this.currentView === 'allFiles') this.loadFiles(1);
        });

        document.getElementById('tagSelect').addEventListener('change', (e) => {
            this.currentParams.category = e.target.value;
            if(this.currentView === 'home') this.loadHome();
            else if(this.currentView === 'allFiles') this.loadFiles(1);
        });

        // Auth forms are now handled in setupAuthForms
    }
}

// Initialize
window.onload = () => {
    window.app = new App();
};
