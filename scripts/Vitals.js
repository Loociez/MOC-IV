(() => {
  let barsEnabled = false;
  let barsLocked = false;
  let barsContainer, hpBar, spBar, mpBar, tpBar;
  let hpTextSpan, spTextSpan, mpTextSpan, tpTextSpan;
  let animationId;

  // Reference to old vitals container to hide/show
  const oldVitals = document.getElementById("winVitals");

  // Create tiny toggle button (to toggle bars on/off)
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "⎯";  // horizontal bar icon
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
      if (oldVitals) oldVitals.style.display = "none";  // Hide old bars
      initBars();
    } else {
      if (oldVitals) oldVitals.style.display = "";      // Show old bars
      removeBars();
    }
  };
  toggleBtn.style.opacity = "0.5";
  document.body.appendChild(toggleBtn);

  // Create lock toggle button
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
    display: "none", // hidden until bars are created
    userSelect: "none",
  });
  lockBtn.onclick = () => {
    barsLocked = !barsLocked;
    updateLockState();
  };
  document.body.appendChild(lockBtn);

  // Create bars container & bars
  function createBar(color) {
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
      color: "white",
      fontWeight: "bold",
      fontSize: "11px",
      lineHeight: "14px",
      paddingLeft: "6px",
      userSelect: "none",
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

    // Text inside bar, on top of barFill
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

    barBg.appendChild(barFill);
    barBg.appendChild(textSpan);
    return { barBg, barFill, textSpan };
  }

  function initBars() {
    if (barsContainer) return; // already created

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

    // HP Bar
    const hpLabel = document.createElement("div");
    hpLabel.textContent = "HP ❤️";
    hpLabel.style.marginBottom = "4px";
    barsContainer.appendChild(hpLabel);

    const hp = createBar("red");
    hpBar = hp.barFill;
    hpTextSpan = hp.textSpan;
    barsContainer.appendChild(hp.barBg);

    // SP Bar
    const spLabel = document.createElement("div");
    spLabel.textContent = "SP";
    spLabel.style.marginBottom = "4px";
    barsContainer.appendChild(spLabel);

    const sp = createBar("lime");
    spBar = sp.barFill;
    spTextSpan = sp.textSpan;
    barsContainer.appendChild(sp.barBg);

    // MP Bar
    const mpLabel = document.createElement("div");
    mpLabel.textContent = "MP";
    mpLabel.style.marginBottom = "4px";
    barsContainer.appendChild(mpLabel);

    const mp = createBar("deepskyblue");
    mpBar = mp.barFill;
    mpTextSpan = mp.textSpan;
    barsContainer.appendChild(mp.barBg);

    // TP Bar (new)
    const tpLabel = document.createElement("div");
    tpLabel.textContent = "TP";
    tpLabel.style.marginBottom = "4px";
    barsContainer.appendChild(tpLabel);

    const tp = createBar("#a64ca6"); // purple color
    tpBar = tp.barFill;
    tpTextSpan = tp.textSpan;
    barsContainer.appendChild(tp.barBg);

    document.body.appendChild(barsContainer);

    // Show lock button now
    lockBtn.style.display = "inline-block";
    barsLocked = false;
    updateLockState();

    // Make bars container draggable unless locked
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

  // Animate bar width and glow pulse effect
  let pulse = 0;
  function animateBars() {
    if (!barsEnabled) return;

    const hpText = document.getElementById("txtHP")?.textContent;
    const spText = document.getElementById("txtSP")?.textContent;
    const mpText = document.getElementById("txtMP")?.textContent;
    const tpText = document.getElementById("txtTP")?.textContent;

    if (hpText) {
      const [current, max] = parseValue(hpText);
      const percent = Math.min(current / max, 1);
      hpBar.style.width = `${percent * 100}%`;
      hpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse))}px red`;
      hpTextSpan.textContent = `${current} / ${max}`;
    }
    if (spText) {
      const [current, max] = parseValue(spText);
      const percent = Math.min(current / max, 1);
      spBar.style.width = `${percent * 100}%`;
      spBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 1))}px lime`;
      spTextSpan.textContent = `${current} / ${max}`;
    }
    if (mpText) {
      const [current, max] = parseValue(mpText);
      const percent = Math.min(current / max, 1);
      mpBar.style.width = `${percent * 100}%`;
      mpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 2))}px deepskyblue`;
      mpTextSpan.textContent = `${current} / ${max}`;
    }
    if (tpText) {
      const [current, max] = parseValue(tpText);
      const percent = Math.min(current / max, 1);
      tpBar.style.width = `${percent * 100}%`;
      tpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 3))}px #a64ca6`;
      tpTextSpan.textContent = `${current} / ${max}`;
    }

    pulse += 0.05;
    animationId = requestAnimationFrame(animateBars);
  }

  // Update lock state styles and behavior
  function updateLockState() {
    if (!barsContainer) return;
    if (barsLocked) {
      lockBtn.textContent = "🔒";
      lockBtn.style.color = "red";
      barsContainer.style.cursor = "default";
      barsContainer.style.pointerEvents = "none"; // make click-through
    } else {
      lockBtn.textContent = "🔓";
      lockBtn.style.color = "lightgreen";
      barsContainer.style.cursor = "move";
      barsContainer.style.pointerEvents = "auto";
    }
  }

  // Simple drag support for the bars container
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
