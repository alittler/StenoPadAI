const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// Use Render's persistent disk for storage
const DATA_DIR = path.join(process.env.RENDER_DISK_PATH || __dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json({limit: '10mb'}));

// Ensure the main data directory exists
fs.ensureDirSync(DATA_DIR);

// --- API Routes ---

app.get('/', (req, res) => {
    res.send('Steno Notepad server is running!');
});

// Route to get the notes for a specific ID
app.get('/api/notes/:id', async (req, res) => {
    const { id } = req.params;
    // Sanitize the ID to prevent directory traversal attacks
    const sanitizedId = path.basename(id);
    const filePath = path.join(DATA_DIR, `${sanitizedId}.json`);

    try {
        const data = await fs.readJson(filePath, { throws: false });
        res.json(data || {}); // Send empty object if file doesn't exist
    } catch (error) {
        console.error(`Error loading notes for ID ${sanitizedId}:`, error);
        res.status(500).send('Error loading notes');
    }
});

// Route to save the notes for a specific ID
app.post('/api/notes/:id', async (req, res) => {
    const { id } = req.params;
    const sanitizedId = path.basename(id);
    const filePath = path.join(DATA_DIR, `${sanitizedId}.json`);

    try {
        await fs.writeJson(filePath, req.body);
        res.status(200).send('Notes saved successfully');
    } catch (error) {
        console.error(`Error saving notes for ID ${sanitizedId}:`, error);
        res.status(500).send('Error saving notes');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});