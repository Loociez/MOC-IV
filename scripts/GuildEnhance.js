(() => {
  const panelId = 'winGuildEditor';
  let intervalId = null;

  function updateGuildColors() {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const selDeclarations = panel.querySelector('select[name="selDeclarations"]');
    if (selDeclarations) {
      Array.from(selDeclarations.options).forEach(option => {
        const text = option.text.toLowerCase();
        if (text.endsWith('(war)')) {
          option.style.color = 'red';
        } else if (text.endsWith('(alliance)')) {
          option.style.color = 'green';
        } else if (text.endsWith('(neutral)')) {
          option.style.color = 'gray';
        } else {
          option.style.color = '';
        }
      });
    }

    const feeElem = panel.querySelector('.guildFee');
    if (feeElem) {
      const feeText = feeElem.textContent || '';
      if (feeText.toLowerCase().includes('fee')) {
        feeElem.style.color = 'orange';
      } else {
        feeElem.style.color = '';
      }
    }
  }

  function hookGuildSelection() {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const guildSelect = panel.querySelector('select[name="selGuild"]');
    if (!guildSelect) return;

    // Remove previous listener to avoid duplicates
    guildSelect.removeEventListener('change', onGuildChange);
    guildSelect.addEventListener('change', onGuildChange);
  }

  function onGuildChange() {
    // Delay a bit to allow panel contents to update
    setTimeout(updateGuildColors, 200);
  }

  // Hook the Guilds button to start the update loop when opened and stop when closed
  function hookGuildsButton() {
    const guildsBtn = document.querySelector('button[title="Guilds"]');
    if (!guildsBtn) {
      console.warn('Guilds button not found');
      return;
    }

    guildsBtn.addEventListener('click', () => {
      // Wait a bit for the panel to open and populate
      setTimeout(() => {
        // First run color update and hook guild selection change
        updateGuildColors();
        hookGuildSelection();

        // Clear any previous interval just in case
        if (intervalId) clearInterval(intervalId);

        // Start interval to update colors every 30 seconds while panel is open
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

  // Run the hook on script load
  hookGuildsButton();

  // Optional: If the panel might already be open, start interval and hook immediately
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
