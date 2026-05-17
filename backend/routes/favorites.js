const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { readDB, writeDB } = require('../utils/scanner');

// POST /api/favorites/:fileId - Toggle favorite
router.post('/:fileId', verifyToken, (req, res) => {
    const userId = req.user.id;
    const fileId = req.params.fileId;
    
    const db = readDB();
    
    // Check if file exists
    if (!db.files.find(f => f.id === fileId)) {
        return res.status(404).json({ error: 'File not found' });
    }

    const favIndex = db.favorites.findIndex(f => f.userId === userId && f.fileId === fileId);
    
    let isFavorite = false;
    if (favIndex === -1) {
        // Add to favorites
        db.favorites.push({ userId, fileId });
        isFavorite = true;
    } else {
        // Remove from favorites
        db.favorites.splice(favIndex, 1);
    }

    writeDB(db);
    res.json({ message: 'Favorite toggled', isFavorite });
});

// GET /api/favorites - Get user's favorite files
router.get('/', verifyToken, (req, res) => {
    const userId = req.user.id;
    const db = readDB();
    
    const userFavorites = db.favorites.filter(f => f.userId === userId).map(f => f.fileId);
    const favoriteFiles = db.files.filter(f => userFavorites.includes(f.id));
    
    res.json({ files: favoriteFiles });
});

// GET /api/favorites/ids - Get user's favorite file IDs (for UI state)
router.get('/ids', verifyToken, (req, res) => {
    const userId = req.user.id;
    const db = readDB();
    const userFavorites = db.favorites.filter(f => f.userId === userId).map(f => f.fileId);
    res.json({ favoriteIds: userFavorites });
});

module.exports = router;
