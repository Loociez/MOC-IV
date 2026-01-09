(() => {
  // Create intro overlay div
  const introDiv = document.createElement('div');
  introDiv.id = 'intro';
  document.body.appendChild(introDiv);

  // Styles for intro overlay
  const style = document.createElement('style');
  style.textContent = `
    #intro {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at center, #220022, #000000);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #ff00ff;
      font-family: 'Press Start 2P', monospace, Arial, sans-serif;
      font-size: 2.5rem;
      text-align: center;
      text-shadow:
        0 0 8px #ff00ff,
        0 0 20px #ff00ff,
        0 0 40px #ff00ff,
        0 0 80px #ff00ff;
      z-index: 9999;
      user-select: none;
      pointer-events: auto;
      animation: neonPulse 3s ease-in-out alternate forwards;
    }

    @keyframes neonPulse {
      0% {
        text-shadow:
          0 0 4px #ff00ff,
          0 0 10px #ff00ff,
          0 0 20px #ff00ff,
          0 0 40px #ff00ff;
        opacity: 1;
      }
      50% {
        text-shadow:
          0 0 10px #ff00ff,
          0 0 30px #ff00ff,
          0 0 60px #ff00ff,
          0 0 90px #ff00ff;
        opacity: 0.8;
      }
      100% {
        text-shadow:
          0 0 4px #ff00ff,
          0 0 10px #ff00ff,
          0 0 20px #ff00ff,
          0 0 40px #ff00ff;
        opacity: 1;
      }
    }

    .subText {
      margin-top: 0.5rem;
      font-size: 1rem;
      color: #ff77ffcc;
      text-shadow: 0 0 6px #ff00ffaa;
      animation: flicker 2s ease forwards;
    }

    @keyframes flicker {
      0%, 100% { opacity: 1; }
      10% { opacity: 0.85; }
      20% { opacity: 0.9; }
      30% { opacity: 0.7; }
      40% { opacity: 0.9; }
      50% { opacity: 0.75; }
      60% { opacity: 1; }
      70% { opacity: 0.8; }
      80% { opacity: 0.95; }
      90% { opacity: 0.7; }
    }
  `;
  document.head.appendChild(style);

  // Add main and sub text
  const mainText = document.createElement('div');
  mainText.textContent = 'Mirage Online Classic';
  introDiv.appendChild(mainText);

  const subText = document.createElement('div');
  subText.textContent = 'Global Chat Viewer';
  subText.className = 'subText';
  introDiv.appendChild(subText);

  // After 4 seconds fade out and remove intro
  setTimeout(() => {
    introDiv.style.transition = 'opacity 1s ease';
    introDiv.style.opacity = '0';

    setTimeout(() => {
      introDiv.remove();
    }, 1000);
  }, 4000);
})();
