(() => {
  const API_CLIENT_URL = 'https://moc.marocodes.eu/api/messages';  // Your API endpoint
  const API_SECRET_TOKEN = 'f684f5c2474a579a37e6747e92e3b8a4';               // Your Bearer token

  // Utility: send one chat message to API client
  async function sendChatMessage(msg) {
    try {
      const payload = {
        message: `[${msg.time}] ${msg.user}: ${msg.message}`
      };

      const res = await fetch(API_CLIENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_SECRET_TOKEN}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.error('Failed to send message', await res.text());
      }
    } catch (e) {
      console.error('Error sending message', e);
    }
  }

  // Parse one <li> chat line into {time, user, message}
  function parseChatLine(li) {
    const spans = li.querySelectorAll('span');
    if (spans.length < 3) return null;

    const timeText = spans[0].textContent.trim().replace(/[()]/g, '');
    const userText = spans[1].textContent.trim();
    let messageText = spans[2].textContent.trim();
    if (messageText.startsWith(': ')) messageText = messageText.slice(2);

    return { time: timeText, user: userText, message: messageText };
  }

  const sentMessages = new Set();

  function scanChatAndSend() {
    const chatbox = document.getElementById('winGameChatbox');
    if (!chatbox) {
      console.warn('Chatbox element not found');
      return;
    }

    const lines = chatbox.querySelectorAll('li');
    lines.forEach(li => {
      const msg = parseChatLine(li);
      if (!msg) return;

      const key = `${msg.time}|${msg.user}|${msg.message}`;
      if (sentMessages.has(key)) return;

      sentMessages.add(key);
      sendChatMessage(msg);
    });
  }

  const intervalId = setInterval(scanChatAndSend, 2000);
  console.log('Chat relay started, sending messages to API client');

  // To stop later: window.stopChatRelay()
  window.stopChatRelay = () => {
    clearInterval(intervalId);
    console.log('Chat relay stopped');
  };
})();
