(() => {
    if (window.__MOC_LOOKUP_MAIN__) return;
    window.__MOC_LOOKUP_MAIN__ = true;

    console.log("%c[MOC Lookup] Loaded", "color:#0f0");

    // Utility: find all canvas and possible game containers
    const findGameNodes = () => {
        const canvases = [...document.querySelectorAll("canvas")];
        const gameRoot = document.querySelector("#game") ||
                         document.querySelector("#root") ||
                         document.body;
        return { canvases, gameRoot };
    };

    // Create floating 📘 button
    const openBtn = document.createElement("button");
    openBtn.textContent = "📘";
    Object.assign(openBtn.style, {
        position: "fixed", top: "10px", left: "10px",
        width: "40px", height: "40px",
        background: "rgba(0,0,0,0.7)", border: "2px solid #0f0",
        borderRadius: "8px", color: "#0f0",
        fontSize: "22px", cursor: "pointer",
        zIndex: "99999999999"
    });
    document.body.appendChild(openBtn);

    // Create modal
    const modal = document.createElement("div");
    Object.assign(modal.style, {
        position: "fixed",
        top: "10%", left: "10%",
        width: "80%", height: "80%",
        background: "#111",
        border: "2px solid #0f0",
        borderRadius: "10px",
        boxShadow: "0 0 30px #0f0",
        display: "none",
        flexDirection: "column",
        zIndex: "999999999999"
    });

    // Close button
    const closeBtn = document.createElement("div");
    closeBtn.textContent = "✖";
    Object.assign(closeBtn.style, {
        fontSize: "20px",
        padding: "6px 12px",
        background: "#000",
        color: "#0f0",
        cursor: "pointer",
        userSelect: "none",
        borderRadius: "8px 8px 0 0"
    });
    modal.appendChild(closeBtn);

    // Iframe
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
        width: "100%", height: "100%",
        border: "none",
        flex: "1",
        pointerEvents: "auto"
    });
    modal.appendChild(iframe);

    document.body.appendChild(modal);

    // URL selector popup (same as your iframe version topBar)
    const dropdown = document.createElement("div");
    Object.assign(dropdown.style, {
        position: "fixed",
        top: "60px", left: "10px",
        background: "#111",
        border: "2px solid #0f0",
        padding: "10px",
        borderRadius: "8px",
        display: "none",
        zIndex: "99999999999"
    });
    dropdown.innerHTML = `
        <button data-url="https://loociez.github.io/MOC-IV/itemslast.html">📦 Items</button><br><br>
        <button data-url="https://loociez.github.io/MOC-IV/npclast.html">👾 NPCs</button><br><br>
        <button data-url="https://moc.wiki.gg">⭐ Wiki</button><br><br>
        <button data-url="https://loociez.github.io/MOC-IV/Best.html">⚔ Builds</button>
    `;
    [...dropdown.querySelectorAll("button")].forEach(btn => {
        Object.assign(btn.style, {
            background: "#000", color: "#0f0",
            border: "1px solid #0f0",
            borderRadius: "6px",
            padding: "6px 12px",
            cursor: "pointer",
            width: "160px",
            marginBottom: "6px"
        });
    });
    document.body.appendChild(dropdown);

    openBtn.addEventListener("click", () => {
        dropdown.style.display =
            dropdown.style.display === "none" ? "block" : "none";
    });

    // Hide ALL game content while modal open
    let hiddenNodes = [];

    function hideGame() {
        const { canvases } = findGameNodes();
        hiddenNodes = [];

        canvases.forEach(c => {
            hiddenNodes.push({ el: c, prev: c.style.display });
            c.style.display = "none";
        });

        // Also hide any parent nodes that trap input
        const uiBlocks = [
            "#game", "#root", ".game-container",
            "#gameContainer", "#wrapper"
        ];

        uiBlocks.forEach(sel => {
            const n = document.querySelector(sel);
            if (n) {
                hiddenNodes.push({ el: n, prev: n.style.visibility });
                n.style.visibility = "hidden";
                hiddenNodes.push({ el: n, prev: n.style.pointerEvents });
                n.style.pointerEvents = "none";
            }
        });
    }

    function showGame() {
        hiddenNodes.forEach(obj => {
            obj.el.style.display = obj.prev ?? "";
            obj.el.style.visibility = obj.prev ?? "";
            obj.el.style.pointerEvents = obj.prev ?? "";
        });
        hiddenNodes = [];
    }

    // Open wiki page
    function openWiki(url) {
        dropdown.style.display = "none";
        iframe.src = url;

        hideGame();

        modal.style.display = "flex";

        // Give focus to iframe a bit later
        setTimeout(() => {
            try { iframe.contentWindow.focus(); } catch(e) {}
        }, 120);
    }

    dropdown.addEventListener("click", e => {
        const btn = e.target.closest("button");
        if (!btn) return;
        openWiki(btn.dataset.url);
    });

    // Close modal
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        iframe.src = "";
        showGame();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && modal.style.display === "flex") {
            modal.style.display = "none";
            iframe.src = "";
            showGame();
        }
    });

})();
