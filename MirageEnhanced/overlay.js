(() => {
  // Session tracker overlay (independent of game DOM)

  // Create overlay container
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '10px',
    right: '10px',
    width: '260px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: '#0f0',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    padding: '10px',
    borderRadius: '12px',
    zIndex: 9999999,
    userSelect: 'none',
    cursor: 'default',
  });

  // Header and toggle button
  const header = document.createElement('div');
  header.textContent = 'Session Tracker';
  header.style.fontWeight = 'bold';
  header.style.marginBottom = '8px';

  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'Hide';
  toggleBtn.style.marginBottom = '10px';
  toggleBtn.style.cursor = 'pointer';

  overlay.appendChild(header);
  overlay.appendChild(toggleBtn);

  // Session info elements
  const sessionLengthEl = document.createElement('div');
  const clicksEl = document.createElement('div');

  overlay.appendChild(sessionLengthEl);
  overlay.appendChild(clicksEl);

  document.body.appendChild(overlay);

  // Session tracking variables
  const startTime = Date.now();
  let overlayClicks = 0;

  // Update session length display
  function updateSessionLength() {
    const elapsed = Date.now() - startTime;
    const hrs = Math.floor(elapsed / 3600000);
    const mins = Math.floor((elapsed % 3600000) / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    sessionLengthEl.textContent = `Time elapsed: ${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  }

  // Update clicks display
  function updateClicks() {
    clicksEl.textContent = `Overlay clicks: ${overlayClicks}`;
  }

  // Toggle overlay visibility
  toggleBtn.onclick = () => {
    if (sessionLengthEl.style.display !== 'none') {
      sessionLengthEl.style.display = 'none';
      clicksEl.style.display = 'none';
      toggleBtn.textContent = 'Show';
    } else {
      sessionLengthEl.style.display = 'block';
      clicksEl.style.display = 'block';
      toggleBtn.textContent = 'Hide';
    }
  };

  // Track clicks on the overlay
  overlay.addEventListener('click', () => {
    overlayClicks++;
    updateClicks();
  });

  // Update every second
  setInterval(updateSessionLength, 1000);

  updateSessionLength();
  updateClicks();
})();
