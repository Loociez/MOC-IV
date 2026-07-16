const express = require('express');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Set these in Render's dashboard under Environment, not in this file.
const SITE_PASSWORD = process.env.SITE_PASSWORD || '';   // the fake/access code you give players
const CONSTY_EMAIL = process.env.CONSTY_EMAIL || '';      // real shared account email
const CONSTY_PASSWORD = process.env.CONSTY_PASSWORD || ''; // real shared account password

// --- very basic per-IP rate limiting so the access code can't be brute forced ---
const attempts = new Map();
function tooManyAttempts(ip) {
  const now = Date.now();
  const record = attempts.get(ip) || { count: 0, windowStart: now };
  if (now - record.windowStart > 60_000) {
    record.count = 0;
    record.windowStart = now;
  }
  record.count += 1;
  attempts.set(ip, record);
  return record.count > 10; // max 10 tries per IP per minute
}

app.post('/credentials', (req, res) => {
  const ip = req.ip;
  if (tooManyAttempts(ip)) {
    return res.status(429).json({ error: 'Too many attempts, try again shortly.' });
  }

  const code = req.body && req.body.code;
  if (!SITE_PASSWORD || code !== SITE_PASSWORD) {
    return res.status(401).json({ error: 'Invalid code' });
  }

  return res.json({ email: CONSTY_EMAIL, password: CONSTY_PASSWORD });
});

app.get('/', (req, res) => {
  res.send('Consty credentials API is running.');
});

app.listen(PORT, () => {
  console.log('Credentials API running on port ' + PORT);
});