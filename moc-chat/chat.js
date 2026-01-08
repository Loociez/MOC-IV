(() => {
  const WEBSITE_URL = 'https://yourgithubusername.github.io/moc-chat/'; // Change this

  // Helper: parse chat <li> element into {time, user, message}
  function parseChatLI(li) {
    const spans = li.querySelectorAll('span[data-processed="true"]');
    if (spans.length < 3) return null;
    const time = spans[0].innerText.trim().replace(/[()]/g, '');
    const user = spans[1].innerText.trim();
    const message = spans[2].innerText.trim();
    return { time, user, message };
  }

  // Observe chat messages container - update this selector to actual global chat UL
  const chatContainer = document.querySelector('#winGameChatbox ul'); // Adjust if needed

  if (!chatContainer) {
    console.error("Chat container not found");
    return;
  }

  let sending = false;
  let observer = null;

  async function sendMessage(data) {
    try {
      await fetch(WEBSITE_URL + 'api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error('Send failed', e);
    }
  }

  function startSending() {
    if (sending) return;
    sending = true;

    observer = new MutationObserver(mutations => {
      for (const mut of mutations) {
        for (const node of mut.addedNodes) {
          if (node.nodeType === 1 && node.tagName === 'LI') {
            const parsed = parseChatLI(node);
            if (parsed) {
              console.log('Sending chat:', parsed);
              sendMessage(parsed);
            }
          }
        }
      }
    });

    observer.observe(chatContainer, { childList: true });
    console.log('Started sending chat messages');
  }

  function stopSending() {
    if (!sending) return;
    sending = false;
    if (observer) observer.disconnect();
    console.log('Stopped sending chat messages');
  }

  // Add UI button to start/stop
  let btn = document.getElementById('chatSendToggleBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'chatSendToggleBtn';
    btn.textContent = 'Start Sending Chat';
    btn.style.position = 'fixed';
    btn.style.bottom = '10px';
    btn.style.right = '10px';
    btn.style.zIndex = 9999;
    btn.style.padding = '10px';
    btn.style.backgroundColor = '#ff00ff';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';
    document.body.appendChild(btn);
  }

  btn.onclick = () => {
    if (!sending) {
      startSending();
      btn.textContent = 'Stop Sending Chat';
    } else {
      stopSending();
      btn.textContent = 'Start Sending Chat';
    }
  };

  console.log('Chat sender script ready. Click the button to start.');
})();
