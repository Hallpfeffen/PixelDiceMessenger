const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
app.use(express.json());

// Load your tokens and IDs from .env
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GROUP_THREAD_ID = process.env.GROUP_THREAD_ID;

// Helper: Fetch page title and description from a URL
async function getUrlInfo(url) {
    try {
        const { data } = await axios.get(url, { timeout: 5000 });
        const $ = cheerio.load(data);
        const title = $('title').first().text();
        const description = $('meta[name="description"]').attr('content') || '';
        return { title, description };
    } catch (err) {
        return { title: 'Unable to fetch', description: '' };
    }
}

// Helper: Send message to Messenger Group (thread)
async function sendToMessengerGroup(message) {
    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    console.log(url);
    const payload = {
        recipient: { thread_key: GROUP_THREAD_ID },
        message: { text: message }
    };
    await axios.post(url, payload);
}

// Endpoint: Accept a POST with { url: "https://..." }
app.post('/send-url', async (req, res) => {
    
    const { faceValue } = req.body;
    if (!faceValue) return res.status(400).json({ error: 'Missing URL' });

    const message = `Roll Result: ${faceValue}`;
    try {
        console.log(message);

        await sendToMessengerGroup(message);
        res.json({ status: 'sent', message });
    } catch (err) {
        console.log(err.message);

        res.status(500).json({ error: 'Failed to send to Messenger', details: err.message });
    }
});

app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // Load the token from the .env file

    // Parse the query parameters from the Facebook request
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if the mode and token are present
    if (mode && token) {
        // Confirm the token matches
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK VERIFIED');
            res.status(200).send(challenge); // Send back the challenge token
        } else {
            res.sendStatus(403); // Forbidden if the tokens don't match
        }
    } else {
        res.sendStatus(403); // Forbidden if mode or token is missing
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));