// Combined Enhancer Script

// Includes: Vitals, Skill Enhancer, Guild Enhancer, Bank Enhancer

(() => {
  let barsEnabled = false;
  let barsLocked = false;
  let barsContainer;
  let hpBar, spBar, mpBar, tpBar, xpBar;
  let hpTextSpan, spTextSpan, mpTextSpan, tpTextSpan, xpTextSpan;
  let animationId;

  const oldVitals = document.getElementById("winVitals");

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "⎯";
  toggleBtn.title = "Toggle Animated HP/SP/MP/TP Bars";
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
      labelEl.style.marginBottom = "4px";
      barsContainer.appendChild(labelEl);
      const { barBg, barFill, textSpan } = createBar(color, tooltipCb);
      assignVars.bar = barFill;
      assignVars.text = textSpan;
      barsContainer.appendChild(barBg);
    }

    const ref = {};

    addBar("HP ❤️", "red", ref);
    hpBar = ref.bar;
    hpTextSpan = ref.text;

    addBar("SP", "lime", ref);
    spBar = ref.bar;
    spTextSpan = ref.text;

    addBar("MP", "deepskyblue", ref);
    mpBar = ref.bar;
    mpTextSpan = ref.text;

    addBar("TP", "#a64ca6", ref);
    tpBar = ref.bar;
    tpTextSpan = ref.text;

    addBar("XP", "goldenrod", ref, () => {
      const txt = document.getElementById("txtXP")?.textContent;
      const match = txt?.match(/(\d+)\s*\/\s*(\d+)/);
      if (!match) return "";
      const [_, cur, max] = match;
      return `${(+max - +cur).toLocaleString()} XP to next level`;
    });
    xpBar = ref.bar;
    xpTextSpan = ref.text;

    document.body.appendChild(barsContainer);
    lockBtn.style.display = "inline-block";
    barsLocked = false;
    updateLockState();
    makeDraggable(barsContainer);
    animateBars();
  }

  function removeBars() {
    if (!barsContainer) return;
    cancelAnimationFrame(animationId);
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
  function animateBars() {
    if (!barsEnabled) return;

    const hpText = document.getElementById("txtHP")?.textContent;
    const spText = document.getElementById("txtSP")?.textContent;
    const mpText = document.getElementById("txtMP")?.textContent;
    const tpText = document.getElementById("txtTP")?.textContent;
    const xpText = document.getElementById("txtXP")?.textContent;

    if (hpText) {
      const [cur, max] = parseValue(hpText);
      const percent = Math.min(cur / max, 1);
      hpBar.style.width = `${percent * 100}%`;
      hpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse))}px red`;
      hpTextSpan.textContent = `${cur} / ${max}`;
    }
    if (spText) {
      const [cur, max] = parseValue(spText);
      const percent = Math.min(cur / max, 1);
      spBar.style.width = `${percent * 100}%`;
      spBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 1))}px lime`;
      spTextSpan.textContent = `${cur} / ${max}`;
    }
    if (mpText) {
      const [cur, max] = parseValue(mpText);
      const percent = Math.min(cur / max, 1);
      mpBar.style.width = `${percent * 100}%`;
      mpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 2))}px deepskyblue`;
      mpTextSpan.textContent = `${cur} / ${max}`;
    }
    if (tpText) {
      const [cur, max] = parseValue(tpText);
      const percent = Math.min(cur / max, 1);
      tpBar.style.width = `${percent * 100}%`;
      tpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 3))}px #a64ca6`;
      tpTextSpan.textContent = `${cur} / ${max}`;
    }
    if (xpText) {
      const match = xpText.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        const cur = parseInt(match[1]), max = parseInt(match[2]);
        const percent = Math.min(cur / max, 1);
        xpBar.style.width = `${percent * 100}%`;
        xpBar.style.boxShadow = `0 0 ${4 + 2 * Math.abs(Math.sin(pulse + 4))}px goldenrod`;
        xpTextSpan.textContent = `${cur.toLocaleString()} / ${max.toLocaleString()}`;
      }
    }

    pulse += 0.05;
    animationId = requestAnimationFrame(animateBars);
  }

  function updateLockState() {
    if (!barsContainer) return;
    if (barsLocked) {
      lockBtn.textContent = "🔒";
      lockBtn.style.color = "red";
      barsContainer.style.cursor = "default";
      barsContainer.style.pointerEvents = "none";
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
    totalBox.style.marginTop = '3px';
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
      colorizeOptions(bankInv);
    }
  }

  const observer = new MutationObserver(() => {
    const bankWindow = document.querySelector('#winBank');
    if (bankWindow && bankWindow.style.display !== 'none') {
      enhanceBankWindow();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
