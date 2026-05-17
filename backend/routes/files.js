const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { readDB, writeDB, scanFiles, SOURCE_DIR } = require('../utils/scanner');

// Multer setup for uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, SOURCE_DIR);
    },
    filename: (req, file, cb) => {
        // Keep original filename or make unique if needed
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// GET /api/files - Paginated, Search, Filter, Sort
router.get('/', (req, res) => {
    let { page = 1, limit = 10, sort = 'newest', search = '', category = '', type = '' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const db = readDB();
    let files = [...db.files];

    // Search
    if (search) {
        const lowerSearch = search.toLowerCase();
        files = files.filter(f => 
            f.title.toLowerCase().includes(lowerSearch) || 
            f.category.toLowerCase().includes(lowerSearch)
        );
    }

    // Filter by Category
    if (category) {
        files = files.filter(f => f.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by Type
    if (type) {
        files = files.filter(f => f.type.toLowerCase() === type.toLowerCase());
    }

    // Sort
    files.sort((a, b) => {
        if (sort === 'newest') return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        if (sort === 'oldest') return new Date(a.uploadedAt) - new Date(b.uploadedAt);
        if (sort === 'a-z') return a.title.localeCompare(b.title);
        if (sort === 'z-a') return b.title.localeCompare(a.title);
        return 0;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedFiles = files.slice(startIndex, endIndex);

    res.json({
        totalFiles: files.length,
        totalPages: Math.ceil(files.length / limit),
        currentPage: page,
        files: paginatedFiles
    });
});

// POST /api/files/upload - Admin only
router.post('/upload', verifyAdmin, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Re-scan to update JSON DB
    scanFiles();
    
    // Update newly added file with title and category if provided
    const { title, category } = req.body;
    if (title || category) {
        const db = readDB();
        const file = db.files.find(f => f.filename === req.file.filename);
        if (file) {
            if (title) file.title = title;
            if (category) file.category = category;
            writeDB(db);
        }
    }
    
    res.status(201).json({ message: 'File uploaded successfully' });
});

// DELETE /api/files/:id - Admin only
router.delete('/:id', verifyAdmin, (req, res) => {
    const db = readDB();
    const fileIndex = db.files.findIndex(f => f.id === req.params.id);
    
    if (fileIndex === -1) {
        return res.status(404).json({ error: 'File not found' });
    }

    const file = db.files[fileIndex];
    const filePath = path.join(SOURCE_DIR, file.filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    db.files.splice(fileIndex, 1);
    writeDB(db);

    res.json({ message: 'File deleted successfully' });
});

// PUT /api/files/:id - Update metadata (Admin only)
router.put('/:id', verifyAdmin, (req, res) => {
    const { title, category } = req.body;
    const db = readDB();
    const file = db.files.find(f => f.id === req.params.id);
    
    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }

    if (title) file.title = title;
    if (category) file.category = category;

    writeDB(db);
    res.json({ message: 'File updated', file });
});

module.exports = router;
