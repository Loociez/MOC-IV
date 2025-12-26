(() => {
  'use strict';

  // === Image replacement logic ===
  const imageReplacementMap = [
    { match: img => img.src.includes('header.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/header.png' },
    { match: img => img.src.includes('stats1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/stats1.png' },
    { match: img => img.src.includes('leaderboard1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/leaderboard1.png' },
    { match: img => img.src.includes('dungeons1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/dungeons1.png' },
    { match: img => img.src.includes('guilds1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/guilds1.png' },
    { match: img => img.src.includes('mobile1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/mobile1.png' },
    { match: img => img.src.includes('quit1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/quit1.png' },
    { match: img => img.src.includes('settings1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/settings1.png' },
    { match: img => img.src.includes('shop1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/shop1.png' },
    { match: img => img.src.includes('trade1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/trade1.png' },
    { match: img => /serpdrag\.png(\?.*)?$/.test(img.src), newSrc: 'https://loociez.github.io/MOC-IV/images/serpdrag.png' }
  ];

  function replaceImages() {
    document.querySelectorAll('img').forEach(img => {
      if (img.dataset.replaced) return;
      for (const rule of imageReplacementMap) {
        if (rule.match(img)) {
          img.src = rule.newSrc;
          img.dataset.replaced = "true";
          break;
        }
      }
    });
  }

  function replaceBackgrounds() {
    document.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') return;
      if (bg.includes('serpdrag.png')) {
        const newBg = bg.replace(/url\(['"]?[^'"]*serpdrag\.png['"]?\)/, `url('https://loociez.github.io/MOC-IV/images/serpdrag.png')`);
        el.style.backgroundImage = newBg;
      }
    });
  }

  replaceImages();
  replaceBackgrounds();

  const observer = new MutationObserver(() => {
    replaceImages();
    replaceBackgrounds();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // === Snowflake effect controller for #winClient active only when #winLogin visible ===
  const snowController = (() => {
    let canvas = null;
    let ctx = null;
    let animationId = null;
    let snowflakes = [];
    let winClient = null;
    let resizeObserver = null;

    class Snowflake {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * -canvas.height;
        this.size = 1 + Math.random() * 3;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = 1 + Math.random() * 1.5;
        this.opacity = 0.3 + Math.random() * 0.7;
        this.angle = Math.random() * 2 * Math.PI;
        this.angleSpeed = (Math.random() - 0.5) * 0.02;
      }
      update() {
        this.x += this.speedX + Math.sin(this.angle) * 0.5;
        this.y += this.speedY;
        this.angle += this.angleSpeed;
        if (this.y > canvas.height) this.reset();
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
      }
      draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity.toFixed(2)})`;
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 3;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function resizeCanvas() {
      if (!canvas || !winClient) return;
      const width = winClient.clientWidth;
      const height = winClient.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }

    function animate() {
      if (!canvas || !ctx) return;
      resizeCanvas();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      snowflakes.forEach(snowflake => {
        snowflake.update();
        snowflake.draw(ctx);
      });
      animationId = requestAnimationFrame(animate);
    }

    function start() {
      if (canvas) return; // already running
      winClient = document.getElementById('winClient');
      if (!winClient) {
        console.warn('[Snowflakes] #winClient not found to start');
        return;
      }
      if (getComputedStyle(winClient).position === 'static') {
        winClient.style.position = 'relative';
      }
      canvas = document.createElement('canvas');
      canvas.id = 'snowCanvas';
      Object.assign(canvas.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '9999',
        mixBlendMode: 'screen',
        borderRadius: '12px',
        backgroundColor: 'transparent'
      });
      winClient.appendChild(canvas);
      ctx = canvas.getContext('2d');
      const snowflakeCount = 60;
      snowflakes = [];
      for (let i = 0; i < snowflakeCount; i++) {
        snowflakes.push(new Snowflake());
      }
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          resizeCanvas();
        });
        resizeObserver.observe(winClient);
      }
      animate();
      console.log('[Snowflakes] started');
    }

    function stop() {
      if (!canvas) return;
      cancelAnimationFrame(animationId);
      animationId = null;
      if (resizeObserver && winClient) {
        resizeObserver.unobserve(winClient);
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      canvas = null;
      ctx = null;
      snowflakes = [];
      winClient = null;
      console.log('[Snowflakes] stopped');
    }

    return { start, stop };
  })();

  // Xmas Lights controller for both #winLogin and #winSelectPlayer
  const lightsController = (() => {
    let lightsContainers = new Map(); // map of windowId => container
    let animationId = null;
    const colors = ['#FF0000', '#00FF00', '#FFFF00', '#FF69B4', '#00FFFF'];
    const lightCount = 20;
    let lightsMap = new Map(); // windowId => lights[]

    function createLights(winId) {
      if (lightsContainers.has(winId)) return;
      const winEl = document.getElementById(winId);
      if (!winEl) return;

      // Create container div outside of the window, as sibling overlay
      const lightsContainer = document.createElement('div');
      lightsContainer.id = `xmasLightsContainer_${winId}`;

      // Position it absolutely exactly over the target window
      const rect = winEl.getBoundingClientRect();
      Object.assign(lightsContainer.style, {
        position: 'absolute',
        top: `${rect.top + window.scrollY - 10}px`,
        left: `${rect.left + window.scrollX - 10}px`,
        width: `${rect.width + 20}px`,
        height: `${rect.height + 20}px`,
        pointerEvents: 'none',
        zIndex: '10000',
        borderRadius: '14px',
        boxSizing: 'border-box',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignContent: 'space-between',
        padding: '5px',
        gap: '4px',
      });

      document.body.appendChild(lightsContainer);

      const lights = [];
      for (let i = 0; i < lightCount; i++) {
        const light = document.createElement('div');
        light.classList.add('xmas-light');
        light.style.width = '10px';
        light.style.height = '10px';
        light.style.borderRadius = '50%';
        light.style.backgroundColor = colors[i % colors.length];
        light.style.boxShadow = `0 0 5px ${colors[i % colors.length]}`;
        lightsContainer.appendChild(light);
        lights.push(light);
      }

      lightsContainers.set(winId, lightsContainer);
      lightsMap.set(winId, lights);
    }

    function animateLights() {
      lightsMap.forEach((lights) => {
        lights.forEach((light, i) => {
          const flicker = 0.5 + Math.sin(Date.now() / 300 + i) * 0.5;
          light.style.opacity = flicker.toFixed(2);
        });
      });
      animationId = requestAnimationFrame(animateLights);
    }

    function updatePosition(winId) {
      const lightsContainer = lightsContainers.get(winId);
      const winEl = document.getElementById(winId);
      if (!lightsContainer || !winEl) return;
      const rect = winEl.getBoundingClientRect();
      lightsContainer.style.top = `${rect.top + window.scrollY - 10}px`;
      lightsContainer.style.left = `${rect.left + window.scrollX - 10}px`;
      lightsContainer.style.width = `${rect.width + 20}px`;
      lightsContainer.style.height = `${rect.height + 20}px`;
    }

    function updateAllPositions() {
      lightsContainers.forEach((_, winId) => updatePosition(winId));
    }

    function start() {
      // Start lights on both windows if visible
      ['winLogin', 'winSelectPlayer'].forEach(winId => {
        if (document.getElementById(winId)) {
          createLights(winId);
        }
      });
      animateLights();
      window.addEventListener('resize', updateAllPositions);
      window.addEventListener('scroll', updateAllPositions);
      console.log('[Xmas Lights] started');
    }

    function stop() {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      window.removeEventListener('resize', updateAllPositions);
      window.removeEventListener('scroll', updateAllPositions);

      lightsContainers.forEach((container) => {
        if (container.parentNode) container.parentNode.removeChild(container);
      });
      lightsContainers.clear();
      lightsMap.clear();
      console.log('[Xmas Lights] stopped');
    }

    return { start, stop };
  })();

  // Helper: is either #winLogin or #winSelectPlayer visible and in DOM
  function isAnyWinVisible() {
    const ids = ['winLogin', 'winSelectPlayer'];
    return ids.some(id => {
      const el = document.getElementById(id);
      if (!el) return false;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (!document.body.contains(el)) return false;
      return true;
    });
  }

  // Helper: add or remove warm glow on both windows
  function addWarmGlow() {
    ['winLogin', 'winSelectPlayer'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.transition = 'background-color 1s ease-in-out';
      el.style.backgroundColor = 'rgba(255, 215, 0, 0.15)'; // subtle golden warm glow
      el.style.boxShadow = '0 0 15px 3px rgba(255, 215, 0, 0.6)';
    });
  }
  function removeWarmGlow() {
    ['winLogin', 'winSelectPlayer'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.backgroundColor = 'rgba(30, 30, 30, 0.7)'; // revert original bg
      el.style.boxShadow = '';
    });
  }

  // Monitor visibility and toggle effects accordingly
  function monitorWindows() {
    let lastVisible = false;

    const mo = new MutationObserver(() => {
      const visible = isAnyWinVisible();
      if (visible && !lastVisible) {
        snowController.start();
        lightsController.start();
        addWarmGlow();
      } else if (!visible && lastVisible) {
        snowController.stop();
        lightsController.stop();
        removeWarmGlow();
      }
      lastVisible = visible;
    });

    let pollInterval = setInterval(() => {
      const visible = isAnyWinVisible();
      if (visible && !lastVisible) {
        snowController.start();
        lightsController.start();
        addWarmGlow();
        lastVisible = true;
      } else if (!visible && lastVisible) {
        snowController.stop();
        lightsController.stop();
        removeWarmGlow();
        lastVisible = false;
      }
    }, 1000);

    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('beforeunload', () => {
      mo.disconnect();
      clearInterval(pollInterval);
      snowController.stop();
      lightsController.stop();
      removeWarmGlow();
    });
  }

  monitorWindows();

})();
