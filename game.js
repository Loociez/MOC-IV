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
const evolutionImage = document.getElementById('evolutionImage');

// UI Updates
function updateUI() {
  goldText.innerText = `Gold: ${Math.floor(gold)}`;
  gpcText.innerText = goldPerClick;
  clickPowerCostText.innerText = upgrades.clickPower.cost;
  autoMinerCostText.innerText = upgrades.autoMiner.cost;
  rebirthText.innerText = `Rebirths: ${rebirths} | Bonus: x${rebirthBonus}`;
}

// Update evolution image based on rebirths
function updateEvolutionImage() {
  const stage = Math.min(rebirths, 5); // You can expand beyond 5
  evolutionImage.src = `images/stage${stage}.png`;
}

// Click to gain gold
document.getElementById('mineBtn').addEventListener('click', (e) => {
  const gain = goldPerClick * rebirthBonus;
  gold += gain;
  showClickEffect(e.clientX, e.clientY, `+${gain}`);
  updateUI();
});

// Buy click power upgrade
document.getElementById('clickUpgradeBtn').addEventListener('click', () => {
  const up = upgrades.clickPower;
  if (gold >= up.cost) {
    gold -= up.cost;
    goldPerClick += up.power;
    up.cost = Math.floor(up.cost * 1.5);
    updateUI();
  }
});

// Buy auto miner upgrade
document.getElementById('autoMinerBtn').addEventListener('click', () => {
  const up = upgrades.autoMiner;
  if (gold >= up.cost) {
    gold -= up.cost;
    goldPerSecond += up.gps;
    up.cost = Math.floor(up.cost * 1.7);
    updateUI();
  }
});

// Rebirth system
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
    updateEvolutionImage();
  }
});

// Passive income loop
setInterval(() => {
  gold += goldPerSecond * rebirthBonus;
  updateUI();
}, 1000);

// Show floating click effect
function showClickEffect(x, y, text) {
  const span = document.createElement('span');
  span.className = 'floating-text';
  span.innerText = text;
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  clickEffects.appendChild(span);
  setTimeout(() => span.remove(), 1000);
}

// Save game to localStorage
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

// Load game from localStorage
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
    updateEvolutionImage();
    console.log("Game Loaded");
  }
}

// Auto-save every 15 seconds
setInterval(() => {
  saveGame();
}, 15000);

// Initial render
updateUI();
updateEvolutionImage();
loadGame(); // Optional: auto-load on page load
