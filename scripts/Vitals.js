(() => {
  let barsEnabled = false;
  let barsLocked = false;
  let barsContainer;
  let hpBar, spBar, mpBar, tpBar, xpBar;
  let hpTextSpan, spTextSpan, mpTextSpan, tpTextSpan, xpTextSpan;
  let animationId;

  const oldVitals = document.getElementById("winVitals");

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "⎯";
  toggleBtn.title = "Toggle Animated HP/SP/MP/TP Bars";
  Object.assign(toggleBtn.style, {
    position: "fixed",
    top: "4px",
    left: "4px",
    zIndex: 99999,
    fontSize: "10px",
    padding: "2px 4px",
    borderRadius: "4px",
    border: "1px solid #888",
    background: "#111",
    color: "deepskyblue",
    cursor: "pointer",
    lineHeight: "1",
    width: "auto",
    height: "auto",
    display: "inline-block",
    userSelect: "none",
  });
  toggleBtn.onclick = () => {
    barsEnabled = !barsEnabled;
    toggleBtn.style.opacity = barsEnabled ? "1" : "0.5";
    if (barsEnabled) {
      if (oldVitals) oldVitals.style.display = "none";
      initBars();
    } else {
      if (oldVitals) oldVitals.style.display = "";
      removeBars();
    }
  };
  toggleBtn.style.opacity = "0.5";
  document.body.appendChild(toggleBtn);

  const lockBtn = document.createElement("button");
  lockBtn.textContent = "🔓";
  lockBtn.title = "Lock/Unlock Bars Position";
  Object.assign(lockBtn.style, {
    position: "fixed",
    top: "4px",
    left: "36px",
    zIndex: 99999,
    fontSize: "10px",
    padding: "2px 4px",
    borderRadius: "4px",
    border: "1px solid #888",
    background: "#111",
    color: "lightgreen",
    cursor: "pointer",
    lineHeight: "1",
    width: "auto",
    height: "auto",
    display: "none",
    userSelect: "none",
  });
  lockBtn.onclick = () => {
    barsLocked = !barsLocked;
    updateLockState();
  };
  document.body.appendChild(lockBtn);

  function createBar(color, tooltipCallback) {
    const barBg = document.createElement("div");
    Object.assign(barBg.style, {
      width: "150px",
      height: "14px",
      backgroundColor: "#222",
      borderRadius: "7px",
      boxShadow: `0 0 8px ${color}`,
      marginBottom: "6px",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      alignItems: "center",
    });

    const barFill = document.createElement("div");
    Object.assign(barFill.style, {
      height: "100%",
      width: "0%",
      background: `linear-gradient(90deg, ${color} 0%, #000 70%)`,
      borderRadius: "7px",
      boxShadow: `0 0 10px ${color}`,
      transition: "width 0.2s ease-out",
      position: "absolute",
      top: "0",
      left: "0",
      filter: `drop-shadow(0 0 4px ${color})`,
      zIndex: 1,
    });

    const textSpan = document.createElement("span");
    Object.assign(textSpan.style, {
      position: "relative",
      zIndex: 2,
      pointerEvents: "none",
      userSelect: "none",
      width: "100%",
      textAlign: "center",
      color: "white",
      textShadow: "0 0 4px black",
      fontWeight: "bold",
      fontSize: "11px",
      fontFamily: "Arial, sans-serif",
    });

    if (tooltipCallback) {
      barBg.title = "";
      barBg.onmouseenter = () => {
        barBg.title = tooltipCallback();
      };
    }

    barBg.appendChild(barFill);
    barBg.appendChild(textSpan);
    return { barBg, barFill, textSpan };
  }

  function initBars() {
    if (barsContainer) return;

    barsContainer = document.createElement("div");
    Object.assign(barsContainer.style, {
      position: "fixed",
      top: "40px",
      left: "4px",
      zIndex: 99999,
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "white",
      userSelect: "none",
      width: "160px",
      background: "rgba(0,0,0,0.4)",
      padding: "8px",
      borderRadius: "8px",
      boxShadow: "0 0 10px rgba(0,0,0,0.7)",
      cursor: "move",
    });

    function addBar(label, color, assignVars, tooltipCb) {
      const labelEl = document.createElement("div");
      labelEl.textContent = label;
      labelEl.style.marginBottom = "4px";
      barsContainer.appendChild(labelEl);
      const { barBg, barFill, textSpan } = createBar(color, tooltipCb);
      assignVars.bar = barFill;
      assignVars.text = textSpan;
      barsContainer.appendChild(barBg);
    }

    const ref = {};

    addBar("HP ❤️", "red", ref);
    hpBar = ref.bar;
    hpTextSpan = ref.text;

    addBar("SP", "lime", ref);
    spBar = ref.bar;
    spTextSpan = ref.text;

    addBar("MP", "deepskyblue", ref);
    mpBar = ref.bar;
    mpTextSpan = ref.text;

    addBar("TP", "#a64ca6", ref);
    tpBar = ref.bar;
    tpTextSpan = ref.text;

    addBar("XP", "goldenrod", ref, () => {
      const txt = document.getElementById("txtXP")?.textContent;
      const match = txt?.match(/(\d+)\s*\/\s*(\d+)/);
      if (!match) return "";
      const [_, cur, max] = match;
      return `${(+max - +cur).toLocaleString()} XP to next level`;
    });
    xpBar = ref.bar;
    xpTextSpan = ref.text;

    document.body.appendChild(barsContainer);
    lockBtn.style.display = "inline-block";
    barsLocked = false;
    updateLockState();
    makeDraggable(barsContainer);
    animateBars();
  }

  function removeBars() {
    if (!barsContainer) return;
    cancelAnimationFrame(animationId);
    barsContainer.remove();
    barsContainer = null;
    lockBtn.style.display = "none";
  }

  function parseValue(text) {
    if (!text) return [0, 100];
    const parts = text.split("/");
    if (parts.length !== 2) return [0, 100];
    return parts.map(s => parseInt(s.replace(/\D/g, ""), 10));
  }

  let pulse = 0;
  function animateBars() {
    if (!barsEnabled) return;

    const hpText = document.getElementById("txtHP")?.textContent;
    const spText = document.getElementById("txtSP")?.textContent;
    const mpText = document.getElementById("txtMP")?.textContent;
    const tpText = document.getElementById("txtTP")?.textContent;
    const xpText = document.getElementById("txtXP")?.textContent;

    if (hpText) {
      const [cur, max] = parseValue(hpText);
      const percent = Math.min(cur / max, 1);
      hpBar.style.width = `${percent * 100}%`;
      hpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse))}px red`;
      hpTextSpan.textContent = `${cur} / ${max}`;
    }
    if (spText) {
      const [cur, max] = parseValue(spText);
      const percent = Math.min(cur / max, 1);
      spBar.style.width = `${percent * 100}%`;
      spBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 1))}px lime`;
      spTextSpan.textContent = `${cur} / ${max}`;
    }
    if (mpText) {
      const [cur, max] = parseValue(mpText);
      const percent = Math.min(cur / max, 1);
      mpBar.style.width = `${percent * 100}%`;
      mpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 2))}px deepskyblue`;
      mpTextSpan.textContent = `${cur} / ${max}`;
    }
    if (tpText) {
      const [cur, max] = parseValue(tpText);
      const percent = Math.min(cur / max, 1);
      tpBar.style.width = `${percent * 100}%`;
      tpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 3))}px #a64ca6`;
      tpTextSpan.textContent = `${cur} / ${max}`;
    }
    if (xpText) {
      const match = xpText.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        const cur = parseInt(match[1]), max = parseInt(match[2]);
        const percent = Math.min(cur / max, 1);
        xpBar.style.width = `${percent * 100}%`;
        xpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 4))}px goldenrod`;
        xpTextSpan.textContent = `${cur.toLocaleString()} / ${max.toLocaleString()}`;
      }
    }

    pulse += 0.05;
    animationId = requestAnimationFrame(animateBars);
  }

  function updateLockState() {
    if (!barsContainer) return;
    if (barsLocked) {
      lockBtn.textContent = "🔒";
      lockBtn.style.color = "red";
      barsContainer.style.cursor = "default";
      barsContainer.style.pointerEvents = "none";
    } else {
      lockBtn.textContent = "🔓";
      lockBtn.style.color = "lightgreen";
      barsContainer.style.cursor = "move";
      barsContainer.style.pointerEvents = "auto";
    }
  }

  function makeDraggable(element) {
    let pos = { x: 0, y: 0, left: 0, top: 0 };
    function onMouseDown(e) {
      if (barsLocked) return;
      pos.x = e.clientX;
      pos.y = e.clientY;
      pos.left = parseInt(element.style.left) || 0;
      pos.top = parseInt(element.style.top) || 0;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      e.preventDefault();
    }
    function onMouseMove(e) {
      const dx = e.clientX - pos.x;
      const dy = e.clientY - pos.y;
      element.style.left = pos.left + dx + "px";
      element.style.top = pos.top + dy + "px";
    }
    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    element.addEventListener("mousedown", onMouseDown);
  }
})();
