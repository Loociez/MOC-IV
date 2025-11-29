(() => {
    console.log("%cLoading Canvas Hotbar...", "color:#0ff");

    const HOTBAR_ID = "canvasHotbar";
    const STORAGE_KEY = "CanvasHotbarBindings";
    const LOCK_KEY = "CanvasHotbarLocked";
    const POS_KEY = "CanvasHotbarPosition";

    // Initial keys that cannot be deleted
    const INITIAL_KEYS = new Set(["C", "V", "B"]);

    // Load saved bindings
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    let locked = localStorage.getItem(LOCK_KEY) === "true";
    let awaitingAssignmentFor = null;

    // Prevent duplicate hotbars
    if (document.getElementById(HOTBAR_ID)) {
        console.log("Hotbar already exists.");
        return;
    }

    // ===========================
    // CREATE HOTBAR
    // ===========================
    const bar = document.createElement("div");
    bar.id = HOTBAR_ID;
    bar.style.position = "fixed";
    bar.style.bottom = "40px";
    bar.style.left = "50%";
    bar.style.transform = "translateX(-50%)";
    bar.style.display = "flex";
    bar.style.gap = "6px";
    bar.style.padding = "6px 10px";
    bar.style.background = "rgba(0,0,0,0.35)";
    bar.style.border = "1px solid rgba(255,255,255,0.2)";
    bar.style.borderRadius = "8px";
    bar.style.backdropFilter = "blur(4px)";
    bar.style.zIndex = "99999";
    bar.style.userSelect = "none";
    bar.style.cursor = locked ? "default" : "grab";

    // Restore saved position
    const savedPos = JSON.parse(localStorage.getItem(POS_KEY) || "null");
    if (savedPos) {
        bar.style.left = savedPos.left + "px";
        bar.style.top = savedPos.top + "px";
        bar.style.bottom = "auto";
        bar.style.transform = "none";
    }

    // ===========================
    // DRAGGABLE HOTBAR
    // ===========================
    let dragging = false, offX = 0, offY = 0;

    bar.addEventListener("mousedown", (e) => {
        if (locked) return;
        if (e.target.classList.contains("slot") ||
            e.target.classList.contains("hotkeyLabel") ||
            e.target.innerText === "⚙️" ||
            e.target.innerText === "+") return;

        dragging = true;
        offX = e.clientX - bar.offsetLeft;
        offY = e.clientY - bar.offsetTop;
        bar.style.cursor = "grabbing";
        e.preventDefault();
    });

    document.addEventListener("mouseup", () => {
        if (dragging) {
            dragging = false;
            bar.style.cursor = "grab";

            localStorage.setItem(POS_KEY, JSON.stringify({
                left: bar.offsetLeft,
                top: bar.offsetTop
            }));
        }
    });

    document.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        bar.style.left = (e.clientX - offX) + "px";
        bar.style.top = (e.clientY - offY) + "px";
        bar.style.bottom = "auto";
        bar.style.transform = "none";
    });

    // ===========================
    // Helper: save bindings
    // ===========================
    function saveBindings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }

    // ===========================
    // UPDATED GREEN RIPPLE EFFECT
    // ===========================
    function animateSlotUseForKey(key) {
        try {
            const slots = document.querySelectorAll(`#${HOTBAR_ID} .slot`);
            for (const slot of slots) {
                const lbl = slot.querySelector(".hotkeyLabel");
                if (!lbl) continue;
                if (lbl.innerText.trim() !== key) continue;

                const ripple = document.createElement("div");
                const size = Math.max(slot.clientWidth, slot.clientHeight) * 3;

                ripple.style.position = "absolute";
                ripple.style.left = "50%";
                ripple.style.top = "50%";
                ripple.style.width = `${size}px`;
                ripple.style.height = `${size}px`;
                ripple.style.marginLeft = `${-size / 2}px`;
                ripple.style.marginTop = `${-size / 2}px`;
                ripple.style.borderRadius = "50%";
                ripple.style.pointerEvents = "none";
                ripple.style.zIndex = "1";
                ripple.style.background = "rgba(0,255,80,0.35)";
                ripple.style.transform = "scale(0)";
                ripple.style.opacity = "1";

                ripple.style.transition =
                    "transform 900ms cubic-bezier(0.16, 1, 0.3, 1), opacity 900ms ease-out";

                slot.appendChild(ripple);

                const cog = slot.querySelector("div[title='Change keybind']");
                const label = slot.querySelector(".hotkeyLabel");
                if (cog) cog.style.zIndex = "10";
                if (label) label.style.zIndex = "10";

                ripple.offsetWidth; // reflow
                ripple.style.transform = "scale(1)";
                ripple.style.opacity = "0";

                setTimeout(() => {
                    ripple.remove();
                }, 950);

                break;
            }
        } catch (err) {
            console.warn("animateSlotUseForKey error:", err);
        }
    }

    // ===========================
    // CREATE SLOT
    // ===========================
    function createSlot(initialKey, isPlus = false) {
        const div = document.createElement("div");
        div.classList.add("slot");
        div.style.position = "relative";
        div.style.width = "42px";
        div.style.height = "42px";
        div.style.border = "1px solid rgba(255,255,255,0.25)";
        div.style.borderRadius = "6px";
        div.style.background = isPlus ? "rgba(0,150,0,0.4)" : "rgba(255,255,255,0.08)";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.fontSize = isPlus ? "24px" : "14px";
        div.style.color = isPlus ? "#0f0" : "white";
        div.style.cursor = locked ? "default" : "pointer";
        div.style.overflow = "hidden";

        if (isPlus) {
            div.innerText = "+";
            div.title = "Add new slot";

            div.addEventListener("click", () => {
                if (locked) return;

                const used = new Set(Object.keys(saved));
                let newKey = null;
                for (let i = 65; i <= 90; i++) {
                    const ch = String.fromCharCode(i);
                    if (!used.has(ch)) {
                        newKey = ch;
                        break;
                    }
                }
                if (!newKey) {
                    alert("No more keys available.");
                    return;
                }

                saved[newKey] = -1;
                saveBindings();

                const slot = createSlot(newKey);
                bar.insertBefore(slot, div);
                console.log("Added slot:", newKey);
            });

            return div;
        }

        // Key label
        const keyLabel = document.createElement("div");
        keyLabel.innerText = initialKey;
        keyLabel.classList.add("hotkeyLabel");
        keyLabel.style.position = "absolute";
        keyLabel.style.bottom = "2px";
        keyLabel.style.right = "4px";
        keyLabel.style.fontWeight = "bold";
        keyLabel.style.fontSize = "12px";
        keyLabel.style.color = "#0f0";
        keyLabel.style.textShadow = "0 0 3px black";
        keyLabel.style.pointerEvents = "none";
        keyLabel.style.zIndex = "10";
        div.appendChild(keyLabel);

        // Settings cog
        const cog = document.createElement("div");
        cog.innerText = "⚙️";
        cog.style.position = "absolute";
        cog.style.top = "-6px";
        cog.style.right = "-2px";
        cog.style.fontSize = "14px";
        cog.style.cursor = "pointer";
        cog.title = "Change keybind";
        cog.style.zIndex = "10";
        div.appendChild(cog);

        cog.addEventListener("click", (e) => {
            e.stopPropagation();
            if (locked) return;
            div.style.outline = "2px solid yellow";

            const listener = (ev) => {
                ev.preventDefault();
                const newKey = ("" + ev.key).toUpperCase();

                // De-dupe
                for (const k in saved) {
                    if (k === newKey) delete saved[k];
                }

                const oldKey = keyLabel.innerText;
                saved[newKey] = saved[oldKey] ?? -1;
                delete saved[oldKey];

                saveBindings();
                keyLabel.innerText = newKey;

                document.removeEventListener("keydown", listener, true);
                div.style.outline = "";
            };

            document.addEventListener("keydown", listener, true);
        });

        // Right-click delete (button 2) for non-initial slots
        div.addEventListener("mousedown", (e) => {
            if (locked) return;
            if (e.button === 2) {
                e.preventDefault();
                const key = keyLabel.innerText;
                if (INITIAL_KEYS.has(key)) {
                    // Prevent deleting initial keys
                    return;
                }
                delete saved[key];
                saveBindings();
                div.remove();
            }
        });

        // Assign inventory slot
        div.addEventListener("click", (ev) => {
            if (locked) return;
            if (ev.target.innerText === "⚙️") return;
            const key = keyLabel.innerText;
            awaitingAssignmentFor = key;
            div.style.outline = "2px solid gold";
            setTimeout(() => div.style.outline = "", 600);
        });

        // Prevent context menu on right-click so right-click deletion works smoothly
        div.addEventListener("contextmenu", (e) => {
            if (locked) return;
            const key = keyLabel.innerText;
            if (!INITIAL_KEYS.has(key)) {
                e.preventDefault();
            }
        });

        return div;
    }

    // ===========================
    // Build hotbar
    // ===========================
    const keys = Object.keys(saved).length ? Object.keys(saved) : ["C", "V", "B"];
    keys.forEach(k => bar.appendChild(createSlot(k)));

    const addSlotBtn = createSlot("+", true);
    bar.appendChild(addSlotBtn);

    // Lock Button
    const lockBtn = document.createElement("div");
    lockBtn.innerText = locked ? "🔒" : "🔓";
    lockBtn.style.fontSize = "13px";
    lockBtn.style.marginLeft = "6px";
    lockBtn.style.cursor = "pointer";

    lockBtn.onclick = () => {
        locked = !locked;
        localStorage.setItem(LOCK_KEY, locked);
        lockBtn.innerText = locked ? "🔒" : "🔓";

        document.querySelectorAll(`#${HOTBAR_ID} .slot`)
            .forEach(s => s.style.cursor = locked ? "default" : "pointer");

        bar.style.cursor = locked ? "default" : "grab";
    };

    bar.appendChild(lockBtn);
    document.body.appendChild(bar);

    // ===========================
    // Assign canvas slot
    // ===========================
    document.addEventListener("mousedown", (e) => {
        if (awaitingAssignmentFor === null) return;

        const canvases = [...document.querySelectorAll("#winInventory canvas")];
        const index = canvases.indexOf(e.target);

        if (index !== -1) {
            saved[awaitingAssignmentFor] = index;
            saveBindings();
            awaitingAssignmentFor = null;
        }
    });

    // ===========================
    // Double click simulation
    // ===========================
    function simulateDoubleClick(canvas) {
        function ev(t) {
            return new MouseEvent(t, {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0,
                buttons: 1,
                clientX: canvas.getBoundingClientRect().left + 10,
                clientY: canvas.getBoundingClientRect().top + 10
            });
        }

        canvas.dispatchEvent(ev("mousedown"));
        canvas.dispatchEvent(ev("mouseup"));

        setTimeout(() => {
            canvas.dispatchEvent(ev("mousedown"));
            canvas.dispatchEvent(ev("mouseup"));
        }, 120);
    }

    function isElementVisible(el) {
        if (!el) return false;
        const s = getComputedStyle(el);
        return s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0";
    }

    // ===========================
    // HOTKEY USE
    // ===========================
    document.addEventListener("keydown", (e) => {
        const active = document.activeElement;
        const chat = document.getElementById("winGameChatbox");
        const msg = document.getElementById("winGameMessage");
        const bank = document.getElementById("winBank");

        if ((active && (active === chat || chat?.contains(active) ||
            active === msg || msg?.contains(active)))
            || isElementVisible(bank)) return;

        const key = ("" + e.key).toUpperCase();
        const index = saved[key];
        if (index === undefined || index === -1) return;

        const canvases = document.querySelectorAll("#winInventory canvas");
        const canvas = canvases[index];
        if (!canvas) return;

        animateSlotUseForKey(key);
        simulateDoubleClick(canvas);
    });

    // ===========================
    // ICON CLONING LOOP
    // ===========================
    setInterval(() => {
        const slots = document.querySelectorAll(`#${HOTBAR_ID} .slot`);
        const canvases = document.querySelectorAll("#winInventory canvas");

        slots.forEach(slot => {
            if (slot.innerText === "+") return;

            const label = slot.querySelector(".hotkeyLabel");
            if (!label) return;

            const key = label.innerText.trim();
            const index = saved[key];

            if (index === undefined || index === -1) {
                const img = slot.querySelector("img");
                if (img) img.src = "";
                slot.style.background = "rgba(255,255,255,0.08)";
                return;
            }

            const srcCanvas = canvases[index];
            if (!srcCanvas) return;

            let img = slot.querySelector("img");
            if (!img) {
                img = document.createElement("img");
                img.style.position = "absolute";
                img.style.left = "0";
                img.style.top = "0";
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "contain";
                img.style.pointerEvents = "none";
                slot.appendChild(img);
            }

            try { img.src = srcCanvas.toDataURL("image/png"); } catch {}

            slot.style.background = "rgba(0,255,140,0.25)";
        });
    }, 120);

    // ===========================
    // MINION AUTO-DISMISS (unchanged)
    // ===========================
    (() => {
        const observer = new MutationObserver(() => {
            const popup = document.querySelector('#winPopup');
            const title = document.querySelector('#txtPopupTitle');
            if (
                popup &&
                popup.style.display !== 'none' &&
                title?.textContent.trim() === 'Minion'
            ) {
                const buttons = popup.querySelectorAll('button');
                const dismissBtn = [...buttons].find(btn =>
                    btn.textContent.trim().toLowerCase().includes('dismiss')
                );
                if (dismissBtn) {
                    dismissBtn.click();
                    console.log('[autoDismissMinion] Dismiss button clicked.');
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[autoDismissMinion] Watching for Minion popup...');
    })();

    console.log("%cCanvas Hotbar Loaded (slow, visible green ripple)!", "color:#0f0");

})();
