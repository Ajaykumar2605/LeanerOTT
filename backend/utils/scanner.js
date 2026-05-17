const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '../database.json');
const SOURCE_DIR = path.join(__dirname, '../../Source');

function readDB() {
    if (!fs.existsSync(DB_PATH)) {
        return { users: [], files: [], favorites: [] };
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function scanFiles() {
    if (!fs.existsSync(SOURCE_DIR)) {
        fs.mkdirSync(SOURCE_DIR, { recursive: true });
    }

    const filesInDir = fs.readdirSync(SOURCE_DIR);
    const db = readDB();
    
    let hasChanges = false;
    const existingFileNames = db.files.map(f => f.filename);

    // Add new files
    filesInDir.forEach(filename => {
        if (!existingFileNames.includes(filename)) {
            const ext = path.extname(filename).toLowerCase();
            const validExts = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
            
            if (validExts.includes(ext)) {
                const stat = fs.statSync(path.join(SOURCE_DIR, filename));
                
                const newFile = {
                    id: crypto.randomUUID(),
                    title: path.basename(filename, ext),
                    filename: filename,
                    type: ext.replace('.', ''),
                    category: 'Uncategorized', // Default
                    uploadedAt: stat.birthtime.toISOString(),
                    size: stat.size
                };
                
                db.files.push(newFile);
                hasChanges = true;
                console.log(`[Scanner] Added new file: ${filename}`);
            }
        }
    });

    // Remove deleted files
    const newDbFiles = db.files.filter(f => {
        if (!filesInDir.includes(f.filename)) {
            hasChanges = true;
            console.log(`[Scanner] Removed missing file: ${f.filename}`);
            return false;
        }
        return true;
    });

    if (hasChanges) {
        db.files = newDbFiles;
        writeDB(db);
        console.log('[Scanner] Database updated with file system changes.');
    } else {
        console.log('[Scanner] No new files detected.');
    }
}

module.exports = {
    scanFiles,
    readDB,
    writeDB,
    SOURCE_DIR
};
