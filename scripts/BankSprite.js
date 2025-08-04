viewBankAsGrid = false;
banoperationInProgress = false;

frmBank = document.getElementById('winBank');
buttons = frmBank.getElementsByTagName("button");
timers = [];

/**
 * Monkey Patch utility function
 * Overrides a function on an object with a new function.
 *
 * @param {object} obj The object containing the function to override.
 * @param {string} functionName The name of the function to override.
 * @param {Function} newFunction The new function that will replace the original.
 * This new function will receive the original function as its first parameter,
 * followed by the original arguments.
 * @returns {Function} A function that can be called to restore the original function.
 */
function overrideFunction(obj, functionName, newFunction) {
    // 1. Store a reference to the original function.
    const originalFunction = obj[functionName];

    // 2. Ensure the property we're trying to override is actually a function.
    if (typeof originalFunction !== 'function') {
        throw new Error(`Error: Property "${functionName}" is not a function on the provided object.`);
    }

    // 3. Replace the function on the object with a new one.
    obj[functionName] = function (...args) {
        // 4. Call the user-provided `newFunction`. The key is to pass the original
        //    function as the first argument. We use `.bind(this)` to ensure the
        //    `this` context is correctly maintained if `originalFunction` is called.
        return newFunction.call(this, originalFunction.bind(this), ...args);
    };

    // 5. Return a "restore" function that puts the original function back.
    return function restore() {
        obj[functionName] = originalFunction;
    };
}

/*
OUTGOING
{
    "type": 117,
    "channel_id": 2,
    "text": "You tell Playername, 'msg me'",
    "color": "#00ff00",
    "temp": false,
    "author": "Playername"
}
*/

/*
{
    "type": 117,
    "channel_id": 2,
    "text": "X tells you, 'Hi'",
    "color": "#00ff00",
    "temp": false,
    "author": "Player"
}

*/

if (typeof (enhancerModuleVars) == 'undefined') {
    enhancerModuleVars = {
        hookedIntoReceive: false,
        receiveFnOriginal: false,
        receiveFnHooked: false,
        whisperHistory: {},
    };
}
(function injectActiveTabStyle() {
    const style = document.createElement('style');
    style.textContent = `
        #winWhispersTabs .caption.active-tab {
            background-color: #333;
            color: #fff;
            font-weight: bold;
            border: 1px solid gold;
            border-radius: 4px;
            padding: 2px 6px;
        }
    `;
    document.head.appendChild(style);
})();

apply = (target, props) => {
    for (let prop in props) {
        target[prop] = props[prop];
    }
    return target;
};

showWhispeHistory = (playerName) => {
    console.log(`history [${playerName}]`);
    if (typeof (enhancerModuleVars.whisperHistory) === 'undefined') {
        console.log('no history');
        return;
    }
    if (typeof (enhancerModuleVars.whisperHistory[playerName]) === 'undefined') {
        console.log('no history for player');
        return;
    }
    let history = enhancerModuleVars.whisperHistory[playerName];

    const elements = document.getElementById("txtChatbox");
    if (!elements) {
        console.log('no element');
        return;
    }
    elements.innerHTML = "";

    for (let i = 0; i < history.length; ++i) {
        let li = document.createElement("li");
        li.innerHTML = history[i].msg.text;
        elements.appendChild(li);
        if (history[i].msg.author != playerName) {
            li.style.color = "blue";
            li.innerHTML = li.innerHTML.replace(`You tell ${playerName},`, ">");
        } else {
            li.style.color = "gold";
            li.innerHTML = li.innerHTML.replace(`${playerName} tells you,`, "<");

        }
        li.innerHTML = "<span>" + (new Date(history[i].timestamp)).toLocaleString().split(" ")[1] + ":</span>" + li.innerHTML;
        li.innerHTML = li.innerHTML.replace(/['"]+/g, '');
        apply(li.querySelector("span").style, {
            fontSize: 'small',
            fontWeight: 'bold',
            color: 'white',
        });


    }
}

handleChatMessage = (message) => {
    console.log('handleChatMessage');
    //enhancerModuleVars.whisperTabsCreated = false;
    if (message.channel_id != 2) {
        //console.log('wrong channel');
        return;
    }
    let container = document.getElementById("winWhispersTabs");;
    const playerName = message.text.indexOf("You tell ") === 0 ? message.text.replace("You tell ", "").split(",")[0] : message.author;

    const buttonsContainer = document.getElementById('winPlayer');
    if ((!enhancerModuleVars.whisperTabsCreated) || container == null) {
        enhancerModuleVars.whisperTabsCreated = true;

        if (buttonsContainer) {
            container = document.createElement('div');
            buttonsContainer.appendChild(container);
            container.id = "winWhispersTabs";
        }
    }

    apply(container.style, {
        height: "20px",
        fontSize: "10px",
        overflow: "hidden",
        padding: "8px",
        border: "none",
    });

    if (typeof (enhancerModuleVars.whisperHistory) === 'undefined') {
        enhancerModuleVars.whisperHistory = {};
    }
    if (typeof (enhancerModuleVars.whisperHistory[playerName]) === 'undefined') {
        enhancerModuleVars.whisperHistory[playerName] = [];
    }
    enhancerModuleVars.whisperHistory[playerName].push({ msg: message, timestamp: Date.now() });

    if (buttonsContainer) {
        buttonsContainer.appendChild(container);
    }

    if (container) {
        let div = container.querySelector(`div[data-author="${playerName}"]`);
        let btn = document.createElement('div');
        btn.className = "caption";

        if (!div) {
            div = document.createElement('div');
            container.appendChild(div);
            div.dataset.author = playerName;
            div.appendChild(btn);
            let closeBtn = document.createElement('div');
            closeBtn.innerText = "X";
            apply(closeBtn.style, {
                display: "inline-block",
                marginLeft: "10px",
            })
            div.appendChild(closeBtn);
            closeBtn.addEventListener('click', (e) => {
                div.remove();
            });
            btn.addEventListener('click', (e) => {
    // Remove active class from all tabs
    let allTabs = document.querySelectorAll('#winWhispersTabs .caption');
    allTabs.forEach(tab => tab.classList.remove('active-tab'));

    // Add active class to the clicked one
    btn.classList.add('active-tab');

    showWhispeHistory(playerName);

    let el = document.getElementById('txtChatMessage');
    el.value = `@"${playerName}" `;
});

        } else {
            btn = div.querySelector("div.caption");
        }
        apply(btn.style, {
            display: "inline-block",
        });

        apply(div.style, {
            display: "inline-block",
            padding: "4px",
            margin: "4px",
            border: "1px solid green",
            cursor: "pointer",
        });

        btn.innerHTML = playerName;


        container.appendChild(div);
    }

    showWhispeHistory(playerName);

};

handleInventoryChange = (message) => {
    if (typeof (enhancerModuleVars.hookedIntoWINGUI) !== "undefined" || enhancerModuleVars.hookedIntoWINGUI === true) {
        enhancerModuleVars.syncSelects && enhancerModuleVars.syncSelects();
    }
}

fnReceiveHook = (v) => {
    switch (v.type) {
        case 115://inventory change
            handleInventoryChange(v);
            break;
        case 117://chat

            //
            //console.log(v);
            handleChatMessage(v);
            break;
    }
    //console.log(v);
}

if (enhancerModuleVars.hookedIntoReceive === false) {
    for (let s in window) {
        if (window.hasOwnProperty(s) && typeof (window[s]) == 'object') {
            let o = window[s];
            try {
                if (typeof (o.g) == 'object' && typeof (o.g.v) == 'function') {
                    enhancerModuleVars.hookedIntoReceive = true;
                    enhancerModuleVars.receiveFnOriginal = o.g.v.bind(o.g);
                    enhancerModuleVars.receiveFnHooked = (originalFn, v) => { originalFn(v); try { fnReceiveHook(v); } catch (e) { } };
                    overrideFunction(o.g, 'v', enhancerModuleVars.receiveFnHooked);
                }
            } catch (e) { }
        }
    }
}

/** BUY SELL DEPOSIT START */

/*

(async function setupMergedShopUI() {

    let isInSellProcess = false;

    if (typeof (enhancerModuleVars.hookedIntoWINGUI) !== "undefined" && enhancerModuleVars.hookedIntoWINGUI === true) {
        if (enhancerModuleVars.originalGUI) {
            window.GUI = enhancerModuleVars.originalGUI;
            enhancerModuleVars.originalGUI = null;
        }
        enhancerModuleVars.hookedIntoWINGUI = false;
    }


    if (typeof (enhancerModuleVars.hookedIntoWINGUI) === "undefined" || enhancerModuleVars.hookedIntoWINGUI === false) {
        enhancerModuleVars.hookedIntoWINGUI = true;
        const originalGUI = window.GUI;
        enhancerModuleVars.originalGUI = originalGUI;
        enhancerModuleVars.syncSelects = syncSelects;

        originalGUI('winGame', 'Shop');
        await (sleep(100));

        originalGUI('winShop', 'Back');

        await (sleep(100));
        originalGUI('winGame', 'Recycle');

        await (sleep(100));
        originalGUI('winRecycle', 'Back');
        await (sleep(100));
        originalGUI('winShop', 'Back');
        await (sleep(100));

        window.GUI = function (win, action) {
            // Call the original GUI handler first
            originalGUI(win, action);

            // If merged shop UI is opened, sync immediately
            if (win === 'winGame' && action === 'Shop') {
                showMergedShopUI();
                setTimeout(() => {
                    syncSelects();
                }, 50);
                return;
            }

            // For shop or recycle window actions that affect inventory lists, sync clones shortly after
            if (win === 'winShop' || win === 'winRecycle') {
                const actionsToSync = ['Trade', 'Recycle', 'Repair', 'Bank', 'Back', 'Shop'];
                if (actionsToSync.includes(action)) {
                    // setTimeout(() => {
                    //     syncSelects();
                    // }, 50);
                }
            }
        };
    }

    function showMergedShopUI() {
        const existing = document.querySelector('#winShopMerged');
        if (existing) {
            existing.style.display = 'grid';
            setTimeout(syncSelects, 100);
            return;
        }

        const shop = document.querySelector('#winShop');
        const recycle = document.querySelector('#winRecycle');
        if (!shop || !recycle) {
            console.warn('Missing original shop or recycle UI');
            return;
        }

        // Ensure originals are open and updating
        makeOriginalsInvisibleButVisible();

        // Original selects
        const selInventory = shop.querySelector('select[name="selInventory"]');
        const selRecycle = recycle.querySelector('select[name="selRecycle"]');

        // === Create cloned selects ===
        const cloneInventory = selInventory.cloneNode(true);
        cloneInventory.name = 'selInventoryClone';
        cloneInventory.onchange = () => selInventory.onchange();
        cloneInventory.ondblclick = () => selInventory.ondblclick();

        const cloneRecycle = selRecycle.cloneNode(true);
        cloneRecycle.name = 'selRecycleClone';
        cloneRecycle.onchange = () => selRecycle.onchange();
        cloneRecycle.ondblclick = () => selRecycle.ondblclick();

        styleSelect(cloneInventory);
        styleSelect(cloneRecycle);

        const container = document.createElement('form');
        container.id = 'winShopMerged';
        container.name = 'frmShopMerged';
        container.className = 'gameWindowEven fadeIn';
        container.style.position = 'absolute';
        container.style.left = '50%';
        container.style.top = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.background = '#111';
        container.style.padding = '12px';
        container.style.border = '2px solid #333';
        container.style.zIndex = '9999';
        container.style.color = '#fff';
        container.style.width = '1000px';
        container.style.height = '600px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';

        const contentRow = document.createElement('div');
        contentRow.style.flex = '1';
        contentRow.style.display = 'flex';
        contentRow.style.gap = '16px';
        contentRow.style.overflow = 'hidden';

        // BUY PANEL
        const buyPanel = document.createElement('div');
        buyPanel.style.flex = '1';
        buyPanel.style.display = 'flex';
        buyPanel.style.flexDirection = 'column';

        const buyTitle = document.createElement('h3');
        buyTitle.textContent = 'Shop - Buy';

        const buyCanvasTop = shop.querySelector('#cvsShopTake');
        const buyCanvasBottom = shop.querySelector('#cvsShopGive');
        const buyDesc = shop.querySelector('#txtShopDesc');

        buyPanel.append(
            buyTitle,
            buyCanvasTop,
            cloneInventory,
            buyCanvasBottom,
            buyDesc,
            createButton("Buy", async () => { selInventory.value = cloneInventory.value; await (sleep(50)); selInventory.dispatchEvent(new Event("change")); window.GUI('winShop', 'Trade') }),
            createButton("Repair", async () => window.GUI('winShop', 'Repair'))
        );

        // SELL PANEL
        const sellPanel = document.createElement('div');
        sellPanel.style.flex = '1';
        sellPanel.style.display = 'flex';
        sellPanel.style.flexDirection = 'column';

        const sellTitle = document.createElement('h3');
        sellTitle.textContent = 'Shop - Sell';

        const sellCanvasTop = recycle.querySelector('#cvsRecycleTake');
        const sellCanvasBottom = recycle.querySelector('#cvsRecycleGive');


        sellPanel.append(
            sellTitle,
            sellCanvasTop,
            cloneRecycle,
            sellCanvasBottom,
            createButton("Sell", async () => {
                if (isInSellProcess) {
                    return;
                }
                selRecycle.value = cloneRecycle.value;
                await (sleep(50));
                enhancerModuleVars.originalGUI('winGame', 'Shop');
                setTimeout(async () => {
                    enhancerModuleVars.originalGUI('winShop', 'Recycle');
                    await (sleep(50));
                    selInventory.dispatchEvent(new Event("change"));
                    enhancerModuleVars.originalGUI('winRecycle', 'Recycle');

                    if (cloneRecycle.innerHTML.indexOf('x') < 0) {
                        enhancerModuleVars.originalGUI('winShop', 'Back');
                        isInSellProcess = false;
                    } else {
                        isInSellProcess = true;
                        container.style.display = 'none';
                    }
                }, 100);
            }),
        );

        // FOOTER
        const footer = document.createElement('div');
        footer.style.display = 'flex';
        footer.style.justifyContent = 'space-between';
        footer.style.marginTop = '12px';
        footer.innerHTML = `
      <button type="button" onclick="window.GUI('winShop','Bank')">Bank</button>
      <button type="button" onclick="window.GUI('winShop','Back'); document.querySelector('#winShopMerged').style.display='none';">Back</button>
    `;

        contentRow.appendChild(buyPanel);
        contentRow.appendChild(sellPanel);
        container.appendChild(contentRow);
        container.appendChild(footer);

        document.body.appendChild(container);
        document.body.appendChild(document.querySelector("#winPopup"));

    }

    function createButton(label, onclick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.style.marginTop = '6px';
        btn.style.fontSize = '13px';
        btn.style.padding = '4px 10px';
        btn.onclick = onclick;
        return btn;
    }

    function styleSelect(select) {
        select.style.flex = '1';
        select.style.height = '100%';
        select.style.minHeight = '250px';
        select.style.fontSize = '13px';
        select.style.background = '#222';
        select.style.color = '#fff';
        select.style.border = '1px solid #666';
        select.size = 15;
    }

    async function syncSelects() {
        enhancerModuleVars.originalGUI('winGame', 'Shop');
        setTimeout(async () => {
            enhancerModuleVars.originalGUI('winShop', 'Recycle');
            await (sleep(100));

            const origShop = document.querySelector('#winShop select[name="selInventory"]');
            const cloneShop = document.querySelector('#winShopMerged select[name="selInventoryClone"]');
            if (origShop && cloneShop) {
                cloneOptions(cloneShop, origShop);
            }

            const origRec = document.querySelector('#winRecycle select[name="selRecycle"]');
            const cloneRec = document.querySelector('#winShopMerged select[name="selRecycleClone"]');
            if (origRec && cloneRec) {
                cloneOptions(cloneRec, origRec);
            }
            setTimeout(() => {
                if (isInSellProcess) {
                    isInSellProcess = false;
                    showMergedShopUI();
                }
            }, 200);
        }, 100);
    }

    function cloneOptions(cloneSelect, originalSelect) {
        cloneSelect.innerHTML = '';
        [...originalSelect.options].forEach(opt => {
            const clone = opt.cloneNode(true);
            cloneSelect.appendChild(clone);
        });
    }

    function makeOriginalsInvisibleButVisible() {
        const winShop = document.querySelector('#winShop');
        const winRecycle = document.querySelector('#winRecycle');
        [winShop, winRecycle].forEach(win => {
            if (win) {
                win.style.display = 'block';
                win.style.position = 'absolute';
                win.style.left = '-9999px';
                win.style.top = '-9999px';
                win.style.zIndex = '-1';
                win.style.opacity = '0';
                win.style.pointerEvents = 'none';
            }
        });
    }
})();

/** BUY SELL DEPOSIT END */




removeTimer = (th) => timers = timers.filter((v) => v != th);

killAllTimers = () => timers.forEach((th) => clearTimeout(th));

sleep = async (t) => new Promise((resolve, reject) => { let th = -1; timers.push(th = setTimeout(() => { removeTimer(th); resolve(); }, t)); });

if (buttons.length < 4) {
    btnToggleContainer = buttons[0].parentNode.parentNode.appendChild(document.createElement('li'));
    btnToggle = btnToggleContainer.appendChild(document.createElement('button'));
    clickHandler = (e) => { viewBankAsGrid = !viewBankAsGrid; changeView(viewBankAsGrid, frmBank); e.preventDefault(); };

    btnToggle.addEventListener('click', (e) => clickHandler(e));
    btnToggle.innerText = "Toggle view";
}

async function fetchItemData() {
    try {
        const response = await fetch('https://loociez.github.io/MOC-IV/last.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch item data:', error);
    }
}

changeView = async (gridView, frm) => {
    let divs = frm.getElementsByTagName("div");

    let gridsContainers = frm.querySelectorAll("div.grids-container");

    for (let gridsContainer of gridsContainers) {
        gridsContainer.remove();
    }
    if (gridView == true) {

        let itemData = await fetchItemData();
        if (!itemData) return;

        for (let div of divs) div.style.display = "none";
        let gridsContainer = document.createElement("div");
        gridsContainer.className = "grids-container";
        frm.insertBefore(gridsContainer, divs[1]);
        gridsContainer.innerText = "";
        gridsContainer.style.display = "block";

        const renderGridItems = (items, gridsContainer, headerContent, select) => {

            let header = gridsContainer.appendChild(document.createElement("h3"));
            header.innerHTML = headerContent;

            const colorHex2Rgb = (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : { r: 0, g: 0, b: 0 };
            };

            const colorHex2Rgba = (hex, alpha) => {
                const { r, g, b } = colorHex2Rgb(hex);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };




            const createBadge = (text, borderColor = 'blue', backgroundColor = '#ffffff', color = '#000000') => {
                let el = document.createElement('span');
                el.innerText = text;
                apply(el.style, {
                    position: 'absolute',
                    border: "2px solid " + borderColor,
                    backgroundColor: colorHex2Rgba(backgroundColor, 0.7),
                    padding: "2px",
                    borderRadius: "5px",
                    color: colorHex2Rgba(color, 0.9),
                    fontWeight: "bold",
                    fontSize: "11px",
                });
                return el;
            };

            const createBadgeStar = (text, outline = "gold") => {
                let el = createBadge(text, "#ffffff", outline, "#000000", "#ffffff");
                apply(el.style, {
                    color: "#FFFFFF",
                    background: "rgba(0,0,0,0)",
                    textShadow: "2px 2px 0 #4074b5, 2px -2px 0 #4074b5, -2px 2px 0 #4074b5, -2px -2px 0 #4074b5, 2px 0px 0 #4074b5, 0px 2px 0 #4074b5, -2px 0px 0 #4074b5, 0px -2px 0 #4074b5".replace(/#4074b5/g, outline),
                    borderColor: "rgba(0,0,0,0)",
                    fontSize: "14px",
                    fontWeight: "normal",
                });

                return el;
            }

            const buildTooltip = (itemName, itemObj) => {
                const lines = [itemName];
                if (itemObj.desc) {
                    lines.push(itemObj.desc);
                }

                if (itemObj.data) {
                    const statMap = {
                        max_hp: "Max HP",
                        max_mp: "Max MP",
                        max_sp: "Max SP",
                        max_atk: "Max ATK",
                        max_def: "Max DEF",
                        max_mat: "Max MAT",
                        max_mdf: "Max MDF",
                        max_rat: "Max RAT",
                        max_rdf: "Max RDF",
                        min_atk: "Min ATK",
                        min_def: "Min DEF",
                        min_mat: "Min MAT",
                        min_mdf: "Min MDF",
                        min_rat: "Min RAT",
                        min_rdf: "Min RDF"
                    };

                    for (let key in statMap) {
                        const val = itemObj.data[key];
                        if (val && key !== "damage_stat") {
                            lines.push(`${statMap[key]}: ${val}`);
                        }
                    }
                }

                return lines.join("\n");
            };


            const makeShortAmountText = (amount) => {
                const levels = [1000, 10000000, 1000000000, 1000000000000, 1000000000000000];
                const suffixes = ['k', 'm', 'b', 't', 'q'];
                for (let i = levels.length - 1; i >= 0; i--) {
                    if (amount >= levels[i]) {
                        return (amount / levels[i]).toFixed(2) + suffixes[i];
                    }
                }
                return amount;
            };

            let squeezedItems = {};

            for (let item of items) {
                const [slotid, srcName] = item;
                let name = srcName;
                let amount = 1;
                if (name.indexOf('(x') > 0) {
                    amount = Number.parseInt(name.split('(x')[1].replace(')', '').trim());
                    name = name.split('(x')[0].trim();
                }

                squeezedItems[name] = squeezedItems[name] || { slots: [], count: 0, name: name };
                squeezedItems[name].count += amount;
                squeezedItems[name].slots.push(slotid);
            }
            items = Object.values(squeezedItems);
            const makeStarsCount = (color) => {
                let starsCount = { "#cc6600": 1, "#bf80ff": 1, "#008b8b": 1, "#66ff66": 1 }[("" + color).toLowerCase()] || 0;
                return starsCount;
            }
            for (let item of items) {
                let currentItemData = itemData.filter((v) => v.name && v.name.length > 0 && item.name.indexOf(v.name) === 0);
                if (currentItemData && currentItemData.length === 1) {

                    currentItemData = currentItemData[0];

                    let div = document.createElement("div");

                    div.title = buildTooltip(item.name, currentItemData);

                    apply(div.style,
                        {
                            position: 'relative',
                            borderRadius: "5px",
                            border: "3px solid black",
                            height: "34px",
                            width: "34px",
                            margin: '6px',
                            display: 'inline-block',
                            padding: "6px",
                        });

                    gridsContainer.appendChild(div);

                    let amount = item.count;
                    if (amount > 1) {
                        let amountEl = createBadge(makeShortAmountText(amount));
                        amountEl.style.bottom = "-10px";
                        amountEl.style.left = "-10px";
                        div.appendChild(amountEl);
                    }

                    let starsCount = makeStarsCount(currentItemData.color);
                    if (starsCount) {
                        let starsEl = createBadgeStar("*", currentItemData.color, "#000000", "#ffffff");
                        starsEl.style.top = "-10px";
                        starsEl.style.left = "-10px";
                        div.appendChild(starsEl);
                    }

                    if (currentItemData.recycle_value > 0) {
                        let amountValue = currentItemData.recycle_value * amount;
                        if (amountValue != amount) {
                            let valueEl = createBadge(makeShortAmountText(amountValue), "gold", "#000000", "#ffffff");
                            valueEl.style.bottom = "-10px";
                            valueEl.style.right = "-10px";
                            div.appendChild(valueEl);
                        }
                    }

                    if (currentItemData.color) {
                        div.style.backgroundColor = colorHex2Rgba(currentItemData.color, 0.1);
                    }

                    if (typeof currentItemData.sprite === 'number') {
                        const SPRITE_SIZE = 32;
                        const SPRITES_PER_SHEET = 1024;
                        const spritesPerRow = 32;
                        const sheetIndex = Math.floor(currentItemData.sprite / SPRITES_PER_SHEET);
                        const spriteIndex = currentItemData.sprite % SPRITES_PER_SHEET;
                        const x = (spriteIndex % spritesPerRow) * SPRITE_SIZE;
                        const y = Math.floor(spriteIndex / spritesPerRow) * SPRITE_SIZE;
                        const backgroundImage = `url('https://loociez.github.io/MOC-IV/images/items${sheetIndex}.png')`;

                        nameHTML = `<div class= "sprite" style = "background-image: ${backgroundImage}; background-position: -${x}px -${y}px; width: ${SPRITE_SIZE}px; height: ${SPRITE_SIZE}px;" ></div > `;
                        div.innerHTML += nameHTML;

                        const selectItem = async (all = false) => {
                            if (banoperationInProgress) {
                                return;
                            }
                            banoperationInProgress = true;

                            select.value = item.slots[0];
                            select.dispatchEvent(new Event('change'));
                            await (sleep(50))
                            select.dispatchEvent(new Event('dblclick'));
                            await (sleep(50))
                            if (item.slots.length == 1 && amount > 1) {
                                setTimeout(async () => {
                                    let btnOk = document.getElementById('winPopup').getElementsByTagName('button')[0];
                                    let btnCancel = document.getElementById('winPopup').getElementsByTagName('button')[1];

                                    if (all === false) {
                                        const handler = (e) => {
                                            setTimeout(() => { changeView(true, frm); banoperationInProgress = false }, 200);
                                            btnOk.removeEventListener('click', handler);
                                        };
                                        btnCancel.addEventListener('click', e => banoperationInProgress = false);
                                        btnOk.addEventListener('click', handler);
                                    } else {
                                        btnOk.click();
                                        await (sleep(50))
                                        setTimeout(() => { banoperationInProgress = false; changeView(true, frm) }, 200);
                                    }
                                }, 200);
                            } else {
                                setTimeout(() => { banoperationInProgress = false; changeView(true, frm) }, 200);
                            }
                        };

                        div.addEventListener("click", (e) => {
                            e.preventDefault();
                            selectItem();
                        });

                        div.addEventListener("contextmenu", (e) => {
                            e.preventDefault();
                            selectItem(true);
                        });
                    }
                }
            }
        };

        let selectBankInv = (frm.querySelector("select[name='selBankInv']"));
        let items = Array.from(selectBankInv.querySelectorAll("option")).map(v => [v.value, v.innerText]);
        let div = document.createElement("div");
        div.style.width = "45%";
        div.style.float = "left";
        div.style.height = "95%";
        div.style.margin = div.style.padding = "0";
        div.style.overflow = "auto";
        gridsContainer.appendChild(div);
        renderGridItems(items, div, 'Bank', selectBankInv);

        let selCurrentInv = (frm.querySelector("select[name='selCurrentInv']"));
        items = Array.from(selCurrentInv.querySelectorAll("option")).map(v => [v.value, v.innerText]);
        div = document.createElement("div");
        div.style.width = "45%";
        div.style.float = "right";
        div.style.height = "95%";
        div.style.margin = div.style.padding = "0";
        div.style.overflow = "auto";
        gridsContainer.appendChild(div);
        renderGridItems(items, div, 'Inventory', selCurrentInv);

    } else {
        for (let div of divs) div.style.display = "grid";
    }

    divs[0].style.display = "grid";
    divs[divs.length - 1].style.display = "grid";
};