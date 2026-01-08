const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const MAX_MESSAGES = 100;
const messages = [];

app.post('/api/chat', (req, res) => {
  const { time, user, message } = req.body;
  if (!time || !user || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  messages.push({ time, user, message });
  if (messages.length > MAX_MESSAGES) messages.shift();
  res.json({ status: 'ok' });
});

app.get('/api/chat', (req, res) => {
  res.json(messages);
});

app.listen(PORT, () => {
  console.log(`Chat relay server listening on port ${PORT}`);
});
