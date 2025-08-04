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

    // Add View Trade History button
    const historyBtn = document.createElement('button');
    historyBtn.textContent = "📜 View Trade History";
    historyBtn.title = "View past accepted trades";
    historyBtn.style = "margin-top: 10px;";
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
        <button style="float:right;" onclick="this.parentElement.remove()">❌ Close</button>
        <button onclick="localStorage.removeItem('${HISTORY_KEY}'); this.parentElement.remove()">🗑️ Clear All</button>
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
