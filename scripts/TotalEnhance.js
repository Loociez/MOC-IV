// Combined Enhancer Script

// Includes: Vitals, Skill Enhancer, Guild Enhancer, Bank Enhancer and QoL settings

(() => {
  let barsEnabled = false;
  let barsLocked = false;
  let barsContainer;
  let hpBar, spBar, mpBar, tpBar, xpBar;
  let hpTextSpan, spTextSpan, mpTextSpan, tpTextSpan, xpTextSpan;
  let intervalId;

  const oldVitals = document.getElementById("winVitals");

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "⎯";
  toggleBtn.title = "Toggle Optimized HP/SP/MP/TP Bars";
  Object.assign(toggleBtn.style, {
    position: "fixed",
    top: "4px",
    left: "4px",
    zIndex: 99999,
    fontSize: "10px",
    padding: "2px 4px",
    borderRadius: "4px",
    border: "1px solid #888",
    background: "#111",
    color: "deepskyblue",
    cursor: "pointer",
    lineHeight: "1",
    width: "auto",
    height: "auto",
    display: "inline-block",
    userSelect: "none",
  });
  toggleBtn.onclick = () => {
    barsEnabled = !barsEnabled;
    toggleBtn.style.opacity = barsEnabled ? "1" : "0.5";
    if (barsEnabled) {
      if (oldVitals) oldVitals.style.display = "none";
      initBars();
    } else {
      if (oldVitals) oldVitals.style.display = "";
      removeBars();
    }
  };
  toggleBtn.style.opacity = "0.5";
  document.body.appendChild(toggleBtn);

  const lockBtn = document.createElement("button");
  lockBtn.textContent = "🔓";
  lockBtn.title = "Lock/Unlock Bars Position";
  Object.assign(lockBtn.style, {
    position: "fixed",
    top: "4px",
    left: "36px",
    zIndex: 99999,
    fontSize: "10px",
    padding: "2px 4px",
    borderRadius: "4px",
    border: "1px solid #888",
    background: "#111",
    color: "lightgreen",
    cursor: "pointer",
    lineHeight: "1",
    width: "auto",
    height: "auto",
    display: "none",
    userSelect: "none",
  });
  lockBtn.onclick = () => {
    barsLocked = !barsLocked;
    updateLockState();
  };
  document.body.appendChild(lockBtn);

  function createBar(color, tooltipCallback) {
    const barBg = document.createElement("div");
    Object.assign(barBg.style, {
      width: "150px",
      height: "14px",
      backgroundColor: "#222",
      borderRadius: "7px",
      boxShadow: `0 0 8px ${color}`,
      marginBottom: "6px",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      alignItems: "center",
    });

    const barFill = document.createElement("div");
    Object.assign(barFill.style, {
      height: "100%",
      width: "0%",
      background: `linear-gradient(90deg, ${color} 0%, #000 70%)`,
      borderRadius: "7px",
      boxShadow: `0 0 10px ${color}`,
      transition: "width 0.2s ease-out",
      position: "absolute",
      top: "0",
      left: "0",
      filter: `drop-shadow(0 0 4px ${color})`,
      zIndex: 1,
    });

    const textSpan = document.createElement("span");
    Object.assign(textSpan.style, {
      position: "relative",
      zIndex: 2,
      pointerEvents: "none",
      userSelect: "none",
      width: "100%",
      textAlign: "center",
      color: "white",
      textShadow: "0 0 4px black",
      fontWeight: "bold",
      fontSize: "11px",
      fontFamily: "Arial, sans-serif",
    });

    if (tooltipCallback) {
      barBg.title = "";
      barBg.onmouseenter = () => {
        barBg.title = tooltipCallback();
      };
    }

    barBg.appendChild(barFill);
    barBg.appendChild(textSpan);
    return { barBg, barFill, textSpan };
  }

  function initBars() {
    if (barsContainer) return;

    barsContainer = document.createElement("div");
    Object.assign(barsContainer.style, {
      position: "fixed",
      top: "40px",
      left: "4px",
      zIndex: 99999,
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "white",
      userSelect: "none",
      width: "160px",
      background: "rgba(0,0,0,0.4)",
      padding: "8px",
      borderRadius: "8px",
      boxShadow: "0 0 10px rgba(0,0,0,0.7)",
      cursor: "move",
    });

    function addBar(label, color, assignVars, tooltipCb) {
      const labelEl = document.createElement("div");
      labelEl.textContent = label;
      labelEl.style.marginBottom = "3px";
      barsContainer.appendChild(labelEl);
      const { barBg, barFill, textSpan } = createBar(color, tooltipCb);
      assignVars.bar = barFill;
      assignVars.text = textSpan;
      barsContainer.appendChild(barBg);
    }

    const ref = {};

    addBar("HP ❤️", "red", ref);
    hpBar = ref.bar; hpTextSpan = ref.text;

    addBar("SP", "lime", ref);
    spBar = ref.bar; spTextSpan = ref.text;

    addBar("MP", "deepskyblue", ref);
    mpBar = ref.bar; mpTextSpan = ref.text;

    addBar("TP", "#a64ca6", ref);
    tpBar = ref.bar; tpTextSpan = ref.text;

    addBar("XP", "goldenrod", ref, () => {
      const txt = document.getElementById("txtXP")?.textContent;
      const match = txt?.match(/(\d+)\s*\/\s*(\d+)/);
      if (!match) return "";
      const [_, cur, max] = match;
      return `${(+max - +cur).toLocaleString()} XP to next level`;
    });
    xpBar = ref.bar; xpTextSpan = ref.text;

    document.body.appendChild(barsContainer);
    lockBtn.style.display = "inline-block";
    barsLocked = false;
    updateLockState();
    makeDraggable(barsContainer);

    startUpdating();
  }

  function removeBars() {
    if (!barsContainer) return;
    clearInterval(intervalId);
    barsContainer.remove();
    barsContainer = null;
    lockBtn.style.display = "none";
  }

  function parseValue(text) {
    if (!text) return [0, 100];
    const parts = text.split("/");
    if (parts.length !== 2) return [0, 100];
    return parts.map(s => parseInt(s.replace(/\D/g, ""), 10));
  }

  let pulse = 0;
  let lastVals = {};

  function updateBars() {
    if (!barsEnabled) return;

    // fresh lookups each tick so bars always see live data
    const txtHP = document.getElementById("txtHP");
    const txtSP = document.getElementById("txtSP");
    const txtMP = document.getElementById("txtMP");
    const txtTP = document.getElementById("txtTP");
    const txtXP = document.getElementById("txtXP");

    const updateStat = (txtNode, bar, span, color, offset, key) => {
      if (!txtNode || !bar) return;
      const raw = txtNode.textContent;
      if (!raw) return;
      if (lastVals[key] === raw) return; // skip unchanged
      lastVals[key] = raw;

      const [cur, max] = parseValue(raw);
      if (!max) return;
      const percent = Math.min(cur / max, 1);
      bar.style.width = `${percent * 100}%`;
      bar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + offset))}px ${color}`;
      span.textContent = `${cur.toLocaleString()} / ${max.toLocaleString()}`;
    };

    updateStat(txtHP, hpBar, hpTextSpan, "red", 0, "hp");
    updateStat(txtSP, spBar, spTextSpan, "lime", 1, "sp");
    updateStat(txtMP, mpBar, mpTextSpan, "deepskyblue", 2, "mp");
    updateStat(txtTP, tpBar, tpTextSpan, "#a64ca6", 3, "tp");

    if (txtXP && xpBar) {
      const match = txtXP.textContent.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        const cur = parseInt(match[1]), max = parseInt(match[2]);
        const raw = `${cur}/${max}`;
        if (lastVals["xp"] !== raw) {
          lastVals["xp"] = raw;
          const percent = Math.min(cur / max, 1);
          xpBar.style.width = `${percent * 100}%`;
          xpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 4))}px goldenrod`;
          xpTextSpan.textContent = `${cur.toLocaleString()} / ${max.toLocaleString()}`;
        }
      }
    }

    pulse += 0.2; // slower pulse
  }

  function startUpdating() {
    clearInterval(intervalId);
    intervalId = setInterval(updateBars, 100); // update every 100ms
  }

  function updateLockState() {
    if (!barsContainer) return;
    if (barsLocked) {
      lockBtn.textContent = "🔒";
      lockBtn.style.color = "red";
      barsContainer.style.cursor = "default";
      barsContainer.style.pointerEvents = "auto";
    } else {
      lockBtn.textContent = "🔓";
      lockBtn.style.color = "lightgreen";
      barsContainer.style.cursor = "move";
      barsContainer.style.pointerEvents = "auto";
    }
  }

  function makeDraggable(element) {
    let pos = { x: 0, y: 0, left: 0, top: 0 };
    function onMouseDown(e) {
      if (barsLocked) return;
      pos.x = e.clientX;
      pos.y = e.clientY;
      pos.left = parseInt(element.style.left) || 0;
      pos.top = parseInt(element.style.top) || 0;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      e.preventDefault();
    }
    function onMouseMove(e) {
      const dx = e.clientX - pos.x;
      const dy = e.clientY - pos.y;
      element.style.left = pos.left + dx + "px";
      element.style.top = pos.top + dy + "px";
    }
    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    element.addEventListener("mousedown", onMouseDown);
  }
})();



(function enhanceSkillsWindow() {
  const winSkills = document.querySelector('#winSkills');
  const content = document.querySelector('#winSkillsContent');
  if (!winSkills || !content) return;

  // === 1. Create dropdown next to "Player Skills" heading ===
  const headerDiv = winSkills.querySelector('div:first-child');
  if (!headerDiv.querySelector('#sortSkillsDropdown')) {
    const sortSelect = document.createElement('select');
    sortSelect.id = 'sortSkillsDropdown';
    sortSelect.style.marginLeft = '1rem';
    sortSelect.style.fontSize = '0.9rem';
    sortSelect.style.verticalAlign = 'middle';
    sortSelect.innerHTML = `
      <option value="">Sort skills...</option>
      <option value="level-desc">Highest Level</option>
      <option value="level-asc">Lowest Level</option>
    `;
    headerDiv.appendChild(sortSelect);

    // === 2. Helper to parse level from label like "Fishing (47):" ===
    function getLevel(labelDiv) {
      const match = labelDiv.textContent.match(/\((\d+)\)/);
      return match ? parseInt(match[1]) : 0;
    }

    // === 3. Extract all skill blocks from content area ===
    function getSkillsArray() {
      const kids = Array.from(content.children);
      const skills = [];
      for (let i = 0; i < kids.length; i += 2) {
        skills.push({
          labelDiv: kids[i],
          barDiv: kids[i + 1],
          level: getLevel(kids[i]),
        });
      }
      return skills;
    }

    // === 4. Add tooltip to .barValue with XP needed ===
    function updateTooltips() {
      const skills = getSkillsArray();
      skills.forEach(({ barDiv }) => {
        const barTextEl = barDiv.querySelector('.barText');
        const barValueEl = barDiv.querySelector('.barValue');

        if (!barTextEl || !barValueEl) return;

        const match = barTextEl.textContent.trim().match(/([\d,]+)\s*\/\s*([\d,]+)/);
        if (match) {
          const currentXP = parseInt(match[1].replace(/,/g, ''));
          const maxXP = parseInt(match[2].replace(/,/g, ''));
          const xpLeft = maxXP - currentXP;
          const tooltipText = `${xpLeft.toLocaleString()} XP to level up`;

          barValueEl.setAttribute('title', tooltipText);
          barValueEl.style.cursor = 'help'; // Optional for better UI
        }
      });
    }

    // === 5. Sort and rebuild skill display ===
    function rebuildContent(skills) {
      content.innerHTML = '';
      skills.forEach(({ labelDiv, barDiv }) => {
        content.appendChild(labelDiv);
        content.appendChild(barDiv);
      });
      updateTooltips();
    }

    // === 6. Handle dropdown sorting logic ===
    sortSelect.addEventListener('change', () => {
      const skills = getSkillsArray();
      if (sortSelect.value === 'level-desc') {
        skills.sort((a, b) => b.level - a.level);
      } else if (sortSelect.value === 'level-asc') {
        skills.sort((a, b) => a.level - b.level);
      }
      rebuildContent(skills);
    });

    // === 7. Initial tooltip setup ===
    updateTooltips();
  }
})();


(() => {
  const panelId = 'winGuildEditor';
  let intervalId = null;

  function updateGuildColors() {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    // Color declarations
    const selDeclarations = panel.querySelector('select[name="selDeclarations"]');
    if (selDeclarations) {
      Array.from(selDeclarations.options).forEach(option => {
        const text = option.text.toLowerCase();
        if (text.endsWith('(war)')) {
          option.style.color = 'red';
          option.title = 'This guild is at war with yours';
        } else if (text.endsWith('(alliance)')) {
          option.style.color = 'green';
          option.title = 'This guild is an ally';
        } else if (text.endsWith('(neutral)')) {
          option.style.color = 'gray';
          option.title = 'This guild is neutral';
        } else {
          option.style.color = '';
          option.title = '';
        }
      });
    }

    // Highlight balance due (instead of .guildFee)
    const balanceInput = panel.querySelector('input[name="numBalance"]');
    if (balanceInput && parseInt(balanceInput.value, 10) > 0) {
      balanceInput.style.color = 'orange';
      balanceInput.style.fontWeight = 'bold';
    } else if (balanceInput) {
      balanceInput.style.color = '';
      balanceInput.style.fontWeight = '';
    }

    // Highlight founder members
    const memberSelect = panel.querySelector('select[name="selMembers"]');
    if (memberSelect) {
      Array.from(memberSelect.options).forEach(opt => {
        const text = opt.text.toLowerCase();
        if (text.includes('(founder)')) {
          opt.style.color = 'gold';
          opt.style.fontWeight = 'bold';
        } else if (text.includes('(soldier)')) {
          opt.style.color = 'silver';
          opt.style.fontWeight = '';
        } else {
          opt.style.color = '';
          opt.style.fontWeight = '';
        }
      });
    }

    // Add balance due countdown tooltip
    const dueInput = panel.querySelector('input[name="txtBalanceDue"]');
    if (dueInput && dueInput.value) {
      const dueDate = new Date(dueInput.value);
      const now = new Date();
      const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      dueInput.title = `Balance due in ${diffDays} day(s)`;
    }

    // Add inline legend in title
    insertLegend();
  }

  function insertLegend() {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const header = panel.querySelector('h3');
    if (!header || header.querySelector('.legendInline')) return;

    const span = document.createElement('span');
    span.className = 'legendInline';
    span.style.fontSize = '0.7rem';
    span.style.marginLeft = '1rem';
    span.innerHTML = `
      <span style="color:red;">War</span> |
      <span style="color:green;">Alliance</span> |
      <span style="color:gray;">Neutral</span> |
      <span style="color:gold;">Founder</span> |
      <span style="color:orange;">Fee</span>
    `;

    header.appendChild(span);
  }

  function hookGuildSelection() {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const guildSelect = panel.querySelector('select[name="selGuild"]');
    if (!guildSelect) return;

    guildSelect.removeEventListener('change', onGuildChange);
    guildSelect.addEventListener('change', onGuildChange);
  }

  function onGuildChange() {
    setTimeout(updateGuildColors, 200);
  }

  function hookGuildsButton() {
    const guildsBtn = document.querySelector('button[title="Guilds"]');
    if (!guildsBtn) {
      console.warn('Guilds button not found');
      return;
    }

    guildsBtn.addEventListener('click', () => {
      setTimeout(() => {
        updateGuildColors();
        hookGuildSelection();

        if (intervalId) clearInterval(intervalId);

        intervalId = setInterval(() => {
          if (document.getElementById(panelId)) {
            updateGuildColors();
          } else {
            clearInterval(intervalId);
            intervalId = null;
          }
        }, 30000);
      }, 500);
    });
  }

  hookGuildsButton();

  if (document.getElementById(panelId)) {
    updateGuildColors();
    hookGuildSelection();

    if (!intervalId) {
      intervalId = setInterval(() => {
        if (document.getElementById(panelId)) {
          updateGuildColors();
        } else {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 30000);
    }
  }
})();


// enhancedBankUI.js
(function () {
  const config = {
    visibleItemCount: 20,
    minItemCount: 5,
    valueCache: {},
    colorCache: {},
    statsCache: {},
  };

  const persistentSettings = {
    currentInv: { filter: '', sort: 'name' },
    bankInv: { filter: '', sort: 'name' }
  };

  const SPELL_AMP_KEYS = {
    "!bard_buff_uptime": "Bard Buff Uptime",
    "!bard_buff_cost": "Bard Buff Cost",
    "!jester_confuse_cost": "Jester Confuse Cost",
    "!jester_playerconfuse_uptime": "Jester Player Uptime",
    "!jester_npcconfuse_uptime": "Jester NPC Uptime",
    "!cleric_petheal_amount": "Cleric Pet Heal",
    "!cleric_petheal_cost": "Cleric Pet Heal Cost",
    "!dragoon_npcaoe_damage": "Dragoon NPC AoE",
    "!dragoon_invisible_cost": "Dragoon Invis Cost",
    "!warlock_npcaoe_damage": "Warlock NPC AoE",
    "!warlock_npcaoe_highercost": "Warlock NPC AoE Cost",
    "!warlock_selfaoe_highercost": "Warlock Self AoE Cost",
    "!warlock_playeraoe_highercost": "Warlock Player AoE Cost",
    "!warlock_npcaoe_cooldown": "Warlock NPC Cooldown",
    "!warlock_playeraoe_cooldown": "Warlock Player Cooldown",
    "!cleric_playerheal_amount": "Cleric Player Heal",
    "!cleric_playerheal_cost": "Cleric Player Heal Cost",
    "!cleric_allheal_cooldown": "Cleric Cooldown",
    "!dragoon_playeraoe_damage": "Dragoon Player AoE",
    "!warlock_playeraoe_damage": "Warlock Player AoE",
    "!assassin_npcpoison_damage": "Assassin NPC Poison",
    "!assassin_cloak_cost": "Assassin Cloak Cost",
    "!assassins_npcpoison_ticks": "Assassin NPC Ticks",
    "!assassins_playerpoison_ticks": "Assassin Player Ticks",
    "!necromancer_minion_damage": "Necromancer Minion DMG",
    "!necromancer_minion_hp": "Necromancer Minion HP",
    "!necromancer_minion_cost": "Necromancer Minion Cost",
    "!necromancer_minion_cooldown": "Necromancer Minion Cooldown",
    "!samurai_npcriposte_damage": "Samurai NPC Riposte",
    "!samurai_riposte_cooldown": "Samurai Riposte Cooldown",
    "!samurai_riposte_cost": "Samurai Riposte Cost",
    "!barbarian_alldamage_amount": "Barbarian All Damage",
    "!marksman_npcshotgun_damage": "Marksman NPC Shotgun",
    "!marksman_shotgun_cooldown": "Marksman Shotgun Cooldown",
    "!assassin_playerpoison_damage": "Assassin Player Poison",
    "!assassin_cloak_cooldown": "Assassin Cloak Cooldown",
    "!samurai_playerriposte_damage": "Samurai Player Riposte",
    "!marksman_playershotgun_damage": "Marksman Player Shotgun",
    "!marksman_shotgun_cost": "Marksman Shotgun Cost",
    "!vampire_npclifesteal_amount": "Vampire NPC Lifesteal",
    "!vampire_playerlifesteal_amount": "Vampire Player Lifesteal"
  };

  // Load item data
  fetch("https://loociez.github.io/MOC-IV/last.json")
    .then(response => response.json())
    .then(data => {
      data.forEach(item => {
        if (item.name) {
          const name = item.name.trim();
          const lower = name.toLowerCase();
          if (typeof item.recycle_value === 'number') config.valueCache[lower] = item.recycle_value;
          if (item.color) config.colorCache[lower] = item.color;
          if (item.data) config.statsCache[lower] = item.data;
        }
      });
      enhanceBankWindow();
    })
    .catch(console.error);

  function expandBankView(compact = false) {
    const size = compact ? config.minItemCount : config.visibleItemCount;
    const currentInv = document.querySelector('select[name="selCurrentInv"]');
    const bankInv = document.querySelector('select[name="selBankInv"]');
    if (currentInv) currentInv.size = size;
    if (bankInv) bankInv.size = size;
  }

  function sortSelectOptions(selectEl, by = "name", descending = false) {
    const options = Array.from(selectEl.options);
    const goldOption = options.find(opt => opt.text.includes("Gold Coins"));
    const otherOptions = options.filter(opt => !opt.text.includes("Gold Coins"));

    otherOptions.sort((a, b) => {
      const nameA = a.text.replace(/\(x\d+\)/, '').trim().toLowerCase();
      const nameB = b.text.replace(/\(x\d+\)/, '').trim().toLowerCase();
      if (by === "quantity") {
        const qtyA = parseInt(a.text.match(/x(\d+)/)?.[1] || "0");
        const qtyB = parseInt(b.text.match(/x(\d+)/)?.[1] || "0");
        return descending ? qtyB - qtyA : qtyA - qtyB;
      } else if (by.startsWith("stat:")) {
        const stat = by.split(":")[1];
        const aStat = config.statsCache[nameA]?.[stat] || 0;
        const bStat = config.statsCache[nameB]?.[stat] || 0;
        return descending ? bStat - aStat : aStat - bStat;
      }
      return descending ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
    });

    selectEl.innerHTML = '';
    if (goldOption) selectEl.appendChild(goldOption);
    otherOptions.forEach(opt => selectEl.appendChild(opt));
  }

  function filterSelectOptions(selectEl, query) {
    const lowerQuery = query.toLowerCase();
    Array.from(selectEl.options).forEach(option => {
      option.hidden = !option.text.toLowerCase().includes(lowerQuery);
    });
  }

  function updateValueDisplay(selectEl, valueBox) {
    const selected = selectEl.options[selectEl.selectedIndex];
    if (!selected) return (valueBox.textContent = '');
    const itemName = selected.text.replace(/\(x\d+\)/, '').trim().toLowerCase();
    const quantity = parseInt(selected.text.match(/x(\d+)/)?.[1] || '1');
    const value = config.valueCache[itemName];
    if (value !== undefined) {
      const total = quantity * value;
      valueBox.textContent = `NPC sell approx: ~${total.toLocaleString()}g`;
    } else {
      valueBox.textContent = '';
    }
  }

 function calculateTotalValue(selectEl, totalBox) {
  let total = 0;
  Array.from(selectEl.options).forEach(option => {
    if (option.hidden) return;
    const itemName = option.text.replace(/\(x\d+\)/, '').trim().toLowerCase();
    const quantity = parseInt(option.text.match(/x(\d+)/)?.[1] || '1');

    if (itemName.includes('gold coin')) {
      total += quantity; // treat as gold itself
    } else {
      const value = config.valueCache[itemName];
      if (value !== undefined) {
        total += quantity * value;
      }
    }
  });
  totalBox.textContent = `Total Est. Value: ~${total.toLocaleString()}g`;
}


  function attachValueTracker(selectEl) {
    const box = document.createElement('div');
    box.style.color = 'gold';
    box.style.fontSize = '12px';
    box.style.textAlign = 'right';
    box.style.marginTop = '3px';
    selectEl.parentElement.appendChild(box);
    selectEl.addEventListener('change', () => updateValueDisplay(selectEl, box));
  }

  function addTooltips(selectEl) {
    Array.from(selectEl.options).forEach(option => {
      const name = option.text.replace(/\(x\d+\)/, '').trim().toLowerCase();
      const stats = config.statsCache[name];
      if (!stats) return;

      let lines = [];

      Object.keys(SPELL_AMP_KEYS).forEach(key => {
        if (stats[key]) {
          lines.push(`${SPELL_AMP_KEYS[key]}: ${stats[key]}`);
        }
      });

      if (stats.tile_range !== undefined) {
        lines.push(`Tile Range: ${stats.tile_range}`);
      }

      option.title = lines.join('\n');
    });
  }

  function injectControls(selectEl, labelText) {
    const id = selectEl.name === 'selCurrentInv' ? 'currentInv' : 'bankInv';
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '5px';
    wrapper.innerHTML = `
      <label style="color: white; font-size: 12px;">
        ${labelText} Filter:
        <input type="text" class="inv-filter" placeholder="Search..." style="margin-left: 5px;">
      </label>
      <label style="color: white; font-size: 12px; margin-left: 10px;">
        Sort:
        <select class="inv-sort">
          <option value="name">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="quantity-asc">Quantity (High → Low)</option>
          <option value="quantity">Quantity (Low → High)</option>
          <option value="stat:max_atk">Physical Attack</option>
          <option value="stat:max_mat">Magical Attack</option>
          <option value="stat:max_rat">Ranged Attack</option>
          <option value="stat:max_def">Physical Defence</option>
          <option value="stat:max_mdf">Magical Defence</option>
          <option value="stat:max_rdf">Ranged Defence</option>
          <option value="stat:max_hp">Health</option>
          <option value="stat:max_mp">Mana</option>
          <option value="stat:max_sp">Stamina</option>
        </select>
      </label>
    `;

    selectEl.parentElement.prepend(wrapper);

    const input = wrapper.querySelector('.inv-filter');
    const sortDropdown = wrapper.querySelector('.inv-sort');

    const totalBox = document.createElement('div');
    totalBox.style.color = 'gold';
    totalBox.style.fontSize = '12px';
    totalBox.style.textAlign = 'right';
    totalBox.style.marginTop = '2px';
    selectEl.parentElement.appendChild(totalBox);

    input.value = persistentSettings[id].filter;
    sortDropdown.value = persistentSettings[id].sort;

    function applySortAndFilter() {
      const sortValue = sortDropdown.value;
      persistentSettings[id].sort = sortValue;
      persistentSettings[id].filter = input.value;

      const sortMap = {
        "name": { by: "name", desc: false },
        "name-desc": { by: "name", desc: true },
        "quantity": { by: "quantity", desc: false },
        "quantity-asc": { by: "quantity", desc: true },
      };

      const isStat = sortValue.startsWith("stat:");
      const sortBy = isStat ? sortValue : (sortMap[sortValue]?.by || "name");
      const descending = isStat ? true : (sortMap[sortValue]?.desc ?? false);

      sortSelectOptions(selectEl, sortBy, descending);
      filterSelectOptions(selectEl, input.value);
      colorizeOptions(selectEl);
      calculateTotalValue(selectEl, totalBox);
      addTooltips(selectEl);
    }

    input.addEventListener('input', applySortAndFilter);
    sortDropdown.addEventListener('change', applySortAndFilter);
    expandBankView(true);
    applySortAndFilter();
    attachValueTracker(selectEl);
  }

  function colorizeOptions(selectEl) {
    Array.from(selectEl.options).forEach(option => {
      const name = option.text.replace(/\(x\d+\)/, '').trim().toLowerCase();
      const color = config.colorCache[name];
      if (color) option.style.color = color;
    });
  }
// --- keep bank colors on refresh (no observers) ---
let MOC_bankColorLoopId = null;
let MOC_bankLastSig = "";

function startBankRecolorLoop() {
  if (MOC_bankColorLoopId) return; // already running

  MOC_bankColorLoopId = setInterval(() => {
    const bankWindow = document.querySelector('#winBank');
    if (!bankWindow || bankWindow.style.display === 'none') return;

    const bankInv = document.querySelector('select[name="selBankInv"]');
    if (!bankInv) return;

    // lightweight change signature: length + first + last option text
    const len = bankInv.options.length;
    const first = len ? bankInv.options[0].text : "";
    const last  = len ? bankInv.options[len - 1].text : "";
    const sig = `${len}|${first}|${last}`;

    if (sig === MOC_bankLastSig) return; // nothing changed

    MOC_bankLastSig = sig;
    // re-apply colors and tooltips after any update
    colorizeOptions(bankInv);
    addTooltips(bankInv);
  }, 250); // gentle cadence; adjust if you like
}

  function enhanceBankWindow() {
    const bankWindow = document.querySelector('#winBank');
    if (!bankWindow || bankWindow.dataset.enhanced) return;
    bankWindow.dataset.enhanced = 'true';

    expandBankView(true);

    const currentInv = document.querySelector('select[name="selCurrentInv"]');
    const bankInv = document.querySelector('select[name="selBankInv"]');

    if (currentInv) {
      injectControls(currentInv, 'Inventory');
      colorizeOptions(currentInv);
    }
		if (bankInv) {
  injectControls(bankInv, 'Bank');
  colorizeOptions(bankInv);   // initial color on open
  addTooltips(bankInv);       // initial tooltips on open
  startBankRecolorLoop();     // keep colors when deposit/withdraw updates occur
}
  }
	

  const observer = new MutationObserver(() => {
    const bankWindow = document.querySelector('#winBank');
    if (bankWindow && bankWindow.style.display !== 'none') {
      enhanceBankWindow();
    }
  });
  (function () {
  const config = {
    valueCache: {},
    colorCache: {},
    statsCache: {}
  };
  const HISTORY_KEY = 'tradeHistoryLog';

  // Load item data from last.json
  fetch("https://loociez.github.io/MOC-IV/last.json")
    .then(response => response.json())
    .then(data => {
      data.forEach(item => {
        if (item.name) {
          const name = item.name.trim().toLowerCase();
          if (typeof item.recycle_value === 'number') {
            config.valueCache[name] = item.recycle_value;
          }
          if (item.color) {
            config.colorCache[name] = item.color;
          }
          if (item.data) {
            config.statsCache[name] = item.data;
          }
        }
      });
      setupTradeEnhancement();
    });

  function setupTradeEnhancement() {
    const form = document.querySelector('#winTrade');
    if (!form) return;

    // Add UI display for offer values and fairness
    const container = document.createElement('div');
    container.innerHTML = `
      <div id="yourValue" style="font-weight:bold; color:gold;">Your Offer: 0g</div>
      <div id="theirValue" style="font-weight:bold; color:gold;">Their Offer: 0g</div>
      <div id="tradeFairness" style="font-weight:bold; margin-top:5px;"></div>
    `;
    form.appendChild(container);

    // Add View Trade History button (fixed with type="button")
    const historyBtn = document.createElement('button');
    historyBtn.textContent = "📜 View Trade History";
    historyBtn.title = "View past accepted trades";
    historyBtn.style = "margin-top: 10px;";
    historyBtn.type = "button"; // Prevent form submission
    historyBtn.onclick = showTradeHistoryPopup;
    form.appendChild(historyBtn);

    const yourSelect = form.querySelector('[name="selYourInv"]');
    const theirSelect = form.querySelector('[name="selTheirInv"]');
    if (!yourSelect || !theirSelect) return;

    function getTradeValue(selectEl) {
      let total = 0;
      [...selectEl.options].forEach(option => {
        const match = option.textContent.match(/^(.*?)\s?\(x(\d+)\)?$/) || [null, option.textContent, "1"];
        const itemName = match[1].trim().toLowerCase();
        const quantity = parseInt(match[2]);
        const value = config.valueCache[itemName] || 0;
        total += value * quantity;
      });
      return total;
    }

    function updateTradeSummary() {
      const yourTotal = getTradeValue(yourSelect);
      const theirTotal = getTradeValue(theirSelect);

      document.getElementById('yourValue').textContent = `Your Offer: ${yourTotal.toLocaleString()}g`;
      document.getElementById('theirValue').textContent = `Their Offer: ${theirTotal.toLocaleString()}g`;

      const fairnessText = document.getElementById('tradeFairness');
      const delta = yourTotal - theirTotal;
      const deltaRatio = Math.abs(delta) / Math.max(1, Math.min(yourTotal, theirTotal));

      if (delta === 0) {
        fairnessText.textContent = "⚖️ Trade is even";
        fairnessText.style.color = 'lightgreen';
      } else if (delta > 0) {
        fairnessText.textContent = `⚠️ You are overpaying by ${delta.toLocaleString()}g`;
        fairnessText.style.color = deltaRatio > 0.25 ? 'red' : 'orange';
      } else {
        fairnessText.textContent = `✅ You are gaining value by ${Math.abs(delta).toLocaleString()}g`;
        fairnessText.style.color = 'lightgreen';
      }
    }

    function getTradeSnapshot() {
      const parseSide = selectEl => {
        return [...selectEl.options].map(option => {
          const match = option.textContent.match(/^(.*?)\s?\(x(\d+)\)?$/) || [null, option.textContent, "1"];
          return {
            name: match[1].trim(),
            quantity: parseInt(match[2])
          };
        });
      };

      return {
        timestamp: new Date().toISOString(),
        yourOffer: parseSide(yourSelect),
        theirOffer: parseSide(theirSelect),
      };
    }

    function saveTradeToHistory(tradeData) {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      history.push(tradeData);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    function showTradeHistoryPopup() {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]').reverse();

      const container = document.createElement('div');
      container.style = `
        position: fixed; top: 10%; left: 50%; transform: translateX(-50%);
        max-height: 70%; overflow-y: auto;
        background: #222; color: #fff;
        padding: 12px; border: 2px solid gold; border-radius: 8px;
        z-index: 9999; width: 600px; font-family: monospace;
      `;
      container.innerHTML = `<h3>📜 Trade History</h3>
        <button style="float:right;" onclick="this.parentElement.remove()" type="button">❌ Close</button>
        <button onclick="localStorage.removeItem('${HISTORY_KEY}'); this.parentElement.remove()" type="button">🗑️ Clear All</button>
        <hr>
      `;

      if (history.length === 0) {
        container.innerHTML += "<p>No trades logged yet.</p>";
      } else {
        history.forEach(entry => {
          container.innerHTML += `
            <div style="margin-bottom:12px;">
              <strong>${new Date(entry.timestamp).toLocaleString()}</strong><br>
              <span style="color: gold;">You Gave:</span> ${entry.yourOffer.map(i => `${i.name} x${i.quantity}`).join(', ') || 'Nothing'}<br>
              <span style="color: lime;">You Got:</span> ${entry.theirOffer.map(i => `${i.name} x${i.quantity}`).join(', ') || 'Nothing'}
            </div>
          `;
        });
      }

      document.body.appendChild(container);
    }

    // Hook into select changes
    yourSelect.addEventListener('change', updateTradeSummary);
    theirSelect.addEventListener('change', updateTradeSummary);

    // Wrap GUI to capture Confirm Trade action
    const originalGUI = window.GUI;
    window.GUI = function (win, action) {
      if (win === "winTrade" && action === "Confirm") {
        const snapshot = getTradeSnapshot();
        if (snapshot) saveTradeToHistory(snapshot);
      }

      originalGUI(win, action);

      if (win === "winTrade") {
        setTimeout(updateTradeSummary, 50);
      }
    };

    // Initial summary update
    updateTradeSummary();
  }
})();

(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) return;

  const settingsDivs = settingsForm.querySelectorAll("div");
  const insertTarget = settingsDivs[1];

  const qolContainer = document.createElement("div");
  qolContainer.innerHTML = `
    <div><b>Quality of Life</b></div>
    <div>
      <label><input type="checkbox" name="chkFpsCounter"> Show FPS Counter</label>
    </div>
    <div>
      <label>FPS Position:
        <select name="selFpsPosition">
          <option value="top-right">Top Right</option>
          <option value="top-left">Top Left</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </label>
    </div>
    <div>
      <label>Chat Font Style:
        <select name="selFontStyle">
          <option value="default">Default</option>
          <option value="monospace">Monospace</option>
          <option value="serif">Serif</option>
          <option value="sans-serif">Sans Serif</option>
        </select>
      </label>
    </div>
    <div>
      <label><input type="checkbox" name="chkHighlightToggle" checked> Enable Chat Highlighting</label>
    </div>
    <div>
      <label>Highlight Color:
        <input type="color" name="highlightColor" value="#07175e">
      </label>
    </div>
    <div>
      <label>Inventory Slot Color:
        <input type="color" name="slotColor" value="#00ff00">
      </label>
    </div>
    <hr style="opacity:.3;margin:6px 0;">
    <div>
      <label><input type="checkbox" name="chkSparkles" checked> Enable Sparkle Effect</label>
    </div>
    <div>
      <label>Sparkle Color:
        <input type="color" name="sparkleColor" value="#ffd700">
      </label>
    </div>
  `;
  insertTarget.appendChild(qolContainer);

  const qolSettings = {
    fontStyle: "",
    highlightEnabled: true,
    highlightColor: "#07175e",
    slotColor: "#00ff00",
    fpsPosition: "top-right",
    sparklesEnabled: true,
    sparkleColor: "#ffd700"
  };

// --- Chat Highlight ---
const chatBox = document.querySelector("#winGameChatbox");
if (chatBox) {
  const chatObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1 || !qolSettings.highlightEnabled) return;
        let msg = node.innerText;
        if (!msg) return;

        // Remove timestamp
        msg = msg.replace(/^\(\d{2}:\d{2}\)\s*/, "");

        const playerName = document.querySelector("#winStats input[name='txtName']")?.value.trim();
        if (!playerName) return;

        // Check if the message is your own (name at start, optionally followed by emojis/colon/space)
        const ownRegex = new RegExp(`^${playerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s:]*\\S*?`, "i");
        const isOwnMessage = ownRegex.test(msg);

        // Check if message mentions you but is not your own
        const mentionsMe = msg.toLowerCase().includes(playerName.toLowerCase());

        if (mentionsMe && !isOwnMessage) {
          node.style.backgroundColor = qolSettings.highlightColor;
          node.style.fontWeight = "bold";
        }
      });
    });
  });
  chatObserver.observe(chatBox, { childList: true, subtree: true });
}


  // --- Inventory Slot Colors ---
  function updateSlotColors() {
    const inv = document.getElementById('winInventory');
    if (!inv) return;
    const canvases = Array.from(inv.querySelectorAll('canvas'));
    const slotsPerRow = 5;
    canvases.forEach((c, index) => {
      if (index >= canvases.length - slotsPerRow) {
        c.style.border = `2px solid ${qolSettings.slotColor}`;
      }
    });
  }

  // --- Sparkles wiring → call InvGlow API ---
  function applySparkleSettings() {
    if (window.InvGlow) {
      window.InvGlow.setEnabled(qolSettings.sparklesEnabled);
      window.InvGlow.setColor(qolSettings.sparkleColor);
    }
  }

  // --- Listeners ---
  settingsForm.querySelector("input[name='chkHighlightToggle']")
    .addEventListener("change", e => { qolSettings.highlightEnabled = e.target.checked; });

  settingsForm.querySelector("input[name='highlightColor']")
    .addEventListener("input", e => { qolSettings.highlightColor = e.target.value; });

  settingsForm.querySelector("input[name='slotColor']")
    .addEventListener("input", e => { qolSettings.slotColor = e.target.value; updateSlotColors(); });

  settingsForm.querySelector("input[name='chkSparkles']")
    .addEventListener("change", e => {
      qolSettings.sparklesEnabled = e.target.checked;
      applySparkleSettings();
    });

  settingsForm.querySelector("input[name='sparkleColor']")
    .addEventListener("input", e => {
      qolSettings.sparkleColor = e.target.value;
      applySparkleSettings();
    });

  // Initial apply
  updateSlotColors();
  applySparkleSettings();
})();



  observer.observe(document.body, { childList: true, subtree: true });
})();

function colorShopItems() {
    const shopSelect = document.querySelector("select[name='selInventory']");
    if (!shopSelect) return;

    for (let option of shopSelect.options) {
        const text = option.text;

        if (text.includes("Potion of Cavalier Health")) {
            option.style.color = "red";
        } else if (text.includes("Potion of Mana Restoration")) {
            option.style.color = "blue";
        } else if (text.includes("Potion of Restored Vivacity") || text.includes("Coffee")) {
            option.style.color = "green";
        } else if (text.includes("Currency Note") || text.includes("Tome of Revival")) {
            option.style.color = "gold"; // yellow/gold for currency and tomes
        } else {
            option.style.color = ""; // default color for other items
        }
    }
}

// Apply colors initially
colorShopItems();

// Watch for changes to the shop select element
const shopSelect = document.querySelector("select[name='selInventory']");
if (shopSelect) {
    const observer = new MutationObserver(colorShopItems);
    observer.observe(shopSelect, { childList: true, subtree: true });
}

//emoji start
(function() {
    const emojiMap = {
        ':moc:': 'https://loociez.github.io/MOC-IV/images/emoji/moc.png',
        ':vibe:': 'https://loociez.github.io/MOC-IV/images/emoji/vibe.gif',
        ':rick:': 'https://loociez.github.io/MOC-IV/images/emoji/rick.gif',
        ':pain:': 'https://loociez.github.io/MOC-IV/images/emoji/pain.gif',
        ':verycat:': 'https://loociez.github.io/MOC-IV/images/emoji/verycat.gif',
        ':boohoo:': 'https://loociez.github.io/MOC-IV/images/emoji/boohoo.png',
        ':kek:': 'https://loociez.github.io/MOC-IV/images/emoji/kek.png',
        ':swag:': 'https://loociez.github.io/MOC-IV/images/emoji/swag.gif',
        ':cry:': 'https://loociez.github.io/MOC-IV/images/emoji/cry.gif',
        ':sasuke:': 'https://loociez.github.io/MOC-IV/images/emoji/sasuke.gif',
        ':bruh:': 'https://loociez.github.io/MOC-IV/images/emoji/bruh.gif',
        ':jam:': 'https://loociez.github.io/MOC-IV/images/emoji/jam.gif',
        ':ban:': 'https://loociez.github.io/MOC-IV/images/emoji/ban.png',
        ':bigbrain:': 'https://loociez.github.io/MOC-IV/images/emoji/bigbrain.gif',
        ':noob:': 'https://loociez.github.io/MOC-IV/images/emoji/noob.gif',
        ':classic:': 'https://loociez.github.io/MOC-IV/images/emoji/classic.gif',
        ':angry:': 'https://loociez.github.io/MOC-IV/images/emoji/angry.gif',
        ':noway:': 'https://loociez.github.io/MOC-IV/images/emoji/noway.gif',
        ':blush:': 'https://loociez.github.io/MOC-IV/images/emoji/blush.gif',
        ':derp:': 'https://loociez.github.io/MOC-IV/images/emoji/derp.png',
        ':skb:': 'https://loociez.github.io/MOC-IV/images/emoji/skb.gif',
    };

    function replaceEmojis(text) {
        return text.replace(/:\w+:/g, match => {
            const src = emojiMap[match];
            if (src) {
                return `<img src="${src}" alt="${match}" style="width:2em;height:2em;vertical-align:middle;">`;
            }
            return match;
        });
    }

    function isNearBottom(container, pad = 10) {
        return container.scrollHeight - container.scrollTop <= container.clientHeight + pad;
    }

    function processNode(node, chatContainer, wasAtBottom) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            node.innerHTML = replaceEmojis(node.innerHTML);

            if (wasAtBottom) {
                // ensure images don’t push chat up
                const imgs = node.querySelectorAll('img');
                imgs.forEach(img => {
                    if (!img.complete) {
                        img.addEventListener('load', () => {
                            requestAnimationFrame(() => {
                                chatContainer.scrollTop = chatContainer.scrollHeight;
                            });
                        }, { once: true });
                    }
                });
            }
        }
    }

    function initEmojiObserver() {
        const chatContainer = document.querySelector('#txtChatbox');
        if (!chatContainer) {
            setTimeout(initEmojiObserver, 500);
            return;
        }

        const observer = new MutationObserver(mutations => {
            const wasAtBottom = isNearBottom(chatContainer);

            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => processNode(node, chatContainer, wasAtBottom));
            });

            if (wasAtBottom) {
                // schedule one safe scroll after DOM updates
                requestAnimationFrame(() => {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                });
            }
        });

        observer.observe(chatContainer, { childList: true });

        console.log('Emoji module with safe autoscroll loaded.');
    }

    initEmojiObserver();
})();





// UI + Vitals
(function() {
    // --- Inventory ---
    const inv = document.getElementById('winInventory');
    if (inv) {
        const slotsPerRow = 5;
        const slotSize = 42;
        const horizontalGap = 25;
        const verticalGap = horizontalGap * 0.1; // ~2.5px

        const baseWidth = (slotsPerRow * slotSize) + (horizontalGap * (slotsPerRow - 1));
        const finalWidth = baseWidth * 1.15;

        Object.assign(inv.style, {
            display: 'grid',
            gridTemplateColumns: `repeat(${slotsPerRow}, ${slotSize}px)`,
            gridAutoRows: `${slotSize}px`,
            columnGap: `${horizontalGap}px`,
            rowGap: `${verticalGap}px`,
            padding: '1px 6px 6px 6px',
            background: 'linear-gradient(145deg, #2e2e2e, #1c1c1c)',
            border: '2px solid #444',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            width: `${finalWidth}px`,
            margin: '0 auto 10px auto',
            overflow: 'visible',
            boxSizing: 'border-box',
        });

        const canvases = Array.from(inv.querySelectorAll('canvas'));
        canvases.forEach((c, index) => {
            Object.assign(c.style, {
                width: `${slotSize - 3}px`,
                height: `${slotSize - 3}px`,
                border: '1px solid #666',
                borderRadius: '4px',
                background: '#222',
                boxShadow: 'inset 0 0 3px rgba(255,255,255,0.1)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                cursor: 'pointer',
            });

            // Apply green trim to bottom row (last 5 slots)
            if(index >= canvases.length - slotsPerRow){
                c.style.border = '2px solid green';
            }

            ['mouseenter','mouseleave','mousedown','mouseup'].forEach(evt => c.addEventListener(evt, () => {
                if(evt==='mouseenter'){c.style.transform='scale(1.1)'; c.style.boxShadow='0 0 6px rgba(255,255,255,0.6)';}
                if(evt==='mouseleave'){c.style.transform='scale(1)'; c.style.boxShadow='inset 0 0 3px rgba(255,255,255,0.1)';}
                if(evt==='mousedown'){c.style.transform='scale(1.2)'; c.style.boxShadow='0 0 10px rgba(255,255,255,0.8)';}
                if(evt==='mouseup'){c.style.transform='scale(1.1)'; c.style.boxShadow='0 0 6px rgba(255,255,255,0.6)';}
            }));
        });
    }

    // --- Vitals ---
    const vitals = document.getElementById('winVitals');
    if (vitals) {
        Object.assign(vitals.style, {
            display: 'grid',
            gridTemplateColumns: '50px 1fr',
            gridAutoRows: '1.3rem',
            gap: '4px 6px',
            padding: '2px 6px',
            background: 'linear-gradient(145deg, #1a1a1a, #2e2e2e)',
            border: '2px solid #555',
            borderRadius: '6px',
            boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
            color: '#fff',
            fontFamily: 'Arial, sans-serif',
            fontSize: '0.8rem',
            margin: '0 auto 6px auto',
            width: '360px',
            boxSizing: 'border-box',
        });

        const barColors = {
            barHP: '#ff4c4c',
            barMP: '#4c6cff',
            barSP: '#4cff4c',
            barXP: '#ffcd4c',
            barTP: '#b84cff'
        };

        function updateBar(id) {
            const bar = document.getElementById(id);
            const txt = document.getElementById('txt'+id.slice(3));
            if (!bar || !txt) return;

            // Hide original text
            txt.style.display = 'none';

            const match = txt.textContent.match(/(\d+)\s*\/\s*(\d+)/);
            if(!match) return;

            const current = parseInt(match[1]);
            const max = parseInt(match[2]);
            const pct = Math.min(100, Math.round(current / max * 100));

            // Bar background (filled portion)
            bar.style.background = barColors[id];
            bar.style.borderRadius = '4px';
            bar.style.height = '1.3rem';
            bar.style.display = 'flex';
            bar.style.alignItems = 'center';
            bar.style.justifyContent = 'center';
            bar.style.fontWeight = 'bold';
            bar.style.fontSize = '0.75rem';
            bar.style.color = '#fff';
            bar.style.boxSizing = 'border-box';
            bar.style.padding = '0 2px';

            // Show text across the full bar width
            let content = `${current} / ${max}`;
            if(id==='barXP'){
                const xpPct = txt.textContent.match(/\(([\d.]+)%\)/);
                if(xpPct) content = `${current} / ${max} (${xpPct[1]}%)`;
            }
            bar.textContent = content;

            // Set filled portion width
            bar.style.width = '100%';
            bar.style.backgroundImage = `linear-gradient(to right, ${barColors[id]} ${pct}%, #555 ${pct}%)`;
        }

        ['barHP','barMP','barSP','barXP','barTP'].forEach(updateBar);

        ['txtHP','txtMP','txtSP','txtXP','txtTP'].forEach(txtId => {
            const txtNode = document.getElementById(txtId);
            if(!txtNode) return;
            const observer = new MutationObserver(() => updateBar('bar'+txtId.slice(3)));
            observer.observe(txtNode, { characterData: true, subtree: true, childList: true });
        });
    }

    console.log('Inventory and vitals initialized with live updating bars, bottom row gold trim applied.');
})();

(function() {
    const inv = document.getElementById("winInventory");
    if (!inv) return;

    // Create container for everything
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.gap = "6px"; // gap between buttons and headings
    container.style.zIndex = "9999";
    document.body.appendChild(container);

    // --- Potion Section ---
    const potionHeading = document.createElement("div");
    potionHeading.textContent = "🧪"; // potion emoji
    potionHeading.style.fontSize = "20px";
    potionHeading.style.color = "#fff";
    container.appendChild(potionHeading);

    const potionButtonsData = [
        {text: "0%", mode: "off"},
        {text: "50%", mode: "50"},
        {text: "75%", mode: "75"}
    ];

    const potionButtons = [];
    potionButtonsData.forEach(data => {
        const btn = document.createElement("button");
        btn.textContent = data.text;
        btn.style.padding = "6px 10px";
        btn.style.background = "#222";
        btn.style.color = "#fff";
        btn.style.border = "1px solid #666";
        btn.style.borderRadius = "6px";
        btn.style.cursor = "pointer";
        btn.onclick = () => runPotionSequence(data.mode);
        container.appendChild(btn);
        potionButtons.push(btn);
    });

    // --- Gap before Treasure Section ---
    const sectionGap = document.createElement("div");
    sectionGap.style.height = "10px"; // small gap
    container.appendChild(sectionGap);

    // --- Treasure Section ---
    const treasureHeading = document.createElement("div");
    treasureHeading.textContent = "💰"; // treasure chest emoji
    treasureHeading.style.fontSize = "20px";
    treasureHeading.style.color = "#fff";
    container.appendChild(treasureHeading);

    const claimBtn = document.createElement("button");
    claimBtn.textContent = "Claim";
    claimBtn.style.padding = "6px 10px";
    claimBtn.style.background = "#222";
    claimBtn.style.color = "#fff";
    claimBtn.style.border = "1px solid #666";
    claimBtn.style.borderRadius = "6px";
    claimBtn.style.cursor = "pointer";
    claimBtn.onclick = runClaimSequence;
    container.appendChild(claimBtn);

    // --- Utility Functions ---
    function clickButtonByText(text) {
        const btn = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === text);
        if (btn) btn.click();
    }
    function clickButtonByTitle(title) {
        const btn = [...document.querySelectorAll("button")].find(b => b.title === title);
        if (btn) btn.click();
    }

   // --- Potion Sequence ---
function runPotionSequence(mode) {
    // Step 1: open Stats
    clickButtonByTitle("Statistics");
    setTimeout(() => {
        // Step 2: Skills / Abilities (by title)
        clickButtonByTitle("Show player skills");
        setTimeout(() => {
            // Step 3: Abilities
            clickButtonByText("Abilities");
            setTimeout(() => {
                // Step 4: Potion
                clickButtonByText("Potion");
                setTimeout(() => {
                    // Step 5: Off / 50% / 75%
                    if (mode === "off") clickButtonByText("Off");
                    else if (mode === "50") clickButtonByText("50%");
                    else clickButtonByText("75%");
                    setTimeout(() => {
                        // Step 6: Back out
                        clickButtonByTitle("Back");
                    }, 300);
                }, 300);
            }, 300);
        }, 300);
    }, 300);
}

    // --- Claim Sequence ---
function runClaimSequence() {
    clickButtonByTitle("Dungeons"); // Open Dungeons
    setTimeout(() => {
        clickButtonByText("🐲 Other"); // Open Other section
        setTimeout(() => {
            clickButtonByText("🎁 Claim Reward"); // Claim reward
        }, 300);
    }, 300);
}

    // --- Dynamic Positioning ---
    function updatePosition() {
        const rect = inv.getBoundingClientRect();
        // Buttons stacked at right edge
        container.style.top = window.scrollY + rect.top + "px";
        container.style.left = window.scrollX + rect.left + rect.width * 1.0 + "px";
        requestAnimationFrame(updatePosition);
    }

    updatePosition();
})();
// New item Sparkle
// === InvGlow (Sparkles) — settings-aware ===
const INV_GLOW_CONFIG = {
  pollMs: 700,           // how often to check canvases
  glowMs: 2000,          // how long the sparkle elements live
  debug: false,          // set true for console logs
  selector: "#winInventory",
  sparkleCount: 6        // number of sparkles per event
};

(function () {
  // ---- Internal state + public API (must exist even if inventory not found) ----
  const state = {
    enabled: true,
    color: "#ffd700" // default gold
  };

  function log(...a){ if (INV_GLOW_CONFIG.debug) console.log("[InvGlow]", ...a); }

  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return null;
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }

  function makeGradient(hex) {
    const rgb = hexToRgb(hex) || { r: 255, g: 215, b: 0 };
    // soft center → fade to transparent
    return `radial-gradient(circle, rgba(${rgb.r},${rgb.g},${rgb.b},1) 0%, rgba(${rgb.r},${rgb.g},${rgb.b},0.85) 50%, rgba(${rgb.r},${rgb.g},${rgb.b},0) 100%)`;
  }

  function cleanup(invEl) {
    const root = invEl || document;
    root.querySelectorAll(".inv-sparkle").forEach(n => n.remove());
    root.querySelectorAll(".inv-pop").forEach(n => n.classList.remove("inv-pop"));
  }

  // Public control API
  window.InvGlow = {
    setEnabled(on) {
      state.enabled = !!on;
      if (!on) cleanup(document);
      log("enabled:", state.enabled);
    },
    setColor(col) {
      if (typeof col === "string" && col.trim()) state.color = col.trim();
      log("color:", state.color);
    },
    get enabled(){ return state.enabled; },
    get color(){ return state.color; },
    stop() {
      try { clearInterval(intervalId); } catch {}
      try { mo && mo.disconnect(); } catch {}
      cleanup(document);
      console.log("[InvGlow] stopped");
    }
  };
  // Back-compat alias if you were calling InvGlowStop()
  window.InvGlowStop = () => window.InvGlow.stop();

  // ---- Inventory hookup ----
  const inv = document.querySelector(INV_GLOW_CONFIG.selector);
  if (!inv) {
    console.warn("[InvGlow] Inventory not found:", INV_GLOW_CONFIG.selector);
    return; // API still available for later toggles
  }

  // Styles (color comes from JS per-element)
  const style = document.createElement("style");
  style.textContent = `
    .inv-sparkle {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      pointer-events: none;
      animation: invSparkleRise 0.8s forwards;
      opacity: 0;
    }
    @keyframes invSparkleRise {
      0%   { transform: translate(0, 0) scale(0.5); opacity: 1; }
      50%  { transform: translate(var(--x), var(--y)) scale(1.2); opacity: 1; }
      100% { transform: translate(var(--x), var(--y)) scale(0.5); opacity: 0; }
    }
    .inv-pop { animation: invPopScale 0.3s ease-out; }
    @keyframes invPopScale {
      0% { transform: scale(1); }
      50% { transform: scale(1.25); }
      100% { transform: scale(1); }
    }
    .inv-slot-wrapper { position: relative !important; }
  `;
  document.head.appendChild(style);

  const slotState = new WeakMap();

  function hashCanvas(can) {
    try {
      const ctx = can.getContext("2d");
      if (!ctx) return null;
      const { width, height } = can;
      if (!width || !height) return null;
      const data = ctx.getImageData(0, 0, width, height).data;
      let h = 2166136261 >>> 0;
      for (let i = 0; i < data.length; i += 16) {
        h ^= data[i]; h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    } catch { return null; }
  }

  function sparkle(wrapper) {
    if (!state.enabled) return;
    if (!wrapper) return;

    const canvas = wrapper.querySelector("canvas");
    if (!canvas) return;

    wrapper.classList.add("inv-slot-wrapper");

    // Pop the item briefly
    canvas.classList.add("inv-pop");
    setTimeout(() => canvas.classList.remove("inv-pop"), 300);

    // Emit sparkles
    const grad = makeGradient(state.color);
    const w = canvas.offsetWidth || 39;
    const h = canvas.offsetHeight || 39;

    for (let i = 0; i < INV_GLOW_CONFIG.sparkleCount; i++) {
      const sp = document.createElement("div");
      sp.className = "inv-sparkle";
      sp.style.background = grad;

      const angle = Math.random() * 2 * Math.PI;
      const distance = 12 + Math.random() * 16;
      sp.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
      sp.style.setProperty("--y", `${-Math.abs(Math.sin(angle) * distance)}px`);

      sp.style.left = `${Math.random() * w}px`;
      sp.style.top  = `${Math.random() * h}px`;

      wrapper.appendChild(sp);
      setTimeout(() => sp.remove(), INV_GLOW_CONFIG.glowMs);
    }
  }

  function scanOnce() {
    const canvases = inv.querySelectorAll("div > canvas");
    canvases.forEach((can) => {
      const wrapper = can.parentElement;
      const h = hashCanvas(can);

      if (!slotState.has(can)) {
        slotState.set(can, { hash: h });
        return;
      }
      const st = slotState.get(can);
      if (h !== null && st.hash !== h) {
        log("change detected", can, "hash", st.hash, "->", h);
        sparkle(wrapper);
        st.hash = h;
      }
    });
  }

  const mo = new MutationObserver((mutations) => {
    let needScan = false;

    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;

        if (n.tagName === "DIV") {
          const can = n.querySelector("canvas");
          if (can && !slotState.has(can)) {
            slotState.set(can, { hash: hashCanvas(can) });
            sparkle(n);
          }
        }

        if (n.tagName === "CANVAS") {
          const wrap = n.parentElement || n;
          if (!slotState.has(n)) slotState.set(n, { hash: hashCanvas(n) });
          sparkle(wrap);
        }
      });

      if (m.type === "childList") needScan = true;
    }

    if (needScan) scanOnce();
  });

  mo.observe(inv, { childList: true, subtree: true });
  scanOnce();
  const intervalId = setInterval(scanOnce, INV_GLOW_CONFIG.pollMs);

  console.log("[InvGlow] running with sparkles; API: InvGlow.setEnabled(bool), InvGlow.setColor('#hex')");
})();
// === FPS Counter (QoL integrated) ===
(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) return;

  // reuse the same global QoL settings object
  window.qolSettings = window.qolSettings || {};
  const qolSettings = window.qolSettings;

  // --- FPS UI element ---
  const fpsDiv = document.createElement("div");
  Object.assign(fpsDiv.style, {
    position: "fixed",
    color: "deepskyblue",
    fontSize: "12px",
    fontFamily: "monospace",
    background: "rgba(0,0,0,0.5)",
    padding: "2px 5px",
    borderRadius: "4px",
    zIndex: 99999,
    display: "none"
  });
  document.body.appendChild(fpsDiv);

  function updateFpsPosition() {
    const pos = qolSettings.fpsPosition || "top-right";
    // reset first
    fpsDiv.style.top = fpsDiv.style.left = fpsDiv.style.right = fpsDiv.style.bottom = "";
    if (pos === "top-right")    { fpsDiv.style.top = "4px";    fpsDiv.style.right = "6px"; }
    if (pos === "top-left")     { fpsDiv.style.top = "4px";    fpsDiv.style.left = "6px"; }
    if (pos === "bottom-left")  { fpsDiv.style.bottom = "4px"; fpsDiv.style.left = "6px"; }
    if (pos === "bottom-right") { fpsDiv.style.bottom = "4px"; fpsDiv.style.right = "6px"; }
  }

  // --- FPS logic ---
  let lastTime = performance.now();
  let frames = 0;

  function loop() {
    const now = performance.now();
    frames++;
    if (now - lastTime >= 1000) {
      const fps = frames;
      frames = 0;
      lastTime = now;
      if (qolSettings.showFps) {
        fpsDiv.textContent = `FPS: ${fps}`;
        fpsDiv.style.color = fps >= 55 ? "lime" : fps >= 30 ? "yellow" : "red";
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // --- Hook QoL checkboxes / dropdown ---
  const fpsCheckbox = settingsForm.querySelector("input[name='chkFpsCounter']");
  const fpsSelect   = settingsForm.querySelector("select[name='selFpsPosition']");

  if (fpsCheckbox) {
    fpsCheckbox.addEventListener("change", e => {
      qolSettings.showFps = e.target.checked;
      fpsDiv.style.display = e.target.checked ? "block" : "none";
      updateFpsPosition();
    });
  }

  if (fpsSelect) {
    fpsSelect.addEventListener("change", e => {
      qolSettings.fpsPosition = e.target.value;
      updateFpsPosition();
    });
  }

  // Initial apply
  updateFpsPosition();
  fpsDiv.style.display = fpsCheckbox?.checked ? "block" : "none";
  qolSettings.showFps = fpsCheckbox?.checked || false;
})();

//1 click shift+item dropper
// === QoL: Shift+RightClick auto "Drop 1" ===
(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) return;

  // Find the QoL container
  const qolContainer = [...settingsForm.querySelectorAll("div")]
    .find(d => d.querySelector("b")?.textContent === "Quality of Life");

  if (!qolContainer) return;

  // --- Add QoL setting checkbox ---
  const optDiv = document.createElement("div");
  optDiv.style.display = "block";  // ensures full-width
  optDiv.style.width = "100%";
  optDiv.style.marginTop = "4px";  // slight spacing from previous element
  optDiv.innerHTML = `<label><input type="checkbox" name="chkQuickDrop1"> Enable Shift+RightClick Drop-1</label>`;

  // Append to the bottom
  qolContainer.appendChild(optDiv);

  // Ensure qolSettings exists
  window.qolSettings = window.qolSettings || {};
  const qolSettings = window.qolSettings;
  qolSettings.quickDrop1 = false;

  // Hook checkbox change
  settingsForm.querySelector("input[name='chkQuickDrop1']")
    .addEventListener("change", e => {
      qolSettings.quickDrop1 = e.target.checked;
    });

  // --- Hook inventory slots ---
  const inv = document.getElementById("winInventory");
  if (!inv) return;

  inv.querySelectorAll("canvas").forEach((canvas) => {
    canvas.addEventListener("contextmenu", e => {
      if (!qolSettings.quickDrop1) return;
      if (e.shiftKey) {
        setTimeout(() => {
          const popup = document.getElementById("winPopup");
          if (!popup || popup.style.display === "none") return;

          const input = popup.querySelector("input[name='txtPopup']");
          const okBtn = [...popup.querySelectorAll("button")]
            .find(b => b.textContent.trim() === "OK");

          if (input && okBtn) {
            input.value = "1";
            okBtn.click();
          }
        }, 50);
      }
    });
  });
})();

// === QoL: Revert UI + Vitals to Default (Sparkles persist) ===
(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) return;

  // Reuse global QoL settings
  window.qolSettings = window.qolSettings || {};
  const q = window.qolSettings;
  if (typeof q.revertUiVitals === "undefined") q.revertUiVitals = false;

  // Find the QoL container
  const qolContainer = [...settingsForm.querySelectorAll("div")]
    .find(d => d.querySelector("b")?.textContent === "Quality of Life");
  if (!qolContainer) return;

  // --- Add checkbox row at the very bottom ---
  let row = settingsForm.querySelector("input[name='chkRevertUiVitals']")?.closest("div");
  if (!row) {
    row = document.createElement("div");
    row.style.display = "block";
    row.style.width = "100%";
    row.style.marginTop = "6px";
    row.innerHTML = `<label><input type="checkbox" name="chkRevertUiVitals"> Revert UI + Vitals to Default</label>`;
    qolContainer.appendChild(row); // ensures last position
  }

  const chk = settingsForm.querySelector("input[name='chkRevertUiVitals']");
  chk.checked = !!q.revertUiVitals;

  // --- Helpers ---
  function revertUIToDefault() {
    ["winInventory", "winVitals"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.removeAttribute("style");
      el.classList.remove("custom-ui", "te-ui-overrides", "te-vitals-overrides");
      el.querySelectorAll("[data-te-inline]").forEach(child => {
        child.removeAttribute("style");
        child.removeAttribute("data-te-inline");
      });
    });
  }

  // These re-apply your new styled UI/Vitals (copied from your enhancer logic)
  function applyNewUI() {
    const inv = document.getElementById("winInventory");
    if (!inv) return;
    Object.assign(inv.style, {
      display: 'grid',
      gridTemplateColumns: `repeat(5, 42px)`,
      gridAutoRows: `42px`,
      columnGap: `25px`,
      rowGap: `2.5px`,
      padding: '1px 6px 6px 6px',
      background: 'linear-gradient(145deg, #2e2e2e, #1c1c1c)',
      border: '2px solid #444',
      borderRadius: '8px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
      width: 'calc((5*42px + 25px*4) * 1.15)',
      margin: '0 auto 10px auto',
      overflow: 'visible',
      boxSizing: 'border-box',
    });
  }

  function applyNewVitals() {
    const vitals = document.getElementById("winVitals");
    if (!vitals) return;
    Object.assign(vitals.style, {
      display: 'grid',
      gridTemplateColumns: '50px 1fr',
      gridAutoRows: '1.3rem',
      gap: '4px 6px',
      padding: '2px 6px',
      background: 'linear-gradient(145deg, #1a1a1a, #2e2e2e)',
      border: '2px solid #555',
      borderRadius: '6px',
      boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '0.8rem',
      margin: '0 auto 6px auto',
      width: '360px',
      boxSizing: 'border-box',
    });
  }

  function applySparklesIfEnabled() {
    if (q.sparklesEnabled && document.body) {
      document.body.classList.add("sparkle-enabled");
    }
    try { window.InvGlow?.setEnabled?.(!!q.sparklesEnabled); } catch {}
    try { window.InvGlow?.setColor?.(q.sparkleColor || "#ffd700"); } catch {}
  }

  function applyState() {
    if (q.revertUiVitals) {
      revertUIToDefault();
      applySparklesIfEnabled();
    } else {
      applyNewUI();
      applyNewVitals();
      applySparklesIfEnabled();
    }
  }

  // Wire up checkbox
  chk.addEventListener("change", e => {
    q.revertUiVitals = e.target.checked;
    applyState();
  });
  // === QoL: Background Color Selector (aligned under Sparkles) ===
(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) return;

  window.qolSettings = window.qolSettings || {};
  const q = window.qolSettings;
  if (typeof q.bgColor === "undefined") q.bgColor = "#1c1c1c";

  // Find the QoL container
  const qolContainer = [...settingsForm.querySelectorAll("div")]
    .find(d => d.querySelector("b")?.textContent === "Quality of Life");
  if (!qolContainer) return;

  // Find the last existing QoL row (sparkles/brightness) to insert after
  const lastRow = [...qolContainer.querySelectorAll("div")].pop();

  // --- Create color picker row ---
  let row = settingsForm.querySelector("input[name='bgColorPicker']")?.closest("div");
  if (!row) {
    row = document.createElement("div");
    row.style.display = "block";         // full width
    row.style.width = "100%";
    row.style.marginTop = "6px";
    row.innerHTML = `
      <label style="display:flex; align-items:center; gap:6px;">
        Background Color:
        <input type="color" name="bgColorPicker" value="${q.bgColor}">
      </label>`;
    if (lastRow && lastRow.parentNode) {
      lastRow.parentNode.insertBefore(row, lastRow.nextSibling); // insert directly after sparkles
    } else {
      qolContainer.appendChild(row);
    }
  }

  const colorInput = settingsForm.querySelector("input[name='bgColorPicker']");
  colorInput.value = q.bgColor;

  // --- Apply the color only if Revert UI is OFF ---
  function applyBgColor() {
    if (q.revertUiVitals) return;
    ["winInventory", "winGameChatbox"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.backgroundColor = q.bgColor;
    });
  }

  // Wire up input change
  colorInput.addEventListener("input", e => {
    q.bgColor = e.target.value;
    applyBgColor();
    localStorage.setItem("totalenhance_bgColor", q.bgColor);
  });

  // Restore saved color
  const savedColor = localStorage.getItem("totalenhance_bgColor");
  if (savedColor) {
    q.bgColor = savedColor;
    colorInput.value = savedColor;
  }

  // Integrate with Revert UI + Vitals checkbox
  const chkRevert = settingsForm.querySelector("input[name='chkRevertUiVitals']");
  if (chkRevert) {
    chkRevert.addEventListener("change", () => {
      if (!q.revertUiVitals) {
        applyBgColor();
      } else {
        ["winInventory", "winGameChatbox"].forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          el.removeAttribute("style");
        });
      }
    });
  }

  // Initial application
  if (!q.revertUiVitals) applyBgColor();
})();


  // Initial apply
  setTimeout(applyState, 0);

  // Optional: allow other modules to force refresh
  document.addEventListener("te:refresh-ui", applyState);
})();
//chat scroll
// === Chat Auto-Scroll Toggle Button for winGameChatbox ===
(function () {
  function initAutoScrollButton() {
    const chatBox = document.querySelector("#winGameChatbox");
    if (!chatBox) return false;

    // Find the "Claim" button by its inner text
    const claimBtn = [...document.querySelectorAll("button")]
      .find(btn => btn.textContent.trim() === "Claim");

    if (!claimBtn) return false;

    // Prevent duplicate injection
    if (document.querySelector("#btnAutoScroll")) return true;

    // Create new button
    const autoBtn = document.createElement("button");
    autoBtn.id = "btnAutoScroll";
    autoBtn.textContent = "💬"; // emoji speech bubble
    Object.assign(autoBtn.style, {
      width: claimBtn.offsetWidth + "px",
      height: claimBtn.offsetHeight + "px",
      marginTop: "4px",
      display: "block",
      background: "rgb(34,34,34)",
      color: "#fff",
      border: "1px solid #666",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "18px",
      transition: "box-shadow 0.2s"
    });

    // Insert right after Claim button
    claimBtn.insertAdjacentElement("afterend", autoBtn);

    // Track state
    let autoScrollEnabled = false;

    // Toggle logic
    autoBtn.addEventListener("click", () => {
      autoScrollEnabled = !autoScrollEnabled;
      autoBtn.style.boxShadow = autoScrollEnabled ? "0 0 8px 2px limegreen" : "none";
    });

    // Auto-scroll loop
    function tick() {
      if (autoScrollEnabled) {
        chatBox.scrollTop = chatBox.scrollHeight;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    console.log("Auto-scroll chat button loaded for winGameChatbox.");
    return true;
  }

  // Keep checking until elements exist
  const waitInterval = setInterval(() => {
    if (initAutoScrollButton()) {
      clearInterval(waitInterval);
    }
  }, 500);
})();
//Theme QoL
// === QoL: Themes for Inventory + Vitals ===
(function () {
  const settingsForm = document.querySelector("#winSettings");
  if (!settingsForm) return;

  // --- Find QoL container (the one we already appended settings to) ---
  const qolContainer = [...settingsForm.querySelectorAll("div")]
    .find(d => d.querySelector("b")?.textContent === "Quality of Life");

  if (!qolContainer) return;

  // --- Insert theme selector BELOW existing settings ---
  const themeDiv = document.createElement("div");
  themeDiv.style.marginTop = "6px";
  themeDiv.innerHTML = `
    <label>UI Theme:
      <select name="selUiTheme">
        <option value="default">Default</option>
        <option value="dark">Dark Minimal</option>
        <option value="neon">Neon Glow</option>
        <option value="retro">Retro Pixel</option>
        <option value="cyberpunk">Cyberpunk Holo</option>
        <option value="fantasy">Fantasy Scroll</option>
        <option value="vaporwave">Vaporwave Dream</option>
        <option value="glass">Minimal Dark Glass</option>
        <option value="industrial">Industrial Steel</option>
        <option value="aurora">Aurora Veil</option>
        <option value="inferno">Inferno Ember</option>
      </select>
    </label>
  `;
  qolContainer.appendChild(themeDiv);

  // --- Insert Brightness control ---
  const brightnessDiv = document.createElement("div");
  brightnessDiv.style.marginTop = "6px";
  brightnessDiv.innerHTML = `
    <label>Game Brightness:
      <input type="range" name="rngBrightness" min="50" max="150" step="10">
      <span class="brightnessVal"></span>%
    </label>
  `;
  qolContainer.appendChild(brightnessDiv);

  const brightnessInput = brightnessDiv.querySelector("input[name='rngBrightness']");
  const brightnessVal = brightnessDiv.querySelector(".brightnessVal");

  // --- Ensure qolSettings global exists ---
  window.qolSettings = window.qolSettings || {};
  const qolSettings = window.qolSettings;
  qolSettings.uiTheme = qolSettings.uiTheme || "default";
  qolSettings.brightness = qolSettings.brightness || 100;

  // --- Theme definitions ---
  const THEMES = {
    default: {
      inv: { background: "linear-gradient(145deg, #2e2e2e, #1c1c1c)", border: "2px solid #444", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" },
      vitals: { background: "linear-gradient(145deg, #1a1a1a, #2e2e2e)", border: "2px solid #555", boxShadow: "0 3px 6px rgba(0,0,0,0.4)" }
    },
    dark: {
      inv: { background: "#111", border: "1px solid #333", boxShadow: "0 0 12px rgba(0,0,0,0.8)" },
      vitals: { background: "#111", border: "1px solid #333", boxShadow: "0 0 12px rgba(0,0,0,0.8)" }
    },
    neon: {
      inv: { background: "black", border: "2px solid deepskyblue", boxShadow: "0 0 12px deepskyblue" },
      vitals: { background: "black", border: "2px solid lime", boxShadow: "0 0 12px lime" }
    },
    retro: {
      inv: { background: "#2b1d0e", border: "2px solid #d4a373", boxShadow: "none" },
      vitals: { background: "#1a1a1a", border: "2px solid #888", boxShadow: "none", fontFamily: "monospace" }
    },
    cyberpunk: {
      inv: { background: "linear-gradient(135deg, #0f0f0f, #1c0033)", border: "2px solid #ff00ff", boxShadow: "0 0 15px #ff00ff" },
      vitals: { background: "rgba(0,0,0,0.85)", border: "2px solid #00ffff", boxShadow: "0 0 15px #00ffff", fontFamily: "Orbitron, sans-serif" }
    },
    fantasy: {
      inv: { background: "linear-gradient(135deg, #3b2f2f, #1e1a1a)", border: "3px solid #d4af37", boxShadow: "0 0 8px rgba(255,215,0,0.6)" },
      vitals: { background: "#2c2415", border: "2px solid #c0a060", boxShadow: "inset 0 0 10px rgba(200,160,100,0.5)", fontFamily: "serif" }
    },
    vaporwave: {
      inv: { background: "linear-gradient(135deg, #ff71ce, #01cdfe, #05ffa1)", border: "2px solid #fffb96", boxShadow: "0 0 15px rgba(255,113,206,0.8)" },
      vitals: { background: "linear-gradient(135deg, #ff71ce, #01cdfe)", border: "2px solid #fffb96", boxShadow: "0 0 10px rgba(1,205,254,0.6)", fontFamily: "monospace" }
    },
    glass: {
      inv: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" },
      vitals: { background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(0,0,0,0.5)" }
    },
    industrial: {
      inv: { background: "linear-gradient(145deg, #3a3a3a, #1e1e1e)", border: "2px solid #888", boxShadow: "inset 0 0 8px rgba(0,0,0,0.6)" },
      vitals: { background: "#2e2e2e", border: "2px solid #ffcc00", boxShadow: "0 0 8px rgba(255,204,0,0.6)", fontFamily: "Stencil, sans-serif" }
    },
    aurora: {
      inv: {
        background: "linear-gradient(135deg, rgba(0,30,60,0.9), rgba(0,60,90,0.9))",
        border: "2px solid #66ccff",
        boxShadow: "inset 0 0 25px rgba(102,204,255,0.4), 0 0 12px rgba(102,204,255,0.7)",
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px)"
      },
      vitals: {
        background: "linear-gradient(135deg, rgba(0,40,70,0.95), rgba(0,70,110,0.95))",
        border: "2px solid #33bbff",
        boxShadow: "inset 0 0 20px rgba(51,187,255,0.4), 0 0 10px rgba(51,187,255,0.6)",
        fontFamily: "Trebuchet MS, sans-serif"
      }
    },
    inferno: {
      inv: {
        background: "linear-gradient(135deg, #1a0f0f, #0d0d0d)",
        border: "2px solid #ff4500",
        boxShadow: "inset 0 0 20px rgba(255,69,0,0.5), 0 0 15px rgba(255,69,0,0.7)",
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,69,0,0.1) 0, rgba(255,69,0,0.1) 2px, transparent 2px, transparent 6px)"
      },
      vitals: {
        background: "linear-gradient(135deg, #260000, #100000)",
        border: "2px solid #ff6347",
        boxShadow: "inset 0 0 15px rgba(255,100,0,0.5), 0 0 12px rgba(255,100,0,0.7)",
        fontFamily: "Verdana, sans-serif"
      }
    }
  };

  // --- Apply theme function ---
  function applyTheme(name) {
    const theme = THEMES[name] || THEMES.default;
    const inv = document.getElementById("winInventory");
    const vitals = document.getElementById("winVitals");

    if (inv) Object.assign(inv.style, theme.inv);
    if (vitals) Object.assign(vitals.style, theme.vitals);
  }

  // --- Apply brightness function ---
  function applyBrightness(value) {
    const gameCanvas = document.getElementById("cvsGame") || document.getElementById("winGameCanvas");
    if (gameCanvas) {
      gameCanvas.style.filter = `brightness(${value}%)`;
    }
  }

  // --- Hook dropdown ---
  const themeSelect = themeDiv.querySelector("select[name='selUiTheme']");
  themeSelect.value = qolSettings.uiTheme;
  themeSelect.addEventListener("change", e => {
    qolSettings.uiTheme = e.target.value;
    applyTheme(qolSettings.uiTheme);
  });

  // --- Hook brightness ---
  brightnessInput.value = qolSettings.brightness;
  brightnessVal.textContent = qolSettings.brightness;
  brightnessInput.addEventListener("input", e => {
    const val = parseInt(e.target.value, 10);
    qolSettings.brightness = val;
    brightnessVal.textContent = val;
    applyBrightness(val);
  });

  // --- Initial apply ---
  applyTheme(qolSettings.uiTheme);
  applyBrightness(qolSettings.brightness);
})();


//recorder button mod
// === Replay Recorder Button (stacked with Claim + Chat buttons) ===
(function () {
  const MAX_RECORDING_TIME_MS = 15 * 60 * 1000; // 15 minutes
  const FILENAME_PREFIX = "Replay_";
  let recorder, recordedChunks = [], recordingTimeout, requestInterval;

  function init() {
    // find our custom floating container (the one with potion/claim/chat buttons)
    const container = [...document.querySelectorAll("div")]
      .find(div => div.style.flexDirection === "column" && div.querySelector("button"));
    if (!container) {
      setTimeout(init, 500);
      return;
    }

    // find the Auto Chat Scroll button in that container
    const autoChatBtn = [...container.querySelectorAll("button")]
      .find(b => b.textContent.includes("💬") || b.title?.includes("Chat"));
    if (!autoChatBtn) {
      setTimeout(init, 500);
      return;
    }

    // --- Create Replay button styled like others ---
    const btn = document.createElement("button");
    btn.textContent = "▶️";
    Object.assign(btn.style, {
      padding: autoChatBtn.style.padding || "6px 10px",
      background: autoChatBtn.style.background || "#222",
      color: autoChatBtn.style.color || "#fff",
      border: autoChatBtn.style.border || "1px solid #666",
      borderRadius: autoChatBtn.style.borderRadius || "6px",
      cursor: "pointer",
      marginTop: "4px"
    });
    btn.title = "Start/Stop Replay Recording";

    autoChatBtn.insertAdjacentElement("afterend", btn);

    async function startRecording() {
      recordedChunks = [];
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30, width: { max: 1280 }, height: { max: 720 } },
          audio: true
        });

        if (!stream || !stream.getTracks().length) {
          alert("No valid stream selected.");
          return;
        }

        recorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp8,opus",
          videoBitsPerSecond: 2500000
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };

        recorder.onstop = () => {
          clearInterval(requestInterval);
          if (recordedChunks.length === 0) {
            alert("Recording failed: no data was captured.");
            return;
          }
          const blob = new Blob(recordedChunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          a.href = url;
          a.download = `${FILENAME_PREFIX}${timestamp}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        };

        recorder.start(1000);
        requestInterval = setInterval(() => {
          if (recorder && recorder.state === "recording") recorder.requestData();
        }, 5000);

        btn.textContent = "⏹️";
        btn.style.animation = "flashRed 1s infinite";

        recordingTimeout = setTimeout(stopRecording, MAX_RECORDING_TIME_MS);
        stream.getVideoTracks()[0].addEventListener("ended", stopRecording);
      } catch (err) {
        alert("Recording canceled or permission denied.");
        console.error(err);
      }
    }

    function stopRecording() {
      if (recorder && recorder.state === "recording") {
        recorder.stop();
        clearTimeout(recordingTimeout);
        clearInterval(requestInterval);
        btn.textContent = "▶️";
        btn.style.animation = "";
      }
    }

    btn.onclick = () => {
      if (recorder && recorder.state === "recording") stopRecording();
      else startRecording();
    };

    // --- Flashing animation ---
    const style = document.createElement("style");
    style.textContent = `
      @keyframes flashRed {
        0%   { background-color: #222; color: #fff; }
        50%  { background-color: red; color: white; }
        100% { background-color: #222; color: #fff; }
      }
    `;
    document.head.appendChild(style);
  }

  init();
})();
//scale zoom fixe
// --- Auto-fix for browser zoom issues with game UI ---
(function () {
  let lastRatio = window.devicePixelRatio;
  window.addEventListener("resize", () => {
    if (window.devicePixelRatio !== lastRatio) {
      lastRatio = window.devicePixelRatio;
      // Mimic manual zoom reset to force reflow
      document.body.style.zoom = "99%";
      setTimeout(() => {
        document.body.style.zoom = "100%";
      }, 50);
    }
  });
})();
//local tracker
(function sessionTracker(){
    if(window.sessionTrackerLoaded) return;
    window.sessionTrackerLoaded = true;

    const tracker = {
        startTime: Date.now(),
        spacePresses: 0,
        itemUses: 0,
        mouseClicks: 0,
        bankOpens: 0,
        shopOpens: 0,
        skillsOpens: 0,
        tabSwitches: 0,      // <Tab> key target switches
        abilityUses: 0,
        peakAPM: 0,
        mouseDistance: 0
    };
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toFixed(0);
}

    // --- Space key realistic tracking ---
    let spaceHeld = false;
    let lastSpaceTime = 0;
    const SPACE_INTERVAL = 200;

    let tabHeld = false; // prevent repeat spam

    document.addEventListener('keydown', e => {
        if(e.code === 'Space'){
            if(!spaceHeld){
                spaceHeld = true;
                const now = Date.now();
                if(now - lastSpaceTime >= SPACE_INTERVAL){
                    tracker.spacePresses++;
                    lastSpaceTime = now;
                }
            }
        }
        if(e.code === 'KeyK'){ // Track using item with K
            tracker.itemUses++;
        }
        if(e.code === 'KeyF'){ // Track ability uses
            tracker.abilityUses++;
        }
        if(e.code === 'Tab' && !tabHeld){ // Track target switching with Tab (debounced)
            tracker.tabSwitches++;
            tabHeld = true;
        }
    });

    document.addEventListener('keyup', e => {
        if(e.code === 'Space'){
            spaceHeld = false;
        }
        if(e.code === 'Tab'){
            tabHeld = false;
        }
    });

    // --- Track inventory double-clicks on item canvases ---
    const invEl = document.querySelector('#winInventory');
    if(invEl){
        const attachCanvasListeners = () => {
            invEl.querySelectorAll('canvas').forEach(c => {
                if(!c._sessionTrackerAttached){
                    c.addEventListener('dblclick', () => tracker.itemUses++);
                    c._sessionTrackerAttached = true;
                }
            });
        };
        attachCanvasListeners();
        const observer = new MutationObserver(attachCanvasListeners);
        observer.observe(invEl, {childList: true, subtree: true});
    }

    // --- Track all mouse clicks (ignore tracker UI clicks) ---
    document.addEventListener('click', e => {
        if (!e.target.closest('#winSessionTracker')) {
            tracker.mouseClicks++;
        }
    });

    // --- Track mouse movement distance ---
    let lastMouseX = null, lastMouseY = null;
    document.addEventListener('mousemove', e => {
        if(lastMouseX !== null && lastMouseY !== null){
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            tracker.mouseDistance += Math.sqrt(dx*dx + dy*dy);
        }
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    // --- Hook Bank, Shop opens via their buttons ---
    const attachWindowOpenListeners = () => {
        document.querySelectorAll("button[title]").forEach(btn => {
            if(btn._sessionTrackerAttached) return;
            const title = btn.getAttribute("title");
            if(title?.includes("Bank")) btn.addEventListener('click', () => tracker.bankOpens++);
            if(title?.includes("Shop")) btn.addEventListener('click', () => tracker.shopOpens++);
            btn._sessionTrackerAttached = true;
        });
    };
    attachWindowOpenListeners();
    new MutationObserver(attachWindowOpenListeners).observe(document.body, {childList:true, subtree:true});

    // --- Watch for Skills window being shown ---
    const watchSkillsWindow = () => {
        const skillsEl = document.querySelector("#winSkills");
        if(skillsEl && !skillsEl._sessionTrackerObserved){
            const observer = new MutationObserver(() => {
                if(skillsEl.style.display !== "none" && skillsEl.style.display !== ""){
                    tracker.skillsOpens++;
                }
            });
            observer.observe(skillsEl, {attributes:true, attributeFilter:["style"]});
            skillsEl._sessionTrackerObserved = true;
        }
    };
    watchSkillsWindow();
    new MutationObserver(watchSkillsWindow).observe(document.body, {childList:true, subtree:true});

    // --- Create new window ---
    const createTrackerWindow = () => {
        if(document.querySelector('#winSessionTracker')) return;

        const form = document.createElement('form');
        form.id = 'winSessionTracker';
        form.className = 'gameWindowEven fadeIn';
        form.name = 'frmSessionTracker';
        form.style.display = 'grid';

        // Header
        const headerDiv = document.createElement('div');
        const h3 = document.createElement('h3');
        h3.textContent = 'Session Tracker';
        headerDiv.appendChild(h3);

        // Stats grid
        const gridDiv = document.createElement('div');

        const makeRow = (label, value) => {
            const labelDiv = document.createElement('div');
            labelDiv.textContent = label + ':';
            const valueDiv = document.createElement('div');
            const input = document.createElement('input');
            input.readOnly = true;
            input.size = 12;
            input.value = value;
            valueDiv.appendChild(input);
            gridDiv.appendChild(labelDiv);
            gridDiv.appendChild(valueDiv);
            return input;
        };

        const sessionLengthInput = makeRow('Session Length', '00:00:00');
        const spaceInput = makeRow('Space Presses', tracker.spacePresses);
        const itemInput = makeRow('Item Uses', tracker.itemUses);
        const mouseInput = makeRow('Mouse Clicks', tracker.mouseClicks);
        const abilityInput = makeRow('Abilities Used (F)', tracker.abilityUses);
        const bankInput = makeRow('Bank Opens', tracker.bankOpens);
        const shopInput = makeRow('Shop Opens', tracker.shopOpens);
        const skillsInput = makeRow('Skills Opens', tracker.skillsOpens);
        const tabInput = makeRow('Tab Switches (Targets)', tracker.tabSwitches);
        const distanceInput = makeRow('Mouse Distance (px)', tracker.mouseDistance.toFixed(0));
        const apmInput = makeRow('Actions Per Minute', '0');
        const peakApmInput = makeRow('Peak APM', tracker.peakAPM);

        // Buttons
        const btnDiv = document.createElement('div');
        const ul = document.createElement('ul');

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = 'Close';
        closeBtn.onclick = () => { form.remove(); };
        ul.appendChild(document.createElement('li')).appendChild(closeBtn);

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.textContent = 'Reset';
        resetBtn.onclick = () => {
            tracker.startTime = Date.now();
            tracker.spacePresses = 0;
            tracker.itemUses = 0;
            tracker.mouseClicks = 0;
            tracker.bankOpens = 0;
            tracker.shopOpens = 0;
            tracker.skillsOpens = 0;
            tracker.tabSwitches = 0;
            tracker.abilityUses = 0;
            tracker.mouseDistance = 0;
            tracker.peakAPM = 0;
            updateDisplay();
        };
        ul.appendChild(document.createElement('li')).appendChild(resetBtn);

        btnDiv.appendChild(ul);
        form.appendChild(headerDiv);
        form.appendChild(gridDiv);
        form.appendChild(btnDiv);
        document.body.appendChild(form);

        // --- Update display ---
        const updateDisplay = () => {
            const elapsed = Date.now() - tracker.startTime;
            const hrs = Math.floor(elapsed / 3600000);
            const mins = Math.floor((elapsed % 3600000) / 60000);
            const secs = Math.floor((elapsed % 60000) / 1000);
            sessionLengthInput.value =
                `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;

            spaceInput.value = tracker.spacePresses;
            itemInput.value = tracker.itemUses;
            mouseInput.value = tracker.mouseClicks;
            abilityInput.value = tracker.abilityUses;
            bankInput.value = tracker.bankOpens;
            shopInput.value = tracker.shopOpens;
            skillsInput.value = tracker.skillsOpens;
            tabInput.value = tracker.tabSwitches;
            distanceInput.value = formatNumber(tracker.mouseDistance);

            // Actions per minute + peak APM (exclude mouseDistance)
            const minutes = elapsed / 60000;
            const totalActions = tracker.spacePresses + tracker.itemUses + tracker.mouseClicks + tracker.abilityUses + tracker.tabSwitches;
            const apm = minutes > 0 ? (totalActions / minutes).toFixed(1) : '0';
            apmInput.value = apm;
            if(parseFloat(apm) > tracker.peakAPM){
                tracker.peakAPM = parseFloat(apm);
            }
            peakApmInput.value = tracker.peakAPM.toFixed(1);
        };

        setInterval(updateDisplay, 500);
    };

    // --- Add button to winStats ---
    const statsWindow = document.querySelector('#winStats ul');
    if(statsWindow){
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Session Tracker';
        btn.title = 'Open session tracker window';
        btn.onclick = createTrackerWindow;
        li.appendChild(btn);
        statsWindow.appendChild(li);
    }

})();
//background Color

(async function() {
  'use strict';

  // Load items JSON data
  const response = await fetch("https://loociez.github.io/MOC-IV/last.json");
  const itemsData = await response.json();

  // Elements
  const inventory = document.getElementById("winInventory");
  const chatInput = document.getElementById("txtChatMessage");
  const chatBox = document.getElementById("winGameChatbox");
  const txtInvDesc = document.getElementById("txtInvDesc");

  if (!inventory || !chatInput || !chatBox || !txtInvDesc) {
    console.warn("Required elements missing: #winInventory, #txtChatMessage, #winGameChatbox, #txtInvDesc");
    return;
  }

  // Insert text at cursor helper
  function insertTextAtCursor(el, text) {
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const val = el.value;
      el.value = val.slice(0, start) + text + val.slice(end);
      el.selectionStart = el.selectionEnd = start + text.length;
    } else if (el.isContentEditable) {
      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      el.value = (el.value || "") + text;
    }
    el.focus();
  }

  // Get hovered item name from #txtInvDesc
  function getNameFromInvDesc() {
    if (txtInvDesc.style.visibility !== "visible") return null;
    const firstP = txtInvDesc.querySelector("p");
    if (!firstP) return null;
    const span = firstP.querySelector("span");
    if (!span) return null;

    let name = span.textContent.trim();

    // Remove stack count at end e.g. "(x74)"
    name = name.replace(/\s*\(x\d+\)$/i, "").trim();

    return name;
  }

  // Inventory canvas handling: shift + left click inserts item name tag into chat input
  const canvases = inventory.querySelectorAll("canvas");
  let currentHoveredName = null;

  canvases.forEach(canvas => {
    canvas.style.cursor = "pointer";

    canvas.addEventListener("mousemove", () => {
      currentHoveredName = getNameFromInvDesc();
    });

    canvas.addEventListener("mouseleave", () => {
      currentHoveredName = null;
    });

    canvas.addEventListener("click", (e) => {
      if (!e.shiftKey || e.button !== 0) return; 
      if (!currentHoveredName) {
        console.warn("No hovered item name detected!");
        return;
      }
      const insertion = `[item=${currentHoveredName}]`;
      insertTextAtCursor(chatInput, insertion);
      e.preventDefault();
    });
  });

  // Find item data by name
  function findItemByName(name) {
    return itemsData.find(item => item.name.toLowerCase() === name.toLowerCase());
  }

  // Format tooltip details
  function formatItemDetails(item) {
    if (!item) return "<em>Item not found</em>";

    let html = `<div style="font-weight:bold; font-size:16px; margin-bottom:4px; color:#00ff00;">${item.name}</div>`;

    if (item.desc && item.desc.trim()) {
      html += `<div style="font-style: italic; margin-bottom:6px; color:#bfbfbf;">${item.desc}</div>`;
    }

    html += "<div style='margin-bottom:6px;'>";
    if (item.uses) html += `<div>Uses: ${item.uses}</div>`;
    if (item.limit) html += `<div>Limit: ${item.limit}</div>`;
    if (item.cooldown_delay) html += `<div>Cooldown: ${item.cooldown_delay} ms</div>`;
    if (item.repair_cost) html += `<div>Repair Cost: ${item.repair_cost}</div>`;
    if (item.break_chance) html += `<div>Break Chance: ${item.break_chance}%</div>`;
    if (item.recycle_value) html += `<div>Recycle Value: ${item.recycle_value}</div>`;
    if (item.level_req) html += `<div>Level Requirement: ${item.level_req}</div>`;
    if (item.death_drop !== undefined) html += `<div>Drop on Death: ${item.death_drop ? "Yes" : "No"}</div>`;
    if (item.transferable !== undefined) html += `<div>Transferable: ${item.transferable ? "Yes" : "No"}</div>`;
    html += "</div>";

    if (item.data) {
      html += "<div style='font-weight:bold; margin-bottom:4px;'>Stats:</div><ul style='margin-top:0; padding-left:16px;'>";

      const excludedKeys = new Set(["sprite_rotation", "scale", "sprite_color", "damage_stat", "hue", "move", "spin", "sprite", "alpha"]);

      for (const [key, value] of Object.entries(item.data)) {
        if (excludedKeys.has(key)) continue;
        if (!value && value !== 0) continue;
        if (value === 0) continue;

        const keyPretty = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        html += `<li>${keyPretty}: ${value}</li>`;
      }
      html += "</ul>";
    }

    return html;
  }

  // Tooltip container (now scrollable)
  const tooltip = document.createElement("div");
  Object.assign(tooltip.style, {
    position: "fixed",
    background: "rgba(0, 0, 0, 0.85)",
    color: "#0f0",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #0f0",
    maxWidth: "300px",
    maxHeight: "350px",       // ★ Scroll height limit
    overflowY: "auto",         // ★ Enable vertical scrolling
    fontFamily: "Arial, sans-serif",
    fontSize: "13px",
    zIndex: "9999999",
    pointerEvents: "auto",
    whiteSpace: "normal",
    display: "none",
    boxShadow: "0 0 10px #0f0",
    userSelect: "none",
  });
  document.body.appendChild(tooltip);

  function showTooltipAtPosition(html, x, y) {
    tooltip.innerHTML = html;

    const padding = 10;
    const extraUpMargin = 350; 
    const tooltipWidth = 300;
    const tooltipHeight = tooltip.offsetHeight || 150;

    let left = x + padding;
    if (left + tooltipWidth > window.innerWidth) {
      left = x - tooltipWidth - padding;
    }

    let top = y - tooltipHeight - padding - extraUpMargin;
    if (top < 0) top = y + padding;

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
    tooltip.style.display = "block";
  }

  function hideTooltip() {
    tooltip.style.display = "none";
  }

  // Parse clickable item links
  function parseChatItems() {
    const itemRegex = /\[item=([^\]]+)\]/gi;
    const spans = [...chatBox.querySelectorAll("li > span")];

    spans.forEach(span => {
      if (span.dataset.processed) return;

      const text = span.textContent;
      let lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let match;

      while ((match = itemRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }

        const itemName = match[1];
        const link = document.createElement("span");
        link.className = "chat-item-link";
        link.style.color = "#0f0";
        link.style.textDecoration = "underline";
        link.style.cursor = "pointer";
        link.dataset.itemName = itemName;
        link.textContent = itemName;
        fragment.appendChild(link);

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      if (fragment.childNodes.length > 0) {
        span.textContent = "";
        span.appendChild(fragment);
        span.dataset.processed = "true";
      }
    });
  }

  setInterval(parseChatItems, 1000);

  chatBox.addEventListener("click", e => {
    const target = e.target;
    if (target.classList.contains("chat-item-link")) {
      const itemName = target.dataset.itemName;
      const item = findItemByName(itemName);
      const html = formatItemDetails(item);
      showTooltipAtPosition(html, e.clientX, e.clientY);
      e.stopPropagation();
    } else {
      hideTooltip();
    }
  });

  document.body.addEventListener("click", e => {
    if (!tooltip.contains(e.target)) hideTooltip();
  });

})();
