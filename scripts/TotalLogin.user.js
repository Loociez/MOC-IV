// ==UserScript==
// @name         MOC IV - Enhanced Login & Account Swapper
// @namespace    http://tampermonkey.net
// @version      1.2
// @description  Custom HD interface overlays, canvas ember particles, and secure local encrypted quick-profile login engine.
// @author       Loocie
// @match        https://play.consty.com/
// @match        https://play.mirageonlineclassic.com
// @match        https://play.freebrowsermmorpg.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=consty.com
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // Structural CSS Theme Override (Fixes Sizing & Background)
  let loginThemeStyle = document.getElementById('moc-login-button-fix');
  if (!loginThemeStyle) {
    loginThemeStyle = document.createElement('style');
    loginThemeStyle.id = 'moc-login-button-fix';
    document.head.appendChild(loginThemeStyle);
  }

  loginThemeStyle.innerHTML = `
    /* Force Custom Background to stick on the login interface window */
    #winLogin {
      background-image: url('https://loociez.github.io/MOC-IV/images/serpdrag.png') !important;
      background-size: cover !important;
      background-position: center !important;
    }

    
    #winSocial, div#winSocial, .login-social-container {
      margin-top: 40px !important;
      padding-top: 10px !important;
      clear: both !important;
    }

    
    #winLogin ul {
      list-style-type: none !important;
      list-style: none !important;
      padding: 0 !important;
      margin: 12px auto !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important; /* Centers the button rows */
      gap: 6px !important;
      width: 100% !important;
    }

    
    #winLogin ul li, #winLogin li {
      list-style: none !important;
      list-style-type: none !important;
      display: inline-block !important; /* Prevents stretching */
      width: 160px !important; /* Compact RPG sizing matching original bounds */
      max-width: 160px !important;
      background: linear-gradient(180deg, #2e2e36 0%, #18181c 100%) !important;
      border: 1px solid #4a4a52 !important;
      border-radius: 4px !important;
      color: #fff !important;
      font-family: 'Arial', sans-serif !important;
      font-size: 12px !important;
      font-weight: bold !important;
      text-align: center !important;
      padding: 6px 0 !important;
      margin: 0 auto !important;
      cursor: pointer !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.4) !important;
      transition: all 0.15s ease !important;
      box-sizing: border-box !important;
    }

    
    #winLogin ul li:hover, #winLogin li:hover {
      background: linear-gradient(180deg, #3a3a45 0%, #202026 100%) !important;
      border-color: #ffe088 !important; /* Soft golden hover border */
      box-shadow: 0 0 8px rgba(255, 224, 136, 0.3) !important;
    }

    #winLogin ul li:active, #winLogin li:active {
      transform: scale(0.98) !important;
    }
  `;

  // Image Replacement Mapping & Functions
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
      // Ensure we continuously check matching states if the source matches a rule but isn't updated yet
      for (const rule of imageReplacementMap) {
        if (rule.match(img)) {
          if (img.src !== rule.newSrc) {
            img.src = rule.newSrc;
            img.dataset.replaced = "true";
          }
          break;
        }
      }
    });
  }

  function replaceBackgrounds() {
    document.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') return;
      if (bg.includes('serpdrag.png') && !bg.includes('https://loociez.github.io')) {
        el.style.setProperty('background-image', "url('https://loociez.github.io/MOC-IV/images/serpdrag.png')", 'important');
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


  // Ember effect controller
  const emberController = (() => {
    let canvas = null; let ctx = null; let animationId = null; let embers = []; let winClient = null; let resizeObserver = null;

    class Ember {
      constructor() { this.reset(); }
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
        this.x += this.speedX; this.y -= this.speedY; this.life++;
        if (this.life > this.maxLife || this.y < -10) { this.reset(); }
        this.alpha = 0.5 + 0.5 * Math.sin(this.twinklePhase + this.life * this.twinkleSpeed);
        if(this.alpha < 0) this.alpha = 0;
      }
      draw(ctx) {
        const color = this.isGold ? `rgba(230, 193, 90, ${this.alpha.toFixed(2)})` : `rgba(177, 52, 52, ${this.alpha.toFixed(2)})`;
        ctx.beginPath(); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
      }
    }

    function resizeCanvas() {
      if (!canvas || !winClient) return;
      const width = winClient.clientWidth; const height = winClient.clientHeight;
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    }

    function animate() {
      if (!canvas || !ctx) return;
      resizeCanvas(); ctx.clearRect(0, 0, canvas.width, canvas.height);
      embers.forEach(ember => { ember.update(); ember.draw(ctx); });
      animationId = requestAnimationFrame(animate);
    }

    function start() {
      if (canvas) return;
      winClient = document.getElementById('winClient'); if (!winClient) return;
      if (getComputedStyle(winClient).position === 'static') { winClient.style.position = 'relative'; }
      canvas = document.createElement('canvas'); canvas.id = 'emberCanvas';
      Object.assign(canvas.style, { position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '9999', mixBlendMode: 'screen', borderRadius: '12px', backgroundColor: 'transparent' });
      winClient.appendChild(canvas); ctx = canvas.getContext('2d');
      for (let i = 0; i < 40; i++) { embers.push(new Ember()); }
      if (typeof ResizeObserver !== 'undefined') { resizeObserver = new ResizeObserver(() => { resizeCanvas(); }); resizeObserver.observe(winClient); }
      animate();
    }

    function stop() {
      if (!canvas) return; cancelAnimationFrame(animationId); animationId = null;
      if (resizeObserver && winClient) { resizeObserver.unobserve(winClient); resizeObserver.disconnect(); resizeObserver = null; }
      if (canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
      canvas = null; ctx = null; embers = []; winClient = null;
    }
    return { start, stop };
  })();

  function isWinLoginVisible() {
    const el = document.getElementById('winLogin'); if (!el) return false;
    const style = getComputedStyle(el); return !(style.display === 'none' || style.visibility === 'hidden');
  }

  function monitorWinLogin() {
    let lastVisible = false;
    const mo = new MutationObserver(() => {
      const visible = isWinLoginVisible();
      if (visible && !lastVisible) { emberController.start(); setupLoginProfilesPanel(); }
      else if (!visible && lastVisible) { emberController.stop(); removeLoginProfilesPanel(); }
      lastVisible = visible;
    });

    let pollInterval = setInterval(() => {
      const visible = isWinLoginVisible();
      if (visible && !lastVisible) { emberController.start(); setupLoginProfilesPanel(); lastVisible = true; }
      else if (!visible && lastVisible) { emberController.stop(); removeLoginProfilesPanel(); lastVisible = false; }
    }, 1000);

    mo.observe(document.body, { childList: true, subtree: true });
  }

  // SECURE ACCOUNT PROFILE SWITCHER LOGIC
  const cipher = (salt) => {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const byteHex = n => ("0" + Number(n).toString(16)).slice(-2);
    const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);
    return text => text.split('').map(textToChars).map(applySaltToChar).map(byteHex).join('');
  };
  const decipher = (salt) => {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);
    return encoded => encoded.match(/.{1,2}/g).map(hex => parseInt(hex, 16)).map(applySaltToChar).map(charCode => String.fromCharCode(charCode)).join('');
  };

  function setupLoginProfilesPanel() {
    if (document.getElementById('quickLoginPanel')) return;
    const loginWin = document.getElementById('winLogin'); if (!loginWin) return;

    loginWin.style.position = 'relative';

    const panel = document.createElement('div');
    panel.id = 'quickLoginPanel';
    Object.assign(panel.style, {
      position: 'absolute', top: '40px', left: '-260px', width: '240px', padding: '12px',
      background: 'rgba(24, 24, 28, 0.95)', border: '2px solid #444', borderRadius: '8px',
      color: '#fff', fontFamily: 'Arial, sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
      zIndex: '100000', boxSizing: 'border-box'
    });

    const header = document.createElement('div');
    header.innerHTML = `<div style="font-weight:bold; font-size:13px; color:#ffe088; text-align:center; margin-bottom:10px; letter-spacing:0.5px;">🔐 Quick Login Swapper</div>`;
    panel.appendChild(header);

    const listContainer = document.createElement('div');
    listContainer.id = 'profileListQueue';
    panel.appendChild(listContainer);

    const actionContainer = document.createElement('div');
    actionContainer.style.display = 'flex'; actionContainer.style.gap = '4px'; actionContainer.style.marginTop = '10px';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '➕ Save Current Account';
    Object.assign(saveBtn.style, { flex: '1', fontSize: '11px', padding: '6px', cursor: 'pointer', background: '#1c665e', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' });

    saveBtn.onclick = (e) => {
      e.preventDefault();
      const userField = document.querySelector('input[name="txtEmail"]') || document.querySelector('input[type="email"]') || document.getElementById('loginEmail');
      const passField = document.querySelector('input[name="txtPassword"]') || document.querySelector('input[type="password"]') || document.getElementById('loginPassword');

      if (!userField || !passField || !userField.value || !passField.value) {
        alert("Please enter your Email and Password in the game's form inputs first!"); return;
      }
      const pin = prompt("Create a Master PIN (Encryption Key) for this profile:"); if (!pin) return;
      try {
        const encryptedPass = cipher(pin)(passField.value);
        let currentAccounts = JSON.parse(localStorage.getItem('moc_saved_profiles') || '[]');
        currentAccounts = currentAccounts.filter(acc => acc.user !== userField.value);
        currentAccounts.push({ user: userField.value, data: encryptedPass });
        localStorage.setItem('moc_saved_profiles', JSON.stringify(currentAccounts));
        renderProfiles();
      } catch (err) { alert("Encryption Error saving account details."); }
    };

    actionContainer.appendChild(saveBtn); panel.appendChild(actionContainer); loginWin.appendChild(panel);
    renderProfiles();
  }

  function renderProfiles() {
    const queue = document.getElementById('profileListQueue'); if (!queue) return;
    queue.innerHTML = '';
    const accounts = JSON.parse(localStorage.getItem('moc_saved_profiles') || '[]');

    if (accounts.length === 0) {
      queue.innerHTML = `<div style="font-size:11px; color:#888; text-align:center; padding:10px; border: 1px dashed #444; border-radius:4px;">No profiles cached. Enter credentials and hit save.</div>`; return;
    }

    accounts.forEach((acc, index) => {
      const row = document.createElement('div');
      Object.assign(row.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: '#1f1f24', marginBottom: '6px', borderRadius: '4px', border: '1px solid #333' });

      const nameLabel = document.createElement('span');
      nameLabel.textContent = acc.user.length > 20 ? acc.user.substring(0, 18) + '...' : acc.user;
      nameLabel.style.fontSize = '11px'; nameLabel.style.cursor = 'pointer'; nameLabel.style.color = '#88ff88'; nameLabel.style.fontWeight = 'bold';

      nameLabel.onclick = () => {
        const pin = prompt(`Enter Master PIN to log into [${acc.user}]:`); if (!pin) return;
        try {
          const decryptedPass = decipher(pin)(acc.data);
          const userField = document.querySelector('input[name="txtEmail"]') || document.querySelector('input[type="email"]') || document.getElementById('loginEmail');
          const passField = document.querySelector('input[name="txtPassword"]') || document.querySelector('input[type="password"]') || document.getElementById('loginPassword');

          const loginListItems = document.querySelectorAll('#winLogin ul li, #winLogin li');
          let nativeLoginBtn = null;
          loginListItems.forEach(li => {
              if (li.textContent.trim().toLowerCase() === 'login') { nativeLoginBtn = li; }
          });

          if (userField && passField) {
            userField.value = acc.user; passField.value = decryptedPass;
            userField.dispatchEvent(new Event('input', { bubbles: true })); passField.dispatchEvent(new Event('input', { bubbles: true }));
            if (nativeLoginBtn) { setTimeout(() => { nativeLoginBtn.click(); }, 150); }
          }
        } catch (err) { alert("Invalid PIN! Decryption operation aborted to secure account data."); }
      };

      const delBtn = document.createElement('button');
      delBtn.textContent = '✕';
      Object.assign(delBtn.style, { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#ff5555', padding: '0 4px', fontWeight: 'bold' });
      delBtn.onclick = () => {
        if(confirm(`Remove profile entry for ${acc.user}?`)) {
          let currentAccounts = JSON.parse(localStorage.getItem('moc_saved_profiles') || '[]');
          currentAccounts.splice(index, 1);
          localStorage.setItem('moc_saved_profiles', JSON.stringify(currentAccounts));
          renderProfiles();
        }
      };
      row.appendChild(nameLabel); row.appendChild(delBtn); queue.appendChild(row);
    });
  }

  function removeLoginProfilesPanel() {
    const panel = document.getElementById('quickLoginPanel'); if (panel) panel.remove();
  }

  monitorWinLogin();
})();
