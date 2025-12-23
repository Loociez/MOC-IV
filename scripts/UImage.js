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
(() => {
  const css = `
    /* ===============================
       MIRAGE ONLINE – RED/GOLD FANTASY THEME
       Console-injectable override
       =============================== */

    /* ---------- GLOBAL COLORS ---------- */
    :root {
      --bg-dark: #120808;
      --bg-panel: #1b0d0d;
      --bg-panel-soft: #231010;
      --bg-header: linear-gradient(to bottom, #5a0f0f, #2b0606);

      --gold: #e6c15a;
      --gold-soft: #c9a74a;
      --gold-dark: #8f6a1f;

      --red-main: #8c1d1d;
      --red-soft: #b13434;

      --text-main: #f3ead3;
      --text-muted: #c7bda5;

      --border-dark: #050202;
      --border-gold: #6f4f18;
    }

    /* ---------- BASE ---------- */
    body {
      color: var(--text-main);
      /* Put image last so gradients are behind image */
      background:
        url('https://loociez.github.io/MOC-IV/images/serpdrag.png'),
        radial-gradient(circle at top, #2a0f0f 0%, #080202 60%),
        linear-gradient(to bottom, #140707, #000);
      background-repeat: repeat;
      background-size: auto, cover, cover;
      background-color: #080202;
    }

    a,
    a:visited {
      color: var(--gold);
    }
    a:hover {
      color: #fff1b3;
    }

    /* ---------- BUTTONS ---------- */
    button {
      background:
        linear-gradient(to bottom, #3a0d0d, #1a0505);
      color: var(--gold);
      border: 0.125rem solid var(--border-gold);
      box-shadow:
        inset 0 0 0.25rem rgba(255, 200, 100, 0.25),
        0 0 0.5rem rgba(0, 0, 0, 0.8);
      text-shadow: 0 1px 2px black;
    }

    button:hover {
      background:
        linear-gradient(to bottom, #5a1414, #260808);
      color: #fff1b3;
      box-shadow:
        inset 0 0 0.5rem rgba(255, 215, 120, 0.5),
        0 0 0.75rem rgba(255, 180, 80, 0.3);
    }

    /* ---------- INPUTS ---------- */
    input,
    select,
    textarea {
      background-color: var(--bg-panel);
      color: var(--text-main);
      border: 0.125rem solid var(--border-gold);
    }

    input:focus,
    select:focus,
    textarea:focus {
      outline: 0.125rem solid var(--gold);
    }

    /* ---------- SCROLLBARS ---------- */
    ::-webkit-scrollbar-track {
      background: #120606;
    }
    ::-webkit-scrollbar-thumb {
      background: #6f4f18;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--gold);
    }

    /* ---------- MAIN GAME GRID ---------- */
    #winGame {
      background-color: black;
    }

    /* ---------- LEFT MENU ---------- */
    #winGameMenu {
      background:
        linear-gradient(to bottom, #240b0b, #140505);
      border-right: 0.125rem solid var(--border-gold);
    }

    /* ---------- SIDEBAR ---------- */
    #winGameSidebar {
      background:
        linear-gradient(to bottom, #1a0707, #0c0303);
      border-left: 0.125rem solid var(--border-gold);
      border-right: 0.125rem solid var(--border-gold);
    }

    /* ---------- NAVBAR ---------- */
    #winGameNavbar {
      background:
        linear-gradient(to bottom, #2b0c0c, #120505);
      border-top: 0.125rem solid var(--border-gold);
    }

    #winGameNavbar button {
      color: var(--gold);
    }

    #winGameNavbar button:hover {
      background-color: transparent;
      color: #fff1b3;
    }

    /* ---------- CHAT ---------- */
    #winGameChatbox {
      background:
        linear-gradient(to bottom, #080202, #020000);
      color: var(--text-main);
    }

    #winGameMessage {
      background:
        linear-gradient(to bottom, #1a0707, #0c0303);
      border-left: 0.125rem solid var(--border-gold);
      border-right: 0.125rem solid var(--border-gold);
    }

    /* ---------- WINDOWS ---------- */
    .gameWindowOdd,
    .gameWindowEven {
      background:
        linear-gradient(to bottom, #200909, #0d0303),
        url('/interface/brick1.png');
      border: 0.125rem solid var(--border-gold);
      box-shadow:
        0 0 1.5rem rgba(0, 0, 0, 0.9),
        inset 0 0 1rem rgba(255, 180, 80, 0.08);
    }

    /* ---------- WINDOW HEADERS ---------- */
    .gameWindowOdd > div:first-child,
    .gameWindowEven > div:first-child {
      background:
        linear-gradient(to bottom, #6b1a1a, #2e0808);
      border-bottom: 0.125rem solid var(--border-gold);
    }

    .gameWindowOdd h3,
    .gameWindowEven h3 {
      color: var(--gold);
      text-shadow:
        0 0 4px rgba(255, 200, 100, 0.6),
        2px 2px 4px black;
    }

    /* ---------- INVENTORY / EQUIPMENT ---------- */
    #winInventory canvas,
    #winEquipment canvas {
      border: 2px solid var(--border-gold);
      background:
        url('https://loociez.github.io/MOC-IV/brick1.png'),
        radial-gradient(circle at top, #2a0f0f 0%, #080202 60%),
        linear-gradient(to bottom, #140707, #000);
      background-repeat: repeat;
      background-size: auto, cover, cover;
      background-color: #080202;
    }

    /* ---------- PLAYER PANEL ---------- */
    #winPlayer {
      background:
        url('https://loociez.github.io/MOC-IV/brick1.png'),
        radial-gradient(circle at top, #2a0f0f 0%, #080202 60%),
        linear-gradient(to bottom, #140707, #000);
      background-repeat: repeat;
      background-size: auto, cover, cover;
      background-color: #080202;
    }

    #winPlayer > div:first-child {
      background:
        linear-gradient(to bottom, #5a1414, #2b0707);
      color: var(--gold);
      border-bottom: 0.125rem solid var(--border-gold);
    }

    /* ---------- VITAL BARS ---------- */
    .barVital {
      background-color: #0c0303;
      border: 0.125rem solid var(--border-gold);
    }

    #barHP { background-color: #a42a2a; }
    #barMP { background-color: #3a4fa3; }
    #barSP { background-color: #3a8a3a; }
    #barXP { background-color: #b19a3a; }
    #barTP { background-color: #7a3a8a; }

    /* ---------- TOOLTIP ---------- */
    #txtInvDesc {
      background:
        linear-gradient(to bottom, #1a0707, #0a0202);
      border: 0.125rem solid var(--border-gold);
      color: var(--text-main);
    }

    /* ---------- BLINK ---------- */
    @keyframes blinkingText {
      0% { color: var(--gold); }
      50% { color: transparent; }
      100% { color: var(--gold); }
    }
  `;

  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);
})();
