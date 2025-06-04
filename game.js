let gold = 0;
let goldPerClick = 1;
let goldPerSecond = 0;
let rebirths = 0;
let rebirthBonus = 1;

const upgrades = {
  clickPower: { cost: 10, power: 1 },
  autoMiner: { cost: 50, gps: 1 }
};

const goldText = document.getElementById('gold');
const rebirthText = document.getElementById('rebirths');
const gpcText = document.getElementById('gpc');
const clickPowerCostText = document.getElementById('clickPowerCost');
const autoMinerCostText = document.getElementById('autoMinerCost');
const clickEffects = document.getElementById('click-effects');

// UI Updates
function updateUI() {
  goldText.innerText = `Gold: ${Math.floor(gold)}`;
  gpcText.innerText = goldPerClick;
  clickPowerCostText.innerText = upgrades.clickPower.cost;
  autoMinerCostText.innerText = upgrades.autoMiner.cost;
  rebirthText.innerText = `Rebirths: ${rebirths} | Bonus: x${rebirthBonus}`;
}

// Click Event
document.getElementById('mineBtn').addEventListener('click', (e) => {
  const gain = goldPerClick * rebirthBonus;
  gold += gain;
  showClickEffect(e.clientX, e.clientY, `+${gain}`);
  updateUI();
});

// Buy Click Power
document.getElementById('clickUpgradeBtn').addEventListener('click', () => {
  const up = upgrades.clickPower;
  if (gold >= up.cost) {
    gold -= up.cost;
    goldPerClick += up.power;
    up.cost = Math.floor(up.cost * 1.5);
    updateUI();
  }
});

// Buy Auto Miner
document.getElementById('autoMinerBtn').addEventListener('click', () => {
  const up = upgrades.autoMiner;
  if (gold >= up.cost) {
    gold -= up.cost;
    goldPerSecond += up.gps;
    up.cost = Math.floor(up.cost * 1.7);
    updateUI();
  }
});

// Rebirth
document.getElementById('rebirthBtn').addEventListener('click', () => {
  if (gold >= 1000) {
    gold = 0;
    goldPerClick = 1;
    goldPerSecond = 0;
    upgrades.clickPower.cost = 10;
    upgrades.autoMiner.cost = 50;
    rebirths++;
    rebirthBonus = 1 + rebirths;
    updateUI();
  }
});

// Passive income
setInterval(() => {
  gold += goldPerSecond * rebirthBonus;
  updateUI();
}, 1000);

// Click effect visuals
function showClickEffect(x, y, text) {
  const span = document.createElement('span');
  span.className = 'floating-text';
  span.innerText = text;
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  clickEffects.appendChild(span);
  setTimeout(() => span.remove(), 1000);
}
function saveGame() {
  const saveData = {
    gold,
    goldPerClick,
    goldPerSecond,
    rebirths,
    rebirthBonus,
    upgrades: {
      clickPowerCost: upgrades.clickPower.cost,
      autoMinerCost: upgrades.autoMiner.cost
    }
  };
  localStorage.setItem('idleClickerSave', JSON.stringify(saveData));
  console.log("Game Saved");
}

function loadGame() {
  const saved = localStorage.getItem('idleClickerSave');
  if (saved) {
    const data = JSON.parse(saved);
    gold = data.gold || 0;
    goldPerClick = data.goldPerClick || 1;
    goldPerSecond = data.goldPerSecond || 0;
    rebirths = data.rebirths || 0;
    rebirthBonus = data.rebirthBonus || 1;

    upgrades.clickPower.cost = data.upgrades?.clickPowerCost || 10;
    upgrades.autoMiner.cost = data.upgrades?.autoMinerCost || 50;

    updateUI();
    console.log("Game Loaded");
  }
}


// Initial render
updateUI();
// Auto-save every 15 seconds
setInterval(() => {
  saveGame();
}, 15000);

