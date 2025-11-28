(() => {
    console.log("%cLoading Canvas Hotbar...", "color:#0ff");

    const HOTBAR_ID = "canvasHotbar";
    const STORAGE_KEY = "CanvasHotbarBindings";
    const LOCK_KEY = "CanvasHotbarLocked";
    const POS_KEY = "CanvasHotbarPosition";

    // Load saved bindings
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    let locked = localStorage.getItem(LOCK_KEY) === "true";

    // Cooldowns per key
    const COOLDOWN_TIME = 6000;
    const cooldowns = {};

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
    // CREATE SLOT
    // ===========================
    function createSlot(initialKey) {
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

                // Avoid duplicates
                for (const k in saved)
                    if (saved[k] === saved[keyLabel.innerText])
                        delete saved[k];

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

        // COOLDOWN CANVAS
        const cdCanvas = document.createElement("canvas");
        cdCanvas.width = 42;
        cdCanvas.height = 42;
        cdCanvas.style.position = "absolute";
        cdCanvas.style.left = "0";
        cdCanvas.style.top = "0";
        cdCanvas.style.pointerEvents = "none";
        cdCanvas.style.zIndex = "2";
        div.appendChild(cdCanvas);

        return div;
    }

    // Create slots dynamically from saved bindings OR default 3 empty slots
    const defaultKeys = Object.keys(saved).length ? Object.keys(saved) : ["C", "V", "B"];
    defaultKeys.forEach(k => bar.appendChild(createSlot(k)));

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
    // ASSIGN INVENTORY ITEM
    // ===========================
    let awaitingAssignmentFor = null;

    bar.querySelectorAll(".slot").forEach(slot => {
        slot.addEventListener("click", () => {
            if (locked) return;

            const key = slot.querySelector(".hotkeyLabel").innerText;
            awaitingAssignmentFor = key;

            slot.style.outline = "2px solid gold";
            setTimeout(() => slot.style.outline = "", 600);
        });
    });

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
        if (index === undefined) return;

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
    // ICON CLONING + COOLDOWN DRAWING
    // ===========================
    setInterval(() => {
        const slots = document.querySelectorAll(`#${HOTBAR_ID} .slot`);
        const canvases = document.querySelectorAll("#winInventory canvas");

        const now = Date.now();

        slots.forEach(slot => {
            const key = slot.querySelector(".hotkeyLabel").innerText;
            const index = saved[key];
            if (index === undefined) return;

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
            } catch (err) {}

            // Cooldown overlay
            const cdCanvas = slot.querySelector("canvas");
            const ctx = cdCanvas.getContext("2d");
            ctx.clearRect(0, 0, cdCanvas.width, cdCanvas.height);

            const cdEnd = cooldowns[key] || 0;
            if (cdEnd > now) {
                const ratio = (cdEnd - now) / COOLDOWN_TIME;

                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.beginPath();
                ctx.moveTo(21, 21);

                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + ratio * 2 * Math.PI;

                ctx.arc(21, 21, 21, startAngle, endAngle, false);
                ctx.lineTo(21, 21);
                ctx.fill();

                ctx.strokeStyle = "rgba(0,255,0,0.7)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(21, 21, 20, 0, 2 * Math.PI);
                ctx.stroke();
            }
        });
    }, 50);

    console.log("%cCanvas Hotbar Loaded with Fully Custom Keybind Settings!", "color:#0f0");
})();
