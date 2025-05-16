const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
app.use(express.json());

// Load your tokens and IDs from .env
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const PSIDS = process.env.PSIDS;

const sendMessage = async (recipientId, messageText) => {
  const url = 'https://graph.facebook.com/v22.0/676526092206627/messages';
  const payload = {
    recipient: { id: recipientId },
    message: { text: messageText },
    messaging_type: "RESPONSE",
    access_token: PAGE_ACCESS_TOKEN
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });
    console.log(url);
    console.log(payload);
    console.log(response.status);
    if (!response.ok) {
      const errorDetails = await response.json();
      console.error('Error details:', errorDetails);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Message sent successfully:', result);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Endpoint: Accept a POST with { url: "https://..." }
app.post('/send-url', async (req, res) => {
    
    const { faceValue } = req.body;
    const { actionValue } = req.body
    if (!faceValue) return res.status(400).json({ error: 'Missing faceValue' });
    if (!actionValue) return res.status(400).json({ error: 'Missing actionValue' });


    const message = `${actionValue}: ${faceValue}`;
    try {
        console.log(message);
        PSIDS.forEach(psid => {
          sendMessage(psid, message)
        });

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