const killCounts = {};
const killBuffer = []; // buffer for newly detected kills in short bursts

// Main display container (same as yours)
const display = document.createElement('div');
display.style.cssText = `
  position: fixed;
  top: 15px;
  right: 10px;
  width: 150px;
  background: rgba(0,0,0,0.7);
  color: #00FF00;
  font-family: monospace;
  font-size: 10px;
  padding: 5px;
  border: 1px solid lime;
  z-index: 99999;
  max-height: 250px;
  overflow-y: auto;
`;
document.body.appendChild(display);

const killList = document.createElement('div');
display.appendChild(killList);

function updateKillList() {
  killList.innerHTML = '<b>Monster Kills:</b><br>' + Object.entries(killCounts)
    .map(([monster, count]) => `${monster}: ${count}`)
    .join('<br>');
}

// Reset button
const resetBtn = document.createElement('button');
resetBtn.textContent = 'Reset';
resetBtn.style.cssText = `
  display: block;
  margin-top: 8px;
  background: darkred;
  color: white;
  font-weight: bold;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
`;
resetBtn.onclick = () => {
  for (const key in killCounts) delete killCounts[key];
  updateKillList();
  console.log('🔄 Kill tracker reset.');
};
display.appendChild(resetBtn);

// Toggle button
const toggleBtn = document.createElement('button');
toggleBtn.textContent = 'Hide';
toggleBtn.style.cssText = resetBtn.style.cssText;
toggleBtn.style.marginTop = '4px';
display.appendChild(toggleBtn);

toggleBtn.onclick = () => {
  if (killList.style.display !== 'none') {
    killList.style.display = 'none';
    resetBtn.style.display = 'none';
    toggleBtn.textContent = 'Show';
  } else {
    killList.style.display = 'block';
    resetBtn.style.display = 'block';
    toggleBtn.textContent = 'Hide';
  }
};

updateKillList();

// Buffer flush function debounced
let flushTimeout = null;
function flushKillBuffer() {
  if (flushTimeout) clearTimeout(flushTimeout);
  flushTimeout = setTimeout(() => {
    for (const monster of killBuffer) {
      killCounts[monster] = (killCounts[monster] || 0) + 1;
      console.log(`🩸 ${monster} slain! Total: ${killCounts[monster]}`);
    }
    killBuffer.length = 0; // clear buffer
    updateKillList();
  }, 250); // flush buffer every 250ms max
}

// Hook fillText
const originalFillText = CanvasRenderingContext2D.prototype.fillText;
CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...args) {
  try {
    // More flexible regex for kill messages
    const regex = /for killing (?:a |an )?(.+?)\./gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const monster = match[1].trim();
      killBuffer.push(monster);
    }
    if (killBuffer.length > 0) {
      flushKillBuffer();
    }
  } catch (err) {
    console.error('Error processing fillText:', err, text);
  }

  return originalFillText.call(this, text, x, y, ...args);
};
