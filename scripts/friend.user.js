// ==UserScript==
// @name         MOC Friend Tracker
// @namespace    http://tampermonkey.net/
// @version      2.6
// @description  Friend tracker with last seen, sorting, drag + scroll
// @match        https://play.consty.com/
// @match        https://play.mirageonlineclassic.com
// @match        https://play.freebrowsermmorpg.com/
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = "moc_friends";
    const LASTSEEN_KEY = "moc_lastseen";

    let friends = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    let onlineStatus = {};
    let lastSeen = JSON.parse(localStorage.getItem(LASTSEEN_KEY)) || {};

    let sortByLastSeen = false;

    // ----------------------------
    // UI CREATION
    // ----------------------------
    const panel = document.createElement("div");
    panel.id = "mocFriendPanel";
    Object.assign(panel.style, {
        position: "fixed",
        top: "100px",
        left: "100px",
        width: "260px",
        background: "#111",
        color: "#fff",
        border: "1px solid #555",
        padding: "10px",
        zIndex: 9999,
        display: "none"
    });

    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div id="mocFriendHeader" style="font-weight:bold; cursor:grab;">Friend Tracker</div>
            <div id="mocSortBtn" style="cursor:pointer;" title="Sort by last seen">🕒</div>
        </div>
        <input id="mocAddFriend" placeholder="Add username" style="width:100%; margin:5px 0;" />
        <button id="mocAddBtn" style="width:100%; margin-bottom:10px;">Add Friend</button>
        <div id="mocFriendList" style="max-height:200px; overflow-y:auto; border-top:1px solid #333; padding-top:5px;"></div>
        <div id="mocOnlineCount" style="margin-top:5px; font-size:12px;"></div>
    `;

    document.body.appendChild(panel);
    const listDiv = panel.querySelector("#mocFriendList");
    const onlineCountDiv = panel.querySelector("#mocOnlineCount");

    function saveAll() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
        localStorage.setItem(LASTSEEN_KEY, JSON.stringify(lastSeen));
    }

    function formatLastSeen(ts) {
        if (!ts) return "Never";
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        const days = Math.floor(hrs / 24);

        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        if (hrs < 24) return `${hrs}h ago`;
        return `${days}d ago`;
    }

    function updateOnlineCount() {
        const count = Object.values(onlineStatus).filter(v => v).length;
        onlineCountDiv.innerText = `${count} online`;
    }

    function renderList() {
        listDiv.innerHTML = "";

        let names = Object.keys(friends);
        if (sortByLastSeen) {
            names.sort((a, b) => (lastSeen[b] || 0) - (lastSeen[a] || 0));
        }

        names.forEach(name => {
            const div = document.createElement("div");
            const isOnline = onlineStatus[name];
            const statusEmoji = isOnline ? "✅" : "❌";
            const seen = isOnline ? "Online now" : `Last seen: ${formatLastSeen(lastSeen[name])}`;

            div.innerHTML = `
                ${statusEmoji} ${name}
                <div style="font-size:10px; color:#aaa;">${seen}</div>
                <span style="float:right; cursor:pointer; color:red;" data-name="${name}">x</span>
            `;

            div.querySelector("span").onclick = () => {
                delete friends[name];
                delete onlineStatus[name];
                delete lastSeen[name];
                saveAll();
                renderList();
            };

            div.oncontextmenu = (e) => {
                e.preventDefault();
                const chatInput = document.querySelector("#winGameMessage #txtChatMessage");
                if (chatInput) {
                    chatInput.value = `@${name} `;
                    chatInput.focus();
                }
            };

            listDiv.appendChild(div);
        });

        updateOnlineCount();
    }

    // ----------------------------
    // SORT BUTTON
    // ----------------------------
    panel.querySelector("#mocSortBtn").onclick = () => {
        sortByLastSeen = !sortByLastSeen;
        renderList();
    };

    // ----------------------------
    // DRAGGING (FIXED)
    // ----------------------------
    const header = panel.querySelector("#mocFriendHeader");
    let isDragging = false, offsetX, offsetY;

    header.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - panel.offsetLeft;
        offsetY = e.clientY - panel.offsetTop;
        header.style.cursor = "grabbing";
        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        panel.style.left = (e.clientX - offsetX) + "px";
        panel.style.top = (e.clientY - offsetY) + "px";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        header.style.cursor = "grab";
    });

    // ----------------------------
    // BLOCKED WINDOWS
    // ----------------------------
    const blockedWindows = [
        "winPopup","winTrade","winShopEditor","winGuildEditor",
        "winSettings","winLogin","winBank","winShop"
    ];

    function isBlockedWindowOpen() {
        return blockedWindows.some(id => {
            const el = document.getElementById(id);
            if (!el) return false;
            const style = window.getComputedStyle(el);
            return style.display !== "none" && style.visibility !== "hidden";
        });
    }

    function closeFriendWindowIfBlocked() {
        if (!isBlockedWindowOpen()) return;
        const win = document.getElementById("winFriends");
        if (win && window.getComputedStyle(win).display !== "none") {
            win.style.display = "none";
        }
    }

    new MutationObserver(closeFriendWindowIfBlocked)
        .observe(document.body, { childList: true, subtree: true });

    // ----------------------------
    // KEYBIND
    // ----------------------------
    let panelOpen = false;
    document.addEventListener("keydown", (e) => {
        if (document.activeElement.tagName === "INPUT") return;
        if (e.key.toLowerCase() !== "p") return;
        if (isBlockedWindowOpen()) return;

        panelOpen = !panelOpen;
        panel.style.display = panelOpen ? "block" : "none";
    });

    // ----------------------------
    // PANEL FOCUS PROTECTION
    // ----------------------------
    ['mousedown','click'].forEach(ev => {
        panel.addEventListener(ev, e => e.stopPropagation());
    });

    // ----------------------------
    // ADD FRIEND
    // ----------------------------
    panel.querySelector("#mocAddBtn").onclick = () => {
        const input = panel.querySelector("#mocAddFriend");
        const name = input.value.trim();
        if (!name) return;

        friends[name] = true;
        if (!(name in onlineStatus)) onlineStatus[name] = false;
        if (!(name in lastSeen)) lastSeen[name] = Date.now();

        saveAll();
        renderList();

        input.value = "";
        input.focus();
    };

    // ----------------------------
    // CHAT HANDLING
    // ----------------------------
    function extractUsername(text) {
        text = text.replace(/^\(\d{1,2}:\d{2}\)\s*/, "");
        const match = text.match(/^([^\.,]+)[, ]*(?:the .+?)?\s*(?:has joined!|has logged online!|has left!)$/i);
        return match ? match[1].trim() : null;
    }

    function handleMessage(text) {
        const username = extractUsername(text);

        if (!username) {
            if (/Players Online/i.test(text)) {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = text;
                const names = tempDiv.innerText.replace(/Players Online.*:/i,"").split(",");

                names.forEach(n => {
                    const name = n.replace(/\(\d+\)/,"").trim();
                    if (friends[name]) {
                        onlineStatus[name] = true;
                        lastSeen[name] = Date.now();
                    }
                });

                saveAll();
                renderList();
            }
            return;
        }

        if (/online|joined/i.test(text)) {
            if (friends[username]) {
                onlineStatus[username] = true;
                lastSeen[username] = Date.now();
            }
        } else if (/left/i.test(text)) {
            if (friends[username]) {
                onlineStatus[username] = false;
                lastSeen[username] = Date.now();
            }
        }

        saveAll();
        renderList();
    }

    function initObserver() {
        const chat = document.querySelector("#txtChatbox");
        if (!chat) return setTimeout(initObserver, 1000);

        new MutationObserver(muts => {
            muts.forEach(m => {
                m.addedNodes.forEach(n => {
                    if (n.innerText) handleMessage(n.innerText);
                });
            });
        }).observe(chat, { childList: true, subtree: true });

        chat.addEventListener("click", (e) => {
            if (!e.altKey) return;
            const username = extractUsername(e.target.innerText);
            if (!username) return;

            const input = panel.querySelector("#mocAddFriend");
            input.value = username;
            input.focus();

            e.preventDefault();
            e.stopPropagation();
        });

        console.log("MOC Friend Tracker Loaded");
    }

    // ----------------------------
    // INIT
    // ----------------------------
    renderList();
    initObserver();

})();