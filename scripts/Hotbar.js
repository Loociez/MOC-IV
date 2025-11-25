(() => {
    console.log("%cLoading Canvas Hotbar...", "color:#0ff");

    const HOTBAR_ID = "canvasHotbar";
    const STORAGE_KEY = "CanvasHotbarBindings";
    const LOCK_KEY = "CanvasHotbarLocked";
    const POS_KEY = "CanvasHotbarPosition";
    const KEYS = ["C", "V", "B"];
    const COOLDOWN_TIME = 6000; // 6 seconds in ms

    // Prevent duplicates
    if (document.getElementById(HOTBAR_ID)) {
        console.log("Hotbar already exists.");
        return;
    }

    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    let locked = localStorage.getItem(LOCK_KEY) === "true";
    let awaitingAssignmentFor = null;

    // To track cooldown timestamps by key
    const cooldowns = {}; // { key: cooldownEndTimestamp }

    // ===========================
    // CREATE HOTBAR ELEMENT
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

    // Restore position if saved
    const savedPos = JSON.parse(localStorage.getItem(POS_KEY) || null);
    if (savedPos) {
        bar.style.left = savedPos.left + "px";
        bar.style.top = savedPos.top + "px";
        bar.style.bottom = "auto";
        bar.style.transform = "none";
    }

    // Draggable when unlocked
    let dragging = false, offX = 0, offY = 0;

    bar.addEventListener("mousedown", (e) => {
        if (locked) return;
        if (e.target.classList.contains("slot")) return;
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
            // Save position
            localStorage.setItem(POS_KEY, JSON.stringify({ left: bar.offsetLeft, top: bar.offsetTop }));
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
    // SLOT CREATION
    // ===========================
    function createSlot(key) {
        const div = document.createElement("div");
        div.classList.add("slot");
        div.style.position = "relative";
        div.style.width = "42px";
        div.style.height = "42px";
        div.style.border = "1px solid rgba(255,255,255,0.25)";
        div.style.borderRadius = "6px";
        div.style.background = "rgba(255,255,255,0.08)";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.color = "white";
        div.style.fontSize = "14px";
        div.style.cursor = locked ? "default" : "pointer";
        div.style.overflow = "hidden";

        // Green key label bottom-right
        const keyLabel = document.createElement("div");
        keyLabel.innerText = key;
        keyLabel.style.position = "absolute";
        keyLabel.style.bottom = "2px";
        keyLabel.style.right = "4px";
        keyLabel.style.color = "#0f0"; // bright green
        keyLabel.style.fontWeight = "bold";
        keyLabel.style.fontSize = "12px";
        keyLabel.style.textShadow = "0 0 3px black";
        keyLabel.style.pointerEvents = "none"; // don't block clicks
        div.appendChild(keyLabel);

        // Cooldown overlay canvas
        const cdCanvas = document.createElement("canvas");
        cdCanvas.width = 42;
        cdCanvas.height = 42;
        cdCanvas.style.position = "absolute";
        cdCanvas.style.left = "0";
        cdCanvas.style.top = "0";
        cdCanvas.style.pointerEvents = "none";
        cdCanvas.style.zIndex = "2";
        div.appendChild(cdCanvas);

        if (saved[key] !== undefined) {
            div.style.background = "rgba(0,255,140,0.25)";
        }

        // Left-click: assign
        div.addEventListener("click", () => {
            if (locked) return;
            awaitingAssignmentFor = key;
            div.style.outline = "2px solid gold";
            setTimeout(() => (div.style.outline = ""), 600);
            console.log(`Click an inventory item to assign to hotkey ${key}...`);
        });

        // Right-click: clear assignment
        div.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (locked) return;
            if (saved[key] !== undefined) {
                delete saved[key];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
                div.style.background = "rgba(255,255,255,0.08)";
                console.log(`Cleared assignment for hotkey ${key}`);
            }
        });

        return div;
    }

    KEYS.forEach(k => bar.appendChild(createSlot(k)));

    // ===========================
    // LOCK BUTTON
    // ===========================
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
    // ASSIGN INVENTORY ITEM BY CLICK
    // ===========================
    document.addEventListener("mousedown", (e) => {
        if (awaitingAssignmentFor === null) return;

        const canvases = [...document.querySelectorAll("#winInventory canvas")];
        const index = canvases.indexOf(e.target);

        if (index !== -1) {
            saved[awaitingAssignmentFor] = index;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

            // Update visual
            const slot = [...document.querySelectorAll(`#${HOTBAR_ID} .slot`)]
                .find(s => s.querySelector("div")?.innerText === awaitingAssignmentFor);

            if (slot) {
                slot.style.background = "rgba(0,255,140,0.25)";
            }

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

    // ===========================
    // UTILITY: Check element visibility
    // ===========================
    function isElementVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
    }

    // ===========================
    // HOTKEY LISTENER with chat & bank focus check + cooldown start
    // ===========================
    document.addEventListener("keydown", (e) => {
        const active = document.activeElement;

        const chatbox = document.getElementById("winGameChatbox");
        const messageField = document.getElementById("winGameMessage");
        const bank = document.getElementById("winBank");

        // Block hotkeys if typing in chat inputs or bank is open
        if (
            (active && (
                active === chatbox || chatbox?.contains(active) ||
                active === messageField || messageField?.contains(active)
            )) ||
            isElementVisible(bank)
        ) {
            return;
        }

        const key = e.key.toUpperCase();
        if (!KEYS.includes(key)) return;

        const index = saved[key];
        if (index === undefined) return;

        // If on cooldown, ignore input
        const now = Date.now();
        if (cooldowns[key] && cooldowns[key] > now) return;

        const canvases = document.querySelectorAll("#winInventory canvas");
        const canvas = canvases[index];
        if (canvas) {
            simulateDoubleClick(canvas);
            cooldowns[key] = now + COOLDOWN_TIME;
        }
    });

    // ===========================
    // ICON + STACK CLONE SYSTEM + cooldown drawing
    // ===========================
    setInterval(() => {
        const slots = document.querySelectorAll(`#${HOTBAR_ID} .slot`);
        const canvases = document.querySelectorAll("#winInventory canvas");

        const now = Date.now();

        slots.forEach(slot => {
            // Find the key from the green label inside slot
            const keyLabel = slot.querySelector("div");
            if (!keyLabel) return;
            const key = keyLabel.innerText.trim();
            const index = saved[key];

            if (index === undefined) return;

            const srcCanvas = canvases[index];
            if (!srcCanvas) return;

            // Create img inside slot if missing
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
                // Make sure img is below the key label and cooldown canvas
                img.style.zIndex = "0";
                keyLabel.style.zIndex = "3";
            }

            try {
                img.src = srcCanvas.toDataURL("image/png");
            } catch (err) {
                // fails if canvas is tainted, but Mirage canvases aren't
            }

            // Draw cooldown overlay
            const cdCanvas = slot.querySelector("canvas");
            if (!cdCanvas) return;
            const ctx = cdCanvas.getContext("2d");
            ctx.clearRect(0, 0, cdCanvas.width, cdCanvas.height);

            const cdEnd = cooldowns[key] || 0;
            if (cdEnd > now) {
                const elapsed = COOLDOWN_TIME - (cdEnd - now);
                const ratio = (cdEnd - now) / COOLDOWN_TIME; // 1 → 0

                // Draw translucent black overlay
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.beginPath();
                ctx.moveTo(cdCanvas.width/2, cdCanvas.height/2);

                // Draw radial "pie" from top center clockwise
                const startAngle = -Math.PI/2;
                const endAngle = startAngle + ratio * 2 * Math.PI;
                ctx.arc(cdCanvas.width/2, cdCanvas.height/2, cdCanvas.width/2, startAngle, endAngle, false);
                ctx.lineTo(cdCanvas.width/2, cdCanvas.height/2);
                ctx.fill();

                // Optional: draw a border circle for cooldown area
                ctx.strokeStyle = "rgba(0,255,0,0.7)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(cdCanvas.width/2, cdCanvas.height/2, cdCanvas.width/2 - 1, 0, 2 * Math.PI);
                ctx.stroke();
            }
        });
    }, 50); // 20 fps for smooth cooldown animation

    console.log("%cCanvas Hotbar Loaded with Icon Support, Keybind Labels, Right-Click Clear & Cooldown Overlay!", "color:#0f0");
})();
