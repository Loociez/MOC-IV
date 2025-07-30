viewBankAsGrid = false;

frmBank = document.getElementById('winBank');
buttons = frmBank.getElementsByTagName("button");

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
                el.style.position = 'absolute';
                el.innerText = text;
                el.style.border = "2px solid " + borderColor;
                el.style.backgroundColor = colorHex2Rgba(backgroundColor, 0.7);
                el.style.padding = "2px";
                el.style.borderRadius = "5px";
                el.style.color = colorHex2Rgba(color, 0.9);
                el.style.fontWeight = "bold";
                el.style.fontSize = "11px";
                return el;
            };

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
                let starsCount = { "#cc6600": 4, "#bf80ff": 3, "#008b8b": 2, "#66ff66": 1 }[("" + color).toLowerCase()] || 0;
                return ((new Array(starsCount)).fill('★').join(""));
            }
            for (let item of items) {
                let currentItemData = itemData.filter((v) => v.name && v.name.length > 0 && item.name.indexOf(v.name) === 0);
                if (currentItemData && currentItemData.length === 1) {

                    currentItemData = currentItemData[0];

                    let div = document.createElement("div");

                    div.title = buildTooltip(item.name, currentItemData);

                    div.style.position = 'relative';
                    div.style.borderRadius = "5px";
                    div.style.border = "3px solid black";
                    div.style.height = div.style.width = "34px";
                    div.style.margin = '6px';
                    div.style.display = 'inline-block';
                    div.style.padding = "6px";
                    gridsContainer.appendChild(div);

                    let amount = item.count;
                    if (amount > 1) {
                        let amountEl = createBadge(makeShortAmountText(amount));
                        amountEl.style.top = "-10px";
                        amountEl.style.right = "-10px";
                        div.appendChild(amountEl);
                    }

                    let starsCount = makeStarsCount(currentItemData.color);
                    if (starsCount.length > 0) {
                        let starsEl = createBadge(starsCount, "gold", "#000000", "#ffffff");
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

                        const selectItem = () => {
                            select.value = item.slots[0];
                            select.dispatchEvent(new Event('change'));
                            select.dispatchEvent(new Event('dblclick'));

                            if (item.slots.length == 1 && amount > 1) {
                                setTimeout(() => {
                                    document.getElementById('winPopup').getElementsByTagName('button')[0].addEventListener('click', (e) => {
                                        setTimeout(() => changeView(true, frm), 200);
                                    });
                                }, 200);
                            } else {
                                setTimeout(() => changeView(true, frm), 200);
                            }
                        };

                        div.querySelector('div').addEventListener("click", (e) => {
                            e.preventDefault();
                            selectItem();
                        });

                        div.querySelector('div').addEventListener("contextmenu", (e) => {
                            e.preventDefault();
                            selectItem();
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