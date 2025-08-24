// Combined Enhancer Script

// Includes: Vitals, Skill Enhancer, Guild Enhancer, Bank Enhancer and QoL settings

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
      labelEl.style.marginBottom = "3px";
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
  if (!settingsForm) {
    console.warn("Settings window not found!");
    return;
  }

  // === Insert QoL Settings ===
  const settingsDivs = settingsForm.querySelectorAll("div");
  const insertTarget = settingsDivs[1]; // main settings block

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
      <label>Highlight Color:
        <input type="color" name="highlightColor" value=""#07175e">
      </label>
    </div>
  `;
  insertTarget.appendChild(qolContainer);

  // === Chatbox & Observer ===
  const chatBox = document.querySelector("#winGameChatbox");
  if (!chatBox) {
    console.warn("Chatbox not found!");
    return;
  }
  const chatObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;

      try {
        let msg = node.innerText;
        if (!msg) return;

        msg = msg.replace(/^\(\d{2}:\d{2}\)\s*/, "");

        const nameInput = document.querySelector("#winStats input[name='txtName']");
        const playerName = nameInput ? nameInput.value.trim() : "";
        if (!playerName) return;

        const highlightColor = qolSettings.highlightColor || "#07175e";

        const isOwnMessage = msg.toLowerCase().startsWith(playerName.toLowerCase() + " ");
        const mentionsMe = msg.toLowerCase().includes(playerName.toLowerCase());

        if (mentionsMe && !isOwnMessage) {
          // Only set background safely
          if (node.style) {
            node.style.backgroundColor = highlightColor;
            node.style.fontWeight = "bold";
          }
        }
      } catch (e) {
        console.warn("Safe chat highlight skipped:", e);
      }
    });
  });
});


  chatObserver.observe(chatBox, { childList: true, subtree: true });

  // Apply font style to entire chat container
  function updateChatFont() {
    chatBox.style.fontFamily = qolSettings.fontStyle || "";
  }

  // === FPS Counter ===
  let fpsEnabled = false;
  let fpsDiv = null;
  let lastFrame = performance.now();
  let frames = 0;
  let fps = 0;

  function createFpsCounter() {
    fpsDiv = document.createElement("div");
    fpsDiv.style.position = "absolute";
    fpsDiv.style.background = "rgba(0,0,0,0.5)";
    fpsDiv.style.color = "#0f0";
    fpsDiv.style.font = "12px monospace";
    fpsDiv.style.padding = "2px 5px";
    fpsDiv.style.zIndex = "9999";
    updateFpsPosition();
    document.body.appendChild(fpsDiv);
    requestAnimationFrame(updateFps);
  }

  function updateFps() {
    const now = performance.now();
    frames++;
    if (now - lastFrame >= 1000) {
      fps = frames;
      frames = 0;
      lastFrame = now;
      if (fpsDiv) fpsDiv.textContent = `FPS: ${fps}`;
    }
    if (fpsEnabled) requestAnimationFrame(updateFps);
  }

  function removeFpsCounter() {
    if (fpsDiv) {
      fpsDiv.remove();
      fpsDiv = null;
    }
  }

  function updateFpsPosition() {
    if (!fpsDiv) return;
    const pos = qolSettings.fpsPosition;
    fpsDiv.style.top = pos.includes("top") ? "5px" : "";
    fpsDiv.style.bottom = pos.includes("bottom") ? "5px" : "";
    fpsDiv.style.left = pos.includes("left") ? "5px" : "";
    fpsDiv.style.right = pos.includes("right") ? "5px" : "";
  }

  // === Settings Listeners ===
  const qolSettings = {
    fontStyle: "",
    highlightColor: "#07175e",
    fpsPosition: "top-right"
  };

  const chkFps = settingsForm.querySelector("input[name='chkFpsCounter']");
  chkFps.addEventListener("change", () => {
    fpsEnabled = chkFps.checked;
    if (fpsEnabled) {
      createFpsCounter();
    } else {
      removeFpsCounter();
    }
  });

  const selFont = settingsForm.querySelector("select[name='selFontStyle']");
  selFont.addEventListener("change", () => {
    qolSettings.fontStyle = selFont.value === "default" ? "" : selFont.value;
    updateChatFont();
  });

  const colorPicker = settingsForm.querySelector("input[name='highlightColor']");
  colorPicker.addEventListener("input", () => {
    qolSettings.highlightColor = colorPicker.value;
  });

  const selFpsPos = settingsForm.querySelector("select[name='selFpsPosition']");
  selFpsPos.addEventListener("change", () => {
    qolSettings.fpsPosition = selFpsPos.value;
    updateFpsPosition();
  });

  console.log("[MOC QoL] Settings injected with FPS + Font Style + Highlight Color + FPS Position");
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
        ':ban:': 'https://loociez.github.io/MOC-IV/images/emoji/ban.gif',
        ':bigbrain:': 'https://loociez.github.io/MOC-IV/images/emoji/bigbrain.gif',
        ':noob:': 'https://loociez.github.io/MOC-IV/images/emoji/noob.gif',
        ':classic:': 'https://loociez.github.io/MOC-IV/images/emoji/classic.gif',
        ':angry:': 'https://loociez.github.io/MOC-IV/images/emoji/angry.gif',
        ':noway:': 'https://loociez.github.io/MOC-IV/images/emoji/noway.gif',
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

    function processNode(node, chatContainer, wasAtBottom) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            node.innerHTML = replaceEmojis(node.innerHTML);

            // If user was already at bottom, make sure to scroll again after images load
            if (wasAtBottom) {
                const imgs = node.querySelectorAll('img');
                imgs.forEach(img => {
                    if (!img.complete) {
                        img.addEventListener('load', () => {
                            chatContainer.scrollTop = chatContainer.scrollHeight;
                        }, { once: true });
                    }
                });
            }
        }
    }

    function isNearBottom(container, pad = 10) {
        return container.scrollHeight - container.scrollTop <= container.clientHeight + pad;
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
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });

        observer.observe(chatContainer, { childList: true });

        console.log('Emoji module with smart autoscroll + image fix loaded.');
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
        clickButtonByTitle("Statistics");
        setTimeout(() => {
            clickButtonByText("Customize");
            setTimeout(() => {
                clickButtonByText("Potion");
                setTimeout(() => {
                    if (mode === "off") clickButtonByText("Off");
                    else if (mode === "50") clickButtonByText("50%");
                    else clickButtonByText("75%");
                    setTimeout(() => {
                        clickButtonByTitle("Back");
                    }, 300);
                }, 300);
            }, 300);
        }, 300);
    }

    // --- Claim Sequence ---
    function runClaimSequence() {
        clickButtonByTitle("Dungeons"); // Open Dungeons
        setTimeout(() => {
            clickButtonByText("Adventurer"); // Open Adventurer
            setTimeout(() => {
                clickButtonByText("Claim Daily Reward"); // Claim reward
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

