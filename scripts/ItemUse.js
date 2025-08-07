(() => {
  let highlightedIndex = null;
  let oKeyDown = false; // track if O is already pressed

  // Highlight or unhighlight item on middle click
  document.querySelector('#winInventory').addEventListener('mousedown', (e) => {
    if (e.button === 1) { // middle mouse button
      e.preventDefault();
      const canvases = Array.from(document.querySelectorAll('#winInventory canvas'));
      const idx = canvases.findIndex(c => c === e.target);

      if (idx !== -1) {
        if (highlightedIndex === idx) {
          // If clicking the same highlighted slot → clear highlight
          e.target.style.outline = '';
          highlightedIndex = null;
        } else {
          // Remove highlight from all
          canvases.forEach(c => c.style.outline = '');
          // Highlight clicked slot
          e.target.style.outline = 'green solid 2px';
          highlightedIndex = idx;
        }
      }
    }
  });

  // Simulate double click function
  function simulateDoubleClickOnCanvas(canvas) {
    function createMouseEvent(type) {
      return new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0,
        buttons: 1,
        clientX: canvas.getBoundingClientRect().left + 10,
        clientY: canvas.getBoundingClientRect().top + 10,
      });
    }

    // First mousedown + mouseup
    canvas.dispatchEvent(createMouseEvent('mousedown'));
    canvas.dispatchEvent(createMouseEvent('mouseup'));

    // Second mousedown + mouseup after short delay
    setTimeout(() => {
      canvas.dispatchEvent(createMouseEvent('mousedown'));
      canvas.dispatchEvent(createMouseEvent('mouseup'));
    }, 150);
  }

  // Key down: only trigger once per press
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'o' && !oKeyDown && highlightedIndex !== null) {
      oKeyDown = true;
      const canvases = document.querySelectorAll('#winInventory canvas');
      const slotCanvas = canvases[highlightedIndex];
      if (slotCanvas) {
        simulateDoubleClickOnCanvas(slotCanvas);
      }
      // Optional: clear highlight after use to avoid accidental repeats
      // slotCanvas.style.outline = '';
      // highlightedIndex = null;
    }
  });

  // Reset key flag when released
  document.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'o') {
      oKeyDown = false;
    }
  });

  console.log('Highlight');
})();
