require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { scanFiles } = require('./utils/scanner');

const authRoutes = require('./routes/auth');
const filesRoutes = require('./routes/files');
const favoritesRoutes = require('./routes/favorites');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, './../frontend')));

// Serve the uploaded files statically so they can be viewed/downloaded
// Using content-disposition logic if needed, but for now simple static serving is fine.
app.use('/Source', express.static(path.join(__dirname, './../Source')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/favorites', favoritesRoutes);

// Fallback to index.html for SPA feeling (if needed, though we use hash routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, './../frontend/index.html'));
});

// Start Server & Initial Scan
app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    scanFiles();
});
