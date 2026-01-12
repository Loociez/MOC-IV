(() => {
  'use strict';

  // === Image replacement logic ===
  const imageReplacementMap = [
    { match: img => img.src.includes('header.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/header.png' },
    { match: img => img.src.includes('stats1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/stats1.png' },
    { match: img => img.src.includes('dungeons1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/dungeons1.png' },
    { match: img => img.src.includes('leaderboard1.png'), newSrc: 'https://loociez.github.io/MOC-IV/images/leaderboard1.png' },
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


  // === Animated Floating Leaves Effect for #winClient while #winLogin visible ===
  const leavesController = (() => {
    let canvas = null;
    let ctx = null;
    let animationId = null;
    let leaves = [];
    let winClient = null;
    let resizeObserver = null;

    class Leaf {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20 - Math.random() * 100;
        this.size = 8 + Math.random() * 10;
        this.speedX = (Math.random() - 0.5) * 0.6;
        this.speedY = 0.5 + Math.random() * 1.2;
        this.angle = Math.random() * 2 * Math.PI;
        this.angleSpeed = (Math.random() - 0.5) * 0.02;
        this.alpha = 0.6 + Math.random() * 0.4;
        this.color = `hsl(${90 + Math.random() * 60}, 70%, 60%)`; // green-yellow foliage tones
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += this.angleSpeed;

        if (this.y > canvas.height + 20 || this.x < -30 || this.x > canvas.width + 30) {
          this.reset();
          this.y = -20;
        }
      }
      draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.alpha;

        // Draw a simple stylized leaf shape (chibi style)
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'rgba(50, 30, 10, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(this.size * 0.4, -this.size * 0.6, this.size, -this.size * 0.3, this.size * 0.5, 0);
        ctx.bezierCurveTo(this.size, this.size * 0.3, this.size * 0.4, this.size * 0.6, 0, 0);
        ctx.fill();
        ctx.stroke();

        // Central vein line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.size * 0.5, 0);
        ctx.strokeStyle = 'rgba(40, 20, 0, 0.7)';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        ctx.restore();
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
      leaves.forEach(leaf => {
        leaf.update();
        leaf.draw(ctx);
      });
      animationId = requestAnimationFrame(animate);
    }

    function start() {
      if (canvas) return; // already running
      winClient = document.getElementById('winClient');
      if (!winClient) {
        console.warn('[Leaves] #winClient not found to start');
        return;
      }

      if (getComputedStyle(winClient).position === 'static') {
        winClient.style.position = 'relative';
      }

      canvas = document.createElement('canvas');
      canvas.id = 'leavesCanvas';
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

      const leafCount = 40;
      leaves = [];
      for (let i = 0; i < leafCount; i++) {
        leaves.push(new Leaf());
      }

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          resizeCanvas();
        });
        resizeObserver.observe(winClient);
      }

      animate();
      console.log('[Leaves] started');
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
      leaves = [];
      winClient = null;
      console.log('[Leaves] stopped');
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

  // Monitor #winLogin visibility, start/stop leaves animation accordingly
  function monitorWinLogin() {
    let lastVisible = false;

    const mo = new MutationObserver(() => {
      const visible = isWinLoginVisible();
      if (visible && !lastVisible) {
        leavesController.start();
      } else if (!visible && lastVisible) {
        leavesController.stop();
      }
      lastVisible = visible;
    });

    let pollInterval = setInterval(() => {
      const visible = isWinLoginVisible();
      if (visible && !lastVisible) {
        leavesController.start();
        lastVisible = true;
      } else if (!visible && lastVisible) {
        leavesController.stop();
        lastVisible = false;
      }
    }, 1000);

    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('beforeunload', () => {
      mo.disconnect();
      clearInterval(pollInterval);
      leavesController.stop();
    });
  }

  monitorWinLogin();

})();

(() => {
  const css = `
    /* ===============================
       MIRAGE ONLINE – CHIBI JRPG FOLIAGE THEME
       Console-injectable override
       =============================== */

    /* ---------- GLOBAL COLORS ---------- */
    :root {
      --bg-grass-light: #a0d468;
      --bg-grass-dark: #6aa84f;
      --bg-foliage-gradient: linear-gradient(135deg, #b4ec51 0%, #429321 100%);
      --panel-bg: #dff0d8;
      --panel-bg-soft: #e6f2db;

      --text-main: #2f4f1f;
      --text-muted: #679f55;

      --border-dark: #3f6d2a;
      --border-light: #d2e6a1;

      --button-bg: #88c057;
      --button-bg-hover: #a4d15f;

      --button-text: #1f370c;
      --button-text-hover: #ffffff;
    }

    /* ---------- BASE ---------- */
    body {
      color: var(--text-main);
      background:
        url('https://loociez.github.io/MOC-IV/images/serpdrag.png'),
        var(--bg-foliage-gradient);
      background-repeat: no-repeat;
      background-position: center 40px;
      background-size: 240px auto;
      background-color: var(--bg-grass-dark);
      font-family: 'Comic Sans MS', 'Segoe UI', 'Arial', sans-serif;
      user-select: none;
    }

    a,
    a:visited {
      color: #497a1a;
      text-shadow: 0 0 2px #c8ff3a;
      font-weight: 600;
    }
    a:hover {
      color: #e3ff70;
      text-shadow: 0 0 6px #c8ff3a;
    }

    /* ---------- BUTTONS ---------- */
    button {
      background-color: var(--button-bg);
      border: 2px solid var(--border-dark);
      border-radius: 12px;
      box-shadow:
        inset 0 3px 0 rgba(255 255 255 / 0.6),
        0 4px 6px rgba(0 0 0 / 0.2);
      color: var(--button-text);
      font-weight: 700;
      font-size: 1.1rem;
      padding: 0.6rem 1.2rem;
      cursor: pointer;
      transition: background-color 0.3s ease, color 0.3s ease;
      text-shadow: 0 1px 1px #b4e675;
      user-select: none;
    }
    button:hover {
      background-color: var(--button-bg-hover);
      color: var(--button-text-hover);
      box-shadow:
        inset 0 3px 0 rgba(255 255 255 / 0.9),
        0 6px 12px rgba(0 0 0 / 0.3);
      text-shadow: 0 0 6px #e3ff70;
    }

    /* ---------- INPUTS ---------- */
    input,
    select,
    textarea {
      background-color: var(--panel-bg-soft);
      color: var(--text-main);
      border: 2px solid var(--border-dark);
      border-radius: 10px;
      padding: 0.3rem 0.6rem;
      font-size: 1rem;
      font-family: inherit;
      transition: border-color 0.3s ease;
    }
    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
      border-color: #a4d15f;
      box-shadow: 0 0 8px #c8ff3aaa;
      background-color: #e6f2db;
    }

    /* ---------- SCROLLBARS ---------- */
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    ::-webkit-scrollbar-track {
      background: var(--panel-bg);
      border-radius: 8px;
    }
    ::-webkit-scrollbar-thumb {
      background: var(--button-bg);
      border-radius: 8px;
      border: 2px solid var(--panel-bg);
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--button-bg-hover);
    }

    /* ---------- MAIN GAME GRID ---------- */
    #winGame {
      background-color: var(--bg-grass-light);
      border-radius: 16px;
      box-shadow:
        inset 0 0 15px #a7d94a,
        0 0 15px #6aa84f;
      overflow: hidden;
    }

    /* ---------- LEFT MENU ---------- */
    #winGameMenu {
      background: linear-gradient(to bottom, #b1d87e, #7caf3a);
      border-right: 3px solid var(--border-dark);
      border-radius: 0 16px 16px 0;
      box-shadow: inset 0 0 6px #a2d248;
    }

    /* ---------- SIDEBAR ---------- */
    #winGameSidebar {
      background: linear-gradient(to bottom, #8dbf41, #5b8230);
      border-left: 3px solid var(--border-dark);
      border-right: 3px solid var(--border-dark);
      border-radius: 16px 0 0 16px;
      box-shadow: inset 0 0 6px #8bc038;
    }

    /* ---------- NAVBAR ---------- */
    #winGameNavbar {
      background: linear-gradient(to bottom, #7cbf3c, #51911d);
      border-top: 3px solid var(--border-dark);
      border-radius: 16px 16px 0 0;
      box-shadow: inset 0 0 10px #a0db54;
    }
    #winGameNavbar button {
      color: var(--button-text);
      font-weight: 700;
    }
    #winGameNavbar button:hover {
      background-color: transparent;
      color: #d2f870;
      text-shadow: 0 0 4px #aef97f;
    }

    /* ---------- CHAT ---------- */
    #winGameChatbox {
      background: linear-gradient(to bottom, #d4e9ae, #a0c541);
      color: var(--text-main);
      border-radius: 12px;
      box-shadow: inset 0 0 8px #95ba40;
      font-family: 'Comic Sans MS', cursive, sans-serif;
    }

    #winGameMessage {
      background: linear-gradient(to bottom, #a0c541, #6c9330);
      border-left: 3px solid var(--border-dark);
      border-right: 3px solid var(--border-dark);
      border-radius: 12px;
      box-shadow: inset 0 0 6px #6f8d2d;
      color: var(--text-main);
      font-weight: 600;
    }

    /* ---------- WINDOWS ---------- */
    .gameWindowOdd,
    .gameWindowEven {
      background:
        linear-gradient(to bottom, #c9e893, #7cad3f);
      border: 3px solid var(--border-dark);
      border-radius: 16px;
      box-shadow:
        0 0 1rem #82a747,
        inset 0 0 0.75rem #d1f56e;
      font-family: 'Comic Sans MS', cursive, sans-serif;
    }

    /* ---------- WINDOW HEADERS ---------- */
    .gameWindowOdd > div:first-child,
    .gameWindowEven > div:first-child {
      background:
        linear-gradient(to bottom, #a2d24d, #62982d);
      border-bottom: 3px solid var(--border-dark);
      border-radius: 16px 16px 0 0;
      padding: 0.5rem;
      color: #355913;
      text-shadow: 0 0 3px #d1f56e;
      font-weight: 700;
      font-size: 1.2rem;
    }

    .gameWindowOdd h3,
    .gameWindowEven h3 {
      margin: 0;
      color: #37670f;
      text-shadow:
        0 0 4px #d5f87a,
        2px 2px 3px #3e5410;
      font-family: 'Comic Sans MS', cursive, sans-serif;
    }

    /* ---------- INVENTORY / EQUIPMENT ---------- */
    #winInventory canvas,
    #winEquipment canvas {
      border: 3px solid var(--border-dark);
      background:
        url('https://loociez.github.io/MOC-IV/brick1.png'),
        radial-gradient(circle at top, #c8f467 0%, #4b8426 60%),
        linear-gradient(to bottom, #a1c835, #5f8223);
      background-repeat: repeat;
      background-size: auto, cover, cover;
      border-radius: 12px;
      box-shadow: inset 0 0 15px #8fc641;
    }

    /* ---------- PLAYER PANEL ---------- */
    #winPlayer {
      background:
        url('https://loociez.github.io/MOC-IV/brick1.png'),
        radial-gradient(circle at top, #c8f467 0%, #4b8426 60%),
        linear-gradient(to bottom, #a1c835, #5f8223);
      background-repeat: repeat;
      background-size: auto, cover, cover;
      background-color: #5f8223;
      border-radius: 12px;
      box-shadow: inset 0 0 15px #82b64d;
      font-family: 'Comic Sans MS', cursive, sans-serif;
    }

    #winPlayer > div:first-child {
      background: linear-gradient(to bottom, #7caf3a, #4b6e1a);
      color: #f0f6d2;
      border-bottom: 3px solid var(--border-dark);
      padding: 0.6rem;
      border-radius: 12px 12px 0 0;
      font-weight: 700;
      text-shadow: 0 0 6px #c9f073;
    }

    /* ---------- VITAL BARS ---------- */
    .barVital {
      background-color: #e0f3c3;
      border: 3px solid var(--border-dark);
      border-radius: 12px;
      box-shadow: inset 0 0 8px #b8e06b;
      overflow: hidden;
    }

    #barHP { background-color: #7acd1b; }
    #barMP { background-color: #51a82c; }
    #barSP { background-color: #a3d157; }
    #barXP { background-color: #d3f484; }
    #barTP { background-color: #8fc54e; }

    /* ---------- TOOLTIP ---------- */
    #txtInvDesc {
      background:
        linear-gradient(to bottom, #dff2be, #a1c53a);
      border: 3px solid var(--border-dark);
      color: var(--text-main);
      border-radius: 12px;
      padding: 0.4rem 0.8rem;
      font-family: 'Comic Sans MS', cursive, sans-serif;
      box-shadow: 0 0 8px #a5d449cc;
    }

    /* ---------- BLINK ---------- */
    @keyframes blinkingText {
      0% { color: #a4d15f; }
      50% { color: transparent; }
      100% { color: #a4d15f; }
    }
  `;

  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);
})();
