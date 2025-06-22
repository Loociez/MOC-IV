(() => {
  const trackedNames = new Map();
  const lastSeen = new Map();
  const hiddenColor = '#008080';
  const UI_ID = 'player-tracker-ui';
  const SAFE_TIMEOUT = 15000; // 15 seconds grace period

  let visible = true;

  // Create UI
  const createUI = () => {
    if (document.getElementById(UI_ID)) return;

    const box = document.createElement('div');
    box.id = UI_ID;
    box.style.position = 'absolute';
    box.style.top = '10px';
    box.style.right = '10px';
    box.style.background = 'rgba(0,0,0,0.7)';
    box.style.color = '#fff';
    box.style.padding = '8px';
    box.style.fontSize = '12px';
    box.style.border = '1px solid #999';
    box.style.zIndex = '99999';
    box.style.borderRadius = '6px';
    box.style.maxWidth = '200px';
    box.style.fontFamily = 'monospace';

    const nameList = document.createElement('div');
    nameList.id = 'nameList';
    nameList.style.marginBottom = '6px';
    box.appendChild(nameList);

    const hideBtn = document.createElement('button');
    hideBtn.textContent = 'Hide';
    hideBtn.style.marginRight = '4px';
    hideBtn.onclick = () => {
      visible = !visible;
      nameList.style.display = visible ? 'block' : 'none';
      hideBtn.textContent = visible ? 'Hide' : 'Show';
    };
    box.appendChild(hideBtn);

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.onclick = () => {
      trackedNames.clear();
      lastSeen.clear();
      updateUI();
    };
    box.appendChild(resetBtn);

    document.body.appendChild(box);
  };

  const updateUI = () => {
    const nameList = document.getElementById('nameList');
    if (!nameList) return;
    nameList.innerHTML = '';
    for (const name of trackedNames.keys()) {
      const entry = document.createElement('div');
      entry.textContent = name;
      nameList.appendChild(entry);
    }
  };

  const isDamageLike = (text) => {
    return /^[-+]?\d+$/.test(text.trim());
  };

  const monitorCanvas = () => {
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y) {
      try {
        const color = this.fillStyle.toString().toLowerCase();
        const now = Date.now();

        if (
          typeof text === 'string' &&
          text.length <= 20 &&
          !isDamageLike(text) &&
          color !== hiddenColor
        ) {
          // Treat as name
          if (!trackedNames.has(text)) {
            console.log('[Track] New:', text);
          }
          trackedNames.set(text, true);
          lastSeen.set(text, now);
          updateUI();
        }
      } catch (e) {
        console.error('Canvas tracking error:', e);
      }

      return original.apply(this, arguments);
    };
  };

  const cleanup = () => {
    const now = Date.now();
    for (const [name, timestamp] of lastSeen.entries()) {
      if (now - timestamp > SAFE_TIMEOUT) {
        trackedNames.delete(name);
        lastSeen.delete(name);
        console.log('[Track] Removed:', name);
        updateUI();
      }
    }
  };

  createUI();
  monitorCanvas();
  setInterval(cleanup, 5000); // check every 5s to reduce performance impact
})();
