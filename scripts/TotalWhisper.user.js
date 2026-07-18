// ==UserScript==
// @name         MOC Whisper Manager
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Saves and organizes private whispers per-person so nothing gets lost when you're AFK, on a different chat tab, or the chat log fills up.
// @author       Loocie
// @match        https://play.consty.com/
// @match        https://play.mirageonlineclassic.com
// @match        https://play.freebrowsermmorpg.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=consty.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'moc_whisper_threads_v1';
  const POS_KEY = 'moc_whisper_pos';
  const MAX_MESSAGES_PER_THREAD = 500;

  // =====================================================================
  // Storage
  // =====================================================================
  function loadThreads() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  let threads = loadThreads();
  let saveTimer = null;

  function saveThreadsDebounced() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(threads)); } catch (e) { /* quota */ }
    }, 300);
  }

  function getThread(name) {
    const key = name.toLowerCase();
    if (!threads[key]) {
      threads[key] = { name, messages: [], unread: 0, lastAt: 0 };
    }
    return threads[key];
  }

  function addMessage(name, dir, text) {
    if (!name || !text) return;
    const key = name.toLowerCase();
    const thread = getThread(name);
    thread.name = name; // keep the most recently seen casing/spelling

    thread.messages.push({ dir, text, ts: Date.now(), away: document.hidden });
    if (thread.messages.length > MAX_MESSAGES_PER_THREAD) {
      thread.messages.splice(0, thread.messages.length - MAX_MESSAGES_PER_THREAD);
    }
    thread.lastAt = Date.now();

    if (dir === 'in' && (activeThreadKey !== key || document.hidden || isPanelCollapsed())) {
      thread.unread = (thread.unread || 0) + 1;
    }

    saveThreadsDebounced();
    renderThreadList();
    if (activeThreadKey === key) renderConversation();
    updateHeaderBadge();
  }


  const IN_RE = /^(.+?)\s+tells you,\s*'([\s\S]*)'$/i;
  const OUT_RE = /^You tell\s+(.+?),\s*'([\s\S]*)'$/i;

  const onmsgDesc = Object.getOwnPropertyDescriptor(WebSocket.prototype, 'onmessage');
  if (onmsgDesc && onmsgDesc.set) {
    Object.defineProperty(WebSocket.prototype, 'onmessage', {
      configurable: true,
      enumerable: onmsgDesc.enumerable,
      get() { return onmsgDesc.get.call(this); },
      set(fn) {
        onmsgDesc.set.call(this, function (event) {
          try { handleIncomingRaw(event.data); } catch (e) { /* ignore */ }
          return fn.call(this, event);
        });
      },
    });
  }

  function handleIncomingRaw(raw) {
    let data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    if (!data || data.type !== 117) return;
    const text = String(data.text || '');

    let m = text.match(IN_RE);
    if (m) {
      const name = (data.author && String(data.author).trim()) || m[1].trim();
      addMessage(name, 'in', m[2]);
      return;
    }

    m = text.match(OUT_RE);
    if (m) addMessage(m[1].trim(), 'out', m[2]);
  }

  function quickReply(name) {
    const input = document.getElementById('txtChatMessage');
    if (!input) return;
    const target = name.indexOf(' ') === -1 ? name : `"${name}"`;
    input.value = '@' + target + ' ';
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  // =====================================================================
  // UI
  // =====================================================================
  let els = {};
  let activeThreadKey = null;

  function isPanelCollapsed() {
    return els.panel && els.panel.classList.contains('collapsed');
  }

  function restorePanelPosition(panel, key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const { left, top } = JSON.parse(raw);
      if (typeof left === 'number' && typeof top === 'number') {
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
      }
    } catch (e) { /* ignore */ }
  }

  function savePanelPosition(panel, key) {
    try {
      const rect = panel.getBoundingClientRect();
      localStorage.setItem(key, JSON.stringify({ left: rect.left, top: rect.top }));
    } catch (e) { /* ignore */ }
  }

  function enableDrag(panel, handle, posKey, collapseClass) {
    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;

    handle.addEventListener('mousedown', (e) => {
      if (collapseClass && e.target.classList.contains(collapseClass)) return;
      const rect = panel.getBoundingClientRect();
      panel.style.left = rect.left + 'px';
      panel.style.top = rect.top + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';

      dragging = true;
      panel.classList.add('dragging');
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;
      newLeft = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, newLeft));
      newTop = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, newTop));
      panel.style.left = newLeft + 'px';
      panel.style.top = newTop + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('dragging');
      savePanelPosition(panel, posKey);
    });
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return min + 'm ago';
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr + 'h ago';
    const day = Math.floor(hr / 24);
    if (day < 7) return day + 'd ago';
    return new Date(ts).toLocaleDateString();
  }

  function formatClock(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function buildPanel() {
    if (document.getElementById('moc-wm-panel')) return;

    const style = document.createElement('style');
    style.textContent = `
      #moc-wm-panel {
        position: fixed;
        top: 12px;
        left: 12px;
        width: 320px;
        max-height: 80vh;
        background: #16181d;
        border: 1px solid #3a3f4b;
        border-radius: 8px;
        color: #eee;
        font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
        font-size: 12px;
        z-index: 999999;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
      }
      #moc-wm-panel.dragging { user-select: none; }
      #moc-wm-panel.collapsed .wm-body { display: none; }
      #moc-wm-panel .wm-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 8px 10px; background: #1f232b; border-radius: 8px 8px 0 0;
        cursor: grab; font-weight: bold; letter-spacing: .02em;
      }
      #moc-wm-panel .wm-header:active { cursor: grabbing; }
      #moc-wm-panel .wm-header-left { display: flex; align-items: center; gap: 6px; }
      #moc-wm-panel .wm-badge {
        background: #c9482f; color: #fff; border-radius: 10px; padding: 1px 7px;
        font-size: 10px; font-weight: bold; display: none;
      }
      #moc-wm-panel .wm-badge.show { display: inline-block; }
      #moc-wm-panel .wm-collapse { cursor: pointer; padding: 0 2px; }
      #moc-wm-panel .wm-body { padding: 8px; display: flex; flex-direction: column; gap: 6px; overflow: hidden; }
      #moc-wm-panel input[type="text"] {
        width: 100%; box-sizing: border-box; background: #0f1115; color: #eee;
        border: 1px solid #3a3f4b; border-radius: 4px; padding: 6px; font-family: inherit; font-size: 12px;
      }
      #moc-wm-panel .wm-list { overflow-y: auto; max-height: 50vh; display: flex; flex-direction: column; gap: 2px; }
      #moc-wm-panel .wm-thread-row {
        display: flex; flex-direction: column; padding: 6px 8px; border-radius: 5px;
        cursor: pointer; background: #1c1f26; border: 1px solid transparent;
      }
      #moc-wm-panel .wm-thread-row:hover { border-color: #3a3f4b; }
      #moc-wm-panel .wm-thread-top { display: flex; justify-content: space-between; align-items: center; }
      #moc-wm-panel .wm-thread-name { font-weight: bold; color: #e8c988; }
      #moc-wm-panel .wm-thread-time { color: #6b7280; font-size: 10px; }
      #moc-wm-panel .wm-thread-preview { color: #9aa0ac; font-size: 11px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      #moc-wm-panel .wm-thread-unread {
        background: #c9482f; color: #fff; border-radius: 9px; padding: 0 6px; font-size: 10px; font-weight: bold;
      }
      #moc-wm-panel .wm-empty { color: #6b7280; text-align: center; padding: 16px 4px; font-size: 11px; }
      #moc-wm-panel .wm-actions { display: flex; gap: 6px; }
      #moc-wm-panel button {
        background: #262a34; color: #eee; border: 1px solid #3a3f4b; border-radius: 5px;
        padding: 6px 8px; cursor: pointer; font-weight: 600; font-size: 11px; flex: 1;
      }
      #moc-wm-panel button:hover { border-color: #c9a86e; color: #e8c988; }
      #moc-wm-panel button.wm-primary { background: linear-gradient(180deg,#d9bb84,#c9a86e); color: #1a1508; border-color: #c9a86e; }
      #moc-wm-panel button.wm-danger { background: #5a2323; border-color: #ff4d4d; }
      #moc-wm-panel .wm-conv-header { display: flex; align-items: center; gap: 6px; }
      #moc-wm-panel .wm-conv-header .wm-back { flex: 0 0 auto; width: auto; padding: 6px 10px; }
      #moc-wm-panel .wm-conv-header .wm-conv-name { font-weight: bold; color: #e8c988; flex: 1; }
      #moc-wm-panel .wm-messages { overflow-y: auto; max-height: 40vh; display: flex; flex-direction: column; gap: 6px; padding: 4px 2px; }
      #moc-wm-panel .wm-msg { max-width: 85%; padding: 6px 8px; border-radius: 8px; line-height: 1.35; }
      #moc-wm-panel .wm-msg.in { align-self: flex-start; background: #262a34; }
      #moc-wm-panel .wm-msg.out { align-self: flex-end; background: #2b3a2e; }
      #moc-wm-panel .wm-msg-meta { font-size: 9px; color: #6b7280; margin-top: 3px; }
      #moc-wm-panel .wm-msg-meta.away { color: #c9a86e; }
      #moc-wm-panel .wm-reply-row { display: flex; gap: 6px; }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'moc-wm-panel';
    panel.innerHTML = `
      <div class="wm-header">
        <div class="wm-header-left">
          <span>\ud83d\udcac Whisper Manager</span>
          <span class="wm-badge" id="wm-badge">0</span>
        </div>
        <span class="wm-collapse">\u25be</span>
      </div>
      <div class="wm-body">
        <div id="wm-list-view">
          <input type="text" id="wm-search" placeholder="Search conversations...">
          <div class="wm-list" id="wm-list"></div>
          <div class="wm-actions">
            <button id="wm-mark-all-read">Mark All Read</button>
            <button id="wm-export">Export All</button>
            <button class="wm-danger" id="wm-clear-all">Clear All</button>
          </div>
        </div>
        <div id="wm-conv-view" style="display:none;">
          <div class="wm-conv-header">
            <button class="wm-back" id="wm-back">\u2190 Back</button>
            <span class="wm-conv-name" id="wm-conv-name"></span>
          </div>
          <div class="wm-messages" id="wm-messages"></div>
          <div class="wm-reply-row">
            <button class="wm-primary" id="wm-reply-btn">Reply (fills game chat box)</button>
          </div>
          <div class="wm-actions">
            <button class="wm-danger" id="wm-clear-thread">Clear This Conversation</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    els = {
      panel,
      header: panel.querySelector('.wm-header'),
      badge: panel.querySelector('#wm-badge'),
      listView: panel.querySelector('#wm-list-view'),
      convView: panel.querySelector('#wm-conv-view'),
      search: panel.querySelector('#wm-search'),
      list: panel.querySelector('#wm-list'),
      markAllRead: panel.querySelector('#wm-mark-all-read'),
      exportAll: panel.querySelector('#wm-export'),
      clearAll: panel.querySelector('#wm-clear-all'),
      back: panel.querySelector('#wm-back'),
      convName: panel.querySelector('#wm-conv-name'),
      messages: panel.querySelector('#wm-messages'),
      replyBtn: panel.querySelector('#wm-reply-btn'),
      clearThread: panel.querySelector('#wm-clear-thread'),
    };

    panel.querySelector('.wm-collapse').addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('collapsed');
      if (!panel.classList.contains('collapsed')) updateHeaderBadge();
    });
    enableDrag(panel, els.header, POS_KEY, 'wm-collapse');
    restorePanelPosition(panel, POS_KEY);

    els.search.addEventListener('input', renderThreadList);

    els.markAllRead.addEventListener('click', () => {
      Object.values(threads).forEach((t) => { t.unread = 0; });
      saveThreadsDebounced();
      renderThreadList();
      updateHeaderBadge();
    });

    els.exportAll.addEventListener('click', exportAllThreads);

    els.clearAll.addEventListener('click', () => {
      if (!confirm('Delete every saved whisper conversation? This cannot be undone.')) return;
      threads = {};
      saveThreadsDebounced();
      renderThreadList();
      updateHeaderBadge();
    });

    els.back.addEventListener('click', () => openListView());

    els.replyBtn.addEventListener('click', () => {
      if (!activeThreadKey) return;
      const thread = threads[activeThreadKey];
      if (!thread) return;
      quickReply(thread.name);
    });

    els.clearThread.addEventListener('click', () => {
      if (!activeThreadKey) return;
      const t = threads[activeThreadKey];
      if (!t) return;
      if (!confirm(`Delete the conversation with ${t.name}?`)) return;
      delete threads[activeThreadKey];
      saveThreadsDebounced();
      openListView();
      updateHeaderBadge();
    });

    renderThreadList();
    updateHeaderBadge();
  }

  function exportAllThreads() {
    const keys = Object.keys(threads).sort((a, b) => (threads[b].lastAt || 0) - (threads[a].lastAt || 0));
    if (keys.length === 0) { alert('No saved conversations to export.'); return; }

    let out = 'MOC Whisper Manager export - ' + new Date().toLocaleString() + '\n';
    keys.forEach((key) => {
      const t = threads[key];
      out += '\n===== ' + t.name + ' =====\n';
      t.messages.forEach((m) => {
        const who = m.dir === 'in' ? t.name : 'Me';
        out += `[${new Date(m.ts).toLocaleString()}] ${who}: ${m.text}\n`;
      });
    });

    const blob = new Blob([out], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whispers-export-' + Date.now() + '.txt';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function renderThreadList() {
    if (!els.list) return;
    const filter = (els.search.value || '').toLowerCase().trim();
    const keys = Object.keys(threads)
      .filter((k) => !filter || threads[k].name.toLowerCase().includes(filter))
      .sort((a, b) => (threads[b].lastAt || 0) - (threads[a].lastAt || 0));

    if (keys.length === 0) {
      els.list.innerHTML = '<div class="wm-empty">No saved whispers yet. They\'ll show up here as they come in.</div>';
      return;
    }

    els.list.innerHTML = keys.map((key) => {
      const t = threads[key];
      const last = t.messages[t.messages.length - 1];
      const preview = last ? (last.dir === 'out' ? 'You: ' : '') + escapeHtml(last.text) : '';
      const unreadBadge = t.unread > 0 ? `<span class="wm-thread-unread">${t.unread}</span>` : '';
      return `
        <div class="wm-thread-row" data-key="${escapeHtml(key)}">
          <div class="wm-thread-top">
            <span class="wm-thread-name">${escapeHtml(t.name)}</span>
            <span class="wm-thread-time">${timeAgo(t.lastAt)}</span>
          </div>
          <div class="wm-thread-top">
            <span class="wm-thread-preview">${preview}</span>
            ${unreadBadge}
          </div>
        </div>
      `;
    }).join('');

    els.list.querySelectorAll('.wm-thread-row').forEach((row) => {
      row.addEventListener('click', () => openConversation(row.dataset.key));
    });
  }

  function openConversation(key) {
    if (!threads[key]) return;
    activeThreadKey = key;
    threads[key].unread = 0;
    saveThreadsDebounced();
    updateHeaderBadge();

    els.listView.style.display = 'none';
    els.convView.style.display = 'block';
    els.convName.textContent = threads[key].name;
    renderConversation();
    renderThreadList();
  }

  function openListView() {
    activeThreadKey = null;
    els.convView.style.display = 'none';
    els.listView.style.display = 'block';
    renderThreadList();
  }

  function renderConversation() {
    if (!activeThreadKey || !threads[activeThreadKey]) return;
    const t = threads[activeThreadKey];
    els.messages.innerHTML = t.messages.map((m) => {
      const meta = formatClock(m.ts) + (m.away ? ' \u2022 while you were away' : '');
      return `
        <div class="wm-msg ${m.dir}">
          <div>${escapeHtml(m.text)}</div>
          <div class="wm-msg-meta ${m.away ? 'away' : ''}">${meta}</div>
        </div>
      `;
    }).join('');
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function updateHeaderBadge() {
    if (!els.badge) return;
    const total = Object.values(threads).reduce((sum, t) => sum + (t.unread || 0), 0);
    if (total > 0) {
      els.badge.textContent = total > 99 ? '99+' : String(total);
      els.badge.classList.add('show');
    } else {
      els.badge.classList.remove('show');
    }
  }

  // =====================================================================
  // Init
  // =====================================================================
  function init() {
    buildPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();