(function setupMergedShopUI() {
  const originalGUI = window.GUI;

  window.GUI = function(win, action) {
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
        setTimeout(() => {
          syncSelects();
        }, 50);
      }
    }
  };

  function showMergedShopUI() {
    const existing = document.querySelector('#winShopMerged');
    if (existing) {
      existing.style.display = 'flex';
      makeOriginalsInvisibleButVisible();
      syncSelects(); // update clones immediately on show
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
      createButton("Buy", () => window.GUI('winShop', 'Trade')),
      createButton("Repair", () => window.GUI('winShop', 'Repair'))
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
      createButton("Sell", () => window.GUI('winRecycle', 'Recycle'))
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

    // Start syncing selects every 500ms as backup
    setInterval(syncSelects, 500);
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

  function syncSelects() {
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
