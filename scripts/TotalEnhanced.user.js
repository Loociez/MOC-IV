// ==UserScript==
// @name         TotalEnhanced for Mirage Online Classic
// @namespace    http://tampermonkey.net/
// @version      2026-07-09
// @description  Enhanced modification tool for MoC! (fixed: overlay UI no longer blocks Map Editor buttons)
// @author       Loocie
// @match        https://play.consty.com/
// @match        https://play.mirageonlineclassic.com
// @match        https://play.freebrowsermmorpg.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=consty.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

// === Ctrl+K MASTER TOGGLE (Hard On / Off) ===

let __TE_ENABLED = true;
const __TE_NODES = new Set();

function teTrack(node) {
    if (node) __TE_NODES.add(node);
    return node;
}

// Keyboard toggle
window.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        __TE_ENABLED = !__TE_ENABLED;

        if (!__TE_ENABLED) {
            // Disable: remove all injected nodes we know about
            __TE_NODES.forEach(node => {
                if (node && node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            });
            console.log('[TotalEnhanced] DISABLED (Ctrl+K)');
        } else {
            console.log('[TotalEnhanced] ENABLED (Ctrl+K)');
            location.reload(); // clean re-init (safe & simple)
        }
    }
});

// === Auto-hide overlay UI while the Map Editor is open ===

const TE_OVERLAY_CLASS = 'te-overlay';
const __TE_hiddenDisplay = new Map();
let __TE_editorOpen = false;

function teMarkOverlay(el) {
    if (el) el.classList.add(TE_OVERLAY_CLASS);
    return teTrack(el);
}

function getMapEditorElement() {
    let editor = document.getElementById('winMapEditor');
    if (editor) return editor;
    // Fallback: some builds may use a different id. Look for any game
    // window whose header reads "Map Editor".
    editor = [...document.querySelectorAll('[class*="gameWindow"], [id^="win"]')]
        .find(el => /map\s*editor/i.test(el.querySelector('h1,h2,h3,.winTitle')?.textContent || ''));
    return editor || null;
}

function isMapEditorOpen() {
    const editor = getMapEditorElement();
    if (!editor) return false;
    const style = window.getComputedStyle(editor);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return false;
    // NOTE: do not use `editor.offsetParent !== null` here - offsetParent is
    // ALWAYS null for position:fixed elements (which game windows commonly
    // are), so that check silently made this function return false forever
    // and the whole overlay-hiding fix never actually ran.
    const rect = editor.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function setOverlaysHidden(hidden) {
    document.querySelectorAll('.' + TE_OVERLAY_CLASS).forEach(el => {
        if (hidden) {
            if (!__TE_hiddenDisplay.has(el)) __TE_hiddenDisplay.set(el, el.style.display);
            el.style.display = 'none';
        } else if (__TE_hiddenDisplay.has(el)) {
            el.style.display = __TE_hiddenDisplay.get(el);
            __TE_hiddenDisplay.delete(el);
        }
    });
}

function checkMapEditorState() {
    const open = isMapEditorOpen();
    if (open !== __TE_editorOpen) {
        __TE_editorOpen = open;
        setOverlaysHidden(open);

        console.log(open
            ? "[TotalEnhanced] Map Editor opened - overlay UI hidden so it won't block editor buttons."
            : '[TotalEnhanced] Map Editor closed - overlay UI restored.');
    }
}
setInterval(checkMapEditorState, 300);



  // Combined Enhancer Script

// Includes: Skill Enhancer, Guild Enhancer, Bank Enhancer and QoL settings

(function enhanceSkillsWindow() {
  const winSkills = document.querySelector('#winSkills');
  const content = document.querySelector('#winSkillsContent');
  if (!winSkills || !content) return;

  // === 1. Create dropdown next to "Player Skills" heading ===
  const headerDiv = winSkills.querySelector('div:first-child');
  if (!headerDiv.querySelector('#sortSkillsDropdown')) {
    const sortSelect = document.createElement('select');
    sortSelect.id = 'sortSkillsDropdown';
    sortSelect.style.marginLeft = '1rem';
    sortSelect.style.fontSize = '0.9rem';
    sortSelect.style.verticalAlign = 'middle';
    sortSelect.innerHTML = `
      <option value="">Sort skills...</option>
      <option value="level-desc">Highest Level</option>
      <option value="level-asc">Lowest Level</option>
    `;
    headerDiv.appendChild(sortSelect);

    // === 2. Helper to parse level from label like "Fishing (47):" ===
    function getLevel(labelDiv) {
      const match = labelDiv.textContent.match(/\((\d+)\)/);
      return match ? parseInt(match[1]) : 0;
    }

    // === 3. Extract all skill blocks from content area ===
    function getSkillsArray() {
      const kids = Array.from(content.children);
      const skills = [];
      for (let i = 0; i < kids.length; i += 2) {
        skills.push({
          labelDiv: kids[i],
          barDiv: kids[i + 1],
          level: getLevel(kids[i]),
        });
      }
      return skills;
    }

    // === 4. Add tooltip to .barValue with XP needed ===
    function updateTooltips() {
      const skills = getSkillsArray();
      skills.forEach(({ barDiv }) => {
        const barTextEl = barDiv.querySelector('.barText');
        const barValueEl = barDiv.querySelector('.barValue');

        if (!barTextEl || !barValueEl) return;

        const match = barTextEl.textContent.trim().match(/([\d,]+)\s*\/\s*([\d,]+)/);
        if (match) {
          const currentXP = parseInt(match[1].replace(/,/g, ''));
          const maxXP = parseInt(match[2].replace(/,/g, ''));
          const xpLeft = maxXP - currentXP;
          const tooltipText = `${xpLeft.toLocaleString()} XP to level up`;

          barValueEl.setAttribute('title', tooltipText);
          barValueEl.style.cursor = 'help'; // Optional for better UI
        }
      });
    }

    // === 5. Sort and rebuild skill display ===
    function rebuildContent(skills) {
      content.innerHTML = '';
      skills.forEach(({ labelDiv, barDiv }) => {
        content.appendChild(labelDiv);
        content.appendChild(barDiv);
      });
      updateTooltips();
    }

    // === 6. Handle dropdown sorting logic ===
    sortSelect.addEventListener('change', () => {
      const skills = getSkillsArray();
      if (sortSelect.value === 'level-desc') {
        skills.sort((a, b) => b.level - a.level);
      } else if (sortSelect.value === 'level-asc') {
        skills.sort((a, b) => a.level - b.level);
      }
      rebuildContent(skills);
    });

    // === 7. Initial tooltip setup ===
    updateTooltips();
  }
})();


(() => {
  const panelId = 'winGuildEditor';
  let intervalId = null;

  // =====================================================================
  // Guild Charter
  // =====================================================================
  if (!document.getElementById('moc-guild-overhaul-styles')) {
    const style = document.createElement('style');
    style.id = 'moc-guild-overhaul-styles';
    style.textContent = `
      #${panelId} {
        --ink:        #0f1115;
        --panel:      #171a21;
        --panel-alt:  #1c202a;
        --line:       rgba(201,168,110,0.16);
        --line-soft:  rgba(255,255,255,0.06);
        --brass:      #c9a86e;
        --brass-hi:   #e8c988;
        --crimson:    #c1524d;
        --emerald:    #5aa876;
        --slate:      #9aa0ac;
        --text:       #ebe7e0;
        --danger-bg:  rgba(179,65,62,0.15);
        --serif:      Georgia, 'Iowan Old Style', 'Times New Roman', serif;
        --sans:       -apple-system, 'Segoe UI', Arial, sans-serif;
        --mono:       'SF Mono', 'Consolas', 'Menlo', monospace;

        /* IMPORTANT: never force the display property here. The game
           toggles this form's own inline style.display between 'none' and
           'grid' to open/close the window. Overriding display with
           !important would beat that inline style and leave the panel
           visually "open" and still polling after the player closes it.
           We only neutralize the game's default grid/box chrome (non-
           display props are safe) and put all real layout on the
           .moc-shell wrapper we insert inside instead. */
        grid-template-columns: 1fr !important;
        gap: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        font-family: var(--sans) !important;
        color: var(--text) !important;

        /* ---------- Resolution-independent placement ----------
           The game positions/sizes this window itself, apparently assuming
           a fixed reference resolution - on a smaller display (e.g.
           1600x900) that ran the bottom of the window off the bottom of
           the screen, and on a larger one (e.g. 2560x1440) it left it
           looking small/off-center. We take over position + size only
           (never display, see above) so it's always centered and always
           fits the viewport, on any screen. .moc-shell then scrolls
           internally if it still doesn't fit at a sane minimum size. */
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: min(92vw, 900px) !important;
        height: auto !important;
        max-height: 92vh !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        scrollbar-width: thin;
        scrollbar-color: #c9a86e #1c202a;
      }
      #${panelId}::-webkit-scrollbar { width: 9px; }
      #${panelId}::-webkit-scrollbar-track { background: #1c202a; border-radius: 8px; }
      #${panelId}::-webkit-scrollbar-thumb { background: rgba(201,168,110,0.16); border-radius: 8px; }
      #${panelId}::-webkit-scrollbar-thumb:hover { background: #c9a86e; }

      /* neutralize the game's native structural wrapper divs */
      #${panelId} > div { display: contents !important; }

      /* ---------- Shell (all real chrome lives here, not on the panel) ---------- */
      .moc-shell {
        display: flex;
        flex-direction: column;
        gap: 11px;
        padding: 14px;
        width: 100%;
        max-width: 100%;
        max-height: 92vh;
        overflow-y: auto;
        overflow-x: hidden;
        background:
          radial-gradient(circle at 15% 0%, rgba(201,168,110,0.06), transparent 40%),
          linear-gradient(180deg, #14161c, var(--ink));
        border: 1px solid var(--line);
        border-radius: 10px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.02);
        box-sizing: border-box;
        scrollbar-width: thin;
        scrollbar-color: var(--brass) var(--panel-alt);
      }
      .moc-shell::-webkit-scrollbar { width: 9px; }
      .moc-shell::-webkit-scrollbar-track { background: var(--panel-alt); border-radius: 8px; }
      .moc-shell::-webkit-scrollbar-thumb { background: var(--line); border-radius: 8px; }
      .moc-shell::-webkit-scrollbar-thumb:hover { background: var(--brass); }

      /* ---------- Header ---------- */
      .moc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--line);
        position: sticky;
        top: 0;
        z-index: 2;
        background: #14161c;
        margin: -4px -4px 0;
        padding: 4px 4px 12px;
      }
      .moc-header-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .moc-header-title svg { flex-shrink: 0; }
      .moc-header h3 {
        margin: 0;
        font-family: var(--serif);
        font-size: 1.2rem;
        font-weight: 400;
        letter-spacing: 0.05em;
        color: var(--brass-hi);
        text-transform: uppercase;
      }
      .moc-header-sub {
        font-family: var(--mono);
        font-size: 0.6rem;
        color: var(--slate);
        letter-spacing: 0.08em;
        margin-top: 1px;
      }

      /* ---------- Layout skeleton ---------- */
      .moc-body {
        display: grid;
        grid-template-columns: clamp(150px, 20vw, 200px) 1fr;
        gap: 11px;
        align-items: start;
      }
      .moc-sidebar {
        display: flex;
        flex-direction: column;
        gap: 11px;
      }
      .moc-main {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 11px;
        align-items: start;
      }
      .moc-col {
        display: flex;
        flex-direction: column;
        gap: 11px;
      }
      .moc-span2 { grid-column: 1 / -1; }

      /* ---------- Card shell ---------- */
      .moc-card {
        background: var(--panel);
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        padding: 11px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
      }
      .moc-card-title {
        display: flex;
        align-items: center;
        gap: 7px;
        font-family: var(--serif);
        font-size: 0.78rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--brass);
        padding-bottom: 8px;
        border-bottom: 1px solid var(--line);
      }
      .moc-card-title svg { opacity: 0.85; }
      .moc-card-title .moc-count {
        margin-left: auto;
        font-family: var(--mono);
        font-size: 0.68rem;
        color: var(--slate);
        letter-spacing: normal;
        text-transform: none;
      }

      /* ---------- Form grid (label / field pairs) ---------- */
      .moc-grid-form {
        display: grid;
        grid-template-columns: 78px 1fr;
        gap: 7px 10px;
        align-items: center;
      }
      .moc-grid-form > .moc-label {
        font-size: 0.72rem;
        font-weight: 600;
        color: var(--slate);
        letter-spacing: 0.02em;
      }

      /* ---------- Inputs ---------- */
      #${panelId} input[type="text"],
      #${panelId} input[type="number"],
      #${panelId} input[type="date"],
      #${panelId} input:not([type]),
      #${panelId} select,
      #${panelId} textarea {
        width: 100% !important;
        box-sizing: border-box !important;
        background: var(--panel-alt) !important;
        border: 1px solid var(--line) !important;
        color: var(--text) !important;
        border-radius: 5px !important;
        padding: 6px 8px !important;
        font-family: var(--sans) !important;
        font-size: 0.82rem !important;
        transition: border-color .15s, box-shadow .15s;
      }
      #${panelId} input:focus,
      #${panelId} select:focus,
      #${panelId} textarea:focus {
        border-color: var(--brass) !important;
        box-shadow: 0 0 0 3px rgba(201,168,110,0.15) !important;
        outline: none !important;
      }
      #${panelId} textarea { resize: none !important; font-family: var(--sans) !important; }
      #${panelId} input[type="number"] { font-family: var(--mono) !important; }

      /* list boxes */
      #${panelId} select[size] {
        min-height: 96px !important;
        font-size: 0.78rem !important;
        line-height: 1.6 !important;
        scrollbar-width: thin;
        scrollbar-color: var(--brass) var(--panel-alt);
      }
      #${panelId} select[size]::-webkit-scrollbar { width: 8px; }
      #${panelId} select[size]::-webkit-scrollbar-track { background: var(--panel-alt); }
      #${panelId} select[size]::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }

      /* filter boxes above lists */
      .moc-filter {
        width: 100% !important;
        box-sizing: border-box !important;
        background: var(--ink) !important;
        border: 1px solid var(--line-soft) !important;
        color: var(--slate) !important;
        border-radius: 5px !important;
        padding: 5px 8px !important;
        font-size: 0.72rem !important;
        margin-bottom: 2px;
      }
      .moc-filter::placeholder { color: #565b66; }
      .moc-filter:focus { color: var(--text) !important; border-color: var(--brass) !important; outline: none; }

      /* ---------- Ledger (activity + payments, merged) ---------- */
      .moc-ledger-list {
        background: var(--panel-alt);
        border: 1px solid var(--line);
        border-radius: 5px;
        height: 116px;
        overflow-y: auto;
        overflow-x: hidden;
        font-size: 0.72rem;
        line-height: 1.55;
        scrollbar-width: thin;
        scrollbar-color: var(--brass) var(--panel-alt);
      }
      .moc-ledger-list::-webkit-scrollbar { width: 8px; }
      .moc-ledger-list::-webkit-scrollbar-track { background: var(--panel-alt); }
      .moc-ledger-list::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
      .moc-ledger-group {
        position: sticky;
        top: 0;
        display: flex;
        align-items: center;
        gap: 5px;
        background: #20242e;
        color: var(--brass);
        font-family: var(--mono);
        font-size: 0.62rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 4px 8px;
        border-bottom: 1px solid var(--line-soft);
      }
      .moc-ledger-hint {
        text-transform: none;
        letter-spacing: normal;
        color: var(--slate);
        font-family: var(--sans);
        font-size: 0.62rem;
        cursor: help;
      }
      .moc-ledger-row {
        padding: 3px 8px;
        color: var(--text);
        border-bottom: 1px solid rgba(255,255,255,0.03);
      }
      .moc-ledger-time {
        font-family: var(--mono);
        color: var(--slate);
        margin-right: 4px;
      }
      .moc-ledger-empty {
        padding: 10px 8px;
        color: var(--slate);
        font-style: italic;
      }

      /* ---------- Buttons ---------- */
      #${panelId} button {
        background: linear-gradient(180deg, #262a34, #1a1d24) !important;
        border: 1px solid var(--line) !important;
        color: var(--text) !important;
        padding: 7px 10px !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: 34px !important;
        line-height: 1.2 !important;
        font-size: 0.74rem !important;
        font-weight: 600 !important;
        letter-spacing: 0.02em;
        border-radius: 5px !important;
        cursor: pointer !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        white-space: nowrap;
        transition: all .15s ease !important;
        font-family: var(--sans) !important;
      }
      #${panelId} button:hover {
        border-color: var(--brass) !important;
        color: var(--brass-hi) !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.35) !important;
      }
      #${panelId} button:active { transform: translateY(1px); }

      .moc-btn-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .moc-btn-row button { flex: 1 1 auto; }
      .moc-btn-end { display: flex; justify-content: flex-end; }

      .moc-btn-primary {
        background: linear-gradient(180deg, #d9bb84, var(--brass)) !important;
        border-color: var(--brass) !important;
        color: #1a1508 !important;
      }
      .moc-btn-primary:hover {
        background: linear-gradient(180deg, var(--brass-hi), #d9bb84) !important;
        color: #14100a !important;
      }
      .moc-btn-ghost {
        background: transparent !important;
        border-color: var(--line) !important;
        color: var(--slate) !important;
      }
      .moc-btn-ghost:hover { color: var(--crimson) !important; border-color: var(--crimson) !important; }

      /* ---------- Identity card specifics ---------- */
      .moc-identity-layout {
        display: grid;
        grid-template-columns: 108px 1fr;
        gap: 14px;
      }
      .moc-emblem-plaque {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 10px;
        background: var(--panel-alt);
        border: 1px solid var(--line);
        border-radius: 6px;
      }
      .moc-emblem-plaque canvas {
        border: 2px solid var(--brass) !important;
        border-radius: 4px !important;
        background: var(--ink) !important;
        box-shadow: 0 0 12px rgba(201,168,110,0.15);
      }
      .moc-emblem-label {
        font-family: var(--mono);
        font-size: 0.6rem;
        letter-spacing: 0.1em;
        color: var(--slate);
        text-transform: uppercase;
      }
      .moc-emblem-plaque input[type="number"] { text-align: center !important; }

      /* ---------- Treasury ---------- */
      .moc-delinquent-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 9px;
        background: var(--panel-alt);
        border: 1px solid var(--line-soft);
        border-radius: 5px;
        font-size: 0.74rem;
        color: var(--slate);
      }
      .moc-delinquent-row input { width: auto !important; accent-color: var(--crimson); }
      .moc-delinquent-row.is-active {
        color: var(--crimson);
        border-color: var(--crimson);
        background: var(--danger-bg);
        font-weight: 600;
      }
      .moc-due-badge {
        font-family: var(--mono);
        font-size: 0.65rem;
        color: var(--slate);
        margin-top: 3px;
      }
      .moc-due-badge.is-overdue { color: var(--crimson); font-weight: 700; }

      /* ---------- Legend / pills ---------- */
      .moc-legend {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        font-family: var(--mono);
        font-size: 0.64rem;
        color: var(--slate);
        letter-spacing: 0.02em;
      }
      .moc-legend span { display: inline-flex; align-items: center; gap: 4px; }
      .moc-legend i { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }

      /* ---------- Experience bar ---------- */
      .moc-xp-card {
        background: var(--panel);
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .moc-xp-label {
        font-family: var(--serif);
        font-size: 0.72rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--brass);
        flex-shrink: 0;
      }
      .moc-xp-track { flex: 1; position: relative; }
      #${panelId} .barTotal {
        background: var(--ink) !important;
        border: 1px solid var(--line) !important;
        border-radius: 7px !important;
        height: 16px !important;
        width: 100% !important;
      }
      #${panelId} .barValue {
        background: linear-gradient(90deg, #4a2545, var(--brass)) !important;
        box-shadow: 0 0 10px rgba(201,168,110,0.35) !important;
        border-radius: 6px !important;
        height: 14px !important;
        top: 1px !important;
        left: 1px !important;
      }
      #${panelId} .barText {
        font-family: var(--mono) !important;
        font-size: 10px !important;
        font-weight: 700 !important;
        color: #fff !important;
        text-shadow: 0 1px 3px #000 !important;
        line-height: 16px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // =====================================================================
  // Minimal inline icon set (1.6px stroke, currentColor) — no external deps
  // =====================================================================
  const ICON = {
    seal: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="9" r="6"/><path d="M8 14.5 6 21l6-3 6 3-2-6.5"/></svg>`,
    back: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>`,
    directory: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 9v11"/></svg>`,
    identity: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/></svg>`,
    roster: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 8a3 3 0 110-6M17 14c2.8.5 5 2.5 5 6"/></svg>`,
    diplomacy: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4v16M4 5h10l-2 3 2 3H4"/></svg>`,
    treasury: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 9.5h3.2a1.8 1.8 0 010 3.6H9.8a1.8 1.8 0 000 3.6h3.5"/></svg>`,
    hall: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 10.5 12 4l9 6.5"/><path d="M5 10v10h14V10"/></svg>`,
    save: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/></svg>`,
    plus: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
    door: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 21V3h9v18M14 12v.01M14 3l5 2v16h-5"/></svg>`,
  };
  const icon = (name) => `<span style="display:inline-flex">${ICON[name] || ''}</span>`;


  // Guild Ledger: merges the server's payment log with a browser-tracked

  const LEDGER_PREFIX = 'mocGuildActivity:';

  function currentGuildKey(panel) {
    const selGuild = panel.querySelector('select[name="selGuild"]');
    return LEDGER_PREFIX + (selGuild ? selGuild.value : 'unknown');
  }
  function loadActivity(panel) {
    try {
      const raw = localStorage.getItem(currentGuildKey(panel));
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveActivity(panel, list) {
    try { localStorage.setItem(currentGuildKey(panel), JSON.stringify(list.slice(0, 60))); } catch (e) { /* storage unavailable, skip */ }
  }
  function logActivity(panel, action, detail) {
    const now = new Date();
    const date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} `
      + `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const list = loadActivity(panel);
    list.unshift({ actor: 'You', action, detail: detail || '', date });
    saveActivity(panel, list);
    renderLedger(panel);
  }

  function ledgerRow(text, time) {
    const row = document.createElement('div');
    row.className = 'moc-ledger-row';
    if (time) {
      const t = document.createElement('span');
      t.className = 'moc-ledger-time';
      t.textContent = time;
      row.appendChild(t);
    }
    row.appendChild(document.createTextNode(text));
    return row;
  }

  function renderLedger(panel) {
    const listEl = panel.querySelector('.moc-ledger-list');
    if (!listEl) return;
    const query = (panel.querySelector('.moc-ledger-filter')?.value || '').trim().toLowerCase();
    const src = panel.querySelector('select[name="cmbBalanceLog"]');
    const activity = loadActivity(panel);
    const prevScroll = listEl.scrollTop;

    listEl.innerHTML = '';
    let shown = 0;

    if (activity.length) {
      const group = document.createElement('div');
      group.className = 'moc-ledger-group';
      group.innerHTML = `<span>Activity</span><span class="moc-ledger-hint" title="Actions taken through this browser only. The game does not expose other members' action history, so this can't show what other officers did.">(this browser)</span>`;
      listEl.appendChild(group);
      activity.forEach(a => {
        const text = `${a.actor} ${a.action}${a.detail ? ' ' + a.detail : ''}`;
        if (query && !text.toLowerCase().includes(query)) return;
        listEl.appendChild(ledgerRow(text, a.date));
        shown++;
      });
    }

    if (src) {
      const group = document.createElement('div');
      group.className = 'moc-ledger-group';
      group.textContent = 'Payments';
      listEl.appendChild(group);
      Array.from(src.options).forEach(opt => {
        if (query && !opt.text.toLowerCase().includes(query)) return;
        listEl.appendChild(ledgerRow(opt.text));
        shown++;
      });
    }

    if (!shown) {
      const empty = document.createElement('div');
      empty.className = 'moc-ledger-empty';
      empty.textContent = query ? 'No matching entries.' : 'No entries yet.';
      listEl.appendChild(empty);
    }
    listEl.scrollTop = prevScroll;
  }


  // takes priority over the pre-click detail when present.
  function wrapActionButton(panel, btn, action, getDetail) {
    if (!btn || btn.dataset.mocLogWrapped === 'true') return;
    const original = btn.onclick;
    btn.onclick = function (evt) {
      const preDetail = getDetail ? getDetail() : '';
      let capturedPrompt = null;
      const origPrompt = window.prompt;
      window.prompt = function (...args) {
        const v = origPrompt.apply(window, args);
        if (capturedPrompt === null && v) capturedPrompt = v;
        return v;
      };
      let result;
      try {
        result = original ? original.call(btn, evt) : undefined;
      } finally {
        window.prompt = origPrompt;
      }
      logActivity(panel, action, capturedPrompt || preDetail);
      return result;
    };
    btn.dataset.mocLogWrapped = 'true';
  }

  function selectedOptionLabel(selectEl) {
    if (!selectEl) return '';
    const opt = selectEl.selectedOptions && selectEl.selectedOptions[0];
    return opt ? opt.text.replace(/\s*\((Founder|Officer|Soldier|Alliance|War|Neutral)\)\s*$/i, '') : '';
  }

  // =====================================================================
  // Build
  // =====================================================================
  function structureGuildUI() {
    const panel = document.getElementById(panelId);
    if (!panel || panel.dataset.restructured === 'true') return;

    const titleEl = panel.querySelector('h3');
    const txtName = panel.querySelector('input[name="txtName"]');
    const txtAcronym = panel.querySelector('input[name="txtAcronym"]');
    const txtDesc = panel.querySelector('textarea[name="txtDesc"]');
    const cvsGuild = panel.querySelector('#cvsGuild');
    const txtLevel = panel.querySelector('input[name="txtLevel"]');
    const numSprite = panel.querySelector('input[name="numSprite"]');
    const selMembers = panel.querySelector('select[name="selMembers"]');
    const selDeclarations = panel.querySelector('select[name="selDeclarations"]');
    const numBalance = panel.querySelector('input[name="numBalance"]');
    const txtBalanceDue = panel.querySelector('input[name="txtBalanceDue"]');
    const chkDelinquent = panel.querySelector('input[name="chkDelinquent"]');
    const cmbHall = panel.querySelector('select[name="cmbHall"]');
    const cmbBalanceLog = panel.querySelector('select[name="cmbBalanceLog"]');
    const selGuild = panel.querySelector('select[name="selGuild"]');
    const xpContainer = panel.querySelector('.barTotal')?.parentElement;

    const btnByTitleFrag = (frag) =>
      Array.from(panel.querySelectorAll('button')).find(b => (b.title || '').toLowerCase().includes(frag.toLowerCase()));
    const btnSave = btnByTitleFrag('save guild');
    const btnCreate = btnByTitleFrag('create new guild');
    const btnAccept = btnByTitleFrag('accept guild');
    const btnInvite = btnByTitleFrag('add member');
    const btnRemove = btnByTitleFrag('remove member');
    const btnToggleRank = btnByTitleFrag('toggle rank');
    const btnToggleDecl = btnByTitleFrag('toggle declaration');
    const btnPayBalance = btnByTitleFrag('pay balance');
    const btnHalls = btnByTitleFrag('hall editor');
    const btnBack = btnByTitleFrag('back to game');

    if (!selGuild || !txtName) return;

    // strip every element out of its native <li>/<div> wrappers, then wipe
    const keep = [titleEl, txtName, txtAcronym, txtDesc, cvsGuild, txtLevel, numSprite,
      selMembers, selDeclarations, numBalance, txtBalanceDue, chkDelinquent, cmbHall,
      cmbBalanceLog, selGuild, xpContainer, btnSave, btnCreate, btnAccept, btnInvite,
      btnRemove, btnToggleRank, btnToggleDecl, btnPayBalance, btnHalls, btnBack]
      .filter(Boolean);
    keep.forEach(el => el.parentElement && el.parentElement.removeChild(el));
    panel.innerHTML = '';

    // All real layout/chrome lives on this wrapper, not on the panel itself,
    // so the game's own open/close toggle (panel.style.display) keeps working.
    const shell = document.createElement('div');
    shell.className = 'moc-shell';
    panel.appendChild(shell);

    const el = (tag, cls, html) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (html !== undefined) n.innerHTML = html;
      return n;
    };
    const cardTitle = (label, iconName, countEl) => {
      const t = el('div', 'moc-card-title', `${icon(iconName)}<span>${label}</span>`);
      if (countEl) t.appendChild(countEl);
      return t;
    };
    const gridRow = (grid, label, field) => {
      if (!field) return;
      grid.appendChild(el('div', 'moc-label', label));
      const wrap = el('div');
      wrap.appendChild(field);
      grid.appendChild(wrap);
    };
    const addFilter = (selectEl, placeholder) => {
      if (!selectEl) return null;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'moc-filter';
      input.placeholder = placeholder;
      input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        Array.from(selectEl.options).forEach(opt => {
          opt.style.display = !q || opt.text.toLowerCase().includes(q) ? '' : 'none';
        });
      });
      return input;
    };

    // ---------------- Header ----------------
    const header = el('div', 'moc-header');
    const titleWrap = el('div', 'moc-header-title');
    const sealTitle = el('div');
    sealTitle.style.color = 'var(--brass)';
    sealTitle.innerHTML = icon('seal');
    titleWrap.appendChild(sealTitle);
    const titleTextWrap = el('div');
    titleTextWrap.appendChild(titleEl || el('h3', null, 'Player Guilds'));
    titleTextWrap.appendChild(el('div', 'moc-header-sub', 'GUILD MANAGEMENT CHARTER'));
    titleWrap.appendChild(titleTextWrap);
    header.appendChild(titleWrap);
    if (btnBack) {
      btnBack.className = 'moc-btn-ghost';
      btnBack.innerHTML = `${icon('back')}<span>Back to Game</span>`;
      header.appendChild(btnBack);
    }
    shell.appendChild(header);

    // ---------------- Body: sidebar + main ----------------
    const body = el('div', 'moc-body');

    // -- Sidebar: Directory --
    const sidebar = el('div', 'moc-sidebar');
    const dirCard = el('div', 'moc-card');
    dirCard.appendChild(cardTitle('Guild Directory', 'directory'));
    const dirFilter = addFilter(selGuild, 'Filter guilds\u2026');
    if (dirFilter) dirCard.appendChild(dirFilter);
    if (selGuild) { selGuild.setAttribute('size', '7'); dirCard.appendChild(selGuild); }
    const dirBtns = el('div', 'moc-btn-row');
    if (btnCreate) { btnCreate.innerHTML = `${icon('plus')}<span>Create Guild</span>`; dirBtns.appendChild(btnCreate); }
    if (btnAccept) { btnAccept.innerHTML = `${icon('door')}<span>Accept Invite</span>`; dirBtns.appendChild(btnAccept); }
    dirCard.appendChild(dirBtns);
    sidebar.appendChild(dirCard);

    // -- Sidebar: Guild Hall --
    const hallCard = el('div', 'moc-card');
    hallCard.appendChild(cardTitle('Guild Hall', 'hall'));
    if (cmbHall) hallCard.appendChild(cmbHall);
    if (btnHalls) {
      btnHalls.innerHTML = `${icon('hall')}<span>Hall Editor</span>`;
      const row = el('div', 'moc-btn-row');
      row.appendChild(btnHalls);
      hallCard.appendChild(row);
    }
    sidebar.appendChild(hallCard);
    body.appendChild(sidebar);

    // -- Main --
    const main = el('div', 'moc-main');
    const colLeft = el('div', 'moc-col');
    const colRight = el('div', 'moc-col');

    // Identity card
    const idCard = el('div', 'moc-card');
    idCard.appendChild(cardTitle('Guild Identity', 'identity'));
    const idLayout = el('div', 'moc-identity-layout');
    const plaque = el('div', 'moc-emblem-plaque');
    plaque.appendChild(el('div', 'moc-emblem-label', 'Guild Sprite'));
    if (cvsGuild) plaque.appendChild(cvsGuild);
    if (numSprite) {
      numSprite.title = 'Sprite index';
      plaque.appendChild(numSprite);
    }
    if (txtLevel) {
      const lvlWrap = el('div');
      lvlWrap.style.cssText = 'display:flex;align-items:center;gap:5px;margin-top:2px;';
      lvlWrap.appendChild(el('span', null, 'Lv'));
      lvlWrap.firstChild.style.cssText = 'font-family:var(--mono);font-size:0.65rem;color:var(--slate);';
      lvlWrap.appendChild(txtLevel);
      plaque.appendChild(lvlWrap);
    }
    idLayout.appendChild(plaque);

    const idFields = el('div');
    const idGrid = el('div', 'moc-grid-form');
    gridRow(idGrid, 'Name', txtName);
    gridRow(idGrid, 'Acronym', txtAcronym);
    idFields.appendChild(idGrid);
    const descWrap = el('div');
    descWrap.style.marginTop = '8px';
    descWrap.appendChild(el('div', 'moc-label', 'Description'));
    descWrap.firstChild.style.marginBottom = '4px';
    if (txtDesc) { txtDesc.rows = 2; descWrap.appendChild(txtDesc); }
    idFields.appendChild(descWrap);
    idLayout.appendChild(idFields);
    idCard.appendChild(idLayout);

    if (btnSave) {
      btnSave.className = 'moc-btn-primary';
      btnSave.innerHTML = `${icon('save')}<span>Save Changes</span>`;
      const saveRow = el('div', 'moc-btn-end');
      saveRow.appendChild(btnSave);
      idCard.appendChild(saveRow);
    }
    colLeft.appendChild(idCard);

    // Treasury card (guild balance) — paired with Identity in row one so it's
    // always visible on open, never buried below the fold.
    const treasCard = el('div', 'moc-card');
    treasCard.appendChild(cardTitle('Treasury', 'treasury'));

    const treasGrid = el('div', 'moc-grid-form');
    gridRow(treasGrid, 'Balance', numBalance);
    if (txtBalanceDue) {
      const dueWrap = el('div');
      dueWrap.appendChild(txtBalanceDue);
      dueWrap.appendChild(el('div', 'moc-due-badge', ''));
      treasGrid.appendChild(el('div', 'moc-label', 'Due Date'));
      treasGrid.appendChild(dueWrap);
    }
    treasCard.appendChild(treasGrid);

    if (chkDelinquent) {
      const drow = el('label', 'moc-delinquent-row');
      drow.appendChild(chkDelinquent);
      drow.appendChild(document.createTextNode('Delinquent \u2014 upkeep or membership in breach'));
      treasCard.appendChild(drow);
    }

    treasCard.appendChild(el('div', 'moc-label', 'Ledger'));
    const ledgerFilter = document.createElement('input');
    ledgerFilter.type = 'text';
    ledgerFilter.className = 'moc-filter moc-ledger-filter';
    ledgerFilter.placeholder = 'Filter ledger\u2026';
    ledgerFilter.addEventListener('input', () => renderLedger(panel));
    treasCard.appendChild(ledgerFilter);
    const ledgerList = el('div', 'moc-ledger-list');
    treasCard.appendChild(ledgerList);
    if (cmbBalanceLog) {
      // Kept in the DOM (hidden) so the game's own polling/refresh logic
      // can keep writing new payment entries into it — we just read from
      // it into the merged ledger view instead of displaying it directly.
      cmbBalanceLog.style.display = 'none';
      treasCard.appendChild(cmbBalanceLog);
    }

    if (btnPayBalance) {
      btnPayBalance.className = 'moc-btn-primary';
      btnPayBalance.innerHTML = `${icon('treasury')}<span>Pay Balance</span>`;
      wrapActionButton(panel, btnPayBalance, 'paid', () => numBalance ? `${numBalance.value} Gold Coins` : '');
      const row = el('div', 'moc-btn-end');
      row.appendChild(btnPayBalance);
      treasCard.appendChild(row);
    }
    colRight.appendChild(treasCard);

    // Roster card
    const rosterCard = el('div', 'moc-card');
    const rosterCount = selMembers ? el('span', 'moc-count', `${selMembers.options.length} members`) : null;
    rosterCard.appendChild(cardTitle('Roster', 'roster', rosterCount));
    const rosterFilter = addFilter(selMembers, 'Filter members\u2026');
    if (rosterFilter) rosterCard.appendChild(rosterFilter);
    if (selMembers) { selMembers.setAttribute('size', '6'); rosterCard.appendChild(selMembers); }
    const rosterBtns = el('div', 'moc-btn-row');
    if (btnInvite) {
      btnInvite.innerHTML = `${icon('plus')}<span>Invite</span>`;
      wrapActionButton(panel, btnInvite, 'invited', () => '');
      rosterBtns.appendChild(btnInvite);
    }
    if (btnRemove) {
      btnRemove.innerHTML = `<span>Remove</span>`;
      wrapActionButton(panel, btnRemove, 'removed', () => selectedOptionLabel(selMembers));
      rosterBtns.appendChild(btnRemove);
    }
    if (btnToggleRank) {
      btnToggleRank.innerHTML = `<span>Toggle Rank</span>`;
      wrapActionButton(panel, btnToggleRank, 'changed the rank of', () => selectedOptionLabel(selMembers));
      rosterBtns.appendChild(btnToggleRank);
    }
    rosterCard.appendChild(rosterBtns);
    colLeft.appendChild(rosterCard);

    // Diplomacy card
    const diploCard = el('div', 'moc-card');
    const diploCount = selDeclarations ? el('span', 'moc-count', `${selDeclarations.options.length} guilds`) : null;
    diploCard.appendChild(cardTitle('Diplomacy', 'diplomacy', diploCount));
    if (selDeclarations) { selDeclarations.setAttribute('size', '6'); diploCard.appendChild(selDeclarations); }
    if (btnToggleDecl) {
      btnToggleDecl.innerHTML = `<span>Toggle Declaration</span>`;
      wrapActionButton(panel, btnToggleDecl, 'toggled declaration with', () => selectedOptionLabel(selDeclarations));
      const row = el('div', 'moc-btn-row');
      row.appendChild(btnToggleDecl);
      diploCard.appendChild(row);
    }
    const legend = el('div', 'moc-legend',
      `<span><i style="background:var(--crimson)"></i>War</span>
       <span><i style="background:var(--emerald)"></i>Alliance</span>
       <span><i style="background:var(--slate)"></i>Neutral</span>`);
    diploCard.appendChild(legend);
    colRight.appendChild(diploCard);
    main.appendChild(colLeft);
    main.appendChild(colRight);

    body.appendChild(main);
    shell.appendChild(body);

    // ---------------- Experience ----------------
    if (xpContainer) {
      const xpCard = el('div', 'moc-xp-card');
      xpCard.appendChild(el('div', 'moc-xp-label', 'Guild Experience'));
      const track = el('div', 'moc-xp-track');
      track.appendChild(xpContainer);
      xpCard.appendChild(track);
      shell.appendChild(xpCard);
    }

    panel.dataset.restructured = 'true';
    renderLedger(panel);
    updateGuildColors();
    hookGuildSelection();
  }

  // =====================================================================
  // Live refresh: colors, badges, due-date countdown
  // =====================================================================
  function updateGuildColors() {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    renderLedger(panel);

    const selDeclarations = panel.querySelector('select[name="selDeclarations"]');
    if (selDeclarations) {
      Array.from(selDeclarations.options).forEach(option => {
        const text = option.text.toLowerCase();
        if (text.endsWith('(war)')) {
          option.style.color = 'var(--crimson)'; option.style.fontWeight = 'bold';
          option.title = 'At war with your guild';
        } else if (text.endsWith('(alliance)')) {
          option.style.color = 'var(--emerald)'; option.style.fontWeight = 'bold';
          option.title = 'Allied with your guild';
        } else if (text.endsWith('(neutral)')) {
          option.style.color = 'var(--slate)'; option.style.fontWeight = '';
          option.title = 'Neutral standing';
        } else {
          option.style.color = ''; option.style.fontWeight = ''; option.title = '';
        }
      });
    }

    const balanceInput = panel.querySelector('input[name="numBalance"]');
    if (balanceInput) {
      const owed = parseInt(balanceInput.value, 10) > 0;
      balanceInput.style.color = owed ? 'var(--brass-hi)' : '';
      balanceInput.style.fontWeight = owed ? 'bold' : '';
      balanceInput.style.borderColor = owed ? 'var(--brass)' : '';
    }

    const memberSelect = panel.querySelector('select[name="selMembers"]');
    if (memberSelect) {
      Array.from(memberSelect.options).forEach(opt => {
        const text = opt.text.toLowerCase();
        if (text.includes('(founder)')) { opt.style.color = 'var(--brass-hi)'; opt.style.fontWeight = 'bold'; }
        else if (text.includes('(officer)')) { opt.style.color = '#8fd0e8'; opt.style.fontWeight = 'bold'; }
        else if (text.includes('(soldier)')) { opt.style.color = 'var(--slate)'; opt.style.fontWeight = ''; }
        else { opt.style.color = ''; opt.style.fontWeight = ''; }
      });
    }

    const dueInput = panel.querySelector('input[name="txtBalanceDue"]');
    const dueBadge = panel.querySelector('.moc-due-badge');
    if (dueInput && dueInput.value && dueBadge) {
      const dueDate = new Date(dueInput.value);
      const now = new Date();
      const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      dueBadge.textContent = diffDays >= 0 ? `Due in ${diffDays} day(s)` : `Overdue by ${Math.abs(diffDays)} day(s)`;
      dueBadge.classList.toggle('is-overdue', diffDays < 0);
      dueInput.title = dueBadge.textContent;
    }

    const chk = panel.querySelector('input[name="chkDelinquent"]');
    const drow = panel.querySelector('.moc-delinquent-row');
    if (chk && drow) drow.classList.toggle('is-active', chk.checked);

    const rosterCount = panel.querySelector('.moc-card-title .moc-count');
    if (memberSelect && rosterCount) rosterCount.textContent = `${memberSelect.options.length} members`;
  }

  function hookGuildSelection() {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const guildSelect = panel.querySelector('select[name="selGuild"]');
    if (!guildSelect) return;
    guildSelect.removeEventListener('change', onGuildChange);
    guildSelect.addEventListener('change', onGuildChange);
    const chk = panel.querySelector('input[name="chkDelinquent"]');
    if (chk) {
      chk.removeEventListener('change', updateGuildColors);
      chk.addEventListener('change', updateGuildColors);
    }
  }

  function onGuildChange() {
    setTimeout(updateGuildColors, 200);
  }

  // The panel can be present in the DOM but closed (game sets
  // style.display = 'none', or it sits with zero layout box). Treat that as
  // "not open" so we never keep computing/writing to a closed window.
  function isPanelOpen() {
    const panel = document.getElementById(panelId);
    if (!panel) return false;
    if (getComputedStyle(panel).display === 'none') return false;
    if (panel.offsetParent === null && getComputedStyle(panel).position !== 'fixed') return false;
    return true;
  }

  function startPolling() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      if (isPanelOpen()) {
        updateGuildColors();
      } else {
        clearInterval(intervalId);
        intervalId = null;
      }
    }, 1000);
  }

  function hookGuildsButton() {
    const guildsBtn = document.querySelector('button[title="Guilds"]');
    if (!guildsBtn) return;
    guildsBtn.addEventListener('click', () => {
      setTimeout(() => {
        structureGuildUI();
        if (isPanelOpen()) startPolling();
      }, 500);
    });
  }

  // --- Init ---
  hookGuildsButton();
  if (isPanelOpen()) {
    structureGuildUI();
    startPolling();
  }
})();


// enhancedBankUI.js
(function () {
  const config = {
    visibleItemCount: 20,
    minItemCount: 5,
    valueCache: {},
    colorCache: {},
    statsCache: {},
    typeCache: {},
    classCache: {},
    knownNames: new Set(),
  };

  // Item "type" flag -> label, as used by the item JSON's `type` field.
  const ITEM_TYPES = {
    "": "All",
    "0": "Item",
    "1": "Weapon",
    "2": "Weapon Projectile",
    "3": "Armor",
    "4": "Helm",
    "5": "Offhand/Shield",
    "6": "Consumable",
    "7": "Warp",
    "11": "Accessory"
  };

  // Class bit positions used in each item's `prof_req_flags` bitmask.
  // A set bit means that class is allowed to use the item (prof_req_flags
  // of -1 has every bit set, i.e. usable by all classes).
  const CLASS_BITS = {
    0: "Samurai",
    1: "Warlock",
    2: "Cleric",
    3: "Assassin",
    4: "Barbarian",
    5: "Marksman",
    6: "Necromancer",
    7: "Bard",
    8: "Dragoon",
    9: "Jester",
    10: "Vampire"
  };

  const persistentSettings = {
    currentInv: { filter: '', sort: 'name', type: '', classFilter: '' },
    bankInv: { filter: '', sort: 'name', type: '', classFilter: '' }
  };

  const SPELL_AMP_KEYS = {
    "!bard_buff_uptime": "Bard Buff Uptime",
    "!bard_buff_cost": "Bard Buff Cost",
    "!jester_confuse_cost": "Jester Confuse Cost",
    "!jester_playerconfuse_uptime": "Jester Player Uptime",
    "!jester_npcconfuse_uptime": "Jester NPC Uptime",
    "!cleric_petheal_amount": "Cleric Pet Heal",
    "!cleric_petheal_cost": "Cleric Pet Heal Cost",
    "!dragoon_npcaoe_damage": "Dragoon NPC AoE",
    "!dragoon_invisible_cost": "Dragoon Invis Cost",
    "!warlock_npcaoe_damage": "Warlock NPC AoE",
    "!warlock_npcaoe_highercost": "Warlock NPC AoE Cost",
    "!warlock_selfaoe_highercost": "Warlock Self AoE Cost",
    "!warlock_playeraoe_highercost": "Warlock Player AoE Cost",
    "!warlock_npcaoe_cooldown": "Warlock NPC Cooldown",
    "!warlock_playeraoe_cooldown": "Warlock Player Cooldown",
    "!cleric_playerheal_amount": "Cleric Player Heal",
    "!cleric_playerheal_cost": "Cleric Player Heal Cost",
    "!cleric_allheal_cooldown": "Cleric Cooldown",
    "!dragoon_playeraoe_damage": "Dragoon Player AoE",
    "!warlock_playeraoe_damage": "Warlock Player AoE",
    "!assassin_npcpoison_damage": "Assassin NPC Poison",
    "!assassin_cloak_cost": "Assassin Cloak Cost",
    "!assassins_npcpoison_ticks": "Assassin NPC Ticks",
    "!assassins_playerpoison_ticks": "Assassin Player Ticks",
    "!necromancer_minion_damage": "Necromancer Minion DMG",
    "!necromancer_minion_hp": "Necromancer Minion HP",
    "!necromancer_minion_cost": "Necromancer Minion Cost",
    "!necromancer_minion_cooldown": "Necromancer Minion Cooldown",
    "!samurai_npcriposte_damage": "Samurai NPC Riposte",
    "!samurai_riposte_cooldown": "Samurai Riposte Cooldown",
    "!samurai_riposte_cost": "Samurai Riposte Cost",
    "!barbarian_alldamage_amount": "Barbarian All Damage",
    "!marksman_npcshotgun_damage": "Marksman NPC Shotgun",
    "!marksman_shotgun_cooldown": "Marksman Shotgun Cooldown",
    "!assassin_playerpoison_damage": "Assassin Player Poison",
    "!assassin_cloak_cooldown": "Assassin Cloak Cooldown",
    "!samurai_playerriposte_damage": "Samurai Player Riposte",
    "!marksman_playershotgun_damage": "Marksman Player Shotgun",
    "!marksman_shotgun_cost": "Marksman Shotgun Cost",
    "!vampire_npclifesteal_amount": "Vampire NPC Lifesteal",
    "!vampire_playerlifesteal_amount": "Vampire Player Lifesteal"
  };

  // Load item data
  fetch("https://loociez.github.io/MOC-IV/last.json")
    .then(response => response.json())
    .then(data => {
      data.forEach(item => {
        if (item.name) {
          const name = item.name.trim();
          const lower = name.toLowerCase();
          if (typeof item.recycle_value === 'number') config.valueCache[lower] = item.recycle_value;
          if (item.color) config.colorCache[lower] = item.color;
          if (item.data) config.statsCache[lower] = item.data;
          if (typeof item.type === 'number') config.typeCache[lower] = item.type;
          if (typeof item.prof_req_flags === 'number') config.classCache[lower] = item.prof_req_flags;
          config.knownNames.add(lower);
        }
      });
      enhanceBankWindow();
    })
    .catch(console.error);

  // Display names aren't always the raw DB name: items can carry a leading
  // enchant/quality word ("Decayed Hand of Roog", "Magi Hand of Roog",
  // "Hardened Hand of Roog") and/or a player-tag possessive ("Rich's Hand
  // of Roog", "Aphelion's Skull" for the base item "Player's Skull") -
  // sometimes both stacked together. Every one of those is still the same
  // base item underneath, just displayed with extra words in front, so
  // this ignores any prefix entirely by repeatedly stripping the leading
  // token (either a plain word, or a whole "Somebody's " tag) in every
  // possible order until what's left matches a real name in the DB. It
  // always checks the least-stripped candidates first, so the closest/
  // longest match wins instead of over-stripping down to a shorter item
  // that happens to also exist.
  function resolveItemKey(rawText) {
    const lower = rawText.replace(/\(x\d+\)/, '').trim().toLowerCase();
    if (config.knownNames.has(lower)) return lower;

    const stripPossessive = (str) => {
      const m = str.match(/^\S+'s\s+(.+)$/);
      return m ? m[1] : null;
    };

    let frontier = [lower];
    const seen = new Set(frontier);
    const maxPeels = 4; // generous cap against runaway/garbage input

    for (let step = 0; step < maxPeels; step++) {
      const next = [];
      for (const candidate of frontier) {
        const words = candidate.split(/\s+/);
        if (words.length <= 1) continue;

        // This candidate starts with "Somebody's " - try dropping the tag
        // entirely, and also try it as the literal "player's " placeholder
        // some base items use (e.g. "Player's Skull").
        const possessiveRest = stripPossessive(candidate);
        if (possessiveRest) {
          if (!seen.has(possessiveRest)) { seen.add(possessiveRest); next.push(possessiveRest); }
          const asPlayer = "player's " + possessiveRest;
          if (!seen.has(asPlayer)) { seen.add(asPlayer); next.push(asPlayer); }
        }

        // Just a plain leading word (enchant/quality prefix).
        const plainRest = words.slice(1).join(' ');
        if (!seen.has(plainRest)) { seen.add(plainRest); next.push(plainRest); }
      }

      for (const candidate of next) {
        if (config.knownNames.has(candidate)) return candidate;
      }
      if (!next.length) break;
      frontier = next;
    }

    return lower; // unresolved - fall back to the raw name (old behavior)
  }

  // True if the item is usable by the selected class. An empty selection
  // means no class filter is applied. An item we have no class data for is
  // treated as unrestricted so items missing from the DB aren't hidden.
  function itemMatchesClass(itemKey, selectedClassBit) {
    if (selectedClassBit === '' || selectedClassBit === undefined || selectedClassBit === null) return true;
    const flags = config.classCache[itemKey];
    if (flags === undefined) return true;
    return (flags & (1 << selectedClassBit)) !== 0;
  }

  function itemMatchesType(itemKey, selectedType) {
    if (selectedType === '' || selectedType === undefined || selectedType === null) return true;
    const type = config.typeCache[itemKey];
    if (type === undefined) return true;
    return String(type) === String(selectedType);
  }

  function expandBankView(compact = false) {
    const size = compact ? config.minItemCount : config.visibleItemCount;
    const currentInv = document.querySelector('select[name="selCurrentInv"]');
    const bankInv = document.querySelector('select[name="selBankInv"]');
    if (currentInv) currentInv.size = size;
    if (bankInv) bankInv.size = size;
  }

  function sortSelectOptions(selectEl, by = "name", descending = false) {
    const options = Array.from(selectEl.options);
    const goldOption = options.find(opt => opt.text.includes("Gold Coins"));
    const otherOptions = options.filter(opt => !opt.text.includes("Gold Coins"));

    otherOptions.sort((a, b) => {
      const nameA = a.text.replace(/\(x\d+\)/, '').trim().toLowerCase();
      const nameB = b.text.replace(/\(x\d+\)/, '').trim().toLowerCase();
      if (by === "quantity") {
        const qtyA = parseInt(a.text.match(/x(\d+)/)?.[1] || "0");
        const qtyB = parseInt(b.text.match(/x(\d+)/)?.[1] || "0");
        return descending ? qtyB - qtyA : qtyA - qtyB;
      } else if (by.startsWith("stat:")) {
        const stat = by.split(":")[1];
        const aStat = config.statsCache[resolveItemKey(a.text)]?.[stat] || 0;
        const bStat = config.statsCache[resolveItemKey(b.text)]?.[stat] || 0;
        return descending ? bStat - aStat : aStat - bStat;
      }
      return descending ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
    });

    selectEl.innerHTML = '';
    if (goldOption) selectEl.appendChild(goldOption);
    otherOptions.forEach(opt => selectEl.appendChild(opt));
  }

  function filterSelectOptions(selectEl, query, selectedType, selectedClassBit) {
    const lowerQuery = query.toLowerCase();
    Array.from(selectEl.options).forEach(option => {
      const itemKey = resolveItemKey(option.text);
      const matchesText = !lowerQuery || option.text.toLowerCase().includes(lowerQuery);
      const matchesType = itemMatchesType(itemKey, selectedType);
      const matchesClass = itemMatchesClass(itemKey, selectedClassBit);
      option.hidden = !(matchesText && matchesType && matchesClass);
    });
  }

  function updateValueDisplay(selectEl, valueBox) {
    const selected = selectEl.options[selectEl.selectedIndex];
    if (!selected) return (valueBox.textContent = '');
    const itemName = resolveItemKey(selected.text);
    const quantity = parseInt(selected.text.match(/x(\d+)/)?.[1] || '1');
    const value = config.valueCache[itemName];
    if (value !== undefined) {
      const total = quantity * value;
      valueBox.textContent = `NPC sell approx: ~${total.toLocaleString()}g`;
    } else {
      valueBox.textContent = '';
    }
  }

 function calculateTotalValue(selectEl, totalBox) {
  let total = 0;
  Array.from(selectEl.options).forEach(option => {
    if (option.hidden) return;
    const itemName = resolveItemKey(option.text);
    const quantity = parseInt(option.text.match(/x(\d+)/)?.[1] || '1');

    if (itemName.includes('gold coin')) {
      total += quantity; // treat as gold itself
    } else {
      const value = config.valueCache[itemName];
      if (value !== undefined) {
        total += quantity * value;
      }
    }
  });
  totalBox.textContent = `Total Est. Value: ~${total.toLocaleString()}g`;
}


  function attachValueTracker(selectEl) {
    const box = document.createElement('div');
    box.style.color = 'gold';
    box.style.fontSize = '12px';
    box.style.textAlign = 'right';
    box.style.marginTop = '3px';
    selectEl.parentElement.appendChild(box);
    selectEl.addEventListener('change', () => updateValueDisplay(selectEl, box));
  }

  function addTooltips(selectEl) {
    Array.from(selectEl.options).forEach(option => {
      const name = resolveItemKey(option.text);
      const stats = config.statsCache[name];
      if (!stats) return;

      let lines = [];

      Object.keys(SPELL_AMP_KEYS).forEach(key => {
        if (stats[key]) {
          lines.push(`${SPELL_AMP_KEYS[key]}: ${stats[key]}`);
        }
      });

      if (stats.tile_range !== undefined) {
        lines.push(`Tile Range: ${stats.tile_range}`);
      }

      option.title = lines.join('\n');
    });
  }

  function injectControls(selectEl, labelText) {
    const id = selectEl.name === 'selCurrentInv' ? 'currentInv' : 'bankInv';
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '5px';

    const typeOptionsHtml = Object.entries(ITEM_TYPES)
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join('');

    const classOptionsHtml = `<option value="">All</option>` + Object.entries(CLASS_BITS)
      .map(([bit, className]) => `<option value="${bit}">${className}</option>`)
      .join('');

    wrapper.innerHTML = `
      <label style="color: white; font-size: 12px;">
        ${labelText} Filter:
        <input type="text" class="inv-filter" placeholder="Search..." style="margin-left: 5px;">
      </label>
      <label style="color: white; font-size: 12px; margin-left: 10px;">
        Sort:
        <select class="inv-sort">
          <option value="name">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="quantity-asc">Quantity (High → Low)</option>
          <option value="quantity">Quantity (Low → High)</option>
          <option value="stat:max_atk">Physical Attack</option>
          <option value="stat:max_mat">Magical Attack</option>
          <option value="stat:max_rat">Ranged Attack</option>
          <option value="stat:max_def">Physical Defence</option>
          <option value="stat:max_mdf">Magical Defence</option>
          <option value="stat:max_rdf">Ranged Defence</option>
          <option value="stat:max_hp">Health</option>
          <option value="stat:max_mp">Mana</option>
          <option value="stat:max_sp">Stamina</option>
        </select>
      </label>
      <label style="color: white; font-size: 12px; margin-left: 10px;">
        Type:
        <select class="inv-type-filter">${typeOptionsHtml}</select>
      </label>
      <label style="color: white; font-size: 12px; margin-left: 10px;">
        Class:
        <select class="inv-class-filter">${classOptionsHtml}</select>
      </label>
    `;

    selectEl.parentElement.prepend(wrapper);

    const input = wrapper.querySelector('.inv-filter');
    const sortDropdown = wrapper.querySelector('.inv-sort');
    const typeDropdown = wrapper.querySelector('.inv-type-filter');
    const classDropdown = wrapper.querySelector('.inv-class-filter');

    const totalBox = document.createElement('div');
    totalBox.style.color = 'gold';
    totalBox.style.fontSize = '12px';
    totalBox.style.textAlign = 'right';
    totalBox.style.marginTop = '2px';
    selectEl.parentElement.appendChild(totalBox);

    input.value = persistentSettings[id].filter;
    sortDropdown.value = persistentSettings[id].sort;
    typeDropdown.value = persistentSettings[id].type;
    classDropdown.value = persistentSettings[id].classFilter;

    function applySortAndFilter() {
      const sortValue = sortDropdown.value;
      persistentSettings[id].sort = sortValue;
      persistentSettings[id].filter = input.value;
      persistentSettings[id].type = typeDropdown.value;
      persistentSettings[id].classFilter = classDropdown.value;

      const sortMap = {
        "name": { by: "name", desc: false },
        "name-desc": { by: "name", desc: true },
        "quantity": { by: "quantity", desc: false },
        "quantity-asc": { by: "quantity", desc: true },
      };

      const isStat = sortValue.startsWith("stat:");
      const sortBy = isStat ? sortValue : (sortMap[sortValue]?.by || "name");
      const descending = isStat ? true : (sortMap[sortValue]?.desc ?? false);

      const selectedClassBit = classDropdown.value === '' ? '' : parseInt(classDropdown.value, 10);

      sortSelectOptions(selectEl, sortBy, descending);
      filterSelectOptions(selectEl, input.value, typeDropdown.value, selectedClassBit);
      colorizeOptions(selectEl);
      calculateTotalValue(selectEl, totalBox);
      addTooltips(selectEl);
    }

    input.addEventListener('input', applySortAndFilter);
    sortDropdown.addEventListener('change', applySortAndFilter);
    typeDropdown.addEventListener('change', applySortAndFilter);
    classDropdown.addEventListener('change', applySortAndFilter);
    expandBankView(true);
    applySortAndFilter();
    attachValueTracker(selectEl);
  }

  function colorizeOptions(selectEl) {
    Array.from(selectEl.options).forEach(option => {
      const name = resolveItemKey(option.text);
      const color = config.colorCache[name];
      if (color) option.style.color = color;
    });
  }
// --- keep bank colors on refresh (no observers) ---
let MOC_bankColorLoopId = null;
let MOC_bankLastSig = "";

function startBankRecolorLoop() {
  if (MOC_bankColorLoopId) return; // already running

  MOC_bankColorLoopId = setInterval(() => {
    const bankWindow = document.querySelector('#winBank');
    if (!bankWindow || bankWindow.style.display === 'none') return;

    const bankInv = document.querySelector('select[name="selBankInv"]');
    if (!bankInv) return;

    // lightweight change signature: length + first + last option text
    const len = bankInv.options.length;
    const first = len ? bankInv.options[0].text : "";
    const last  = len ? bankInv.options[len - 1].text : "";
    const sig = `${len}|${first}|${last}`;

    if (sig === MOC_bankLastSig) return; // nothing changed

    MOC_bankLastSig = sig;
    // re-apply colors and tooltips after any update
    colorizeOptions(bankInv);
    addTooltips(bankInv);
  }, 250); // gentle cadence; adjust if you like
}

  function enhanceBankWindow() {
    const bankWindow = document.querySelector('#winBank');
    if (!bankWindow || bankWindow.dataset.enhanced) return;
    bankWindow.dataset.enhanced = 'true';

    expandBankView(true);

    const currentInv = document.querySelector('select[name="selCurrentInv"]');
    const bankInv = document.querySelector('select[name="selBankInv"]');

    if (currentInv) {
      injectControls(currentInv, 'Inventory');
      colorizeOptions(currentInv);
    }
		if (bankInv) {
  injectControls(bankInv, 'Bank');
  colorizeOptions(bankInv);   // initial color on open
  addTooltips(bankInv);       // initial tooltips on open
  startBankRecolorLoop();     // keep colors when deposit/withdraw updates occur
}
  }


  const observer = new MutationObserver(() => {
    const bankWindow = document.querySelector('#winBank');
    if (bankWindow && bankWindow.style.display !== 'none') {
      enhanceBankWindow();
    }
  });
  (function () {
  const config = {
    valueCache: {},
    colorCache: {},
    statsCache: {}
  };
  const HISTORY_KEY = 'tradeHistoryLog';

  // Load item data from last.json
  fetch("https://loociez.github.io/MOC-IV/last.json")
    .then(response => response.json())
    .then(data => {
      data.forEach(item => {
        if (item.name) {
          const name = item.name.trim().toLowerCase();
          if (typeof item.recycle_value === 'number') {
            config.valueCache[name] = item.recycle_value;
          }
          if (item.color) {
            config.colorCache[name] = item.color;
          }
          if (item.data) {
            config.statsCache[name] = item.data;
          }
        }
      });
      setupTradeEnhancement();
    });

  function setupTradeEnhancement() {
    const form = document.querySelector('#winTrade');
    if (!form) return;

    // Add UI display for offer values and fairness
    const container = document.createElement('div');
    container.innerHTML = `
      <div id="yourValue" style="font-weight:bold; color:gold;">Your Offer: 0g</div>
      <div id="theirValue" style="font-weight:bold; color:gold;">Their Offer: 0g</div>
      <div id="tradeFairness" style="font-weight:bold; margin-top:5px;"></div>
    `;
    form.appendChild(container);

    // Add View Trade History button (fixed with type="button")
    const historyBtn = document.createElement('button');
    historyBtn.textContent = "📜 View Trade History";
    historyBtn.title = "View past accepted trades";
    historyBtn.style = "margin-top: 10px;";
    historyBtn.type = "button"; // Prevent form submission
    historyBtn.onclick = showTradeHistoryPopup;
    form.appendChild(historyBtn);

    const yourSelect = form.querySelector('[name="selYourInv"]');
    const theirSelect = form.querySelector('[name="selTheirInv"]');
    if (!yourSelect || !theirSelect) return;

    function getTradeValue(selectEl) {
      let total = 0;
      [...selectEl.options].forEach(option => {
        const match = option.textContent.match(/^(.*?)\s?\(x(\d+)\)?$/) || [null, option.textContent, "1"];
        const itemName = match[1].trim().toLowerCase();
        const quantity = parseInt(match[2]);
        const value = config.valueCache[itemName] || 0;
        total += value * quantity;
      });
      return total;
    }

    function updateTradeSummary() {
      const yourTotal = getTradeValue(yourSelect);
      const theirTotal = getTradeValue(theirSelect);

      document.getElementById('yourValue').textContent = `Your Offer: ${yourTotal.toLocaleString()}g`;
      document.getElementById('theirValue').textContent = `Their Offer: ${theirTotal.toLocaleString()}g`;

      const fairnessText = document.getElementById('tradeFairness');
      const delta = yourTotal - theirTotal;
      const deltaRatio = Math.abs(delta) / Math.max(1, Math.min(yourTotal, theirTotal));

      if (delta === 0) {
        fairnessText.textContent = "⚖️ Trade is even";
        fairnessText.style.color = 'lightgreen';
      } else if (delta > 0) {
        fairnessText.textContent = `⚠️ You are overpaying by ${delta.toLocaleString()}g`;
        fairnessText.style.color = deltaRatio > 0.25 ? 'red' : 'orange';
      } else {
        fairnessText.textContent = `✅ You are gaining value by ${Math.abs(delta).toLocaleString()}g`;
        fairnessText.style.color = 'lightgreen';
      }
    }

    function getTradeSnapshot() {
      const parseSide = selectEl => {
        return [...selectEl.options].map(option => {
          const match = option.textContent.match(/^(.*?)\s?\(x(\d+)\)?$/) || [null, option.textContent, "1"];
          return {
            name: match[1].trim(),
            quantity: parseInt(match[2])
          };
        });
      };

      return {
        timestamp: new Date().toISOString(),
        yourOffer: parseSide(yourSelect),
        theirOffer: parseSide(theirSelect),
      };
    }

    function saveTradeToHistory(tradeData) {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      history.push(tradeData);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    function showTradeHistoryPopup() {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]').reverse();

      const container = document.createElement('div');
      container.style = `
        position: fixed; top: 10%; left: 50%; transform: translateX(-50%);
        max-height: 70%; overflow-y: auto;
        background: #222; color: #fff;
        padding: 12px; border: 2px solid gold; border-radius: 8px;
        z-index: 9999; width: 600px; font-family: monospace;
      `;
      container.innerHTML = `<h3>📜 Trade History</h3>
        <button style="float:right;" onclick="this.parentElement.remove()" type="button">❌ Close</button>
        <button onclick="localStorage.removeItem('${HISTORY_KEY}'); this.parentElement.remove()" type="button">🗑️ Clear All</button>
        <hr>
      `;

      if (history.length === 0) {
        container.innerHTML += "<p>No trades logged yet.</p>";
      } else {
        history.forEach(entry => {
          container.innerHTML += `
            <div style="margin-bottom:12px;">
              <strong>${new Date(entry.timestamp).toLocaleString()}</strong><br>
              <span style="color: gold;">You Gave:</span> ${entry.yourOffer.map(i => `${i.name} x${i.quantity}`).join(', ') || 'Nothing'}<br>
              <span style="color: lime;">You Got:</span> ${entry.theirOffer.map(i => `${i.name} x${i.quantity}`).join(', ') || 'Nothing'}
            </div>
          `;
        });
      }

      document.body.appendChild(teMarkOverlay(container));
    }

    // Hook into select changes
    yourSelect.addEventListener('change', updateTradeSummary);
    theirSelect.addEventListener('change', updateTradeSummary);

    // Wrap GUI to capture Confirm Trade action
    const originalGUI = window.GUI;
    window.GUI = function (win, action) {
      if (win === "winTrade" && action === "Confirm") {
        const snapshot = getTradeSnapshot();
        if (snapshot) saveTradeToHistory(snapshot);
      }

      originalGUI(win, action);

      if (win === "winTrade") {
        setTimeout(updateTradeSummary, 50);
      }
    };

    // Initial summary update
    updateTradeSummary();
  }
})();

(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) return;

  const settingsDivs = settingsForm.querySelectorAll("div");
  const insertTarget = settingsDivs[1];

  const qolContainer = document.createElement("div");
  qolContainer.innerHTML = `
    <div><b>Quality of Life</b></div>
    <div>
      <label><input type="checkbox" name="chkFpsCounter"> Show FPS Counter</label>
    </div>
    <div>
      <label>FPS Position:
        <select name="selFpsPosition">
          <option value="top-right">Top Right</option>
          <option value="top-left">Top Left</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </label>
    </div>
    <div>
      <label>Chat Font Style:
        <select name="selFontStyle">
          <option value="default">Default</option>
          <option value="monospace">Monospace</option>
          <option value="serif">Serif</option>
          <option value="sans-serif">Sans Serif</option>
        </select>
      </label>
    </div>
    <div>
      <label><input type="checkbox" name="chkHighlightToggle" checked> Enable Chat Highlighting</label>
    </div>
    <div>
      <label>Highlight Color:
        <input type="color" name="highlightColor" value="#07175e">
      </label>
    </div>
    <div>
      <label>Inventory Slot Color:
        <input type="color" name="slotColor" value="#00ff00">
      </label>
    </div>
    <hr style="opacity:.3;margin:6px 0;">
    <div>
      <label><input type="checkbox" name="chkSparkles" checked> Enable Sparkle Effect</label>
    </div>
    <div>
      <label>Sparkle Color:
        <input type="color" name="sparkleColor" value="#ffd700">
      </label>
    </div>
  `;
  insertTarget.appendChild(qolContainer);

  const qolSettings = {
    fontStyle: "",
    highlightEnabled: true,
    highlightColor: "#07175e",
    slotColor: "#00ff00",
    fpsPosition: "top-right",
    sparklesEnabled: true,
    sparkleColor: "#ffd700"
  };

// --- Chat Highlight ---
const chatBox = document.querySelector("#winGameChatbox");
if (chatBox) {
  const chatObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1 || !qolSettings.highlightEnabled) return;
        let msg = node.innerText;
        if (!msg) return;

        // Remove timestamp
        msg = msg.replace(/^\(\d{2}:\d{2}\)\s*/, "");

        const playerName = document.querySelector("#winStats input[name='txtName']")?.value.trim();
        if (!playerName) return;

        // Check if the message is your own (name at start, optionally followed by emojis/colon/space)
        const ownRegex = new RegExp(`^${playerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s:]*\\S*?`, "i");
        const isOwnMessage = ownRegex.test(msg);

        // Check if message mentions you but is not your own
        const mentionsMe = msg.toLowerCase().includes(playerName.toLowerCase());

        if (mentionsMe && !isOwnMessage) {
          node.style.backgroundColor = qolSettings.highlightColor;
          node.style.fontWeight = "bold";
        }
      });
    });
  });
  chatObserver.observe(chatBox, { childList: true, subtree: true });
}


  // --- Inventory Slot Colors ---
  function updateSlotColors() {
    const inv = document.getElementById('winInventory');
    if (!inv) return;
    const canvases = Array.from(inv.querySelectorAll('canvas'));
    const slotsPerRow = 5;
    canvases.forEach((c, index) => {
      if (index >= canvases.length - slotsPerRow) {
        c.style.border = `2px solid ${qolSettings.slotColor}`;
      }
    });
  }

  // --- Sparkles wiring → call InvGlow API ---
  function applySparkleSettings() {
    if (window.InvGlow) {
      window.InvGlow.setEnabled(qolSettings.sparklesEnabled);
      window.InvGlow.setColor(qolSettings.sparkleColor);
    }
  }

  // --- Listeners ---
  settingsForm.querySelector("input[name='chkHighlightToggle']")
    .addEventListener("change", e => { qolSettings.highlightEnabled = e.target.checked; });

  settingsForm.querySelector("input[name='highlightColor']")
    .addEventListener("input", e => { qolSettings.highlightColor = e.target.value; });

  settingsForm.querySelector("input[name='slotColor']")
    .addEventListener("input", e => { qolSettings.slotColor = e.target.value; updateSlotColors(); });

  settingsForm.querySelector("input[name='chkSparkles']")
    .addEventListener("change", e => {
      qolSettings.sparklesEnabled = e.target.checked;
      applySparkleSettings();
    });

  settingsForm.querySelector("input[name='sparkleColor']")
    .addEventListener("input", e => {
      qolSettings.sparkleColor = e.target.value;
      applySparkleSettings();
    });

  // Initial apply
  updateSlotColors();
  applySparkleSettings();
})();



  observer.observe(document.body, { childList: true, subtree: true });
})();

function colorShopItems() {
    const shopSelect = document.querySelector("select[name='selInventory']");
    if (!shopSelect) return;

    for (let option of shopSelect.options) {
        const text = option.text;

        if (text.includes("Potion of Cavalier Health")) {
            option.style.color = "red";
        } else if (text.includes("Potion of Mana Restoration")) {
            option.style.color = "blue";
        } else if (text.includes("Potion of Restored Vivacity") || text.includes("Coffee")) {
            option.style.color = "green";
        } else if (text.includes("Currency Note") || text.includes("Tome of Revival")) {
            option.style.color = "gold"; // yellow/gold for currency and tomes
        } else {
            option.style.color = ""; // default color for other items
        }
    }
}

// Apply colors initially
colorShopItems();

// Watch for changes to the shop select element
const shopSelect = document.querySelector("select[name='selInventory']");
if (shopSelect) {
    const observer = new MutationObserver(colorShopItems);
    observer.observe(shopSelect, { childList: true, subtree: true });
}

// === Emoji Processor (Safe Version – Preserves Item Links) ===
(function () {
    const emojiMap = {
        ':bruh:': 'https://loociez.github.io/MOC-IV/images/emoji/bruh.gif',
        ':jam:': 'https://loociez.github.io/MOC-IV/images/emoji/jam.gif',
        ':ban:': 'https://loociez.github.io/MOC-IV/images/emoji/ban.png',
        ':bigbrain:': 'https://loociez.github.io/MOC-IV/images/emoji/bigbrain.gif',
        ':noob:': 'https://loociez.github.io/MOC-IV/images/emoji/noob.gif',
        ':classic:': 'https://loociez.github.io/MOC-IV/images/emoji/classic.gif',
        ':angry:': 'https://loociez.github.io/MOC-IV/images/emoji/angry.gif',
        ':noway:': 'https://loociez.github.io/MOC-IV/images/emoji/noway.gif',
        ':blush:': 'https://loociez.github.io/MOC-IV/images/emoji/blush.gif',
        ':derp:': 'https://loociez.github.io/MOC-IV/images/emoji/derp.png',
        ':skb:': 'https://loociez.github.io/MOC-IV/images/emoji/skb.gif'
    };

    function replaceEmojis(html) {
        return html.replace(/:\w+:/g, token => {
            const src = emojiMap[token];
            if (!src) return token;
            return `<img src="${src}" alt="${token}" class="emojiImg" style="width:2em;height:2em;vertical-align:middle;">`;
        });
    }

    // Safe processor: preserves existing HTML (including item links)
    function processNode(node) {
        if (!(node instanceof HTMLElement)) return;

        // Do NOT use innerText ― innerText erases spans
        const rawHTML = node.innerHTML;

        // Replace emojis inside existing HTML
        const newHTML = replaceEmojis(rawHTML);

        if (newHTML !== rawHTML) {
            node.innerHTML = newHTML;
        }

        // Let your item-link parser run AFTER emoji replacement
        document.dispatchEvent(new Event("chatline-updated"));
    }

    function initEmojiObserver() {
        const chatContainer = document.querySelector('#txtChatbox');
        if (!chatContainer) {
            setTimeout(initEmojiObserver, 500);
            return;
        }

        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(n => processNode(n));

                if (m.type === "characterData" && m.target.parentElement) {
                    processNode(m.target.parentElement);
                }
            });
        });

        observer.observe(chatContainer, {
            childList: true,
            subtree: true,
            characterData: true
        });

        console.log("Emoji module (SAFE) loaded.");
    }

    initEmojiObserver();
})();



// UI + Vitals
(function() {
    // Scale everything relative to a 1600px-wide reference viewport (chosen
    // to match a "normal" sized display) so the inventory grid and vitals
    // bars stay proportionally the same size across resolutions instead of
    // being a fixed pixel size that looks tiny on a big screen or oversized
    // on a small one.
    function getResScale() {
        return Math.min(1.7, Math.max(0.75, window.innerWidth / 1600));
    }

    function applySizing() {
    const resScale = getResScale();
    // --- Inventory ---
    const inv = document.getElementById('winInventory');
    if (inv) {
        const slotsPerRow = 5;
        const slotSize = 42 * resScale;
        const horizontalGap = 25 * resScale;
        const verticalGap = horizontalGap * 0.1; // ~2.5px

        const baseWidth = (slotsPerRow * slotSize) + (horizontalGap * (slotsPerRow - 1));
        const finalWidth = baseWidth * 1.15;

        Object.assign(inv.style, {
    display: 'grid',
    gridTemplateColumns: `repeat(${slotsPerRow}, ${slotSize}px)`,
    gridAutoRows: `${slotSize}px`,
    columnGap: `${horizontalGap}px`,
    rowGap: `${verticalGap}px`,
    padding: '1px 0 6px 0',
    background: 'linear-gradient(145deg, #2e2e2e, #1c1c1c)',
    border: '2px solid #444',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
    width: `${finalWidth}px`,
    margin: '0 auto 10px 0',
    overflow: 'visible',
    justifyContent: 'start',
    boxSizing: 'border-box',
});


        const canvases = Array.from(inv.querySelectorAll('canvas'));
        canvases.forEach((c, index) => {
            Object.assign(c.style, {
                width: `${slotSize - 3}px`,
                height: `${slotSize - 3}px`,
                border: '1px solid #666',
                borderRadius: '4px',
                background: '#222',
                boxShadow: 'inset 0 0 3px rgba(255,255,255,0.1)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                cursor: 'pointer',
            });

            // Apply green trim to bottom row (last 5 slots)
            if(index >= canvases.length - slotsPerRow){
                c.style.border = '2px solid green';
            }

            if (!c.dataset.teHoverBound) {
                c.dataset.teHoverBound = 'true';
                ['mouseenter','mouseleave','mousedown','mouseup'].forEach(evt => c.addEventListener(evt, () => {
                    if(evt==='mouseenter'){c.style.transform='scale(1.1)'; c.style.boxShadow='0 0 6px rgba(255,255,255,0.6)';}
                    if(evt==='mouseleave'){c.style.transform='scale(1)'; c.style.boxShadow='inset 0 0 3px rgba(255,255,255,0.1)';}
                    if(evt==='mousedown'){c.style.transform='scale(1.2)'; c.style.boxShadow='0 0 10px rgba(255,255,255,0.8)';}
                    if(evt==='mouseup'){c.style.transform='scale(1.1)'; c.style.boxShadow='0 0 6px rgba(255,255,255,0.6)';}
                }));
            }
        });
    }

    // --- Vitals ---
    const vitals = document.getElementById('winVitals');
    if (vitals) {
        Object.assign(vitals.style, {
            display: 'grid',
            gridTemplateColumns: `${Math.round(50 * resScale)}px 1fr`,
            gridAutoRows: '1.3rem',
            gap: '4px 6px',
            padding: '2px 6px',
            background: 'linear-gradient(145deg, #1a1a1a, #2e2e2e)',
            border: '2px solid #555',
            borderRadius: '6px',
            boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
            color: '#fff',
            fontFamily: 'Arial, sans-serif',
            fontSize: '0.8rem',
            margin: '0 auto 6px auto',
            width: `${Math.round(360 * resScale)}px`,
            boxSizing: 'border-box',
        });

        const barColors = {
            barHP: '#ff4c4c',
            barMP: '#4c6cff',
            barSP: '#4cff4c',
            barXP: '#ffcd4c',
            barTP: '#b84cff'
        };

        function updateBar(id) {
            const bar = document.getElementById(id);
            const txt = document.getElementById('txt'+id.slice(3));
            if (!bar || !txt) return;

            // Hide original text
            txt.style.display = 'none';

            const match = txt.textContent.match(/(\d+)\s*\/\s*(\d+)/);
            if(!match) return;

            const current = parseInt(match[1]);
            const max = parseInt(match[2]);
            const pct = Math.min(100, Math.round(current / max * 100));

            // Bar background (filled portion)
            bar.style.background = barColors[id];
            bar.style.borderRadius = '4px';
            bar.style.height = '1.3rem';
            bar.style.display = 'flex';
            bar.style.alignItems = 'center';
            bar.style.justifyContent = 'center';
            bar.style.fontWeight = 'bold';
            bar.style.fontSize = '0.75rem';
            bar.style.color = '#fff';
            bar.style.boxSizing = 'border-box';
            bar.style.padding = '0 2px';

            // Show text across the full bar width
            let content = `${current} / ${max}`;
            if(id==='barXP'){
                const xpPct = txt.textContent.match(/\(([\d.]+)%\)/);
                if(xpPct) content = `${current} / ${max} (${xpPct[1]}%)`;
            }
            bar.textContent = content;

            // Set filled portion width
            bar.style.width = '100%';
            bar.style.backgroundImage = `linear-gradient(to right, ${barColors[id]} ${pct}%, #555 ${pct}%)`;
        }

        ['barHP','barMP','barSP','barXP','barTP'].forEach(updateBar);

        if (!vitals.dataset.teObserversBound) {
            vitals.dataset.teObserversBound = 'true';
            ['txtHP','txtMP','txtSP','txtXP','txtTP'].forEach(txtId => {
                const txtNode = document.getElementById(txtId);
                if(!txtNode) return;
                const observer = new MutationObserver(() => updateBar('bar'+txtId.slice(3)));
                observer.observe(txtNode, { characterData: true, subtree: true, childList: true });
            });
        }
    }
    }

    applySizing();
    console.log('Inventory and vitals initialized with live updating bars, bottom row gold trim applied.');

    // Re-apply sizing on window resize (debounced) so the UI keeps
    // matching the viewport instead of staying locked to whatever
    // resolution was active when the page first loaded.
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applySizing, 150);
    });
})();

(function() {
    const inv = document.getElementById("winInventory");
    if (!inv) return;

    // Create container for everything
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.gap = "6px"; // gap between buttons and headings
    container.style.zIndex = "9999";
    container.style.width = "72px";        // fixed width - keeps every button
    container.style.boxSizing = "border-box"; // the same size regardless of content
    document.body.appendChild(teMarkOverlay(container));

    // --- Potion Section ---
    const potionHeading = document.createElement("div");
    potionHeading.textContent = "🧪"; // potion emoji
    potionHeading.style.fontSize = "20px";
    potionHeading.style.color = "#fff";
    container.appendChild(potionHeading);

    const potionButtonsData = [
        {text: "0%", mode: "off"},
        {text: "50%", mode: "50"},
        {text: "75%", mode: "75"}
    ];

    const potionButtons = [];
    potionButtonsData.forEach(data => {
        const btn = document.createElement("button");
        btn.textContent = data.text;
        btn.style.padding = "6px 10px";
        btn.style.width = "100%";
        btn.style.boxSizing = "border-box";
        btn.style.background = "#222";
        btn.style.color = "#fff";
        btn.style.border = "1px solid #666";
        btn.style.borderRadius = "6px";
        btn.style.cursor = "pointer";
        btn.onclick = () => runPotionSequence(data.mode);
        container.appendChild(btn);
        potionButtons.push(btn);
    });

    // --- Gap before Treasure Section ---
    const sectionGap = document.createElement("div");
    sectionGap.style.height = "10px"; // small gap
    container.appendChild(sectionGap);

    // --- Treasure Section ---
    const treasureHeading = document.createElement("div");
    treasureHeading.textContent = "💰"; // treasure chest emoji
    treasureHeading.style.fontSize = "20px";
    treasureHeading.style.color = "#fff";
    container.appendChild(treasureHeading);

    const claimBtn = document.createElement("button");
    claimBtn.textContent = "Claim";
    claimBtn.style.padding = "6px 10px";
    claimBtn.style.width = "100%";
    claimBtn.style.boxSizing = "border-box";
    claimBtn.style.background = "#222";
    claimBtn.style.color = "#fff";
    claimBtn.style.border = "1px solid #666";
    claimBtn.style.borderRadius = "6px";
    claimBtn.style.cursor = "pointer";
    claimBtn.onclick = runClaimSequence;
    container.appendChild(claimBtn);

    // --- Gap before Skills/Quit buttons ---
    const sectionGap2 = document.createElement("div");
    sectionGap2.style.height = "10px";
    container.appendChild(sectionGap2);

    // --- Skills button (no heading icon - just the button, per request) ---
    const skillsBtn = document.createElement("button");
    skillsBtn.textContent = "Skills";
    skillsBtn.title = "Open Skills Window";
    skillsBtn.style.padding = "6px 10px";
    skillsBtn.style.width = "100%";
    skillsBtn.style.boxSizing = "border-box";
    skillsBtn.style.background = "#222";
    skillsBtn.style.color = "#fff";
    skillsBtn.style.border = "1px solid #666";
    skillsBtn.style.borderRadius = "6px";
    skillsBtn.style.cursor = "pointer";
    skillsBtn.onclick = () => {
        clickButtonByTitle("Statistics");
        setTimeout(() => {
            clickButtonByTitle("Show player skills");
            setTimeout(() => {
                clickButtonByText("Skills");
            }, 250);
        }, 250);
    };
    container.appendChild(skillsBtn);

    // --- Quit button, right under Skills ---
    const quitBtn = document.createElement("button");
    quitBtn.textContent = "Quit";
    quitBtn.title = "Quit Game";
    quitBtn.style.padding = "6px 10px";
    quitBtn.style.width = "100%";
    quitBtn.style.boxSizing = "border-box";
    quitBtn.style.background = "#8b0000";
    quitBtn.style.color = "#ffd6d6";
    quitBtn.style.border = "1px solid #ff4d4d";
    quitBtn.style.borderRadius = "6px";
    quitBtn.style.cursor = "pointer";
    quitBtn.onclick = () => {
        if (typeof GUI === "function") {
            GUI("winGame", "Quit");
        } else {
            console.warn("GUI function not available.");
        }
    };
    container.appendChild(quitBtn);

    // --- Utility Functions ---
    function clickButtonByText(text) {
        const btn = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === text);
        if (btn) btn.click();
    }
    function clickButtonByTitle(title) {
        const btn = [...document.querySelectorAll("button")].find(b => b.title === title);
        if (btn) btn.click();
    }

  function runPotionSequence(mode) {

    // ---------- helpers ----------
    const waitFor = (fn, timeout = 3000) =>
        new Promise((resolve, reject) => {
            const start = Date.now();
            const t = setInterval(() => {
                if (fn()) {
                    clearInterval(t);
                    resolve();
                } else if (Date.now() - start > timeout) {
                    clearInterval(t);
                    reject("Timeout waiting for condition");
                }
            }, 50);
        });

    const clickSpanByText = (text) => {
        const spans = [...document.querySelectorAll("span.buttonlink")];
        const el = spans.find(s => s.textContent.trim() === text);
        if (el) el.click();
        else throw `Span "${text}" not found`;
    };

    const clickButtonByText = (text) => {
        const btns = [...document.querySelectorAll("#winPopup button")];
        const el = btns.find(b => b.textContent.trim() === text);
        if (el) el.click();
        else throw `Button "${text}" not found`;
    };

    // ---------- sequence ----------
    (async () => {
        try {
            // Step 1: open Statistics window
            GUI("winGame", "Stats");

            // Step 2: wait for Character Customization popup
            await waitFor(() =>
                document.querySelector("#winPopup #txtPopupTitle")?.textContent
                    .includes("Character")
            );

            // Step 3: click Potion (span.buttonlink)
            clickSpanByText("Potion");

            // Step 4: wait for Potion Auto Usage popup
            await waitFor(() =>
                document.querySelector("#txtPopupTitle")?.textContent
                    .includes("Potion")
            );

            // Step 5: select percentage
            switch (mode) {
                case "off": clickButtonByText("Off"); break;
                case "75":  clickButtonByText("75%"); break;
                case "50":  clickButtonByText("50%"); break;
                case "25":  clickButtonByText("25%"); break;
                default:
                    console.warn("Unknown potion mode:", mode);
            }

        } catch (e) {
            console.warn("Potion sequence failed:", e);
        }
    })();
}


    // --- Claim Sequence ---
function runClaimSequence() {
    clickButtonByTitle("Dungeons"); // Open Dungeons
    setTimeout(() => {
        clickButtonByText("🐲 Other"); // Open Other section
        setTimeout(() => {
            clickButtonByText("🎁 Claim Reward"); // Claim reward
        }, 300);
    }, 300);
}

    // --- Dynamic Positioning ---
    function updatePosition() {
        const rect = inv.getBoundingClientRect();
        const chatBox = document.getElementById("winGameChatbox");

        // Match the same resolution scale used for the inventory/vitals grid
        // so this panel grows/shrinks with the rest of the game's UI instead
        // of staying a fixed 72px (which looked squished on high-res screens
        // and oversized on low-res ones).
        const resScale = Math.min(1.7, Math.max(0.75, window.innerWidth / 1600));
        container.style.width = Math.round(72 * resScale) + "px";
        container.style.fontSize = Math.round(13 * resScale) + "px";

        // Measure the panel's natural (unscaled) size first.
        container.style.transform = "none";
        const containerWidth = container.offsetWidth || 72;
        const naturalHeight = container.scrollHeight || container.offsetHeight || 0;

        // Figure out how much vertical room is actually available before we'd
        // start drawing over the chat log, and shrink the whole panel to fit
        // instead of overlapping it.
        let availableHeight = window.innerHeight - rect.top - 8;
        if (chatBox) {
            const chatRect = chatBox.getBoundingClientRect();
            if (chatRect.height > 0 && chatRect.top > rect.top) {
                availableHeight = Math.min(availableHeight, chatRect.top - rect.top - 8);
            }
        }

        let scale = 1;
        if (naturalHeight > 0 && availableHeight > 0 && naturalHeight > availableHeight) {
            scale = Math.max(0.55, availableHeight / naturalHeight); // never shrink past 55%
        }
        container.style.transform = scale < 1 ? `scale(${scale})` : "none";
        container.style.transformOrigin = "top left";

        const scaledWidth = containerWidth * scale;
        const scaledHeight = naturalHeight * scale;

        // Buttons stacked at right edge of the inventory window...
        let left = window.scrollX + rect.left + rect.width;
        let top = window.scrollY + rect.top;

        // ...but never past the edge of the viewport, on any screen size.
        const maxLeft = window.scrollX + window.innerWidth - scaledWidth - 4;
        const maxTop = window.scrollY + window.innerHeight - scaledHeight - 4;
        left = Math.min(left, Math.max(maxLeft, window.scrollX + 4));
        top = Math.min(Math.max(top, window.scrollY + 4), Math.max(maxTop, window.scrollY + 4));

        container.style.left = left + "px";
        container.style.top = top + "px";
        requestAnimationFrame(updatePosition);
    }

    updatePosition();
})();
// (Quick-Skills button now lives inside the potion/claim panel above, for
// visual continuity - see "Skills Section" in that block.)

// New item Sparkle
// === InvGlow (Sparkles) — settings-aware ===
const INV_GLOW_CONFIG = {
  pollMs: 700,           // how often to check canvases
  glowMs: 2000,          // how long the sparkle elements live
  debug: false,          // set true for console logs
  selector: "#winInventory",
  sparkleCount: 6        // number of sparkles per event
};

(function () {
  // ---- Internal state + public API (must exist even if inventory not found) ----
  const state = {
    enabled: true,
    color: "#ffd700" // default gold
  };

  function log(...a){ if (INV_GLOW_CONFIG.debug) console.log("[InvGlow]", ...a); }

  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return null;
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }

  function makeGradient(hex) {
    const rgb = hexToRgb(hex) || { r: 255, g: 215, b: 0 };
    // soft center → fade to transparent
    return `radial-gradient(circle, rgba(${rgb.r},${rgb.g},${rgb.b},1) 0%, rgba(${rgb.r},${rgb.g},${rgb.b},0.85) 50%, rgba(${rgb.r},${rgb.g},${rgb.b},0) 100%)`;
  }

  function cleanup(invEl) {
    const root = invEl || document;
    root.querySelectorAll(".inv-sparkle").forEach(n => n.remove());
    root.querySelectorAll(".inv-pop").forEach(n => n.classList.remove("inv-pop"));
  }

  // Public control API
  window.InvGlow = {
    setEnabled(on) {
      state.enabled = !!on;
      if (!on) cleanup(document);
      log("enabled:", state.enabled);
    },
    setColor(col) {
      if (typeof col === "string" && col.trim()) state.color = col.trim();
      log("color:", state.color);
    },
    get enabled(){ return state.enabled; },
    get color(){ return state.color; },
    stop() {
      try { clearInterval(intervalId); } catch {}
      try { mo && mo.disconnect(); } catch {}
      cleanup(document);
      console.log("[InvGlow] stopped");
    }
  };
  // Back-compat alias if you were calling InvGlowStop()
  window.InvGlowStop = () => window.InvGlow.stop();

  // ---- Inventory hookup ----
  const inv = document.querySelector(INV_GLOW_CONFIG.selector);
  if (!inv) {
    console.warn("[InvGlow] Inventory not found:", INV_GLOW_CONFIG.selector);
    return; // API still available for later toggles
  }

  // Styles (color comes from JS per-element)
  const style = document.createElement("style");
  style.textContent = `
    .inv-sparkle {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      pointer-events: none;
      animation: invSparkleRise 0.8s forwards;
      opacity: 0;
    }
    @keyframes invSparkleRise {
      0%   { transform: translate(0, 0) scale(0.5); opacity: 1; }
      50%  { transform: translate(var(--x), var(--y)) scale(1.2); opacity: 1; }
      100% { transform: translate(var(--x), var(--y)) scale(0.5); opacity: 0; }
    }
    .inv-pop { animation: invPopScale 0.3s ease-out; }
    @keyframes invPopScale {
      0% { transform: scale(1); }
      50% { transform: scale(1.25); }
      100% { transform: scale(1); }
    }
    .inv-slot-wrapper { position: relative !important; }
  `;
  document.head.appendChild(style);

  const slotState = new WeakMap();

  function hashCanvas(can) {
    try {
      const ctx = can.getContext("2d");
      if (!ctx) return null;
      const { width, height } = can;
      if (!width || !height) return null;
      const data = ctx.getImageData(0, 0, width, height).data;
      let h = 2166136261 >>> 0;
      for (let i = 0; i < data.length; i += 16) {
        h ^= data[i]; h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    } catch { return null; }
  }

  function sparkle(wrapper) {
    if (!state.enabled) return;
    if (!wrapper) return;

    const canvas = wrapper.querySelector("canvas");
    if (!canvas) return;

    wrapper.classList.add("inv-slot-wrapper");

    // Pop the item briefly
    canvas.classList.add("inv-pop");
    setTimeout(() => canvas.classList.remove("inv-pop"), 300);

    // Emit sparkles
    const grad = makeGradient(state.color);
    const w = canvas.offsetWidth || 39;
    const h = canvas.offsetHeight || 39;

    for (let i = 0; i < INV_GLOW_CONFIG.sparkleCount; i++) {
      const sp = document.createElement("div");
      sp.className = "inv-sparkle";
      sp.style.background = grad;

      const angle = Math.random() * 2 * Math.PI;
      const distance = 12 + Math.random() * 16;
      sp.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
      sp.style.setProperty("--y", `${-Math.abs(Math.sin(angle) * distance)}px`);

      sp.style.left = `${Math.random() * w}px`;
      sp.style.top  = `${Math.random() * h}px`;

      wrapper.appendChild(sp);
      setTimeout(() => sp.remove(), INV_GLOW_CONFIG.glowMs);
    }
  }

  function scanOnce() {
    const canvases = inv.querySelectorAll("div > canvas");
    canvases.forEach((can) => {
      const wrapper = can.parentElement;
      const h = hashCanvas(can);

      if (!slotState.has(can)) {
        slotState.set(can, { hash: h });
        return;
      }
      const st = slotState.get(can);
      if (h !== null && st.hash !== h) {
        log("change detected", can, "hash", st.hash, "->", h);
        sparkle(wrapper);
        st.hash = h;
      }
    });
  }

  const mo = new MutationObserver((mutations) => {
    let needScan = false;

    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;

        if (n.tagName === "DIV") {
          const can = n.querySelector("canvas");
          if (can && !slotState.has(can)) {
            slotState.set(can, { hash: hashCanvas(can) });
            sparkle(n);
          }
        }

        if (n.tagName === "CANVAS") {
          const wrap = n.parentElement || n;
          if (!slotState.has(n)) slotState.set(n, { hash: hashCanvas(n) });
          sparkle(wrap);
        }
      });

      if (m.type === "childList") needScan = true;
    }

    if (needScan) scanOnce();
  });

  mo.observe(inv, { childList: true, subtree: true });
  scanOnce();
  const intervalId = setInterval(scanOnce, INV_GLOW_CONFIG.pollMs);

  console.log("[InvGlow] running with sparkles; API: InvGlow.setEnabled(bool), InvGlow.setColor('#hex')");
})();
// === FPS Counter (QoL integrated) ===
(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) return;

  // reuse the same global QoL settings object
  window.qolSettings = window.qolSettings || {};
  const qolSettings = window.qolSettings;

  // --- FPS UI element ---
  const fpsDiv = document.createElement("div");
  Object.assign(fpsDiv.style, {
    position: "fixed",
    color: "deepskyblue",
    fontSize: "12px",
    fontFamily: "monospace",
    background: "rgba(0,0,0,0.5)",
    padding: "2px 5px",
    borderRadius: "4px",
    zIndex: 99999,
    display: "none"
  });
  document.body.appendChild(teMarkOverlay(fpsDiv));

  function updateFpsPosition() {
    const pos = qolSettings.fpsPosition || "top-right";
    // reset first
    fpsDiv.style.top = fpsDiv.style.left = fpsDiv.style.right = fpsDiv.style.bottom = "";
    if (pos === "top-right")    { fpsDiv.style.top = "4px";    fpsDiv.style.right = "6px"; }
    if (pos === "top-left")     { fpsDiv.style.top = "4px";    fpsDiv.style.left = "6px"; }
    if (pos === "bottom-left")  { fpsDiv.style.bottom = "4px"; fpsDiv.style.left = "6px"; }
    if (pos === "bottom-right") { fpsDiv.style.bottom = "4px"; fpsDiv.style.right = "6px"; }
  }

  // --- FPS logic ---
  let lastTime = performance.now();
  let frames = 0;

  function loop() {
    const now = performance.now();
    frames++;
    if (now - lastTime >= 1000) {
      const fps = frames;
      frames = 0;
      lastTime = now;
      if (qolSettings.showFps) {
        fpsDiv.textContent = `FPS: ${fps}`;
        fpsDiv.style.color = fps >= 55 ? "lime" : fps >= 30 ? "yellow" : "red";
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // --- Hook QoL checkboxes / dropdown ---
  const fpsCheckbox = settingsForm.querySelector("input[name='chkFpsCounter']");
  const fpsSelect   = settingsForm.querySelector("select[name='selFpsPosition']");

  if (fpsCheckbox) {
    fpsCheckbox.addEventListener("change", e => {
      qolSettings.showFps = e.target.checked;
      fpsDiv.style.display = e.target.checked ? "block" : "none";
      updateFpsPosition();
    });
  }

  if (fpsSelect) {
    fpsSelect.addEventListener("change", e => {
      qolSettings.fpsPosition = e.target.value;
      updateFpsPosition();
    });
  }

  // Initial apply
  updateFpsPosition();
  fpsDiv.style.display = fpsCheckbox?.checked ? "block" : "none";
  qolSettings.showFps = fpsCheckbox?.checked || false;
})();

//1 click shift+item dropper
// === QoL: Shift+RightClick auto "Drop 1" ===
(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) return;

  // Find the QoL container
  const qolContainer = [...settingsForm.querySelectorAll("div")]
    .find(d => d.querySelector("b")?.textContent === "Quality of Life");

  if (!qolContainer) return;

  // --- Add QoL setting checkbox ---
  const optDiv = document.createElement("div");
  optDiv.className = "te-settings-row";
  optDiv.innerHTML = `<label><input type="checkbox" name="chkQuickDrop1"> Enable Shift+RightClick Drop-1</label>`;

  // Append to the bottom
  qolContainer.appendChild(optDiv);

  // Ensure qolSettings exists
  window.qolSettings = window.qolSettings || {};
  const qolSettings = window.qolSettings;
  qolSettings.quickDrop1 = false;

  // Hook checkbox change
  settingsForm.querySelector("input[name='chkQuickDrop1']")
    .addEventListener("change", e => {
      qolSettings.quickDrop1 = e.target.checked;
    });

  // --- Hook inventory slots ---
  const inv = document.getElementById("winInventory");
  if (!inv) return;

  inv.querySelectorAll("canvas").forEach((canvas) => {
    canvas.addEventListener("contextmenu", e => {
      if (!qolSettings.quickDrop1) return;
      if (e.shiftKey) {
        setTimeout(() => {
          const popup = document.getElementById("winPopup");
          if (!popup || popup.style.display === "none") return;

          const input = popup.querySelector("input[name='txtPopup']");
          const okBtn = [...popup.querySelectorAll("button")]
            .find(b => b.textContent.trim() === "OK");

          if (input && okBtn) {
            input.value = "1";
            okBtn.click();
          }
        }, 50);
      }
    });
  });
})();

// === QoL: Revert UI + Vitals to Default (Sparkles persist) ===
(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) return;

  // Reuse global QoL settings
  window.qolSettings = window.qolSettings || {};
  const q = window.qolSettings;
  if (typeof q.revertUiVitals === "undefined") q.revertUiVitals = false;

  // Find the QoL container
  const qolContainer = [...settingsForm.querySelectorAll("div")]
    .find(d => d.querySelector("b")?.textContent === "Quality of Life");
  if (!qolContainer) return;

  // --- Add checkbox row at the very bottom ---
  let row = settingsForm.querySelector("input[name='chkRevertUiVitals']")?.closest("div");
  if (!row) {
    row = document.createElement("div");
    row.className = "te-settings-row";
    row.innerHTML = `<label><input type="checkbox" name="chkRevertUiVitals"> Revert UI + Vitals to Default</label>`;
    qolContainer.appendChild(row); // ensures last position
  }

  const chk = settingsForm.querySelector("input[name='chkRevertUiVitals']");
  chk.checked = !!q.revertUiVitals;

  // --- Helpers ---
  function revertUIToDefault() {
    ["winInventory", "winVitals"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.removeAttribute("style");
      el.classList.remove("custom-ui", "te-ui-overrides", "te-vitals-overrides");
      el.querySelectorAll("[data-te-inline]").forEach(child => {
        child.removeAttribute("style");
        child.removeAttribute("data-te-inline");
      });
    });
  }

  // These re-apply your new styled UI/Vitals (copied from your enhancer logic)
  function applyNewUI() {
    const inv = document.getElementById("winInventory");
    if (!inv) return;
    const resScale = Math.min(1.7, Math.max(0.75, window.innerWidth / 1600));
    const slotsPerRow = 5;
    const slotSize = 42 * resScale;
    const horizontalGap = 25 * resScale;
    const verticalGap = horizontalGap * 0.1;
    const finalWidth = ((slotsPerRow * slotSize) + (horizontalGap * (slotsPerRow - 1))) * 1.15;
  Object.assign(inv.style, {
    display: 'grid',
    gridTemplateColumns: `repeat(${slotsPerRow}, ${slotSize}px)`,
    gridAutoRows: `${slotSize}px`,
    columnGap: `${horizontalGap}px`,
    rowGap: `${verticalGap}px`,
    padding: '1px 0 6px 0',
    background: 'linear-gradient(145deg, #2e2e2e, #1c1c1c)',
    border: '2px solid #444',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
    width: `${finalWidth}px`,
    margin: '0 auto 10px 0',
    overflow: 'visible',
    justifyContent: 'start',
    boxSizing: 'border-box',
});
  }

  function applyNewVitals() {
    const vitals = document.getElementById("winVitals");
    if (!vitals) return;
    const resScale = Math.min(1.7, Math.max(0.75, window.innerWidth / 1600));
    Object.assign(vitals.style, {
      display: 'grid',
      gridTemplateColumns: `${Math.round(50 * resScale)}px 1fr`,
      gridAutoRows: '1.3rem',
      gap: '4px 6px',
      padding: '2px 6px',
      background: 'linear-gradient(145deg, #1a1a1a, #2e2e2e)',
      border: '2px solid #555',
      borderRadius: '6px',
      boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '0.8rem',
      margin: '0 auto 6px auto',
      width: `${Math.round(360 * resScale)}px`,
      boxSizing: 'border-box',

    });
  }

  function applySparklesIfEnabled() {
    if (q.sparklesEnabled && document.body) {
      document.body.classList.add("sparkle-enabled");
    }
    try { window.InvGlow?.setEnabled?.(!!q.sparklesEnabled); } catch {}
    try { window.InvGlow?.setColor?.(q.sparkleColor || "#ffd700"); } catch {}
  }

  function applyState() {
    if (q.revertUiVitals) {
      revertUIToDefault();
      applySparklesIfEnabled();
    } else {
      applyNewUI();
      applyNewVitals();
      applySparklesIfEnabled();
    }
  }

  // Wire up checkbox
  chk.addEventListener("change", e => {
    q.revertUiVitals = e.target.checked;
    applyState();
  });
  // === QoL: Background Color Selector (aligned under Sparkles) ===
(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) return;

  window.qolSettings = window.qolSettings || {};
  const q = window.qolSettings;
  if (typeof q.bgColor === "undefined") q.bgColor = "#1c1c1c";

  // Find the QoL container
  const qolContainer = [...settingsForm.querySelectorAll("div")]
    .find(d => d.querySelector("b")?.textContent === "Quality of Life");
  if (!qolContainer) return;

  // Find the last existing QoL row (sparkles/brightness) to insert after
  const lastRow = [...qolContainer.querySelectorAll("div")].pop();

  // --- Create color picker row ---
  let row = settingsForm.querySelector("input[name='bgColorPicker']")?.closest("div");
  if (!row) {
    row = document.createElement("div");
    row.className = "te-settings-row";
    row.innerHTML = `
      <label>
        Background Color:
        <input type="color" name="bgColorPicker" value="${q.bgColor}">
      </label>`;
    if (lastRow && lastRow.parentNode) {
      lastRow.parentNode.insertBefore(row, lastRow.nextSibling); // insert directly after sparkles
    } else {
      qolContainer.appendChild(row);
    }
  }

  const colorInput = settingsForm.querySelector("input[name='bgColorPicker']");
  colorInput.value = q.bgColor;

  // --- Apply the color only if Revert UI is OFF ---
  function applyBgColor() {
    if (q.revertUiVitals) return;
    ["winInventory", "winGameChatbox"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.backgroundColor = q.bgColor;
    });
  }

  // Wire up input change
  colorInput.addEventListener("input", e => {
    q.bgColor = e.target.value;
    applyBgColor();
    localStorage.setItem("totalenhance_bgColor", q.bgColor);
  });

  // Restore saved color
  const savedColor = localStorage.getItem("totalenhance_bgColor");
  if (savedColor) {
    q.bgColor = savedColor;
    colorInput.value = savedColor;
  }

  // Integrate with Revert UI + Vitals checkbox
  const chkRevert = settingsForm.querySelector("input[name='chkRevertUiVitals']");
  if (chkRevert) {
    chkRevert.addEventListener("change", () => {
      if (!q.revertUiVitals) {
        applyBgColor();
      } else {
        ["winInventory", "winGameChatbox"].forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          el.removeAttribute("style");
        });
      }
    });
  }

  // Initial application
  if (!q.revertUiVitals) applyBgColor();
})();


  // Initial apply
  setTimeout(applyState, 0);

  // Optional: allow other modules to force refresh
  document.addEventListener("te:refresh-ui", applyState);
})();
//chat scroll
// === Chat Auto-Scroll Toggle Button for winGameChatbox ===
(function () {
  function initAutoScrollButton() {
    const chatBox = document.querySelector("#winGameChatbox");
    if (!chatBox) return false;

    // Find the "Claim" button by its inner text
    const claimBtn = [...document.querySelectorAll("button")]
      .find(btn => btn.textContent.trim() === "Claim");

    if (!claimBtn) return false;

    // Prevent duplicate injection
    if (document.querySelector("#btnAutoScroll")) return true;

    // Create new button
    const autoBtn = document.createElement("button");
    autoBtn.id = "btnAutoScroll";
    autoBtn.textContent = "💬"; // emoji speech bubble
    Object.assign(autoBtn.style, {
      width: claimBtn.offsetWidth + "px",
      height: claimBtn.offsetHeight + "px",
      marginTop: "4px",
      display: "block",
      background: "rgb(34,34,34)",
      color: "#fff",
      border: "1px solid #666",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "18px",
      transition: "box-shadow 0.2s"
    });

    // Insert right after Claim button
    claimBtn.insertAdjacentElement("afterend", autoBtn);

    // Track state
    let autoScrollEnabled = false;

    // Toggle logic
    autoBtn.addEventListener("click", () => {
      autoScrollEnabled = !autoScrollEnabled;
      autoBtn.style.boxShadow = autoScrollEnabled ? "0 0 8px 2px limegreen" : "none";
    });

    // Auto-scroll loop
    function tick() {
      if (autoScrollEnabled) {
        chatBox.scrollTop = chatBox.scrollHeight;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    console.log("Auto-scroll chat button loaded for winGameChatbox.");
    return true;
  }

  // Keep checking until elements exist
  const waitInterval = setInterval(() => {
    if (initAutoScrollButton()) {
      clearInterval(waitInterval);
    }
  }, 500);
})();
//Theme QoL
// === QoL: Themes for Inventory + Vitals ===
(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) return;

  // --- Find QoL container (the one we already appended settings to) ---
  const qolContainer = [...settingsForm.querySelectorAll("div")]
    .find(d => d.querySelector("b")?.textContent === "Quality of Life");

  if (!qolContainer) return;

  // --- Insert theme selector BELOW existing settings ---
  const themeDiv = document.createElement("div");
  themeDiv.className = "te-settings-row";
  themeDiv.innerHTML = `
    <label>UI Theme:
      <select name="selUiTheme">
        <option value="default">Default</option>
        <option value="dark">Dark Minimal</option>
        <option value="neon">Neon Glow</option>
        <option value="retro">Retro Pixel</option>
        <option value="cyberpunk">Cyberpunk Holo</option>
        <option value="fantasy">Fantasy Scroll</option>
        <option value="vaporwave">Vaporwave Dream</option>
        <option value="glass">Minimal Dark Glass</option>
        <option value="industrial">Industrial Steel</option>
        <option value="aurora">Aurora Veil</option>
        <option value="inferno">Inferno Ember</option>
      </select>
    </label>
  `;
  qolContainer.appendChild(themeDiv);

  // --- Insert Brightness control ---
  const brightnessDiv = document.createElement("div");
  brightnessDiv.className = "te-settings-row";
  brightnessDiv.innerHTML = `
    <label>Game Brightness:
      <span style="display:flex; align-items:center; gap:6px;">
        <input type="range" name="rngBrightness" min="50" max="150" step="10">
        <span class="brightnessVal"></span>%
      </span>
    </label>
  `;
  qolContainer.appendChild(brightnessDiv);

  const brightnessInput = brightnessDiv.querySelector("input[name='rngBrightness']");
  const brightnessVal = brightnessDiv.querySelector(".brightnessVal");

  // --- Ensure qolSettings global exists ---
  window.qolSettings = window.qolSettings || {};
  const qolSettings = window.qolSettings;
  qolSettings.uiTheme = qolSettings.uiTheme || "default";
  qolSettings.brightness = qolSettings.brightness || 100;

  // --- Theme definitions ---
  const THEMES = {
    default: {
      inv: { background: "linear-gradient(145deg, #2e2e2e, #1c1c1c)", border: "2px solid #444", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" },
      vitals: { background: "linear-gradient(145deg, #1a1a1a, #2e2e2e)", border: "2px solid #555", boxShadow: "0 3px 6px rgba(0,0,0,0.4)" }
    },
    dark: {
      inv: { background: "#111", border: "1px solid #333", boxShadow: "0 0 12px rgba(0,0,0,0.8)" },
      vitals: { background: "#111", border: "1px solid #333", boxShadow: "0 0 12px rgba(0,0,0,0.8)" }
    },
    neon: {
      inv: { background: "black", border: "2px solid deepskyblue", boxShadow: "0 0 12px deepskyblue" },
      vitals: { background: "black", border: "2px solid lime", boxShadow: "0 0 12px lime" }
    },
    retro: {
      inv: { background: "#2b1d0e", border: "2px solid #d4a373", boxShadow: "none" },
      vitals: { background: "#1a1a1a", border: "2px solid #888", boxShadow: "none", fontFamily: "monospace" }
    },
    cyberpunk: {
      inv: { background: "linear-gradient(135deg, #0f0f0f, #1c0033)", border: "2px solid #ff00ff", boxShadow: "0 0 15px #ff00ff" },
      vitals: { background: "rgba(0,0,0,0.85)", border: "2px solid #00ffff", boxShadow: "0 0 15px #00ffff", fontFamily: "Orbitron, sans-serif" }
    },
    fantasy: {
      inv: { background: "linear-gradient(135deg, #3b2f2f, #1e1a1a)", border: "3px solid #d4af37", boxShadow: "0 0 8px rgba(255,215,0,0.6)" },
      vitals: { background: "#2c2415", border: "2px solid #c0a060", boxShadow: "inset 0 0 10px rgba(200,160,100,0.5)", fontFamily: "serif" }
    },
    vaporwave: {
      inv: { background: "linear-gradient(135deg, #ff71ce, #01cdfe, #05ffa1)", border: "2px solid #fffb96", boxShadow: "0 0 15px rgba(255,113,206,0.8)" },
      vitals: { background: "linear-gradient(135deg, #ff71ce, #01cdfe)", border: "2px solid #fffb96", boxShadow: "0 0 10px rgba(1,205,254,0.6)", fontFamily: "monospace" }
    },
    glass: {
      inv: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" },
      vitals: { background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(0,0,0,0.5)" }
    },
    industrial: {
      inv: { background: "linear-gradient(145deg, #3a3a3a, #1e1e1e)", border: "2px solid #888", boxShadow: "inset 0 0 8px rgba(0,0,0,0.6)" },
      vitals: { background: "#2e2e2e", border: "2px solid #ffcc00", boxShadow: "0 0 8px rgba(255,204,0,0.6)", fontFamily: "Stencil, sans-serif" }
    },
    aurora: {
      inv: {
        background: "linear-gradient(135deg, rgba(0,30,60,0.9), rgba(0,60,90,0.9))",
        border: "2px solid #66ccff",
        boxShadow: "inset 0 0 25px rgba(102,204,255,0.4), 0 0 12px rgba(102,204,255,0.7)",
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)"
      },
      vitals: {
        background: "linear-gradient(135deg, rgba(0,40,70,0.95), rgba(0,70,110,0.95))",
        border: "2px solid #33bbff",
        boxShadow: "inset 0 0 20px rgba(51,187,255,0.4), 0 0 10px rgba(51,187,255,0.6)",
        fontFamily: "Trebuchet MS, sans-serif"
      }
    },
    inferno: {
      inv: {
        background: "linear-gradient(135deg, #1a0f0f, #0d0d0d)",
        border: "2px solid #ff4500",
        boxShadow: "inset 0 0 20px rgba(255,69,0,0.5), 0 0 15px rgba(255,69,0,0.7)",
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,69,0,0.1) 0, rgba(255,69,0,0.1) 2px, transparent 2px, transparent 6px)"
      },
      vitals: {
        background: "linear-gradient(135deg, #260000, #100000)",
        border: "2px solid #ff6347",
        boxShadow: "inset 0 0 15px rgba(255,100,0,0.5), 0 0 12px rgba(255,100,0,0.7)",
        fontFamily: "Verdana, sans-serif"
      }
    }
  };

  // --- Apply theme function ---
  function applyTheme(name) {
    const theme = THEMES[name] || THEMES.default;
    const inv = document.getElementById("winInventory");
    const vitals = document.getElementById("winVitals");

    if (inv) Object.assign(inv.style, theme.inv);
    if (vitals) Object.assign(vitals.style, theme.vitals);
  }

  // --- Apply brightness function ---
  function applyBrightness(value) {
    const gameCanvas = document.getElementById("cvsGame") || document.getElementById("winGameCanvas");
    if (gameCanvas) {
      gameCanvas.style.filter = `brightness(${value}%)`;
    }
  }

  // --- Hook dropdown ---
  const themeSelect = themeDiv.querySelector("select[name='selUiTheme']");
  themeSelect.value = qolSettings.uiTheme;
  themeSelect.addEventListener("change", e => {
    qolSettings.uiTheme = e.target.value;
    applyTheme(qolSettings.uiTheme);
  });

  // --- Hook brightness ---
  brightnessInput.value = qolSettings.brightness;
  brightnessVal.textContent = qolSettings.brightness;
  brightnessInput.addEventListener("input", e => {
    const val = parseInt(e.target.value, 10);
    qolSettings.brightness = val;
    brightnessVal.textContent = val;
    applyBrightness(val);
  });

  // --- Initial apply ---
  applyTheme(qolSettings.uiTheme);
  applyBrightness(qolSettings.brightness);
})();


//recorder button mod
// === Replay Recorder Button (stacked with Claim + Chat buttons) ===
(function () {
  const MAX_RECORDING_TIME_MS = 15 * 60 * 1000; // 15 minutes
  const FILENAME_PREFIX = "Replay_";
  let recorder, recordedChunks = [], recordingTimeout, requestInterval;

  function init() {
    // find our custom floating container (the one with potion/claim/chat buttons)
    const container = [...document.querySelectorAll("div")]
      .find(div => div.style.flexDirection === "column" && div.querySelector("button"));
    if (!container) {
      setTimeout(init, 500);
      return;
    }

    // find the Auto Chat Scroll button in that container
    const autoChatBtn = [...container.querySelectorAll("button")]
      .find(b => b.textContent.includes("💬") || b.title?.includes("Chat"));
    if (!autoChatBtn) {
      setTimeout(init, 500);
      return;
    }

    // --- Create Replay button styled like others ---
    const btn = document.createElement("button");
    btn.textContent = "▶️";
    Object.assign(btn.style, {
      padding: autoChatBtn.style.padding || "6px 10px",
      background: autoChatBtn.style.background || "#222",
      color: autoChatBtn.style.color || "#fff",
      border: autoChatBtn.style.border || "1px solid #666",
      borderRadius: autoChatBtn.style.borderRadius || "6px",
      cursor: "pointer",
      marginTop: "4px"
    });
    btn.title = "Start/Stop Replay Recording";

    autoChatBtn.insertAdjacentElement("afterend", btn);

    async function startRecording() {
      recordedChunks = [];
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30, width: { max: 1280 }, height: { max: 720 } },
          audio: true
        });

        if (!stream || !stream.getTracks().length) {
          alert("No valid stream selected.");
          return;
        }

        recorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp8,opus",
          videoBitsPerSecond: 2500000
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };

        recorder.onstop = () => {
          clearInterval(requestInterval);
          if (recordedChunks.length === 0) {
            alert("Recording failed: no data was captured.");
            return;
          }
          const blob = new Blob(recordedChunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          a.href = url;
          a.download = `${FILENAME_PREFIX}${timestamp}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        };

        recorder.start(1000);
        requestInterval = setInterval(() => {
          if (recorder && recorder.state === "recording") recorder.requestData();
        }, 5000);

        btn.textContent = "⏹️";
        btn.style.animation = "flashRed 1s infinite";

        recordingTimeout = setTimeout(stopRecording, MAX_RECORDING_TIME_MS);
        stream.getVideoTracks()[0].addEventListener("ended", stopRecording);
      } catch (err) {
        alert("Recording canceled or permission denied.");
        console.error(err);
      }
    }

    function stopRecording() {
      if (recorder && recorder.state === "recording") {
        recorder.stop();
        clearTimeout(recordingTimeout);
        clearInterval(requestInterval);
        btn.textContent = "▶️";
        btn.style.animation = "";
      }
    }

    btn.onclick = () => {
      if (recorder && recorder.state === "recording") stopRecording();
      else startRecording();
    };

    // --- Flashing animation ---
    const style = document.createElement("style");
    style.textContent = `
      @keyframes flashRed {
        0%   { background-color: #222; color: #fff; }
        50%  { background-color: red; color: white; }
        100% { background-color: #222; color: #fff; }
      }
    `;
    document.head.appendChild(style);
  }

  init();
})();
//scale zoom fixe
// --- Auto-fix for browser zoom issues with game UI ---
(function () {
  let lastRatio = window.devicePixelRatio;
  window.addEventListener("resize", () => {
    if (window.devicePixelRatio !== lastRatio) {
      lastRatio = window.devicePixelRatio;
      // Mimic manual zoom reset to force reflow
      document.body.style.zoom = "99%";
      setTimeout(() => {
        document.body.style.zoom = "100%";
      }, 50);
    }
  });
})();
//local tracker
(function sessionTracker(){
    if(window.sessionTrackerLoaded) return;
    window.sessionTrackerLoaded = true;

    const tracker = {
        startTime: Date.now(),
        spacePresses: 0,
        itemUses: 0,
        mouseClicks: 0,
        bankOpens: 0,
        shopOpens: 0,
        skillsOpens: 0,
        tabSwitches: 0,      // <Tab> key target switches
        abilityUses: 0,
        peakAPM: 0,
        mouseDistance: 0
    };
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toFixed(0);
}

    // --- Space key realistic tracking ---
    let spaceHeld = false;
    let lastSpaceTime = 0;
    const SPACE_INTERVAL = 200;

    let tabHeld = false; // prevent repeat spam

    document.addEventListener('keydown', e => {
        if(e.code === 'Space'){
            if(!spaceHeld){
                spaceHeld = true;
                const now = Date.now();
                if(now - lastSpaceTime >= SPACE_INTERVAL){
                    tracker.spacePresses++;
                    lastSpaceTime = now;
                }
            }
        }
        if(e.code === 'KeyK'){ // Track using item with K
            tracker.itemUses++;
        }
        if(e.code === 'KeyF'){ // Track ability uses
            tracker.abilityUses++;
        }
        if(e.code === 'Tab' && !tabHeld){ // Track target switching with Tab (debounced)
            tracker.tabSwitches++;
            tabHeld = true;
        }
    });

    document.addEventListener('keyup', e => {
        if(e.code === 'Space'){
            spaceHeld = false;
        }
        if(e.code === 'Tab'){
            tabHeld = false;
        }
    });

    // --- Track inventory double-clicks on item canvases ---
    const invEl = document.querySelector('#winInventory');
    if(invEl){
        const attachCanvasListeners = () => {
            invEl.querySelectorAll('canvas').forEach(c => {
                if(!c._sessionTrackerAttached){
                    c.addEventListener('dblclick', () => tracker.itemUses++);
                    c._sessionTrackerAttached = true;
                }
            });
        };
        attachCanvasListeners();
        const observer = new MutationObserver(attachCanvasListeners);
        observer.observe(invEl, {childList: true, subtree: true});
    }

    // --- Track all mouse clicks (ignore tracker UI clicks) ---
    document.addEventListener('click', e => {
        if (!e.target.closest('#winSessionTracker')) {
            tracker.mouseClicks++;
        }
    });

    // --- Track mouse movement distance ---
    let lastMouseX = null, lastMouseY = null;
    document.addEventListener('mousemove', e => {
        if(lastMouseX !== null && lastMouseY !== null){
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            tracker.mouseDistance += Math.sqrt(dx*dx + dy*dy);
        }
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    // --- Hook Bank, Shop opens via their buttons ---
    const attachWindowOpenListeners = () => {
        document.querySelectorAll("button[title]").forEach(btn => {
            if(btn._sessionTrackerAttached) return;
            const title = btn.getAttribute("title");
            if(title?.includes("Bank")) btn.addEventListener('click', () => tracker.bankOpens++);
            if(title?.includes("Shop")) btn.addEventListener('click', () => tracker.shopOpens++);
            btn._sessionTrackerAttached = true;
        });
    };
    attachWindowOpenListeners();
    new MutationObserver(attachWindowOpenListeners).observe(document.body, {childList:true, subtree:true});

    // --- Watch for Skills window being shown ---
    const watchSkillsWindow = () => {
        const skillsEl = document.querySelector("#winSkills");
        if(skillsEl && !skillsEl._sessionTrackerObserved){
            const observer = new MutationObserver(() => {
                if(skillsEl.style.display !== "none" && skillsEl.style.display !== ""){
                    tracker.skillsOpens++;
                }
            });
            observer.observe(skillsEl, {attributes:true, attributeFilter:["style"]});
            skillsEl._sessionTrackerObserved = true;
        }
    };
    watchSkillsWindow();
    new MutationObserver(watchSkillsWindow).observe(document.body, {childList:true, subtree:true});

    // --- Create new window ---
    const createTrackerWindow = () => {
        if(document.querySelector('#winSessionTracker')) return;

        const form = document.createElement('form');
        form.id = 'winSessionTracker';
        form.className = 'gameWindowEven fadeIn';
        form.name = 'frmSessionTracker';
        form.style.display = 'grid';

        // Header
        const headerDiv = document.createElement('div');
        const h3 = document.createElement('h3');
        h3.textContent = 'Session Tracker';
        headerDiv.appendChild(h3);

        // Stats grid
        const gridDiv = document.createElement('div');

        const makeRow = (label, value) => {
            const labelDiv = document.createElement('div');
            labelDiv.textContent = label + ':';
            const valueDiv = document.createElement('div');
            const input = document.createElement('input');
            input.readOnly = true;
            input.size = 12;
            input.value = value;
            valueDiv.appendChild(input);
            gridDiv.appendChild(labelDiv);
            gridDiv.appendChild(valueDiv);
            return input;
        };

        const sessionLengthInput = makeRow('Session Length', '00:00:00');
        const spaceInput = makeRow('Space Presses', tracker.spacePresses);
        const itemInput = makeRow('Item Uses', tracker.itemUses);
        const mouseInput = makeRow('Mouse Clicks', tracker.mouseClicks);
        const abilityInput = makeRow('Abilities Used (F)', tracker.abilityUses);
        const bankInput = makeRow('Bank Opens', tracker.bankOpens);
        const shopInput = makeRow('Shop Opens', tracker.shopOpens);
        const skillsInput = makeRow('Skills Opens', tracker.skillsOpens);
        const tabInput = makeRow('Tab Switches (Targets)', tracker.tabSwitches);
        const distanceInput = makeRow('Mouse Distance (px)', tracker.mouseDistance.toFixed(0));
        const apmInput = makeRow('Actions Per Minute', '0');
        const peakApmInput = makeRow('Peak APM', tracker.peakAPM);

        // Buttons
        const btnDiv = document.createElement('div');
        const ul = document.createElement('ul');

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = 'Close';
        closeBtn.onclick = () => { form.remove(); };
        ul.appendChild(document.createElement('li')).appendChild(closeBtn);

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.textContent = 'Reset';
        resetBtn.onclick = () => {
            tracker.startTime = Date.now();
            tracker.spacePresses = 0;
            tracker.itemUses = 0;
            tracker.mouseClicks = 0;
            tracker.bankOpens = 0;
            tracker.shopOpens = 0;
            tracker.skillsOpens = 0;
            tracker.tabSwitches = 0;
            tracker.abilityUses = 0;
            tracker.mouseDistance = 0;
            tracker.peakAPM = 0;
            updateDisplay();
        };
        ul.appendChild(document.createElement('li')).appendChild(resetBtn);

        btnDiv.appendChild(ul);
        form.appendChild(headerDiv);
        form.appendChild(gridDiv);
        form.appendChild(btnDiv);
        document.body.appendChild(teMarkOverlay(form));

        // --- Update display ---
        const updateDisplay = () => {
            const elapsed = Date.now() - tracker.startTime;
            const hrs = Math.floor(elapsed / 3600000);
            const mins = Math.floor((elapsed % 3600000) / 60000);
            const secs = Math.floor((elapsed % 60000) / 1000);
            sessionLengthInput.value =
                `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;

            spaceInput.value = tracker.spacePresses;
            itemInput.value = tracker.itemUses;
            mouseInput.value = tracker.mouseClicks;
            abilityInput.value = tracker.abilityUses;
            bankInput.value = tracker.bankOpens;
            shopInput.value = tracker.shopOpens;
            skillsInput.value = tracker.skillsOpens;
            tabInput.value = tracker.tabSwitches;
            distanceInput.value = formatNumber(tracker.mouseDistance);

            // Actions per minute + peak APM (exclude mouseDistance)
            const minutes = elapsed / 60000;
            const totalActions = tracker.spacePresses + tracker.itemUses + tracker.mouseClicks + tracker.abilityUses + tracker.tabSwitches;
            const apm = minutes > 0 ? (totalActions / minutes).toFixed(1) : '0';
            apmInput.value = apm;
            if(parseFloat(apm) > tracker.peakAPM){
                tracker.peakAPM = parseFloat(apm);
            }
            peakApmInput.value = tracker.peakAPM.toFixed(1);
        };

        setInterval(updateDisplay, 500);
    };

    // --- Add button to winStats ---
    const statsWindow = document.querySelector('#winStats ul');
    if(statsWindow){
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Session Tracker';
        btn.title = 'Open session tracker window';
        btn.onclick = createTrackerWindow;
        li.appendChild(btn);
        statsWindow.appendChild(li);
    }
// --- HOTKEY (FIXED + SAFE) ---
(() => {
    if (window.__sessionTrackerHotkeyInstalled) return;
    window.__sessionTrackerHotkeyInstalled = true;

    document.addEventListener('keydown', (e) => {
        const key = e.code === 'KeyL';

        if (e.ctrlKey && !e.shiftKey && !e.altKey && key) {
            e.preventDefault();

            const existing = document.querySelector('#winSessionTracker');

            if (existing) {
                existing.remove();
            } else {
                if (typeof createTrackerWindow === "function") {
                    createTrackerWindow();
                }
            }
        }
    });
})();
})();
//background Color

(function() {
  'use strict';

  // Load item DB in the background - a failed/slow fetch should degrade
  // gracefully (tooltips just show less detail) instead of disabling the
  // whole item-link feature.
  let itemsData = [];
  fetch("https://loociez.github.io/MOC-IV/last.json")
    .then(r => r.json())
    .then(data => { itemsData = data; })
    .catch(err => console.error("[TotalEnhanced] Item database failed to load, tooltips will be limited:", err));

  // The chat box / inventory window don't exist until the player has
  // actually logged into the game, so retry setup instead of giving up
  // permanently if they're missing the first time this runs.
  const readyPoll = setInterval(() => {
    if (trySetup()) clearInterval(readyPoll);
  }, 1000);
  trySetup();

  function trySetup() {
  // Elements
  const inventory = document.getElementById("winInventory");
  const chatInput = document.getElementById("txtChatMessage");
  const chatBox = document.getElementById("winGameChatbox");
  const txtInvDesc = document.getElementById("txtInvDesc");

  if (!inventory || !chatInput || !chatBox || !txtInvDesc) {
    return false;
  }
  if (chatBox.dataset.teItemLinkInit) return true; // already set up

  // Insert text at cursor helper
  function insertTextAtCursor(el, text) {
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const val = el.value;
      el.value = val.slice(0, start) + text + val.slice(end);
      el.selectionStart = el.selectionEnd = start + text.length;
    } else if (el.isContentEditable) {
      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      el.value = (el.value || "") + text;
    }
    el.focus();
  }

  // Get hovered item name from #txtInvDesc
  function getNameFromInvDesc() {
    if (txtInvDesc.style.visibility !== "visible") return null;
    const firstP = txtInvDesc.querySelector("p");
    if (!firstP) return null;
    const span = firstP.querySelector("span");
    if (!span) return null;

    let name = span.textContent.trim();

    // Remove stack count at end e.g. "(x74)"
    name = name.replace(/\s*\(x\d+\)$/i, "").trim();

    return name;
  }

  // Inventory canvas handling: shift + left click inserts item name tag into chat input
  const canvases = inventory.querySelectorAll("canvas");
  let currentHoveredName = null;

  canvases.forEach(canvas => {
    canvas.style.cursor = "pointer";

    canvas.addEventListener("mousemove", () => {
      currentHoveredName = getNameFromInvDesc();
    });

    canvas.addEventListener("mouseleave", () => {
      currentHoveredName = null;
    });

    canvas.addEventListener("click", (e) => {
      if (!e.shiftKey || e.button !== 0) return;
      if (!currentHoveredName) {
        console.warn("No hovered item name detected!");
        return;
      }
      const insertion = `[item=${currentHoveredName}]`;
      insertTextAtCursor(chatInput, insertion);
      e.preventDefault();
    });
  });

  // Find item data by name
  function findItemByName(name) {
    return itemsData.find(item => item.name.toLowerCase() === name.toLowerCase());
  }

  // Format tooltip details
  function formatItemDetails(item) {
    if (!item) return "<em>Item not found</em>";

    let html = `<div style="font-weight:bold; font-size:16px; margin-bottom:4px; color:#00ff00;">${item.name}</div>`;

    if (item.desc && item.desc.trim()) {
      html += `<div style="font-style: italic; margin-bottom:6px; color:#bfbfbf;">${item.desc}</div>`;
    }

    html += "<div style='margin-bottom:6px;'>";
    if (item.uses) html += `<div>Uses: ${item.uses}</div>`;
    if (item.limit) html += `<div>Limit: ${item.limit}</div>`;
    if (item.cooldown_delay) html += `<div>Cooldown: ${item.cooldown_delay} ms</div>`;
    if (item.repair_cost) html += `<div>Repair Cost: ${item.repair_cost}</div>`;
    if (item.break_chance) html += `<div>Break Chance: ${item.break_chance}%</div>`;
    if (item.recycle_value) html += `<div>Recycle Value: ${item.recycle_value}</div>`;
    if (item.level_req) html += `<div>Level Requirement: ${item.level_req}</div>`;
    if (item.death_drop !== undefined) html += `<div>Drop on Death: ${item.death_drop ? "Yes" : "No"}</div>`;
    if (item.transferable !== undefined) html += `<div>Transferable: ${item.transferable ? "Yes" : "No"}</div>`;
    html += "</div>";

    if (item.data) {
      html += "<div style='font-weight:bold; margin-bottom:4px;'>Stats:</div><ul style='margin-top:0; padding-left:16px;'>";

      const excludedKeys = new Set(["sprite_rotation", "scale", "sprite_color", "damage_stat", "hue", "move", "spin", "sprite", "alpha"]);

      for (const [key, value] of Object.entries(item.data)) {
        if (excludedKeys.has(key)) continue;
        if (!value && value !== 0) continue;
        if (value === 0) continue;

        const keyPretty = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        html += `<li>${keyPretty}: ${value}</li>`;
      }
      html += "</ul>";
    }

    return html;
  }

  // Tooltip container (now scrollable)
  const tooltip = document.createElement("div");
  Object.assign(tooltip.style, {
    position: "fixed",
    background: "rgba(0, 0, 0, 0.85)",
    color: "#0f0",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #0f0",
    maxWidth: "300px",
    maxHeight: "350px",       // ★ Scroll height limit
    overflowY: "auto",         // ★ Enable vertical scrolling
    fontFamily: "Arial, sans-serif",
    fontSize: "13px",
    zIndex: "9999999",
    pointerEvents: "auto",
    whiteSpace: "normal",
    display: "none",
    boxShadow: "0 0 10px #0f0",
    userSelect: "none",
  });
  document.body.appendChild(teMarkOverlay(tooltip));

  function showTooltipAtPosition(html, x, y) {
    tooltip.innerHTML = html;

    const padding = 10;
    const extraUpMargin = 350;
    const tooltipWidth = 300;
    const tooltipHeight = tooltip.offsetHeight || 150;

    let left = x + padding;
    if (left + tooltipWidth > window.innerWidth) {
      left = x - tooltipWidth - padding;
    }

    let top = y - tooltipHeight - padding - extraUpMargin;
    if (top < 0) top = y + padding;

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
    tooltip.style.display = "block";
  }

  function hideTooltip() {
    tooltip.style.display = "none";
  }

  // Parse clickable item links
  function parseChatItems() {
    const itemRegex = /\[item=([^\]]+)\]/gi;
    const spans = [...chatBox.querySelectorAll("li > span")];

    spans.forEach(span => {
      if (span.dataset.processed) return;

      const text = span.textContent;
      let lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let match;

      while ((match = itemRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }

        const itemName = match[1];
        const link = document.createElement("span");
        link.className = "chat-item-link";
        link.style.color = "#0f0";
        link.style.textDecoration = "underline";
        link.style.cursor = "pointer";
        link.dataset.itemName = itemName;
        link.textContent = itemName;
        fragment.appendChild(link);

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      if (fragment.childNodes.length > 0) {
        span.textContent = "";
        span.appendChild(fragment);
        span.dataset.processed = "true";
      }
    });
  }

  document.addEventListener("chatline-updated", parseChatItems);


  chatBox.addEventListener("click", e => {
    const target = e.target;
    if (target.classList.contains("chat-item-link")) {
      const itemName = target.dataset.itemName;
      const item = findItemByName(itemName);
      const html = formatItemDetails(item);
      showTooltipAtPosition(html, e.clientX, e.clientY);
      e.stopPropagation();
    } else {
      hideTooltip();
    }
  });

  document.body.addEventListener("click", e => {
    if (!tooltip.contains(e.target)) hideTooltip();
  });

  chatBox.dataset.teItemLinkInit = "true";
  return true;
  } // end trySetup

})();
// Utility function to apply the glass style
function applyGlassStyle(element) {
    if (!element) return;
    element.style.background = 'rgba(30, 30, 30, 0.7)';
    element.style.backdropFilter = 'blur(10px)';
    element.style.border = '1.5px solid rgba(255, 255, 255, 0.2)';
    element.style.borderRadius = '12px';
    element.style.color = '#eee';
    element.style.padding = '14px';
}

// Apply the theme to all main windows
[
    'winStats',
    'winLogin',
    'winTrade',
    'winGuildEditor',
    'winShop',
    'winBank',
    'winCredits',
    'winSkills',
    'winSkillsContent',
    'winSelectPlayer',
    'winSettings',
    'winPopup'
].forEach(id => {
    applyGlassStyle(document.getElementById(id));
});

const css = `
.emojiImg {
    filter: none !important;
    -webkit-filter: none !important;
    image-rendering: pixelated;
}
`;
const style = document.createElement("style");
style.textContent = css;
document.head.appendChild(style);

})();
// NOTE: Map Editor handling now lives at the very top of this file
// (see "Auto-hide overlay UI while the Map Editor is open"). It hides every
// element tagged with the "te-overlay" class whenever #winMapEditor is open,
// which is what actually stops TotalEnhanced's buttons from covering the
// tileset viewer's up/down controls.
(() => {
  // Prevent duplicates
  if (document.getElementById("moc-quick-quit")) return;

  // Create button
  const btn = document.createElement("div");
  btn.id = "moc-quick-quit";
  btn.title = "Quit Game";

  btn.innerText = "✖";

  // Styling
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "12px",
    left: "12px",
    width: "32px",
    height: "32px",
    background: "#8b0000",
    border: "2px solid #ff4d4d",
    borderRadius: "6px",
    color: "#ffd6d6",
    fontSize: "18px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 999999,
    boxShadow: "0 0 6px rgba(255,0,0,0.6)",
    userSelect: "none"
  });

  // Hover effect
  btn.onmouseenter = () => {
    btn.style.background = "#b00000";
    btn.style.boxShadow = "0 0 10px rgba(255,50,50,0.9)";
  };
  btn.onmouseleave = () => {
    btn.style.background = "#8b0000";
    btn.style.boxShadow = "0 0 6px rgba(255,0,0,0.6)";
  };

  // Click action
  btn.onclick = () => {
    if (typeof GUI === "function") {
      GUI("winGame", "Quit");
    } else {
      console.warn("GUI function not available.");
    }
  };

  document.body.appendChild(teMarkOverlay(btn));
})();
