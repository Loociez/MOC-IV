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
    { match: img => /serpdrag\.png(\?.*)?$/.test(img.src), newSrc: 'https://loociez.github.io/MOC-IV/images/2serpdrag.png' }
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

  replaceImages();

  const observer = new MutationObserver(replaceImages);
  observer.observe(document.body, { childList: true, subtree: true });

  // === Leaf animation (login only) ===
  const leafController = (() => {
    let canvas, ctx, anim;
    let leaves = [];
    let target;

    class Leaf {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = 6 + Math.random() * 8;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = 0.4 + Math.random() * 1.0;
        this.rot = Math.random() * Math.PI;
        this.rotSpd = (Math.random() - 0.5) * 0.02;
        this.alpha = 0.4 + Math.random() * 0.4;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rot += this.rotSpd;
        if (this.y > canvas.height + 20) this.reset();
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = '#6f7a4f';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      leaves.forEach(l => { l.update(); l.draw(); });
      anim = requestAnimationFrame(loop);
    }

    function start() {
      if (canvas) return;
      target = document.getElementById('winClient');
      if (!target) return;

      canvas = document.createElement('canvas');
      Object.assign(canvas.style, {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10
      });

      target.style.position = 'relative';
      target.appendChild(canvas);

      canvas.width = target.clientWidth;
      canvas.height = target.clientHeight;
      ctx = canvas.getContext('2d');

      leaves = Array.from({ length: 32 }, () => new Leaf());
      loop();
    }

    function stop() {
      cancelAnimationFrame(anim);
      canvas?.remove();
      canvas = null;
    }

    return { start, stop };
  })();

  function isLoginVisible() {
    const el = document.getElementById('winLogin');
    return el && getComputedStyle(el).display !== 'none';
  }

  let last = false;
  setInterval(() => {
    const now = isLoginVisible();
    if (now && !last) leafController.start();
    if (!now && last) leafController.stop();
    last = now;
  }, 800);
})();

(() => {
  const css = `
  :root {
    --bg-main: #000000;
    --bg-panel: #2a283b;
    --bg-soft: #35324a;

    --text-main: #d7d3ff;
    --text-muted: #a5a1cc;

    --accent: #bfa6ff;
    --border: #4a4566;
  }

  body {
    background-color: #000;
    background-image: url('https://loociez.github.io/MOC-IV/images/2serpdrag.png');
    background-repeat: no-repeat;
    background-position: center center;
    background-size: contain;
    color: var(--text-main);
    font-family: 'Segoe UI', sans-serif;
    text-shadow: none;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }

  button {
    background: linear-gradient(#4b4680, #343060);
    border: 2px solid var(--border);
    color: var(--text-main);
    border-radius: 10px;
    text-shadow: none;
  }

  input {
    background: var(--bg-soft);
    border: 2px solid var(--border);
    color: var(--text-main);
    border-radius: 8px;
  }

  .gameWindowOdd,
  .gameWindowEven {
    background: linear-gradient(#35324a, #242235);
    border: 2px solid var(--border);
    border-radius: 14px;
    color: var(--text-main);
  }

  h3, label {
    color: var(--accent);
  }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})();
