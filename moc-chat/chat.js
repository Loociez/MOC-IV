(() => {
  const API_CLIENT_URL = 'https://moc.marocodes.eu/api/messages';
  const API_SECRET_TOKEN = 'f684f5c2474a579a37e6747e92e3b8a4';

  const sent = new Set();
  const timers = new WeakMap();

  function formatDateToSQL(date = new Date()) {
    const pad = n => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  // 🔁 Normalize any CSS color → #rrggbb
  function normalizeColor(color) {
    if (!color) return '#ffffff';

    if (/^#[0-9a-f]{6}$/i.test(color)) {
      return color.toLowerCase();
    }

    const rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
    if (rgb) {
      return '#' + rgb.slice(1)
        .map(v => parseInt(v, 10).toString(16).padStart(2, '0'))
        .join('');
    }

    return '#ffffff';
  }

  async function sendPostData(url, data, token) {
    console.log('📤 Sending POST:', data);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const text = await response.text();
      console.log('📡 Status:', response.status);
      console.log('📨 Body:', text);

      if (!response.ok) {
        console.error('❌ API rejected payload');
      }
    } catch (err) {
      console.error('🚨 Network error:', err);
    }
  }

  function normalize(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  function parseLine(li) {
    const raw = normalize(li.textContent || '');
    if (!raw) return null;

    // Try to extract user + message
    // (19:35) Name 🌸: hello
    const match = raw.match(/^\(\d{2}:\d{2}\)\s+(.+?):\s*(.+)$/);

    let user = null;
    let message = raw;

    if (match) {
      user = match[1];
      message = match[2];
    }

    // Prefer span color if present
    const span = li.querySelector('span');
    const colorSource = span?.style?.color || li.style.color;

    return {
      time: formatDateToSQL(),
      user,
      message,
      user_color: normalizeColor(colorSource),
      raw
    };
  }

  function processLine(li) {
    const data = parseLine(li);
    if (!data) return;

    if (sent.has(data.raw)) return;
    sent.add(data.raw);

    sendPostData(API_CLIENT_URL, data, API_SECRET_TOKEN);
  }

  function schedule(li) {
    if (timers.has(li)) clearTimeout(timers.get(li));

    timers.set(li, setTimeout(() => {
      timers.delete(li);
      processLine(li);
    }, 120));
  }

  function observeChat() {
    const ul = document.querySelector('#winGameChatbox ul');
    if (!ul) {
      console.warn('❌ Chat UL not found');
      return;
    }

    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.tagName === 'LI') {
              schedule(node);
            }
          });
        }
      }
    });

    observer.observe(ul, { childList: true });

    console.log('✅ MOC chat relay running — emoji + color + user safe');
  }

  const boot = setInterval(() => {
    if (document.querySelector('#winGameChatbox ul')) {
      clearInterval(boot);
      observeChat();
    }
  }, 250);
})();
