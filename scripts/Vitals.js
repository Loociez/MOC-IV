(() => {
  let barsEnabled = false;
  let barsLocked = false;
  let barsContainer, hpBar, spBar, mpBar;
  let hpTextLabel, spTextLabel, mpTextLabel;
  let animationId;

  // Create tiny toggle button (to toggle bars on/off)
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "⎯";  // horizontal bar icon
  toggleBtn.title = "Toggle Animated HP/SP/MP Bars";
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

    const winVitals = document.getElementById("winVitals");
    if (barsEnabled) {
      if (winVitals) winVitals.style.display = "none"; // Hide when bars on
      initBars();
    } else {
      if (winVitals) winVitals.style.display = ""; // Show when bars off
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
      userSelect: "none",
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
      zIndex: "1",
    });

    // Create numeric text label inside the bar
    const textLabel = document.createElement("span");
    textLabel.style.position = "absolute";
    textLabel.style.left = "50%";
    textLabel.style.top = "50%";
    textLabel.style.transform = "translate(-50%, -50%)";
    textLabel.style.color = "white";
    textLabel.style.fontWeight = "bold";
    textLabel.style.fontSize = "11px";
    textLabel.style.textShadow = "0 0 3px #000";
    textLabel.style.zIndex = "2";
    textLabel.style.userSelect = "none";

    barBg.appendChild(barFill);
    barBg.appendChild(textLabel);

    return { barBg, barFill, textLabel };
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
    hpLabel.textContent = "HP";
    hpLabel.style.marginBottom = "4px";
    barsContainer.appendChild(hpLabel);

    const hp = createBar("red");
    hpBar = hp.barFill;
    hpTextLabel = hp.textLabel;
    barsContainer.appendChild(hp.barBg);

    // SP Bar
    const spLabel = document.createElement("div");
    spLabel.textContent = "SP";
    spLabel.style.marginBottom = "4px";
    barsContainer.appendChild(spLabel);

    const sp = createBar("lime");
    spBar = sp.barFill;
    spTextLabel = sp.textLabel;
    barsContainer.appendChild(sp.barBg);

    // MP Bar
    const mpLabel = document.createElement("div");
    mpLabel.textContent = "MP";
    mpLabel.style.marginBottom = "4px";
    barsContainer.appendChild(mpLabel);

    const mp = createBar("deepskyblue");
    mpBar = mp.barFill;
    mpTextLabel = mp.textLabel;
    barsContainer.appendChild(mp.barBg);

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

  // Animate bar width and glow pulse effect + update numeric labels
  let pulse = 0;
  function animateBars() {
    if (!barsEnabled) return;

    const hpText = document.getElementById("txtHP")?.textContent;
    const spText = document.getElementById("txtSP")?.textContent;
    const mpText = document.getElementById("txtMP")?.textContent;

    if (hpText) {
      const [current, max] = parseValue(hpText);
      const percent = Math.min(current / max, 1);
      hpBar.style.width = `${percent * 100}%`;
      hpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse))}px red`;
      hpTextLabel.textContent = `${current} / ${max}`;
    }
    if (spText) {
      const [current, max] = parseValue(spText);
      const percent = Math.min(current / max, 1);
      spBar.style.width = `${percent * 100}%`;
      spBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 1))}px lime`;
      spTextLabel.textContent = `${current} / ${max}`;
    }
    if (mpText) {
      const [current, max] = parseValue(mpText);
      const percent = Math.min(current / max, 1);
      mpBar.style.width = `${percent * 100}%`;
      mpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 2))}px deepskyblue`;
      mpTextLabel.textContent = `${current} / ${max}`;
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

  // Draggable helper for bars container
  function makeDraggable(el) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    el.addEventListener("mousedown", e => {
      if (barsLocked) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      e.preventDefault();
    });

    window.addEventListener("mousemove", e => {
      if (!isDragging) return;
      let newLeft = startLeft + (e.clientX - startX);
      let newTop = startTop + (e.clientY - startY);
      // Clamp to viewport edges
      const maxLeft = window.innerWidth - el.offsetWidth;
      const maxTop = window.innerHeight - el.offsetHeight;
      newLeft = Math.min(Math.max(0, newLeft), maxLeft);
      newTop = Math.min(Math.max(0, newTop), maxTop);
      el.style.left = newLeft + "px";
      el.style.top = newTop + "px";
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Also touch support for mobile
    el.addEventListener("touchstart", e => {
      if (barsLocked) return;
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      isDragging = true;
      startX = touch.clientX;
      startY = touch.clientY;
      const rect = el.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      e.preventDefault();
    });

    window.addEventListener("touchmove", e => {
      if (!isDragging) return;
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      let newLeft = startLeft + (touch.clientX - startX);
      let newTop = startTop + (touch.clientY - startY);
      // Clamp to viewport edges
      const maxLeft = window.innerWidth - el.offsetWidth;
      const maxTop = window.innerHeight - el.offsetHeight;
      newLeft = Math.min(Math.max(0, newLeft), maxLeft);
      newTop = Math.min(Math.max(0, newTop), maxTop);
      el.style.left = newLeft + "px";
      el.style.top = newTop + "px";
      e.preventDefault();
    });

    window.addEventListener("touchend", () => {
      isDragging = false;
    });
  }
})();
