// ==UserScript==
// @name         TotalSkill/Overlay for Mirage Online Classic
// @namespace    http://tampermonkey.net/
// @version      2026-07-15
// @description  Floating skill tracker, per-skill checkboxes, skill-bar appearance, and Overlay drawing settings for MoC.
// @author       Loocie
// @match        https://play.consty.com/
// @match        https://play.mirageonlineclassic.com
// @match        https://play.freebrowsermmorpg.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=consty.com
// @grant        none
// ==/UserScript==

(function () {
    // NOTE: deliberately no 'use strict' here - the original TotalSkill.js
    // assigns to `pHTML` without declaring it (relies on it becoming an
    // implicit global), which throws a ReferenceError in strict mode.
    // Leaving this sloppy-mode keeps the original code's behavior identical.

    const __TS_READY_INTERVAL = setInterval(() => {
        const ready =
            document.getElementById('winSkillsContent') &&
            document.getElementById('winSettings') &&
            document.getElementById('winGame') &&
            typeof window.GUI === 'function';

        if (!ready) return;
        clearInterval(__TS_READY_INTERVAL);
        runTotalSkill();
    }, 300);

    
    function runTotalSkill() {
    (() => {
        let recAssign = (a, props) => {
            for (let propName in props) {
                if (a[propName] && typeof (a[propName]) === 'object') {
                    recAssign(a[propName], props[propName]);
                } else {
                    a[propName] = props[propName];
                }
            }
            return a;
        };
        let handler = {
            get: (target, property) => {
                return (...args) => {
                    let obj = recAssign(document.createElement(property), args[0] || {});
                    for (let i = 1; i < args.length; ++i) {
                        if (typeof (args[i]) === 'function') {
                            obj.appendChild(args[i]());
                        } else if (args[i] instanceof Node) {
                            obj.appendChild(args[i]);
                        } else {
                            // Fix for appending strings safely
                            obj.appendChild(document.createTextNode(String(args[i])));
                        }
                    };
                    return obj;
                }
            }
        };
        let o = {};
        pHTML = new Proxy(o, handler);

        /* --- THEMES DEFINITION --- */
        const themes = {
            blue: {
                barGradient: 'linear-gradient(90deg, #3399FF, #0066CC)',
                barBg: 'rgba(51, 153, 255, 0.18)',
                barBorder: 'rgba(51, 153, 255, 0.35)'
            },
            red: {
                barGradient: 'linear-gradient(90deg, #FF4C4C, #CC0000)',
                barBg: 'rgba(255, 76, 76, 0.18)',
                barBorder: 'rgba(204, 0, 0, 0.35)'
            },
            green: {
                barGradient: 'linear-gradient(90deg, #33CC33, #009900)',
                barBg: 'rgba(51, 204, 51, 0.18)',
                barBorder: 'rgba(0, 153, 0, 0.35)'
            },
            purple: {
                barGradient: 'linear-gradient(90deg, #B366FF, #7A1FCC)',
                barBg: 'rgba(179, 102, 255, 0.18)',
                barBorder: 'rgba(122, 31, 204, 0.35)'
            },
            gold: {
                barGradient: 'linear-gradient(90deg, #FFD966, #CC9900)',
                barBg: 'rgba(255, 217, 102, 0.18)',
                barBorder: 'rgba(204, 153, 0, 0.35)'
            }
        };

        /* --- PERSISTED APPEARANCE STATE --- */
        let currentTheme = localStorage.getItem('skillTrackerTheme') || 'blue';
        let currentBarStyle = localStorage.getItem('skillTrackerBarStyle') || 'solid';
        let currentOpacity = parseInt(localStorage.getItem('skillTrackerOpacity') || '100', 10);

        let flashEnabled = localStorage.getItem('skillFlashEnabled');
        if (flashEnabled === null) flashEnabled = true;
        else flashEnabled = flashEnabled === 'true';

        function applyTheme() {
            const theme = themes[currentTheme] || themes.blue;

            let styleEl = document.getElementById('custom-skillbar-blue-fill');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'custom-skillbar-blue-fill';
                document.head.appendChild(styleEl);
            }

            // Extra CSS for bar "style" variants
            let styleExtra = '';
            if (currentBarStyle === 'striped') {
                styleExtra = `
      #winSkillsContent .barValue,
      #floatingWinSkillsContent .barValue {
        background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 10px, transparent 10px, transparent 20px), ${theme.barGradient};
      }
      `;
            } else if (currentBarStyle === 'glow') {
                styleExtra = `
      #winSkillsContent .barValue,
      #floatingWinSkillsContent .barValue {
        box-shadow: 0 0 10px 2px ${theme.barBorder};
        animation: skillGlowPulse 1.6s ease-in-out infinite;
      }
      @keyframes skillGlowPulse {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.35); }
      }
      `;
            }

            styleEl.textContent = `
      /* Bar fill */
      #winSkillsContent .barValue,
      #floatingWinSkillsContent .barValue {
        background: ${theme.barGradient};
        border-radius: 6px;
      }

      /* Bar background */
      #winSkillsContent .barSkill,
      #floatingWinSkillsContent .barSkill {
        background: ${theme.barBg};
        border: 1px solid ${theme.barBorder};
        border-radius: 3px;
        padding: 2px 3px;
        margin: 2px 0;
        font-weight: 500;
      }

      /* Checkbox spacing */
      #winSkillsContent .barSkill input,
      #floatingWinSkillsContent .barSkill input {
        margin-left: 3px;
      }

      #floatingWinSkillsContent {
        position: absolute;
        z-index: 9999;
        user-select: none;
        cursor: move;
        opacity: ${currentOpacity / 100};
      }

      .skill-gain-flash {
        animation: skillFlash 0.35s ease-out;
      }

      @keyframes skillFlash {
        from { filter: brightness(1.7); }
        to { filter: brightness(1); }
      }

      .te-settings-row {
        margin: 4px 0;
      }

      ${styleExtra}
      `;
        }
        applyTheme();

        GUI('winSkills', 'Show');

        const enabledSkilTrackers = JSON.parse(
            window.localStorage.getItem('totalEnhancerSkillTracking') || '{}'
        ) || {};

        const chkBoxClick = (skillName) => (e) => {
            enabledSkilTrackers[skillName] = e.currentTarget.checked;
            window.localStorage.setItem(
                'totalEnhancerSkillTracking',
                JSON.stringify(enabledSkilTrackers)
            );
        };

        const container = document.getElementById("winSkillsContent");

        for (let b of Array.from(container.querySelectorAll('div'))) {
            if (b.classList.contains('barSkill')) {
                if (!b.querySelector('input')) {
                    const skillName = b.innerText.split(' ')[0];
                    const inputCheckbox = pHTML.input({ type: 'checkbox', checked: enabledSkilTrackers[skillName] || false });
                    inputCheckbox.name = "skillSelector";
                    inputCheckbox.addEventListener('click', chkBoxClick(skillName));
                    b.appendChild(inputCheckbox);
                }
            }
        }

        // --- DRAG LOGIC ---
        let dragging = false;
        let offsetX = 0, offsetY = 0;
        let floatingSkillsDivRef = null;

        function enableDrag(el) {
            el.addEventListener('mousedown', (e) => {
                dragging = true;
                offsetX = e.clientX - el.offsetLeft;
                offsetY = e.clientY - el.offsetTop;
            });
            document.addEventListener('mousemove', (e) => {
                if (!dragging) return;
                el.style.left = (e.clientX - offsetX) + 'px';
                el.style.top = (e.clientY - offsetY) + 'px';
            });
            document.addEventListener('mouseup', () => {
                if (!dragging) return;
                dragging = false;
                window.localStorage.setItem('floatingSkillPos', JSON.stringify({
                    left: floatingSkillsDivRef.style.left,
                    top: floatingSkillsDivRef.style.top
                }));
            });
        }

        
        function injectSkillAppearanceSettings() {
            const settingsForm = document.getElementById('winSettings');
            if (!settingsForm) return null;

            // Already injected (e.g. script re-run) - just return existing refs
            if (settingsForm.querySelector('[name="chkSkillFlash"]')) {
                return {
                    flashCheckbox: settingsForm.querySelector('[name="chkSkillFlash"]'),
                    themeSelect: settingsForm.querySelector('[name="selSkillBarTheme"]'),
                    styleSelect: settingsForm.querySelector('[name="selSkillBarStyle"]'),
                    opacityRange: settingsForm.querySelector('[name="rngSkillBarOpacity"]'),
                    opacityLabel: settingsForm.querySelector('.skillBarOpacityVal')
                };
            }

            const header = pHTML.div({ className: 'te-settings-row' },
                pHTML.div({}, pHTML.b({}, 'Skill Bar Appearance'))
            );

            const flashRow = pHTML.div({ className: 'te-settings-row' });
            const flashLabel = pHTML.label({});
            const flashCheckbox = pHTML.input({ type: 'checkbox', name: 'chkSkillFlash', checked: true });
            flashLabel.appendChild(flashCheckbox);
            flashLabel.appendChild(document.createTextNode(' Enable Skill XP Flash'));
            flashRow.appendChild(flashLabel);

            const themeRow = pHTML.div({ className: 'te-settings-row' });
            const themeLabel = pHTML.label({}, 'Skill Bar Theme: ');
            const themeSelect = pHTML.select({ name: 'selSkillBarTheme' });
            for (const themeName of Object.keys(themes)) {
                const opt = pHTML.option({ value: themeName }, themeName.charAt(0).toUpperCase() + themeName.slice(1));
                themeSelect.appendChild(opt);
            }
            themeLabel.appendChild(themeSelect);
            themeRow.appendChild(themeLabel);

            const styleRow = pHTML.div({ className: 'te-settings-row' });
            const styleLabel = pHTML.label({}, 'Skill Bar Style: ');
            const styleSelect = pHTML.select({ name: 'selSkillBarStyle' });
            [['solid', 'Solid'], ['striped', 'Striped'], ['glow', 'Glow']].forEach(([val, text]) => {
                styleSelect.appendChild(pHTML.option({ value: val }, text));
            });
            styleLabel.appendChild(styleSelect);
            styleRow.appendChild(styleLabel);

            const opacityRow = pHTML.div({ className: 'te-settings-row' });
            const opacityLabelWrap = pHTML.label({}, 'Skill Bar Opacity: ');
            const opacitySpan = pHTML.span({ style: { display: 'flex', alignItems: 'center', gap: '6px' } });
            const opacityRange = pHTML.input({ type: 'range', name: 'rngSkillBarOpacity', min: '20', max: '100', step: '5', value: '100' });
            const opacityLabel = pHTML.span({ className: 'skillBarOpacityVal' }, '100');
            opacitySpan.appendChild(opacityRange);
            opacitySpan.appendChild(opacityLabel);
            opacitySpan.appendChild(document.createTextNode('%'));
            opacityLabelWrap.appendChild(opacitySpan);
            opacityRow.appendChild(opacityLabelWrap);

            
            const buttonList = settingsForm.querySelector('ul');
            const insertBefore = buttonList ? buttonList.parentElement : null;
            if (insertBefore && insertBefore.parentElement === settingsForm) {
                settingsForm.insertBefore(header, insertBefore);
                settingsForm.insertBefore(flashRow, insertBefore);
                settingsForm.insertBefore(themeRow, insertBefore);
                settingsForm.insertBefore(styleRow, insertBefore);
                settingsForm.insertBefore(opacityRow, insertBefore);
            } else {
                settingsForm.appendChild(header);
                settingsForm.appendChild(flashRow);
                settingsForm.appendChild(themeRow);
                settingsForm.appendChild(styleRow);
                settingsForm.appendChild(opacityRow);
            }

            return { flashCheckbox, themeSelect, styleSelect, opacityRange, opacityLabel };
        }

        function initSkillAppearanceSettings() {
            const refs = injectSkillAppearanceSettings();
            if (!refs) return;
            const { flashCheckbox, themeSelect, styleSelect, opacityRange, opacityLabel } = refs;

            if (flashCheckbox) {
                flashCheckbox.checked = flashEnabled;
                flashCheckbox.addEventListener('change', (e) => {
                    flashEnabled = e.currentTarget.checked;
                    localStorage.setItem('skillFlashEnabled', flashEnabled);
                });
            }

            if (themeSelect) {
                themeSelect.value = currentTheme;
                themeSelect.addEventListener('change', (e) => {
                    currentTheme = e.currentTarget.value;
                    localStorage.setItem('skillTrackerTheme', currentTheme);
                    applyTheme();
                });
            }

            if (styleSelect) {
                styleSelect.value = currentBarStyle;
                styleSelect.addEventListener('change', (e) => {
                    currentBarStyle = e.currentTarget.value;
                    localStorage.setItem('skillTrackerBarStyle', currentBarStyle);
                    applyTheme();
                });
            }

            if (opacityRange) {
                opacityRange.value = currentOpacity;
                if (opacityLabel) opacityLabel.textContent = currentOpacity;
                opacityRange.addEventListener('input', (e) => {
                    currentOpacity = parseInt(e.currentTarget.value, 10);
                    localStorage.setItem('skillTrackerOpacity', currentOpacity);
                    if (opacityLabel) opacityLabel.textContent = currentOpacity;
                    applyTheme();
                });
            }
        }
        initSkillAppearanceSettings();

        if (window.totalEnhancerSkillTrackingTimer) {
            clearInterval(window.totalEnhancerSkillTrackingTimer);
        }

        const lastWidths = {};

        window.totalEnhancerSkillTrackingTimer = setInterval(() => {
            const skillsToDisplay = ['Non-Existing-Skill'];
            for (let [k, v] of Object.entries(enabledSkilTrackers)) {
                if (v) skillsToDisplay.push(k);
            }

            const existingDiv = document.getElementById('floatingWinSkillsContent');
            const isNewDiv = !existingDiv;
            let floatingSkillsDiv = existingDiv || document.createElement("div");
            floatingSkillsDivRef = floatingSkillsDiv;

            floatingSkillsDiv.id = 'floatingWinSkillsContent';

            
            if (isNewDiv) {
                const savedPos = JSON.parse(window.localStorage.getItem('floatingSkillPos') || '{}');
                if (savedPos.left && savedPos.top) {
                    floatingSkillsDiv.style.left = savedPos.left;
                    floatingSkillsDiv.style.top = savedPos.top;
                } else {
                    floatingSkillsDiv.style.left = '100px';
                    floatingSkillsDiv.style.top = '20px';
                }
                floatingSkillsDiv.style.position = 'absolute';
                enableDrag(floatingSkillsDiv);
            }

            floatingSkillsDiv.style.display = 'block';

            floatingSkillsDiv.innerHTML = "";

            if (skillsToDisplay.length) {
                if (document.getElementById('winSkills').style.display === 'none') {
                    GUI('winSkills', 'Show');
                }

                const container = document.getElementById("winSkillsContent");
                document.getElementById('winGame').appendChild(floatingSkillsDiv);

                for (let b of Array.from(container.querySelectorAll('div'))) {
                    if (b.classList.contains('barSkill')) {
                        const skillName = b.innerText.split(' ')[0];
                        if (!b.querySelector('input')) {
                            const inputCheckbox = document.createElement("input");
                            inputCheckbox.type = 'checkbox';
                            inputCheckbox.name = 'skillSelector';
                            inputCheckbox.checked = enabledSkilTrackers[skillName] || false;
                            inputCheckbox.addEventListener('input', chkBoxClick(skillName));
                            b.appendChild(inputCheckbox);
                        }

                        if (skillsToDisplay.includes(skillName)) {
                            let skillNameContainer = pHTML.div({ innerHTML: b.innerHTML, style: { width: '190px', display: "inline-block", textAlign: 'right' } });
                            const bar = b.nextSibling.cloneNode(true);

                            // Flash effect when width changes and flashEnabled is true
                            if (flashEnabled && bar.querySelector('.barValue')) {
                                const currentWidth = bar.querySelector('.barValue').style.width;
                                if (lastWidths[skillName] && lastWidths[skillName] !== currentWidth) {
                                    bar.querySelector('.barValue').classList.add('skill-gain-flash');
                                    setTimeout(() => {
                                        bar.querySelector('.barValue').classList.remove('skill-gain-flash');
                                    }, 400);
                                }
                                lastWidths[skillName] = currentWidth;
                            } else if (bar.querySelector('.barValue')) {
                                bar.querySelector('.barValue').classList.remove('skill-gain-flash');
                            }

                            bar.style = b.nextElementSibling.style;
                            recAssign(bar.style, { width: '400px', position: 'relative', top: "-18px", left: "24px", display: 'inline-block' });
                            const skillInfo = pHTML.div({ className: b.className, style: { ...b.style, position: "relative", width: '600px' } }, skillNameContainer, bar);
                            const cb = skillNameContainer.querySelector("input");
                            cb.checked = true;
                            cb.addEventListener('input', chkBoxClick(skillName));

                            floatingSkillsDiv.appendChild(skillInfo);

                        }
                    }
                }
            }
        }, 1200);
    })();
    }
})();



(function () {
    'use strict';

    const GRID_COLS = 16; // maps are always 16 tiles wide
    const GRID_ROWS = 12; // maps are always 12 tiles high

    const LS = {
        enabled: 'totalSkillOverlayEnabled',
        drawings: 'totalSkillOverlayDrawings',
        color: 'totalSkillOverlayColor',
        symbol: 'totalSkillOverlaySymbol',
        opacity: 'totalSkillOverlayOpacity',
        locked: 'totalSkillOverlayLocked',
        panelPos: 'totalSkillOverlayPanelPos',
        minimized: 'totalSkillOverlayMinimized'
    };

    function loadJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }
    function saveJSON(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore quota errors */ }
    }

    
    const __TS_OVERLAY_READY_INTERVAL = setInterval(() => {
        const ready =
            document.getElementById('winSettings') &&
            document.getElementById('cvsGame') &&
            document.getElementById('winGame');

        if (!ready) return;
        clearInterval(__TS_OVERLAY_READY_INTERVAL);
        initOverlayDrawing();
    }, 300);

    function initOverlayDrawing() {
        const settingsForm = document.getElementById('winSettings');

        // --- State (all persisted) ---
        let enabled = localStorage.getItem(LS.enabled) === 'true';
        let drawings = loadJSON(LS.drawings, []); // [{col, row, symbol, color}]
        let drawColor = localStorage.getItem(LS.color) || '#ff3b3b';
        let drawSymbol = (localStorage.getItem(LS.symbol) || 'X').slice(0, 2);
        let opacity = parseInt(localStorage.getItem(LS.opacity) || '100', 10);
        let storedLocked = localStorage.getItem(LS.locked);
        let locked = storedLocked === null ? true : storedLocked === 'true'; // default: locked (safe)
        let minimized = localStorage.getItem(LS.minimized) === 'true';

        let overlayCanvas = null;
        let overlayCtx = null;
        let panel = null;
        let syncTimer = null;

        
        function injectSettingsCheckbox() {
            const existing = settingsForm.querySelector('[name="chkOverlayDrawing"]');
            if (existing) return existing;

            const row = document.createElement('div');
            row.className = 'te-settings-row';
            row.innerHTML =
                '<div style="margin-top:6px;"><b>Overlay Drawing</b></div>' +
                '<label><input type="checkbox" name="chkOverlayDrawing"> Enable Overlay Drawing (draw symbols on the map)</label>';

            
            const buttonList = settingsForm.querySelector('ul');
            const insertBefore = buttonList ? buttonList.parentElement : null;
            if (insertBefore && insertBefore.parentElement === settingsForm) {
                settingsForm.insertBefore(row, insertBefore);
            } else {
                settingsForm.appendChild(row);
            }
            return row.querySelector('[name="chkOverlayDrawing"]');
        }

        const checkbox = injectSettingsCheckbox();
        checkbox.checked = enabled;
        checkbox.addEventListener('change', (e) => {
            enabled = e.currentTarget.checked;
            localStorage.setItem(LS.enabled, enabled);
            if (enabled) startOverlay(); else stopOverlay();
        });

        // ---------- Overlay canvas (sits on top of #cvsGame) ----------
        function ensureOverlayCanvas() {
            if (overlayCanvas) return;
            const gameCanvas = document.getElementById('cvsGame');
            if (!gameCanvas) return;

            overlayCanvas = document.createElement('canvas');
            overlayCanvas.id = 'totalSkillOverlayCanvas';
            
            overlayCanvas.width = gameCanvas.width;
            overlayCanvas.height = gameCanvas.height;
            Object.assign(overlayCanvas.style, {
                position: 'fixed',
                left: '0px',
                top: '0px',
                zIndex: '500', // above the game canvas, below TE/game UI windows
                pointerEvents: locked ? 'none' : 'auto'
            });
            document.body.appendChild(overlayCanvas);
            overlayCtx = overlayCanvas.getContext('2d');
            overlayCanvas.addEventListener('click', handleOverlayClick);
        }

        
        function syncOverlayGeometry() {
            const gameCanvas = document.getElementById('cvsGame');
            if (!gameCanvas || !overlayCanvas) return;

            const rect = gameCanvas.getBoundingClientRect();
            overlayCanvas.style.left = rect.left + 'px';
            overlayCanvas.style.top = rect.top + 'px';
            overlayCanvas.style.width = rect.width + 'px';
            overlayCanvas.style.height = rect.height + 'px';

            if (overlayCanvas.width !== gameCanvas.width || overlayCanvas.height !== gameCanvas.height) {
                overlayCanvas.width = gameCanvas.width;
                overlayCanvas.height = gameCanvas.height;
                redrawAll();
            }
        }

        function redrawAll() {
            if (!overlayCtx) return;
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            const tileW = overlayCanvas.width / GRID_COLS;
            const tileH = overlayCanvas.height / GRID_ROWS;
            overlayCtx.textAlign = 'center';
            overlayCtx.textBaseline = 'middle';
            overlayCtx.font = 'bold ' + Math.floor(Math.min(tileW, tileH) * 0.65) + 'px sans-serif';
            drawings.forEach((d) => {
                overlayCtx.fillStyle = d.color;
                overlayCtx.fillText(d.symbol, d.col * tileW + tileW / 2, d.row * tileH + tileH / 2);
            });
        }

        // Click a tile to stamp the current symbol/color; click an already
        // stamped tile again to erase it.
        function handleOverlayClick(e) {
            if (locked || !overlayCanvas) return;

            const rect = overlayCanvas.getBoundingClientRect();
            const scaleX = overlayCanvas.width / rect.width;
            const scaleY = overlayCanvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            const tileW = overlayCanvas.width / GRID_COLS;
            const tileH = overlayCanvas.height / GRID_ROWS;
            const col = Math.floor(x / tileW);
            const row = Math.floor(y / tileH);
            if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return;

            const existingIdx = drawings.findIndex((d) => d.col === col && d.row === row);
            if (existingIdx !== -1) {
                drawings.splice(existingIdx, 1);
            } else {
                drawings.push({ col, row, symbol: drawSymbol || '?', color: drawColor });
            }
            saveJSON(LS.drawings, drawings);
            redrawAll();
        }

        function applyLockState() {
            if (overlayCanvas) overlayCanvas.style.pointerEvents = locked ? 'none' : 'auto';
        }

        function applyOpacity() {
            if (overlayCanvas) overlayCanvas.style.opacity = String(opacity / 100);
        }

        // ---------- Floating control panel ----------
        function ensurePanel() {
            if (panel) return;

            panel = document.createElement('div');
            panel.id = 'totalSkillOverlayPanel';
            Object.assign(panel.style, {
                position: 'fixed',
                zIndex: '10000',
                background: 'rgba(20,20,20,0.9)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '8px',
                color: '#eee',
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                width: '210px',
                userSelect: 'none',
                boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
            });

            const savedPos = loadJSON(LS.panelPos, null);
            if (savedPos && savedPos.left && savedPos.top) {
                panel.style.left = savedPos.left;
                panel.style.top = savedPos.top;
            } else {
                panel.style.left = '20px';
                panel.style.top = '80px';
            }

            const titleBar = document.createElement('div');
            Object.assign(titleBar.style, {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                cursor: 'move',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '8px 8px 0 0',
                fontWeight: 'bold'
            });
            const titleText = document.createElement('span');
            titleText.textContent = 'Overlay Drawing';
            titleBar.appendChild(titleText);

            const minBtn = document.createElement('span');
            minBtn.textContent = minimized ? '\u25A2' : '_';
            Object.assign(minBtn.style, { cursor: 'pointer', padding: '0 4px' });
            minBtn.title = 'Minimize / Restore';
            titleBar.appendChild(minBtn);

            const body = document.createElement('div');
            body.style.padding = '8px';
            body.style.display = minimized ? 'none' : 'block';
            body.innerHTML =
                '<div style="margin-bottom:6px;">' +
                '  <button type="button" id="tsOverlayLockBtn" style="width:100%; padding:4px; cursor:pointer;"></button>' +
                '</div>' +
                '<div style="margin-bottom:6px;">' +
                '  <label>Symbol: <input type="text" id="tsOverlaySymbol" maxlength="2" style="width:40px;"></label>' +
                '</div>' +
                '<div style="margin-bottom:6px;">' +
                '  <label>Color: <input type="color" id="tsOverlayColor"></label>' +
                '</div>' +
                '<div style="margin-bottom:6px;">' +
                '  <label>Opacity: <input type="range" id="tsOverlayOpacity" min="10" max="100" step="5" style="vertical-align:middle;"> <span id="tsOverlayOpacityVal"></span>%</label>' +
                '</div>' +
                '<div style="display:flex; gap:6px;">' +
                '  <button type="button" id="tsOverlayUndo" style="flex:1; cursor:pointer;">Undo</button>' +
                '  <button type="button" id="tsOverlayClear" style="flex:1; cursor:pointer;">Clear All</button>' +
                '</div>';

            panel.appendChild(titleBar);
            panel.appendChild(body);
            document.body.appendChild(panel);

            const lockBtn = body.querySelector('#tsOverlayLockBtn');
            const symbolInput = body.querySelector('#tsOverlaySymbol');
            const colorInput = body.querySelector('#tsOverlayColor');
            const opacityInput = body.querySelector('#tsOverlayOpacity');
            const opacityVal = body.querySelector('#tsOverlayOpacityVal');
            const undoBtn = body.querySelector('#tsOverlayUndo');
            const clearBtn = body.querySelector('#tsOverlayClear');

            function refreshLockBtn() {
                lockBtn.textContent = locked ? 'Locked (click to unlock)' : 'Unlocked (click to lock)';
                lockBtn.style.background = locked ? '#5a1f1f' : '#1f5a2b';
                lockBtn.style.color = '#fff';
                lockBtn.style.border = 'none';
                lockBtn.style.borderRadius = '4px';
            }
            refreshLockBtn();

            lockBtn.addEventListener('click', () => {
                locked = !locked;
                localStorage.setItem(LS.locked, locked);
                refreshLockBtn();
                applyLockState();
            });

            symbolInput.value = drawSymbol;
            symbolInput.addEventListener('input', (e) => {
                drawSymbol = e.currentTarget.value.slice(0, 2) || '?';
                localStorage.setItem(LS.symbol, drawSymbol);
            });

            colorInput.value = drawColor;
            colorInput.addEventListener('input', (e) => {
                drawColor = e.currentTarget.value;
                localStorage.setItem(LS.color, drawColor);
            });

            opacityInput.value = String(opacity);
            opacityVal.textContent = String(opacity);
            opacityInput.addEventListener('input', (e) => {
                opacity = parseInt(e.currentTarget.value, 10);
                opacityVal.textContent = String(opacity);
                localStorage.setItem(LS.opacity, opacity);
                applyOpacity();
            });

            undoBtn.addEventListener('click', () => {
                drawings.pop();
                saveJSON(LS.drawings, drawings);
                redrawAll();
            });

            clearBtn.addEventListener('click', () => {
                if (!confirm('Clear all overlay drawings?')) return;
                drawings = [];
                saveJSON(LS.drawings, drawings);
                redrawAll();
            });

            minBtn.addEventListener('click', () => {
                minimized = !minimized;
                localStorage.setItem(LS.minimized, minimized);
                body.style.display = minimized ? 'none' : 'block';
                minBtn.textContent = minimized ? '\u25A2' : '_';
            });

            // Drag by the title bar only (avoid the minimize button).
            let dragging = false, offsetX = 0, offsetY = 0;
            titleBar.addEventListener('mousedown', (e) => {
                if (e.target === minBtn) return;
                dragging = true;
                offsetX = e.clientX - panel.offsetLeft;
                offsetY = e.clientY - panel.offsetTop;
            });
            document.addEventListener('mousemove', (e) => {
                if (!dragging) return;
                panel.style.left = (e.clientX - offsetX) + 'px';
                panel.style.top = (e.clientY - offsetY) + 'px';
            });
            document.addEventListener('mouseup', () => {
                if (!dragging) return;
                dragging = false;
                saveJSON(LS.panelPos, { left: panel.style.left, top: panel.style.top });
            });
        }

        function removePanel() {
            if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
            panel = null;
        }

        function removeOverlayCanvas() {
            if (overlayCanvas && overlayCanvas.parentNode) overlayCanvas.parentNode.removeChild(overlayCanvas);
            overlayCanvas = null;
            overlayCtx = null;
        }

        function startOverlay() {
            ensureOverlayCanvas();
            ensurePanel();
            applyLockState();
            applyOpacity();
            syncOverlayGeometry();
            redrawAll();
            if (!syncTimer) {
                syncTimer = setInterval(syncOverlayGeometry, 300);
            }
        }

        function stopOverlay() {
            if (syncTimer) {
                clearInterval(syncTimer);
                syncTimer = null;
            }
            removeOverlayCanvas();
            removePanel();
        }

        if (enabled) startOverlay();
    }
})();