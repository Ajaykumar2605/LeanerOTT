const renderOTTCard = (file) => {
    // Generate an icon class based on type
    let iconClass = 'fa-file';
    let typeColor = 'var(--text-muted)';
    if (file.type === 'pdf') { iconClass = 'fa-file-pdf'; typeColor = '#e2574c'; }
    if (file.type === 'docx' || file.type === 'doc') { iconClass = 'fa-file-word'; typeColor = '#2b579a'; }
    if (file.type === 'pptx' || file.type === 'ppt') { iconClass = 'fa-file-powerpoint'; typeColor = '#d24726'; }

    const isFav = window.app && window.app.favoriteIds && window.app.favoriteIds.includes(file.id);
    const heartClass = isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    const heartColor = isFav ? 'color: var(--primary-light);' : '';

    return `
        <div class="ott-card" data-id="${file.id}">
            <div class="card-thumbnail">
                <i class="fa-solid ${iconClass}" style="color: ${typeColor};"></i>
                <div class="file-badge">${file.type}</div>
            </div>
            <div class="card-content">
                <h3 class="card-title" title="${file.title.replace(/"/g, '&quot;')}">${file.title}</h3>
                <div class="card-meta">
                    <span><i class="fa-solid fa-folder"></i> ${file.category || 'Uncategorized'}</span><br>
                    <small>Uploaded: ${new Date(file.uploadedAt).toLocaleDateString()}</small>
                </div>
                <div class="card-actions">
                    <button class="card-btn btn-view" onclick="window.app.viewFile('${file.filename.replace(/'/g, "\\'")}', '${(file.type||'').replace(/'/g, "\\'")}')">View</button>
                    <button class="card-btn btn-download" onclick="window.app.downloadFile('${file.filename.replace(/'/g, "\\'")}')">Download</button>
                    <button class="card-btn icon-only" onclick="window.app.toggleFavorite('${file.id}')"><i class="${heartClass}" style="${heartColor}"></i></button>
                </div>
            </div>
        </div>
    `;
};

const renderPagination = (currentPage, totalPages) => {
    if (totalPages <= 1) return '';
    let html = '<div class="pagination">';
    html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="window.app.loadFiles(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
    
    for(let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="window.app.loadFiles(${i})">${i}</button>`;
    }
    
    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.app.loadFiles(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
    html += '</div>';
    return html;
};

const views = {
    home: `
        <div class="hero-banner">
            <div class="hero-content">
                <h1 class="hero-title">Elevate Your Learning</h1>
                <p class="hero-desc">Access thousands of premium PDFs, documents, and presentations in one place. Your ultimate educational OTT platform.</p>
                <button class="btn primary-btn glow-btn" onclick="document.querySelector('[data-view=allFiles]').click()">Start Exploring</button>
            </div>
        </div>
        <h2 class="section-title"><i class="fa-solid fa-fire"></i> Trending Files</h2>
        <div id="trendingGrid" class="card-grid"></div>
        
        <h2 class="section-title" style="margin-top: 40px;"><i class="fa-solid fa-folder-open"></i> All Documents</h2>
        <div id="allDocsGrid" class="card-grid"></div>
    `,
    allFiles: `
        <h2 class="section-title"><i class="fa-solid fa-folder-open"></i> All Content</h2>
        <div id="fileGrid" class="card-grid"></div>
        <div id="paginationContainer"></div>
    `,
    favorites: `
        <h2 class="section-title"><i class="fa-solid fa-heart"></i> Your Favorites</h2>
        <div id="fileGrid" class="card-grid"></div>
    `,
    admin: `
        <h2 class="section-title"><i class="fa-solid fa-shield-halved"></i> Admin Dashboard</h2>
        
        <div class="glass-panel" style="padding: 20px; margin-bottom: 30px;">
            <h3>Upload New File</h3>
            <form id="uploadForm" style="margin-top: 15px; display:flex; flex-wrap: wrap; gap: 15px; align-items:center;">
                <input type="text" id="uploadTitle" placeholder="File Title" style="padding:8px; border-radius:4px; border:none;" required>
                <select id="uploadCategory" style="padding:8px; border-radius:4px; border:none;" required>
                    <option value="">Select Category</option>
                    <option value="Linux">Linux</option>
                    <option value="Cloud">Cloud</option>
                    <option value="CI/CD">CI/CD</option>
                    <option value="RedHat">RedHat</option>
                    <option value="Networking">Networking</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Uncategorized">Uncategorized</option>
                </select>
                <input type="file" id="fileInput" multiple required>
                <button type="submit" class="btn primary-btn">Upload</button>
            </form>
        </div>

        <div class="admin-table-container">
            <table id="adminFilesTable">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `,
    login: `
        <div class="auth-page-wrapper">
            <div class="glass-panel auth-page">
                <h2 id="authPageTitle" class="section-title" style="justify-content:center; margin-bottom: 5px;">Login</h2>
                <p id="authPageDesc" style="text-align:center; color:var(--text-muted); margin-bottom: 30px;">Welcome back to LearnersOTT</p>
                <form id="authPageForm" class="auth-form">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="authPageUsername" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="authPagePassword" required>
                    </div>
                    <div class="form-group" id="rolePageGroup" style="display:none;">
                        <label style="display:flex; align-items:center; gap:10px;"><input type="checkbox" id="authPageAdminRole"> Register as Admin</label>
                    </div>
                    <button type="submit" class="btn primary-btn glow-btn" id="authPageSubmitBtn" style="width:100%; padding: 12px; margin-top: 10px;">Login</button>
                </form>
                <p class="auth-switch" style="text-align:center; margin-top:25px;">
                    <span id="switchAuthPageMode">Don't have an account? Register here</span>
                </p>
            </div>
        </div>
    `
};

