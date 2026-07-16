// ==UserScript==
// @name         Consty Auto Login (Shared Account)
// @namespace    consty-autologin
// @version      2.0
// @description  Prompts for an access code, never shows the real account password
// @match        https://play.consty.com/*
// @grant        GM_xmlhttpRequest
// @connect      YOUR-RENDER-APP.onrender.com
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // Replace with your real Render URL
  const CREDENTIALS_ENDPOINT = 'https://moc-iv.onrender.com';

  let loginClicked = false;
  let playClicked = false;

  // Hide account-management buttons so nobody can delete/modify the account
  const style = document.createElement('style');
  style.textContent = `
    #winLogin button[title="Modify account"],
    #winLogin button[title="Recover account"],
    #winLogin button[title="Register new account"],
    #winSelectPlayer button[title="Remove selected player"],
    #winSelectPlayer button[title="Back to login"] {
      display: none !important;
    }
  `;
  document.documentElement.appendChild(style);

  function buildOverlay() {
    if (document.getElementById('accessCodeOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'accessCodeOverlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.9);
      display: flex; align-items: center; justify-content: center;
      z-index: 999999; font-family: sans-serif;
    `;
    overlay.innerHTML = `
      <div style="background:#1e1e1e;border:1px solid #444;border-radius:10px;padding:24px;text-align:center;color:#eee;min-width:260px;">
        <h2 style="margin-top:0;">Enter Access Code</h2>
        <input id="accessCodeInput" type="password" style="padding:8px;font-size:16px;border-radius:6px;border:1px solid #555;background:#222;color:#eee;width:100%;box-sizing:border-box;" />
        <br/><br/>
        <button id="accessCodeSubmit" style="padding:8px 16px;border-radius:6px;cursor:pointer;">Enter</button>
        <p id="accessCodeError" style="color:#f66;min-height:1.2em;margin-bottom:0;"></p>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('accessCodeSubmit').addEventListener('click', submitCode);
    document.getElementById('accessCodeInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitCode();
    });
    document.getElementById('accessCodeInput').focus();
  }

  function submitCode() {
    const codeInput = document.getElementById('accessCodeInput');
    const errorEl = document.getElementById('accessCodeError');
    const code = codeInput.value;
    errorEl.textContent = 'Checking...';

    GM_xmlhttpRequest({
      method: 'POST',
      url: CREDENTIALS_ENDPOINT,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ code: code }),
      onload: function (response) {
        if (response.status !== 200) {
          errorEl.textContent = 'Wrong code, try again.';
          codeInput.value = '';
          codeInput.focus();
          return;
        }
        let data;
        try {
          data = JSON.parse(response.responseText);
        } catch (e) {
          errorEl.textContent = 'Unexpected response, try again.';
          return;
        }
        const overlayEl = document.getElementById('accessCodeOverlay');
        if (overlayEl) overlayEl.remove();
        doLogin(data.email, data.password);
      },
      onerror: function () {
        errorEl.textContent = 'Connection error, try again.';
      },
    });
  }

  function doLogin(email, password) {
    function tryLogin() {
      if (loginClicked) return;
      const form = document.getElementById('winLogin');
      if (!form) return;
      const emailInput = form.querySelector('input[name="txtEmail"]');
      const passInput = form.querySelector('input[name="txtPassword"]');
      const loginBtn = form.querySelector('button[title="Login"]');
      if (!emailInput || !passInput || !loginBtn) return;
      loginClicked = true;
      emailInput.value = email;
      passInput.value = password;
      loginBtn.click();
    }

    function tryPlay() {
      if (playClicked) return;
      const form = document.getElementById('winSelectPlayer');
      if (!form) return;
      const playBtn = form.querySelector('button[title="Play player"]');
      if (!playBtn) return;
      playClicked = true;
      playBtn.click();
    }

    const observer = new MutationObserver(function () {
      tryLogin();
      tryPlay();
      if (loginClicked && playClicked) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    tryLogin();
    tryPlay();

    setTimeout(function () { observer.disconnect(); }, 30000);
  }

  // Wait until the real login form exists, then cover it with our overlay
  function init() {
    if (document.getElementById('winLogin')) {
      buildOverlay();
      return;
    }
    const waitObserver = new MutationObserver(function () {
      if (document.getElementById('winLogin')) {
        buildOverlay();
        waitObserver.disconnect();
      }
    });
    waitObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  init();
})();