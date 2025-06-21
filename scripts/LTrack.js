(function () {
  const recentDrops = [];
  let lastDropTime = 0;

 const dropRegex = /\b(?:a|an|the)?\s*(.+?)\s+(drop|drops|dropped|dropping)\s+(?:a|an|the)?\s*([\w\s'()-]+?)(?:\s+x(\d+))?\.?$/i;

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 999999;
    font-family: monospace;
  `;
  document.body.appendChild(container);

  const dropDisplay = document.createElement('div');
  dropDisplay.style.cssText = `
    max-width: 240px;
    max-height: 300px;
    overflow-y: auto;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.75);
    color: #FFD700;
    padding: 6px;
    border: 1px solid gold;
    border-radius: 6px;
  `;
  container.appendChild(dropDisplay);

  const buttonRow = document.createElement('div');
  buttonRow.style.cssText = `display: flex; gap: 4px; margin-top: 4px;`;
  container.appendChild(buttonRow);

  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'Hide';
  toggleBtn.style.cssText = `
    flex: 1;
    font-size: 10px;
    background: #222;
    color: gold;
    border: 1px solid gold;
    border-radius: 4px;
    cursor: pointer;
    padding: 2px 4px;
  `;
  toggleBtn.onclick = () => {
    const hidden = dropDisplay.style.display === 'none';
    dropDisplay.style.display = hidden ? 'block' : 'none';
    toggleBtn.textContent = hidden ? 'Hide' : 'Show';
  };
  buttonRow.appendChild(toggleBtn);

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset';
  resetBtn.style.cssText = toggleBtn.style.cssText;
  resetBtn.onclick = () => {
    recentDrops.length = 0;
    updateDropUI();
    console.log('🔁 Drop list reset.');
  };
  buttonRow.appendChild(resetBtn);

  function updateDropUI() {
    dropDisplay.innerHTML = `<b>Drops:</b><br>` + recentDrops
      .slice(-10)
      .map(d => `🪙 ${d.monster} → <b>${d.item}</b>${d.quantity > 1 ? ' x' + d.quantity : ''}`)
      .reverse()
      .join('<br>');
  }

  const originalFillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...args) {
    try {
      const cleaned = String(text).trim();
      const match = cleaned.match(dropRegex);

      if (match) {
        const monster = match[1].trim();
        const item = match[3].trim();
        const quantity = parseInt(match[4] || "1", 10);
        const timestamp = Date.now();

        if (timestamp - lastDropTime > 200 || recentDrops.at(-1)?.item !== item || recentDrops.at(-1)?.quantity !== quantity) {
          recentDrops.push({ monster, item, quantity, timestamp });
          lastDropTime = timestamp;
          updateDropUI();
          console.log(`🪙 Drop detected: ${monster} → ${item} x${quantity}`);
        }

        if (recentDrops.length > 50) recentDrops.shift();
      }
    } catch (e) {
      console.warn('Drop watcher error:', e);
    }

    return originalFillText.call(this, text, x, y, ...args);
  };

  console.log('✨ Drop tracker with toggle & reset loaded.');
})();
