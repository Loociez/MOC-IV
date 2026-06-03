// ==UserScript==
// @name         Mirage Online Classic - Map Editor QoL
// @namespace    By Loocie
// @version      1.0
// @description  QoL improvements for Map Editor
// @match        https://play.mirageonlineclassic.com/*
// @match        https://mo.mirageonlineclassic.com/*
// @match        https://play.consty.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE = {
        AUTOSAVE_ENABLED: 'moc_autosave_enabled',
        AUTOSAVE_MINUTES: 'moc_autosave_minutes',
        LAST_TILESET: 'moc_last_tileset',
        LAST_LAYER: 'moc_last_layer',
        FAVORITES: 'moc_tileset_favorites',

        PANEL_X: 'moc_panel_x',
        PANEL_Y: 'moc_panel_y',
        PANEL_W: 'moc_panel_w',
        PANEL_H: 'moc_panel_h'
    };

    let autosaveTimer = null;

    function isEditorOpen() {
        const editor = document.getElementById('winMapEditor');
        return editor && getComputedStyle(editor).display !== 'none';
    }

    function getTilesetSelect() {
        return document.querySelector('select[name="cmbTileset"]');
    }

    function getLayerSelect() {
        return document.querySelector('select[name="cmbTileLayer"]');
    }

    function getCanvas() {
        return document.getElementById('cvsMapEditor');
    }

    function saveMap() {
        try {
            GUI('winGame', 'Save Map');
        } catch (e) {
            console.error(e);
        }
    }

    function scrollTiles(direction, fast = false) {
        try {
            const speed = fast ? 4 : 1;

            if (direction === 'up') {
                GUI('winGame', 'Toggle Tileset North', [speed]);
                setTimeout(() => GUI('winGame', 'Toggle Tileset North', [0]), 50);
            }

            if (direction === 'down') {
                GUI('winGame', 'Toggle Tileset South', [speed]);
                setTimeout(() => GUI('winGame', 'Toggle Tileset South', [0]), 50);
            }
        } catch(e) {}
    }

    function startAutosave() {
        stopAutosave();

        const enabled = localStorage.getItem(STORAGE.AUTOSAVE_ENABLED) === 'true';
        const minutes = parseInt(localStorage.getItem(STORAGE.AUTOSAVE_MINUTES) || '5');

        if (!enabled) return;

        autosaveTimer = setInterval(() => {
            if (isEditorOpen()) saveMap();
        }, minutes * 60 * 1000);
    }

    function stopAutosave() {
        if (autosaveTimer) clearInterval(autosaveTimer);
        autosaveTimer = null;
    }

    /* ---------------- DRAG ---------------- */

    function makeDraggable(panel) {
        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;

        panel.addEventListener('mousedown', (e) => {
            const tag = e.target.tagName.toLowerCase();
            if (['input', 'select', 'button', 'option', 'textarea'].includes(tag)) return;

            dragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;

            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;

            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;

            panel.style.left = x + 'px';
            panel.style.top = y + 'px';

            localStorage.setItem(STORAGE.PANEL_X, x);
            localStorage.setItem(STORAGE.PANEL_Y, y);
        });

        document.addEventListener('mouseup', () => {
            dragging = false;
            document.body.style.userSelect = '';
        });
    }

    /* ---------------- RESIZE ---------------- */

    function makeResizable(panel, handle) {
        let resizing = false;
        let startX, startY, startW, startH;

        handle.addEventListener('mousedown', (e) => {
            resizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startW = panel.offsetWidth;
            startH = panel.offsetHeight;
            e.preventDefault();
            e.stopPropagation();
        });

        document.addEventListener('mousemove', (e) => {
            if (!resizing) return;

            const w = Math.max(180, startW + (e.clientX - startX));
            const h = Math.max(160, startH + (e.clientY - startY));

            panel.style.width = w + 'px';
            panel.style.height = h + 'px';

            localStorage.setItem(STORAGE.PANEL_W, w);
            localStorage.setItem(STORAGE.PANEL_H, h);
        });

        document.addEventListener('mouseup', () => {
            resizing = false;
        });
    }

    /* ---------------- PANEL ---------------- */

    function createPanel() {
        if (document.getElementById('moc-qol-panel')) return;

        const editor = document.getElementById('winMapEditor');
        if (!editor) return;

        const panel = document.createElement('div');
        panel.id = 'moc-qol-panel';

        const x = parseInt(localStorage.getItem(STORAGE.PANEL_X)) || 16;
        const y = parseInt(localStorage.getItem(STORAGE.PANEL_Y)) || 16;
        const w = parseInt(localStorage.getItem(STORAGE.PANEL_W)) || 200;
        const h = parseInt(localStorage.getItem(STORAGE.PANEL_H)) || 260;

        panel.style.position = 'absolute';
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
        panel.style.width = w + 'px';
        panel.style.height = h + 'px';
        panel.style.zIndex = '1000';

        panel.style.backgroundColor = '#1c1f24';
        panel.style.border = '1px solid #3f444a';
        panel.style.borderRadius = '4px';
        panel.style.padding = '8px';
        panel.style.fontSize = '12px';
        panel.style.color = '#fff';
        panel.style.fontFamily = 'sans-serif';
        panel.style.overflow = 'auto';

        panel.innerHTML = `
            <div style="margin-bottom:8px; display:flex; align-items:center; justify-content:space-between;">
                <label style="display:inline-flex; align-items:center; cursor:pointer;">
                    <input type="checkbox" id="moc-autosave" style="margin-right:6px;">
                    Auto Save
                </label>
                <div>
                    <input id="moc-autosave-minutes" type="number" min="1" max="120"
                           style="width:45px; background:#111; color:#fff; border:1px solid #555; border-radius:3px; padding:2px; text-align:center;">
                    <span style="font-size:11px; margin-left:2px; color:#aaa;">mins</span>
                </div>
            </div>

            <div style="margin-bottom:10px;">
                <button id="moc-save-now" type="button"
                        style="width:100%; padding:5px; background:#2da44e; color:#fff; border:none; border-radius:3px; font-weight:bold; cursor:pointer;">
                    💾 Save Now
                </button>
            </div>

            <div style="border-top:1px solid #3f444a; padding-top:8px;">
                <strong style="color:#ffcc00; font-size:11px;">FAVOURITES</strong>

                <select id="moc-favs" style="width:100%; margin-top:6px; background:#111; color:#fff; border:1px solid #555; border-radius:3px;">
                    <option value="">Select Favourite...</option>
                </select>

                <button id="moc-add-fav"
        type="button"
        style="width:100%; margin-top:6px; padding:4px; background:#30363d; color:#fff; border:1px solid #8b949e; border-radius:3px;">
    ★ Add Current Tileset
</button>

<button id="moc-remove-fav"
        type="button"
        style="width:100%; margin-top:4px; padding:4px; background:#8b2d2d; color:#fff; border:1px solid #b84a4a; border-radius:3px;">
    ✖ Remove Selected Favourite
</button>
            </div>

            <div id="moc-resize"
                 style="position:absolute; right:0; bottom:0; width:10px; height:10px; cursor:nwse-resize;">
            </div>
        `;

        editor.appendChild(panel);

        makeDraggable(panel);
        makeResizable(panel, panel.querySelector('#moc-resize'));

        const autosaveCheckbox = panel.querySelector('#moc-autosave');
        const autosaveMinutes = panel.querySelector('#moc-autosave-minutes');

        autosaveCheckbox.checked = localStorage.getItem(STORAGE.AUTOSAVE_ENABLED) === 'true';
        autosaveMinutes.value = localStorage.getItem(STORAGE.AUTOSAVE_MINUTES) || '5';

        autosaveCheckbox.onchange = () => {
            localStorage.setItem(STORAGE.AUTOSAVE_ENABLED, autosaveCheckbox.checked);
            startAutosave();
        };

        autosaveMinutes.onchange = () => {
            localStorage.setItem(STORAGE.AUTOSAVE_MINUTES, autosaveMinutes.value);
            startAutosave();
        };

        panel.querySelector('#moc-save-now').onclick = saveMap;

        renderFavorites();
        startAutosave();
    }

    function renderFavorites() {
    const dropdown = document.getElementById('moc-favs');
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Select Favourite...</option>';

    const favs = JSON.parse(localStorage.getItem(STORAGE.FAVORITES) || '[]');

    favs.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        dropdown.appendChild(opt);
    });

    dropdown.onchange = () => {
        const select = getTilesetSelect();
        if (!select || !dropdown.value) return;

        select.value = dropdown.value;
        select.dispatchEvent(new Event('change'));
    };

    const addBtn = document.getElementById('moc-add-fav');
    if (addBtn) {
        addBtn.onclick = () => {
            const select = getTilesetSelect();
            if (!select) return;

            const current = select.value;
            let favs = JSON.parse(localStorage.getItem(STORAGE.FAVORITES) || '[]');

            if (!favs.includes(current)) {
                favs.push(current);
                localStorage.setItem(STORAGE.FAVORITES, JSON.stringify(favs));
                renderFavorites();
            }
        };
    }

    const removeBtn = document.getElementById('moc-remove-fav');
    if (removeBtn) {
        removeBtn.onclick = () => {
            if (!dropdown.value) return;

            let favs = JSON.parse(localStorage.getItem(STORAGE.FAVORITES) || '[]');

            favs = favs.filter(f => f !== dropdown.value);

            localStorage.setItem(STORAGE.FAVORITES, JSON.stringify(favs));

            renderFavorites();
        };
    }
}

    /* ---------------- HOTKEYS ---------------- */

    document.addEventListener('keydown', function(e) {
        if (!isEditorOpen()) return;

        if (e.ctrlKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            saveMap();
            return;
        }

        const layerSelect = getLayerSelect();
        if (!layerSelect) return;

        const layerMap = {
            '1':0, '2':1, '3':2, '4':3, '5':4,
            '6':5, '7':6, '8':7, '9':8, '0':9
        };

        if (layerMap[e.key] !== undefined) {
            layerSelect.selectedIndex = Math.min(layerMap[e.key], layerSelect.options.length - 1);
            localStorage.setItem(STORAGE.LAST_LAYER, layerSelect.selectedIndex);
            layerSelect.dispatchEvent(new Event('change'));
        }
    });

    document.addEventListener('wheel', function(e) {
        if (!isEditorOpen()) return;

        const canvas = getCanvas();
        if (!canvas || !canvas.matches(':hover')) return;

        e.preventDefault();

        const fast = e.shiftKey;

        if (e.deltaY > 0) scrollTiles('down', fast);
        else scrollTiles('up', fast);

    }, { passive: false });

    setInterval(createPanel, 1000);

})();