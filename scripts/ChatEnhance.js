(() => {
  const chatbox = document.getElementById("winGameChatbox");
  const chatList = document.getElementById("txtChatbox");
  const inputContainer = document.getElementById("winGameMessage");
  const inputBox = document.getElementById("txtChatMessage");

  if (!chatbox || !chatList || !inputContainer || !inputBox) {
    console.warn("Chat elements not found!");
    return;
  }

  // ===== POLISH CHATBOX =====
  Object.assign(chatbox.style, {
    background: "rgba(20, 20, 20, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
    padding: "10px",
    overflow: "hidden",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#e0e0e0",
  });

  Object.assign(chatList.style, {
    listStyle: "none",
    margin: "0",
    padding: "0",
    maxHeight: "100%",
    overflowY: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "#888 transparent",
  });

  const style = document.createElement("style");
  style.textContent = `
    #txtChatbox::-webkit-scrollbar {
      width: 6px;
    }
    #txtChatbox::-webkit-scrollbar-thumb {
      background-color: #666;
      border-radius: 3px;
    }
    #txtChatbox::-webkit-scrollbar-track {
      background: transparent;
    }
    #txtChatbox li {
      padding: 2px 4px;
      margin: 1px 0;
      border-radius: 4px;
      transition: background 0.2s ease;
      cursor: default;
    }
    #txtChatbox li:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  `;
  document.head.appendChild(style);

  // Auto-scroll to bottom on new chat lines
  const observer = new MutationObserver(() => {
    chatList.scrollTop = chatList.scrollHeight;
  });
  observer.observe(chatList, { childList: true });
  chatList.scrollTop = chatList.scrollHeight;

  // ===== POLISH INPUT FIELD =====
  inputContainer.style.display = "flex";
  inputContainer.style.alignItems = "center";
  inputContainer.style.background = "rgba(20, 20, 20, 0.85)";
  inputContainer.style.borderRadius = "8px";
  inputContainer.style.padding = "4px 6px";
  inputContainer.style.gap = "6px";
  inputContainer.style.border = "1px solid rgba(255,255,255,0.1)";
  inputContainer.style.boxShadow = "0 0 6px rgba(0,0,0,0.3)";
  inputContainer.style.height = "2rem";

  Object.assign(inputBox.style, {
    flex: "1 1 0%",
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#fff",
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: "0.9rem",
  });

  // ===== WHISPER ON MIDDLE CLICK =====
  chatList.addEventListener("mousedown", (e) => {
    if (e.button !== 1) return; // Only middle mouse button

    const li = e.target.closest("li");
    if (!li) return;

    const spans = li.querySelectorAll("span");
    if (spans.length < 2) return;

    const nameRaw = spans[1].textContent.trim();
    const name = nameRaw.split(" ")[0]; // strip emojis, take first word only

    if (name) {
      e.preventDefault(); // Prevent auto-scroll/middle-click default behavior
      inputBox.focus();
      inputBox.value = `@${name} `;
      // Optionally set cursor at end
      inputBox.setSelectionRange(inputBox.value.length, inputBox.value.length);
    }
  });
})();
