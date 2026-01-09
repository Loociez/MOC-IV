(() => {
  const API_CLIENT_URL = 'https://moc.marocodes.eu/api/messages';
  const API_SECRET_TOKEN = 'f684f5c2474a579a37e6747e92e3b8a4';

  const sent = new Set();

  async function sendRawMessage(text) {
    try {
      const res = await fetch(API_CLIENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_SECRET_TOKEN}`
        },
        body: JSON.stringify({ message: text })
      });

      if (!res.ok) {
        console.error('Send failed', await res.text());
      }
    } catch (e) {
      console.error('Send error', e);
    }
  }

  function extractText(li) {
    // Get visible text only, ignore styling
    let text = li.textContent?.trim();
    if (!text) return null;

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ');
    return text;
  }

  function scanChat() {
    const chatbox = document.getElementById('winGameChatbox');
    if (!chatbox) return;

    const lines = chatbox.querySelectorAll('li');

    lines.forEach(li => {
      // Ignore guild messages by checking their color style
      const color = li.style.color?.toLowerCase();
      if (color === '#00ffff') return; // skip guild messages

      const text = extractText(li);
      if (!text) return;

      if (sent.has(text)) return;
      sent.add(text);

      sendRawMessage(text);
    });
  }

  const interval = setInterval(scanChat, 1500);
  console.log('MOC chat relay running');

  window.stopChatRelay = () => {
    clearInterval(interval);
    console.log('MOC chat relay stopped');
  };
})();
