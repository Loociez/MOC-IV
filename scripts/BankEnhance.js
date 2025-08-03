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
