// ==UserScript==
// @name         MOC Friend Tracker
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Track friends online/offline in Mirage Online Classic with titles/colors ignored, /who updates, Alt+Click, ✅/❌ emoji
// @match        https://play.consty.com/
// @match        https://play.mirageonlineclassic.com
// @match        https://play.freebrowsermmorpg.com/
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = "moc_friends";
    let friends = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    let onlineStatus = {}; // true = online, false = offline

    // ----------------------------
    // UI CREATION
    // ----------------------------
    const panel = document.createElement("div");
    panel.id = "mocFriendPanel";
    panel.style.position = "fixed";
    panel.style.top = "100px";
    panel.style.left = "100px";
    panel.style.width = "250px";
    panel.style.background = "#111";
    panel.style.color = "#fff";
    panel.style.border = "1px solid #555";
    panel.style.padding = "10px";
    panel.style.zIndex = 9999;
    panel.style.display = "none";
    panel.style.cursor = "default";
    panel.style.userSelect = "none";

    panel.innerHTML = `
        <div id="mocFriendHeader" style="font-weight:bold; margin-bottom:5px; cursor:pointer;">Friend Tracker</div>
        <input id="mocAddFriend" placeholder="Add username" style="width:100%; margin-bottom:5px;" />
        <button id="mocAddBtn" style="width:100%; margin-bottom:10px;">Add Friend</button>
        <div id="mocFriendList"></div>
        <div id="mocOnlineCount" style="margin-top:5px; font-size:12px;"></div>
    `;

    document.body.appendChild(panel);
    const listDiv = panel.querySelector("#mocFriendList");
    const onlineCountDiv = panel.querySelector("#mocOnlineCount");

    function saveFriends() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
    }

    function updateOnlineCount() {
        const count = Object.values(onlineStatus).filter(v => v).length;
        onlineCountDiv.innerText = `${count} online`;
    }

    function renderList() {
        listDiv.innerHTML = "";
        Object.keys(friends).forEach(name => {
            const div = document.createElement("div");
            const statusEmoji = onlineStatus[name] ? "✅" : "❌";

            div.innerHTML = `
                ${statusEmoji} ${name}
                <span style="float:right; cursor:pointer; color:red;" data-name="${name}">x</span>
            `;

            div.querySelector("span").onclick = () => {
                delete friends[name];
                delete onlineStatus[name];
                saveFriends();
                renderList();
                updateOnlineCount();
            };

            listDiv.appendChild(div);
        });
        updateOnlineCount();
    }

    // ----------------------------
    // PREVENT GAME FROM STEALING FOCUS
    // ----------------------------
    ['mousedown','mouseup','click','keydown','keypress','keyup'].forEach(ev => {
        panel.addEventListener(ev, e => {
            e.stopPropagation();
            e.preventDefault();
        });
    });

    panel.querySelector("#mocAddFriend").addEventListener("click", (e) => {
        e.stopPropagation();
        e.target.focus();
    });

    // ----------------------------
    // ADD FRIEND BUTTON
    // ----------------------------
    panel.querySelector("#mocAddBtn").onclick = () => {
        const input = panel.querySelector("#mocAddFriend");
        const name = input.value.trim();
        if (!name) return;

        friends[name] = true;
        if (onlineStatus[name] === undefined) onlineStatus[name] = false;
        saveFriends();
        renderList();
        input.value = "";
        input.focus();
    };

    // ----------------------------
    // DRAGGING (TOGGLE MODE)
    // ----------------------------
    const header = panel.querySelector("#mocFriendHeader");
    let isDragging = false, dragEnabled = false;
    let offsetX, offsetY;

    header.addEventListener("click", () => {
        dragEnabled = !dragEnabled;
        header.style.cursor = dragEnabled ? "grab" : "pointer";
    });

    header.addEventListener("mousedown", (e) => {
        if (!dragEnabled) return;
        isDragging = true;
        offsetX = e.clientX - panel.offsetLeft;
        offsetY = e.clientY - panel.offsetTop;
        e.stopPropagation();
    });

    document.addEventListener("mousemove", (e) => {
        if (isDragging && dragEnabled) {
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
        }
    });

    document.addEventListener("mouseup", () => isDragging = false);

    // ----------------------------
    // KEYBIND (P)
    // ----------------------------
    let panelOpen = false;
    document.addEventListener("keydown", (e) => {
        if (document.activeElement.tagName === "INPUT") return;
        if (e.key.toLowerCase() === "p") {
            panelOpen = !panelOpen;
            panel.style.display = panelOpen ? "block" : "none";
        }
    });

    // ----------------------------
    // CHAT HANDLING
    // ----------------------------
    function extractUsername(text) {
        // Remove timestamp
        text = text.replace(/^\(\d{1,2}:\d{2}\)\s*/, "");
        // Remove titles/descriptions
        const joinLeaveMatch = text.match(/^([^\.,]+)[, ]*(?:the .+?)?\s*(?:has joined!|has logged online!|has left!)$/i);
        if (joinLeaveMatch) return joinLeaveMatch[1].trim();
        return null;
    }

    function handleMessage(text) {
        const username = extractUsername(text);
        if (!username) {
            // check for /who list
            if (/Players Online/i.test(text)) {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = text; // parse inner HTML spans
                const namesText = tempDiv.innerText.replace(/Players Online.*:/i,"").split(",");
                namesText.forEach(n => {
                    const name = n.replace(/\(\d+\)/,"").trim();
                    if (friends[name]) onlineStatus[name] = true;
                });
                renderList();
            }
            return;
        }

        if (/has logged online!|has joined!/i.test(text)) {
            if (friends[username]) onlineStatus[username] = true;
        } else if (/has left!/i.test(text)) {
            if (friends[username]) onlineStatus[username] = false;
        }
        renderList();
    }

    function initObserver() {
        const chat = document.querySelector("#txtChatbox");
        if (!chat) {
            setTimeout(initObserver, 1000);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.innerText) handleMessage(node.innerText);
                });
            });
        });

        observer.observe(chat, { childList: true, subtree: true });

        // ----------------------------
        // ALT+CLICK TO FILL INPUT
        // ----------------------------
        chat.addEventListener("click", (e) => {
            if (!e.altKey) return;
            const username = extractUsername(e.target.innerText);
            if (!username) return;
            const input = panel.querySelector("#mocAddFriend");
            input.value = username;
            input.focus();
            e.stopPropagation();
            e.preventDefault();
        });

        console.log("MOC Friend Tracker Loaded");
    }

    // ----------------------------
    // INIT
    // ----------------------------
    renderList();
    initObserver();

})();