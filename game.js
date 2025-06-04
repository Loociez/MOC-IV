let gold = 0;
let goldPerClick = 1;
let goldPerSecond = 0;
let rebirths = 0;
let rebirthBonus = 1;

let critChance = 0; // %
let critMultiplier = 2;
let goldBonusPercent = 0; // From Gold Magnet

const upgrades = {
  clickPower: { cost: 10, power: 1 },
  autoMiner: { cost: 50, gps: 1 }
};

const goldText = document.getElementById('gold');
const rebirthText = document.getElementById('rebirths');
const clickPowerCostText = document.getElementById('clickPowerCost');
const autoMinerCostText = document.getElementById('autoMinerCost');
const clickEffects = document.getElementById('click-effects');
const evolutionImage = document.getElementById('evolutionImage');

// UI Updates
function updateUI() {
  goldText.innerText = `Gold: ${Math.floor(gold)}`;
  clickPowerCostText.innerText = upgrades.clickPower.cost;
  autoMinerCostText.innerText = upgrades.autoMiner.cost;
  rebirthText.innerText = `Rebirths: ${rebirths} | Bonus: x${rebirthBonus}`;
}

function updateEvolutionImage() {
  const stage = Math.min(rebirths, 5);
  evolutionImage.src = `images/stage${stage}.png`;
}

document.getElementById('mineBtn').addEventListener('click', (e) => {
  let gain = goldPerClick * rebirthBonus;
  
  // Apply crit
  const isCrit = Math.random() * 100 < critChance;
  if (isCrit) {
    gain *= critMultiplier;
    showClickEffect(e.clientX, e.clientY, `CRIT! +${gain}`);
  } else {
    showClickEffect(e.clientX, e.clientY, `+${gain}`);
  }

  // Apply global % bonus
  gain *= 1 + goldBonusPercent / 100;
  gold += gain;
  updateUI();
});

document.getElementById('clickUpgradeBtn').addEventListener('click', () => {
  const up = upgrades.clickPower;
  if (gold >= up.cost) {
    gold -= up.cost;
    goldPerClick += up.power;
    up.cost = Math.floor(up.cost * 1.5);
    updateUI();
  }
});

document.getElementById('autoMinerBtn').addEventListener('click', () => {
  const up = upgrades.autoMiner;
  if (gold >= up.cost) {
    gold -= up.cost;
    goldPerSecond += up.gps;
    up.cost = Math.floor(up.cost * 1.7);
    updateUI();
  }
});

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

// Passive gold
setInterval(() => {
  let gain = goldPerSecond * rebirthBonus;
  gain *= 1 + goldBonusPercent / 100;
  gold += gain;
  updateUI();
}, 1000);

// Click effects
function showClickEffect(x, y, text) {
  const span = document.createElement('span');
  span.className = 'floating-text';
  span.innerText = text;
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  clickEffects.appendChild(span);
  setTimeout(() => span.remove(), 1000);
}

// Save / Load
function saveGame() {
  const saveData = {
    gold,
    goldPerClick,
    goldPerSecond,
    rebirths,
    rebirthBonus,
    critChance,
    goldBonusPercent,
    upgrades: {
      clickPowerCost: upgrades.clickPower.cost,
      autoMinerCost: upgrades.autoMiner.cost
    }
  };
  localStorage.setItem('idleClickerSave', JSON.stringify(saveData));
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
    critChance = data.critChance || 0;
    goldBonusPercent = data.goldBonusPercent || 0;

    upgrades.clickPower.cost = data.upgrades?.clickPowerCost || 10;
    upgrades.autoMiner.cost = data.upgrades?.autoMinerCost || 50;

    updateUI();
    updateEvolutionImage();
  }
}

setInterval(saveGame, 15000);

// Prestige Shop
function buyGoldMagnet() {
  if (rebirths >= 1) {
    rebirths -= 1;
    goldBonusPercent += 10;
    updateUI();
  }
}

function buyLuckyTouch() {
  if (rebirths >= 1) {
    rebirths -= 1;
    critChance += 2;
    updateUI();
  }
}

// Start game
updateUI();
updateEvolutionImage();
loadGame();
