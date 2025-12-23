(() => {
  'use strict';

  // === Image replacement logic ===
  const imageReplacementMap = [
    { match: img => img.src.includes('header.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/header.png' },
    { match: img => img.src.includes('stats1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/stats1.png' },
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


  // === Ember effect controller for #winClient but active only while #winLogin is visible ===
  const emberController = (() => {
    let canvas = null;
    let ctx = null;
    let animationId = null;
    let embers = [];
    let winClient = null;
    let resizeObserver = null;

    class Ember {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 20;
        this.size = 1 + Math.random() * 2;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = 0.5 + Math.random() * 1.5;
        this.life = 0;
        this.maxLife = 200 + Math.random() * 200;
        this.alpha = 0;
        this.twinkleSpeed = 0.05 + Math.random() * 0.05;
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.isGold = Math.random() > 0.5;
      }
      update() {
        this.x += this.speedX;
        this.y -= this.speedY;
        this.life++;
        if (this.life > this.maxLife || this.y < -10) {
          this.reset();
        }
        this.alpha = 0.5 + 0.5 * Math.sin(this.twinklePhase + this.life * this.twinkleSpeed);
        if(this.alpha < 0) this.alpha = 0;
      }
      draw(ctx) {
        const color = this.isGold
          ? `rgba(230, 193, 90, ${this.alpha.toFixed(2)})`
          : `rgba(177, 52, 52, ${this.alpha.toFixed(2)})`;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
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
      embers.forEach(ember => {
        ember.update();
        ember.draw(ctx);
      });
      animationId = requestAnimationFrame(animate);
    }

    function start() {
      if (canvas) return; // already running
      winClient = document.getElementById('winClient');
      if (!winClient) {
        console.warn('[Embers] #winClient not found to start');
        return;
      }

      if (getComputedStyle(winClient).position === 'static') {
        winClient.style.position = 'relative';
      }

      canvas = document.createElement('canvas');
      canvas.id = 'emberCanvas';
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

      const emberCount = 40;
      embers = [];
      for (let i = 0; i < emberCount; i++) {
        embers.push(new Ember());
      }

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          resizeCanvas();
        });
        resizeObserver.observe(winClient);
      }

      animate();
      console.log('[Embers] started');
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
      embers = [];
      winClient = null;
      console.log('[Embers] stopped');
    }

    return { start, stop };
  })();

  // Helper: is #winLogin visible and in DOM
  function isWinLoginVisible() {
    const el = document.getElementById('winLogin');
    if (!el) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (!document.body.contains(el)) return false;
    return true;
  }

  // Monitor #winLogin visibility, start/stop embers accordingly
  function monitorWinLogin() {
    let lastVisible = false;

    // MutationObserver to catch DOM changes
    const mo = new MutationObserver(() => {
      const visible = isWinLoginVisible();
      if (visible && !lastVisible) {
        emberController.start();
      } else if (!visible && lastVisible) {
        emberController.stop();
      }
      lastVisible = visible;
    });

    // Poll every second just in case mutations miss something
    let pollInterval = setInterval(() => {
      const visible = isWinLoginVisible();
      if (visible && !lastVisible) {
        emberController.start();
        lastVisible = true;
      } else if (!visible && lastVisible) {
        emberController.stop();
        lastVisible = false;
      }
    }, 1000);

    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('beforeunload', () => {
      mo.disconnect();
      clearInterval(pollInterval);
      emberController.stop();
    });
  }

  monitorWinLogin();

})();
