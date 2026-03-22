// ==UserScript==
// @name         MOC Friend Tracker
// @namespace    http://tampermonkey.net/
// @version      2.11
// @description  Friend tracker with last seen, sorting modes, /who alt-click + profiles + activity + resize (remove in profile)
// @match        https://play.consty.com/
// @match        https://play.mirageonlineclassic.com
// @match        https://play.freebrowsermmorpg.com/
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = "moc_friends";
    const LASTSEEN_KEY = "moc_lastseen";
    const ACTIVITY_KEY = "moc_activity";

    let friends = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    let onlineStatus = {};
    let lastSeen = JSON.parse(localStorage.getItem(LASTSEEN_KEY)) || {};
    let activity = JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || {};

    let sortMode = 0; // 0 = default, 1 = online, 2 = last seen

    // ----------------------------
    // UI
    // ----------------------------
    const panel = document.createElement("div");
    panel.id = "mocFriendPanel";
    Object.assign(panel.style, {
        position: "fixed",
        top: "100px",
        left: "100px",
        width: "260px",
        height: "300px",
        background: "#111",
        color: "#fff",
        border: "1px solid #555",
        padding: "10px",
        zIndex: 9999,
        display: "none",
        boxSizing: "border-box"
    });

    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div id="mocFriendHeader" style="font-weight:bold; cursor:grab;">Friend Tracker</div>
            <div id="mocSortBtn" style="cursor:pointer;" title="Sort: Default">🕒</div>
        </div>
        <div style="display:flex; gap:5px; margin:5px 0;">
            <input id="mocAddFriend" placeholder="Add username" style="flex:1;" />
            <button id="mocAddBtn" style="flex:none; padding:0 4px; height:12px; line-height:12px; font-size:8px; width:30px;">Add</button>
        </div>
        <div id="mocFriendList" style="height:200px; overflow-y:auto; border-top:1px solid #333; padding-top:5px;"></div>
        <div id="mocOnlineCount" style="margin-top:5px; font-size:12px;"></div>
        <div id="mocResizer" style="position:absolute; right:0; bottom:0; width:15px; height:15px; cursor:nwse-resize;"></div>
    `;

    document.body.appendChild(panel);

    const listDiv = panel.querySelector("#mocFriendList");
    const onlineCountDiv = panel.querySelector("#mocOnlineCount");
    const sortBtn = panel.querySelector("#mocSortBtn");

    function saveAll() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
        localStorage.setItem(LASTSEEN_KEY, JSON.stringify(lastSeen));
        localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
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

    // ----------------------------
    // PROFILE WINDOW
    // ----------------------------
    let profileWindow = null;

    function openProfile(name) {
        if (profileWindow) profileWindow.remove();

        profileWindow = document.createElement("div");
        Object.assign(profileWindow.style, {
            position: "fixed",
            top: "200px",
            left: "200px",
            background: "#222",
            color: "#fff",
            border: "1px solid #555",
            padding: "10px",
            zIndex: 10000,
            minWidth: "200px"
        });

        const act = activity[name];

        profileWindow.innerHTML = `
            <b>${name}</b><br>
            Status: ${onlineStatus[name] ? "Online" : "Offline"}<br>
            Last seen: ${formatLastSeen(lastSeen[name])}<br><br>
            <b>Last activity:</b><br>
            ${act ? act.text + " (" + formatLastSeen(act.time) + ")" : "None"}<br><br>
            <button id="removeFriendBtn" style="padding:2px 6px; font-size:10px;">Remove Friend</button>
        `;

        document.body.appendChild(profileWindow);

        profileWindow.querySelector("#removeFriendBtn").onclick = () => {
            delete friends[name];
            delete onlineStatus[name];
            delete lastSeen[name];
            delete activity[name];
            saveAll();
            renderList();
            closeProfile({ target: document.body });
        };

        setTimeout(() => {
            document.addEventListener("click", closeProfile);
        }, 10);
    }

    function closeProfile(e) {
        if (!profileWindow) return;
        if (!profileWindow.contains(e.target)) {
            profileWindow.remove();
            profileWindow = null;
            document.removeEventListener("click", closeProfile);
        }
    }

    // ----------------------------
    // RENDER
    // ----------------------------
    function renderList() {
        listDiv.innerHTML = "";

        let names = Object.keys(friends);

        if (sortMode === 1) {
            names.sort((a, b) => (onlineStatus[b] === true) - (onlineStatus[a] === true));
        } else if (sortMode === 2) {
            names.sort((a, b) => (lastSeen[b] || 0) - (lastSeen[a] || 0));
        }

        names.forEach(name => {
            const div = document.createElement("div");
            const isOnline = onlineStatus[name];
            const statusEmoji = isOnline ? "✅" : "❌";
            const seen = isOnline ? "Online now" : `Last seen: ${formatLastSeen(lastSeen[name])}`;

            div.innerHTML = `
                ${statusEmoji} <span class="mocName">${name}</span>
                <div style="font-size:10px; color:#aaa;">${seen}</div>
            `;

            div.oncontextmenu = (e) => {
                e.preventDefault();
                const chatInput = document.querySelector("#winGameMessage #txtChatMessage");
                if (chatInput) {
                    chatInput.value = `@${name} `;
                    chatInput.focus();
                }
            };

            div.querySelector(".mocName").onclick = (e) => {
                e.stopPropagation();
                openProfile(name);
            };

            listDiv.appendChild(div);
        });

        updateOnlineCount();
    }

    // ----------------------------
    // RESIZE
    // ----------------------------
    const resizer = panel.querySelector("#mocResizer");
    let resizing = false;

    resizer.addEventListener("mousedown", (e) => {
        resizing = true;
        e.stopPropagation();
    });

    document.addEventListener("mousemove", (e) => {
        if (!resizing) return;

        panel.style.width = (e.clientX - panel.offsetLeft) + "px";
        panel.style.height = (e.clientY - panel.offsetTop) + "px";

        const addRowHeight = panel.querySelector('input').offsetHeight + panel.querySelector('button').offsetHeight + 10;
        const headerHeight = 30;
        const listHeight = panel.offsetHeight - addRowHeight - headerHeight - 30;
        listDiv.style.height = listHeight + "px";
    });

    document.addEventListener("mouseup", () => resizing = false);

    // ----------------------------
    // SORT BUTTON (CYCLE)
    // ----------------------------
    sortBtn.onclick = () => {
        sortMode = (sortMode + 1) % 3;

        const titles = ["Sort: Default", "Sort: Online First", "Sort: Last Seen"];
        sortBtn.title = titles[sortMode];

        renderList();
    };

    // ----------------------------
    // DRAGGING
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
    // KEYBIND
    // ----------------------------
    let panelOpen = false;
    document.addEventListener("keydown", (e) => {
        if (document.activeElement.tagName === "INPUT") return;
        if (e.key.toLowerCase() !== "p") return;

        panelOpen = !panelOpen;
        panel.style.display = panelOpen ? "block" : "none";
    });

    // ----------------------------
    // PANEL FOCUS
    // ----------------------------
    ['mousedown','click'].forEach(ev => {
        panel.addEventListener(ev, e => e.stopPropagation());
    });

    // ----------------------------
    // ADD FRIEND BUTTON
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
    // CHAT PARSING
    // ----------------------------
    function extractUsername(text) {
        text = text.replace(/^\(\d{1,2}:\d{2}\)\s*/, "");
        const match = text.match(/^([^\.,]+)[, ]*(?:the .+?)?\s*(?:has joined!|has logged online!|has left!)$/i);
        return match ? match[1].trim() : null;
    }

    function handleMessage(text) {
        const username = extractUsername(text);

        let match;
        match = text.match(/^(.*?) has defeated (.*?)!/i);
        if (match) activity[match[1]] = { text: `Defeated ${match[2]}`, time: Date.now() };

        match = text.match(/^(.*?) has been killed by (.*?)\./i);
        if (match) activity[match[1]] = { text: `Killed by ${match[2]}`, time: Date.now() };

        if (/Players Online/i.test(text)) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = text;
            const raw = tempDiv.innerText.replace(/Players Online.*:/i,"");
            const names = raw.split(",");
            names.forEach(n => {
                const name = n.replace(/\(\d+\)/,"").trim();
                if (friends[name]) {
                    onlineStatus[name] = true;
                    lastSeen[name] = Date.now();
                }
            });
            saveAll();
            renderList();
            return;
        }

        if (!username) return;

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
            const match = e.target.innerText.match(/^([A-Za-z0-9_]+)(?:\s*\(\d+\))?/);
            if (!match) return;
            panel.querySelector("#mocAddFriend").value = match[1];
            panel.querySelector("#mocAddFriend").focus();
            e.preventDefault(); e.stopPropagation();
        });

        console.log("MOC Friend Tracker Loaded");
    }

    // ----------------------------
    // INIT
    // ----------------------------
    renderList();
    initObserver();

})();