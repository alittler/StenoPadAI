const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// This path is where Render will store your data file.
const DB_PATH = path.join(process.env.RENDER_DISK_PATH || __dirname, 'data', 'notes.json');

// Middleware
app.use(cors()); // Allows your frontend to talk to this server
app.use(express.json({limit: '10mb'})); // Allows the server to understand JSON data, with a generous size limit

// Ensure the data directory and file exist
fs.ensureFileSync(DB_PATH);

// --- API Routes ---

// A "welcome" route for the main URL
app.get('/', (req, res) => {
    res.send('Steno Notepad server is running!');
});

// Route to get the latest notes
app.get('/api/notes', async (req, res) => {
    try {
        const data = await fs.readJson(DB_PATH, { throws: false });
        res.json(data || {}); // Send empty object if file is empty
    } catch (error) {
        console.error('Error loading notes:', error);
        res.status(500).send('Error loading notes');
    }
});

// Route to save the notes
app.post('/api/notes', async (req, res) => {
    try {
        await fs.writeJson(DB_PATH, req.body);
        res.status(200).send('Notes saved successfully');
    } catch (error) {
        console.error('Error saving notes:', error);
        res.status(500).send('Error saving notes');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});