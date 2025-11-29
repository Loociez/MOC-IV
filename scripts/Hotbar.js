(() => {
    console.log("%cLoading Canvas Hotbar...", "color:#0ff");

    const HOTBAR_ID = "canvasHotbar";
    const STORAGE_KEY = "CanvasHotbarBindings";
    const LOCK_KEY = "CanvasHotbarLocked";
    const POS_KEY = "CanvasHotbarPosition";

    // Load saved bindings
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    let locked = localStorage.getItem(LOCK_KEY) === "true";

    // If hotbar exists, prevent duplicates
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

    // Restore position
    const savedPos = JSON.parse(localStorage.getItem(POS_KEY) || null);
    if (savedPos) {
        bar.style.left = savedPos.left + "px";
        bar.style.top = savedPos.top + "px";
        bar.style.bottom = "auto";
        bar.style.transform = "none";
    }

    // Draggable
    let dragging = false, offX = 0, offY = 0;

    bar.addEventListener("mousedown", (e) => {
        if (locked) return;
        if (e.target.classList.contains("slot") || e.target.classList.contains("hotkeyLabel") || e.target.innerText === "⚙️") return;
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
    // CREATE SLOT WITH ALL LISTENERS
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
        div.style.color = isPlus ? "#0f0" : "white";
        div.style.fontSize = isPlus ? "24px" : "14px";
        div.style.cursor = locked ? "default" : "pointer";
        div.style.overflow = "hidden";
        div.title = isPlus ? "Add new slot" : "";

        if (isPlus) {
            div.innerText = "+";
            div.style.fontWeight = "bold";
            div.style.userSelect = "none";

            // Plus slot click: add new slot
            div.addEventListener("click", () => {
                if (locked) return;

                // Find unused key for new slot (A-Z)
                const usedKeys = new Set(Object.keys(saved));
                let newKey = null;
                for (let i = 65; i <= 90; i++) { // A-Z
                    const char = String.fromCharCode(i);
                    if (!usedKeys.has(char)) {
                        newKey = char;
                        break;
                    }
                }
                if (!newKey) {
                    alert("No more keys available for new slots!");
                    return;
                }

                // Assign a default inventory index of -1 (empty)
                saved[newKey] = -1;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

                // Create and insert new slot before the "+" button
                const newSlot = createSlot(newKey);
                bar.insertBefore(newSlot, div);

                console.log(`Added new slot with key "${newKey}"`);
            });

            return div;
        }

        // GREEN KEY LABEL
        const keyLabel = document.createElement("div");
        keyLabel.innerText = initialKey;
        keyLabel.classList.add("hotkeyLabel");
        keyLabel.style.position = "absolute";
        keyLabel.style.bottom = "2px";
        keyLabel.style.right = "4px";
        keyLabel.style.color = "#0f0";
        keyLabel.style.fontWeight = "bold";
        keyLabel.style.fontSize = "12px";
        keyLabel.style.textShadow = "0 0 3px black";
        keyLabel.style.pointerEvents = "none";
        keyLabel.style.zIndex = "3";
        div.appendChild(keyLabel);

        // SETTINGS COG BUTTON
        const cog = document.createElement("div");
        cog.innerText = "⚙️";
        cog.style.position = "absolute";
        cog.style.top = "-6px";
        cog.style.right = "-2px";
        cog.style.fontSize = "14px";
        cog.style.cursor = "pointer";
        cog.style.zIndex = "5";
        cog.title = "Change keybind";
        div.appendChild(cog);

        // WAIT FOR KEY INPUT WHEN CLICKING COG
        cog.addEventListener("click", (e) => {
            e.stopPropagation();
            if (locked) return;

            div.style.outline = "2px solid yellow";
            console.log("Press any key to set a new hotkey...");

            const listener = (ev) => {
                const newKey = ev.key.toUpperCase();

                // Avoid duplicates: remove any old binding with newKey
                for (const k in saved)
                    if (k === newKey)
                        delete saved[k];

                // Assign new key, delete old
                saved[newKey] = saved[keyLabel.innerText];
                delete saved[keyLabel.innerText];

                localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

                keyLabel.innerText = newKey;
                div.style.outline = "";

                console.log("Assigned new hotkey:", newKey);
                document.removeEventListener("keydown", listener, true);
            };

            document.addEventListener("keydown", listener, true);
        });

        // Right click to remove slot if unlocked
        div.addEventListener("contextmenu", (e) => {
            if (locked) return;
            e.preventDefault();

            const key = keyLabel.innerText;

            // Remove binding and slot element
            if (saved[key] !== undefined) {
                delete saved[key];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                div.remove();
                console.log(`Removed slot bound to key "${key}"`);
            }
        });

        // CLICK to assign inventory slot
        div.addEventListener("click", () => {
            if (locked) return;

            const key = keyLabel.innerText;
            awaitingAssignmentFor = key;

            div.style.outline = "2px solid gold";
            setTimeout(() => div.style.outline = "", 600);
        });

        return div;
    }

    // Create slots dynamically from saved bindings OR default 3 empty slots
    const keys = Object.keys(saved).length ? Object.keys(saved) : ["C", "V", "B"];
    keys.forEach(k => bar.appendChild(createSlot(k)));

    // Add "+" slot to add new slots
    const addSlotBtn = createSlot("+", true);
    bar.appendChild(addSlotBtn);

    // LOCK BUTTON
    const lockBtn = document.createElement("div");
    lockBtn.innerText = locked ? "🔒" : "🔓";
    lockBtn.style.fontSize = "13px";
    lockBtn.style.marginLeft = "4px";
    lockBtn.style.cursor = "pointer";
    lockBtn.style.opacity = "0.9";

    lockBtn.onclick = () => {
        locked = !locked;
        localStorage.setItem(LOCK_KEY, locked);
        document.querySelectorAll(`#${HOTBAR_ID} .slot`).forEach(s => {
            s.style.cursor = locked ? "default" : "pointer";
        });
        bar.style.cursor = locked ? "default" : "grab";
        lockBtn.innerText = locked ? "🔒" : "🔓";
    };

    bar.appendChild(lockBtn);
    document.body.appendChild(bar);

    // ===========================
    // ASSIGN INVENTORY ITEM FROM CANVAS CLICK
    // ===========================
    let awaitingAssignmentFor = null;

    document.addEventListener("mousedown", (e) => {
        if (awaitingAssignmentFor === null) return;

        const canvases = [...document.querySelectorAll("#winInventory canvas")];
        const index = canvases.indexOf(e.target);

        if (index !== -1) {
            saved[awaitingAssignmentFor] = index;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

            console.log(`Assigned ${awaitingAssignmentFor} to inventory slot ${index}`);
            awaitingAssignmentFor = null;
        }
    });

    // ===========================
    // DOUBLE CLICK SIMULATION
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

    // Visibility check
    function isElementVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
    }

    // ===========================
    // HOTKEY LISTENER
    // ===========================
    document.addEventListener("keydown", (e) => {
        const active = document.activeElement;

        const chatbox = document.getElementById("winGameChatbox");
        const messageField = document.getElementById("winGameMessage");
        const bank = document.getElementById("winBank");

        if (
            (active && (
                active === chatbox || chatbox?.contains(active) ||
                active === messageField || messageField?.contains(active)
            )) ||
            isElementVisible(bank)
        ) return;

        const key = e.key.toUpperCase();
        const index = saved[key];
        if (index === undefined || index === -1) return;

        const canvases = document.querySelectorAll("#winInventory canvas");
        const canvas = canvases[index];

        if (canvas) {
            simulateDoubleClick(canvas);
        }
    });

    // ===========================
    // ICON CLONING (NO COOLDOWN)
    // ===========================
    setInterval(() => {
        const slots = document.querySelectorAll(`#${HOTBAR_ID} .slot`);
        const canvases = document.querySelectorAll("#winInventory canvas");

        slots.forEach(slot => {
            if (slot.innerText === "+") return; // skip plus slot

            const key = slot.querySelector(".hotkeyLabel").innerText;
            const index = saved[key];
            if (index === undefined || index === -1) return;

            const srcCanvas = canvases[index];
            if (!srcCanvas) return;

            // Create img if missing
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
                img.style.zIndex = "0";
                slot.appendChild(img);
            }

            try {
                img.src = srcCanvas.toDataURL("image/png");
            } catch (err) {
                // ignore toDataURL errors
            }
        });
    }, 100);

    // ===========================
    // YOUR ORIGINAL MINION AUTO DISMISS CODE (NO KEYBIND)
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
                const dismissBtn = Array.from(buttons).find(btn =>
                    btn.textContent.trim().toLowerCase().includes('dismiss')
                );
                if (dismissBtn) {
                    dismissBtn.click();
                    console.log('[autoDismissMinion] Dismiss button clicked.');
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        console.log('[autoDismissMinion] Watching for Minion popup...');
    })();

    console.log("%cCanvas Hotbar Loaded (minion auto-dismiss active)!", "color:#0f0");
})();
