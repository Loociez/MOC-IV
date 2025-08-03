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
