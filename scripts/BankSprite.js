viewBankAsGrid = false;
banoperationInProgress = false;

frmBank = document.getElementById('winBank');
buttons = frmBank.getElementsByTagName("button");
timers = [];

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

            const apply = (target, props) => {
                for (let prop in props) {
                    target[prop] = props[prop];
                }
                return target;
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

                        nameHTML = `<div class="sprite" style="background-image: ${backgroundImage}; background-position: -${x}px -${y}px; width: ${SPRITE_SIZE}px; height: ${SPRITE_SIZE}px;"></div>`;
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
                                            setTimeout(() => changeView(true, frm), 200);
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
		
		// --- Create polished bank slots bar ---
const slotInfo = document.getElementById("txtBankSlots")?.innerText;
let current = 0, max = 500;

if (slotInfo) {
    const match = slotInfo.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
        current = parseInt(match[1]);
        max = parseInt(match[2]);
    }
}

// Create or update the slot bar container
let slotBar = document.getElementById("bankSlotBar");
if (!slotBar) {
    slotBar = document.createElement("div");
    slotBar.id = "bankSlotBar";
    slotBar.style.margin = "6px";
    slotBar.style.padding = "4px";
    slotBar.style.border = "1px solid #555";
    slotBar.style.borderRadius = "6px";
    slotBar.style.backgroundColor = "#222";
    slotBar.style.fontSize = "12px";
    slotBar.style.fontWeight = "bold";

    // Progress bar itself
    let barFill = document.createElement("div");
    barFill.id = "bankSlotBarFill";
    barFill.style.height = "16px";
    barFill.style.marginTop = "4px";
    barFill.style.borderRadius = "4px";
    barFill.style.background = "linear-gradient(to right, #66ff66, #009900)";
    barFill.style.width = "0%";

    slotBar.appendChild(document.createTextNode(`Bank Inventory: ${current}/${max}`));
    slotBar.appendChild(barFill);
    div.appendChild(slotBar);
} else {
    // Update text and fill % on rerender
    slotBar.firstChild.nodeValue = `Bank Inventory: ${current}/${max}`;
    const barFill = document.getElementById("bankSlotBarFill");
    if (barFill) {
        const pct = Math.min((current / max) * 100, 100);
        barFill.style.width = `${pct}%`;
    }
}


        let selCurrentInv = (frm.querySelector("select[name='selCurrentInv']"));
        items = Array.from(selCurrentInv.querySelectorAll("option")).map(v => [v.value, v.innerText]);
        div = document.createElement("div");
        div.style.width = "45%";
        div.style.float = "right";
        div.style.height = "95%";
        div.style.margin = div.style.padding = "0";
        div.style.overflow = "auto";
        gridsContainer.appendChild(div);
		// --- Create polished bank slots bar on RIGHT side (inventory panel) ---
const slotInfo = document.getElementById("txtBankSlots")?.innerText;
let current = 0, max = 500;

if (slotInfo) {
    const match = slotInfo.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
        current = parseInt(match[1]);
        max = parseInt(match[2]);
    }
}

// Remove previous bar if it exists
const existing = div.querySelector("#bankSlotBar");
if (existing) existing.remove();

// Create new slot bar
const slotBar = document.createElement("div");
slotBar.id = "bankSlotBar";
slotBar.style.margin = "6px 6px 12px 6px";
slotBar.style.padding = "6px";
slotBar.style.border = "1px solid #555";
slotBar.style.borderRadius = "6px";
slotBar.style.backgroundColor = "#222";
slotBar.style.fontSize = "13px";
slotBar.style.fontWeight = "bold";
slotBar.style.color = "#fff";

// Label
const label = document.createElement("div");
label.innerText = `Bank Inventory: ${current}/${max}`;
slotBar.appendChild(label);

// Bar container
const barContainer = document.createElement("div");
barContainer.style.marginTop = "6px";
barContainer.style.width = "100%";
barContainer.style.height = "14px";
barContainer.style.backgroundColor = "#444";
barContainer.style.borderRadius = "4px";
barContainer.style.overflow = "hidden";

// Bar fill
const barFill = document.createElement("div");
const percent = Math.min((current / max) * 100, 100);
barFill.style.width = `${percent}%`;
barFill.style.height = "100%";
barFill.style.background = "linear-gradient(to right, #66ff66, #009900)";
barFill.style.transition = "width 0.3s ease";

barContainer.appendChild(barFill);
slotBar.appendChild(barContainer);
div.appendChild(slotBar);

        renderGridItems(items, div, 'Inventory', selCurrentInv);

    } else {
        for (let div of divs) div.style.display = "grid";
    }

    divs[0].style.display = "grid";
    divs[divs.length - 1].style.display = "grid";
};