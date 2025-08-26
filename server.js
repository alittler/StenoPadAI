const express = require('express');
const cors = require('cors');
const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = '/notes.json'; // The file path inside the Dropbox App Folder

// --- Your Dropbox App Credentials ---
const DROPBOX_APP_KEY = 'huhj1gbqerltkqs';
const DROPBOX_APP_SECRET = 'qeari2cgsif6dl6';

// This will store the access token once the user authenticates.
// In a real production app, you would store this more permanently.
let dropboxAccessToken = null;

const dbx = new Dropbox({
    clientId: DROPBOX_APP_KEY,
    clientSecret: DROPBOX_APP_SECRET,
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Dropbox Authentication Routes ---

// 1. Kicks off the authentication process
app.get('/auth', (req, res) => {
    const authUrl = dbx.auth.getAuthenticationUrl(
        'https://steno-backend.onrender.com/auth/callback', // Use your public Render URL
        undefined,
        'code',
        'offline',
        undefined,
        undefined,
        true
    );
    res.redirect(authUrl);
});

// 2. Dropbox redirects back here after the user approves access
app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { result } = await dbx.auth.getAccessTokenFromCode(
            'https://steno-backend.onrender.com/auth/callback', // Use your public Render URL
            code
        );
        dropboxAccessToken = result.access_token;
        res.send('Authentication successful! You can close this window. Your app is now connected to Dropbox.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error during authentication.');
    }
});

// --- API Routes ---

app.get('/', (req, res) => {
    res.send('Steno Notepad server is running! Authenticate by visiting /auth');
});

// Route to get the latest notes
app.get('/api/notes', async (req, res) => {
    if (!dropboxAccessToken) return res.status(401).send('Not authenticated. Please visit the /auth endpoint first.');
    dbx.auth.setAccessToken(dropboxAccessToken);

    try {
        const { result } = await dbx.filesDownload({ path: DB_PATH });
        res.json(JSON.parse(result.fileBinary.toString()));
    } catch (error) {
        // If the file doesn't exist, return an empty object
        res.json({});
    }
});

// Route to save the notes
app.post('/api/notes', async (req, res) => {
    if (!dropboxAccessToken) return res.status(401).send('Not authenticated. Please visit the /auth endpoint first.');
    dbx.auth.setAccessToken(dropboxAccessToken);

    try {
        await dbx.filesUpload({
            path: DB_PATH,
            contents: JSON.stringify(req.body, null, 2),
            mode: 'overwrite'
        });
        res.status(200).send('Notes saved successfully to Dropbox');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving notes to Dropbox');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});