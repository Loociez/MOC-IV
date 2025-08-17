(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) {
    console.warn("Settings window not found!");
    return;
  }

  // === Insert QoL Settings ===
  const settingsDivs = settingsForm.querySelectorAll("div");
  const insertTarget = settingsDivs[1]; // main settings block

  const qolContainer = document.createElement("div");
  qolContainer.innerHTML = `
    <div><b>Quality of Life</b></div>
    <div>
      <label><input type="checkbox" name="chkFpsCounter"> Show FPS Counter</label>
    </div>
    <div>
      <label>FPS Position:
        <select name="selFpsPosition">
          <option value="top-right">Top Right</option>
          <option value="top-left">Top Left</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </label>
    </div>
    <div>
      <label>Chat Font Style:
        <select name="selFontStyle">
          <option value="default">Default</option>
          <option value="monospace">Monospace</option>
          <option value="serif">Serif</option>
          <option value="sans-serif">Sans Serif</option>
        </select>
      </label>
    </div>
    <div>
      <label>Highlight Color:
        <input type="color" name="highlightColor" value="#ffff00">
      </label>
    </div>
  `;
  insertTarget.appendChild(qolContainer);

  // === Chatbox & Observer ===
  const chatBox = document.querySelector("#winGameChatbox");
  if (!chatBox) {
    console.warn("Chatbox not found!");
    return;
  }

  const chatObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;

        let msg = node.innerText;
        if (!msg) return;

        // Strip timestamp "(14:18) "
        msg = msg.replace(/^\(\d{2}:\d{2}\)\s*/, "");
        node.innerText = msg;

        // Get current player name
        const nameInput = document.querySelector("#winStats input[name='txtName']");
        const playerName = nameInput ? nameInput.value.trim() : "";

        if (!playerName) return;

        // Get highlight color from settings
        const highlightColor = qolSettings.highlightColor;

        // Check if message contains my name but is not my own message
        const isOwnMessage = msg.toLowerCase().startsWith(playerName.toLowerCase() + " ");
        const mentionsMe = msg.toLowerCase().includes(playerName.toLowerCase());

        if (mentionsMe && !isOwnMessage) {
          node.style.backgroundColor = highlightColor;
          node.style.fontWeight = "bold";
        }
      });
    });
  });

  chatObserver.observe(chatBox, { childList: true, subtree: true });

  // Apply font style to entire chat container
  function updateChatFont() {
    chatBox.style.fontFamily = qolSettings.fontStyle || "";
  }

  // === FPS Counter ===
  let fpsEnabled = false;
  let fpsDiv = null;
  let lastFrame = performance.now();
  let frames = 0;
  let fps = 0;

  function createFpsCounter() {
    fpsDiv = document.createElement("div");
    fpsDiv.style.position = "absolute";
    fpsDiv.style.background = "rgba(0,0,0,0.5)";
    fpsDiv.style.color = "#0f0";
    fpsDiv.style.font = "12px monospace";
    fpsDiv.style.padding = "2px 5px";
    fpsDiv.style.zIndex = "9999";
    updateFpsPosition();
    document.body.appendChild(fpsDiv);
    requestAnimationFrame(updateFps);
  }

  function updateFps() {
    const now = performance.now();
    frames++;
    if (now - lastFrame >= 1000) {
      fps = frames;
      frames = 0;
      lastFrame = now;
      if (fpsDiv) fpsDiv.textContent = `FPS: ${fps}`;
    }
    if (fpsEnabled) requestAnimationFrame(updateFps);
  }

  function removeFpsCounter() {
    if (fpsDiv) {
      fpsDiv.remove();
      fpsDiv = null;
    }
  }

  function updateFpsPosition() {
    if (!fpsDiv) return;
    const pos = qolSettings.fpsPosition;
    fpsDiv.style.top = pos.includes("top") ? "5px" : "";
    fpsDiv.style.bottom = pos.includes("bottom") ? "5px" : "";
    fpsDiv.style.left = pos.includes("left") ? "5px" : "";
    fpsDiv.style.right = pos.includes("right") ? "5px" : "";
  }

  // === Settings Listeners ===
  const qolSettings = {
    fontStyle: "",
    highlightColor: "#ffff00",
    fpsPosition: "top-right"
  };

  const chkFps = settingsForm.querySelector("input[name='chkFpsCounter']");
  chkFps.addEventListener("change", () => {
    fpsEnabled = chkFps.checked;
    if (fpsEnabled) {
      createFpsCounter();
    } else {
      removeFpsCounter();
    }
  });

  const selFont = settingsForm.querySelector("select[name='selFontStyle']");
  selFont.addEventListener("change", () => {
    qolSettings.fontStyle = selFont.value === "default" ? "" : selFont.value;
    updateChatFont();
  });

  const colorPicker = settingsForm.querySelector("input[name='highlightColor']");
  colorPicker.addEventListener("input", () => {
    qolSettings.highlightColor = colorPicker.value;
  });

  const selFpsPos = settingsForm.querySelector("select[name='selFpsPosition']");
  selFpsPos.addEventListener("change", () => {
    qolSettings.fpsPosition = selFpsPos.value;
    updateFpsPosition();
  });

  console.log("[MOC QoL] Settings injected with FPS + Font Style + Highlight Color + FPS Position");
})();
