# PixelDiceMessenger
A web app to expose the Meta Send API to the GameWithPixel API so you can roll the physical dice and automatically send the results over Messenger

# Copilot generated code to paruse
Certainly! Below is a practical **Node.js** example using the [Meta Messenger Platform SDK](https://developers.facebook.com/docs/messenger-platform/) (which is essentially the Messenger Send API). This code demonstrates how to accept a URL from an HTTP request, fetch information about the URL (such as the page title and description), and send that information to a Messenger group chat.

**Assumptions:**
- You have a Facebook Page and have set up a Messenger bot.
- You have your Page Access Token.
- You know the recipient group’s PSID (for group chats, you typically need to use a Messenger app within a group, or use a Messenger thread ID).
- The bot is added to the group or thread.

---

### 1. Install Dependencies

```bash
npm init -y
npm install express axios cheerio body-parser dotenv
```

---

### 2. Create a `.env` File

```env
PAGE_ACCESS_TOKEN=YOUR_PAGE_ACCESS_TOKEN
GROUP_THREAD_ID=YOUR_THREAD_ID
```

---

### 3. `index.js` Example

```javascript
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
    const payload = {
        recipient: { thread_key: GROUP_THREAD_ID },
        message: { text: message }
    };
    await axios.post(url, payload);
}

// Endpoint: Accept a POST with { url: "https://..." }
app.post('/send-url', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing URL' });

    const info = await getUrlInfo(url);
    const message = `Shared URL: ${url}\nTitle: ${info.title}\nDescription: ${info.description}`;
    try {
        await sendToMessengerGroup(message);
        res.json({ status: 'sent', message });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send to Messenger', details: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

### 4. Notes

- **GROUP_THREAD_ID:**  
  For group messaging, you might use a `thread_key` or, in some cases, a group chat’s unique ID. You can find more in [Meta’s documentation](https://developers.facebook.com/docs/messenger-platform/send-messages/#messaging_types).
- **Permissions:**  
  Your bot needs the correct permissions and must be added to the group.
- **Testing:**  
  Use Postman or curl to try:  
  ```bash
  curl -X POST http://localhost:3000/send-url -H "Content-Type: application/json" -d '{"url":"https://example.com"}'
  ```
- **Error Handling:**  
  This is a simple demo; for production, add more robust error handling and security.

---

Would you like a version in another language or more details on Messenger group integration and thread keys?
