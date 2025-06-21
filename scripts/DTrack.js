(() => {
  const players = new Map();
  const damageLog = [];
  const damageByPlayer = new Map();
  const recentDamageCache = new Set();
  let currentPlayer = null;

  // UI setup
  const display = document.createElement('div');
  display.style = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 260px;
    max-height: 220px;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.9);
    color: #0f0;
    font: 12px monospace;
    padding: 8px;
    border: 1px solid #0f0;
    z-index: 99999;
  `;
  document.body.appendChild(display);

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear';
  clearBtn.style = `
    position: fixed;
    top: 10px;
    right: 280px;
    padding: 4px 8px;
    font-size: 12px;
    background: #600;
    color: white;
    border: 1px solid #a00;
    cursor: pointer;
    z-index: 100000;
  `;
  clearBtn.onclick = () => {
    damageLog.length = 0;
    damageByPlayer.clear();
    recentDamageCache.clear();
    updateDisplay();
  };
  document.body.appendChild(clearBtn);

  const cleanDamageString = str => str.replace(/,/g, '').trim();

  const updateDisplay = () => {
    display.innerHTML = `<b>Players Nearby</b><br>`;
    for (const [name, pos] of players.entries()) {
      display.innerHTML += `${name.padEnd(14)} — x:${pos.x.toFixed(0)} y:${pos.y.toFixed(0)}<br>`;
    }

    display.innerHTML += `<hr><b>Recent Damage</b><br>`;
    const recent = damageLog.slice(-6);
    for (let i = recent.length - 1; i >= 0; i--) {
      const d = recent[i];
      display.innerHTML += `${d.name || "?"}: ${d.val} @ x:${d.x.toFixed(0)}<br>`;
    }

    display.innerHTML += `<hr><b>Total Damage</b><br>`;
    for (const [name, total] of damageByPlayer.entries()) {
      display.innerHTML += `${name}: ${total}<br>`;
    }
  };

  const isLikelyPlayer = text => /^[A-Z][a-zA-Z0-9_]{2,15}$/.test(text);
  const isLikelyDamage = text => /^\d{1,3}(,\d{3})*$|^\d+$/.test(text.trim());

  const hookMethod = method => {
    const original = CanvasRenderingContext2D.prototype[method];
    CanvasRenderingContext2D.prototype[method] = function(text, x, y, ...rest) {
      try {
        const clean = text.trim();
        if (isLikelyPlayer(clean)) {
          players.set(clean, { x, y });
          currentPlayer = clean; // Assume next damage text is from this player
        } else if (isLikelyDamage(clean)) {
          const cleaned = cleanDamageString(clean);
          const id = `${cleaned}_${Math.round(x)}_${Math.round(y)}`;
          if (!recentDamageCache.has(id)) {
            recentDamageCache.add(id);
            if (recentDamageCache.size > 100) {
              const excess = [...recentDamageCache].slice(0, 30);
              for (const old of excess) recentDamageCache.delete(old);
            }
            const value = parseInt(cleaned);
            if (!isNaN(value)) {
              const name = currentPlayer || 'Unknown';
              damageByPlayer.set(name, (damageByPlayer.get(name) || 0) + value);
              damageLog.push({ val: cleaned, x, y, name });
              if (damageLog.length > 100) damageLog.shift();
              updateDisplay();
            }
          }
        }
      } catch (err) {
        console.warn('Canvas hook error:', err);
      }
      return original.call(this, text, x, y, ...rest);
    };
  };

  hookMethod("fillText");
  hookMethod("strokeText");
})();
