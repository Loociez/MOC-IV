let gold = 0;
let goldPerClick = 1;
let goldPerSecond = 0;
let rebirths = 0;
let rebirthBonus = 1;

let critChance = 0;
let critMultiplier = 2;
let goldBonusPercent = 0;

// Prestige Upgrades (persist through rebirths)
let prestigeUpgrades = {
  goldMagnet: 0,
  luckyTouch: 0,
  clickForge: 0,
  autoMinerBoost: 0,
  rebirthPower: 0
};

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

function updateUI() {
  goldText.innerText = `Gold: ${Math.floor(gold)}`;
  clickPowerCostText.innerText = upgrades.clickPower.cost;
  autoMinerCostText.innerText = upgrades.autoMiner.cost;
  rebirthText.innerText = `Rebirths: ${rebirths} | Bonus: x${rebirthBonus.toFixed(2)}`;
}

function updateEvolutionImage() {
  const stage = Math.min(rebirths, 5);
  evolutionImage.src = `images/stage${stage}.png`;
}

document.getElementById('mineBtn').addEventListener('click', (e) => {
  let gain = (goldPerClick + prestigeUpgrades.clickForge) * rebirthBonus;

  const isCrit = Math.random() * 100 < critChance;
  if (isCrit) {
    gain *= critMultiplier;
    showClickEffect(e.clientX, e.clientY, `CRIT! +${Math.floor(gain)}`);
  } else {
    showClickEffect(e.clientX, e.clientY, `+${Math.floor(gain)}`);
  }

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
    rebirthBonus = 1 + rebirths * (1 + prestigeUpgrades.rebirthPower * 0.5);
    updateEvolutionImage();
    updateUI();
  }
});

setInterval(() => {
  let gain = (goldPerSecond + prestigeUpgrades.autoMinerBoost) * rebirthBonus;
  gain *= 1 + goldBonusPercent / 100;
  gold += gain;
  updateUI();
}, 1000);

function showClickEffect(x, y, text) {
  const span = document.createElement('span');
  span.className = 'floating-text';
  span.innerText = text;
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  clickEffects.appendChild(span);
  setTimeout(() => span.remove(), 1000);
}

// Prestige Functions
function buyGoldMagnet() {
  if (rebirths >= 1) {
    rebirths--;
    prestigeUpgrades.goldMagnet++;
    goldBonusPercent += 10;
    updateUI();
  }
}

function buyLuckyTouch() {
  if (rebirths >= 1) {
    rebirths--;
    prestigeUpgrades.luckyTouch++;
    critChance += 2;
    updateUI();
  }
}

function buyClickForge() {
  if (rebirths >= 1) {
    rebirths--;
    prestigeUpgrades.clickForge++;
    updateUI();
  }
}

function buyAutoMinerBoost() {
  if (rebirths >= 1) {
    rebirths--;
    prestigeUpgrades.autoMinerBoost++;
    updateUI();
  }
}

function buyRebirthPower() {
  if (rebirths >= 1) {
    rebirths--;
    prestigeUpgrades.rebirthPower++;
    rebirthBonus = 1 + rebirths * (1 + prestigeUpgrades.rebirthPower * 0.5);
    updateUI();
  }
}

// Save & Load
function saveGame() {
  const saveData = {
    gold,
    goldPerClick,
    goldPerSecond,
    rebirths,
    rebirthBonus,
    critChance,
    goldBonusPercent,
    prestigeUpgrades,
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
    prestigeUpgrades = data.prestigeUpgrades || prestigeUpgrades;

    upgrades.clickPower.cost = data.upgrades?.clickPowerCost || 10;
    upgrades.autoMiner.cost = data.upgrades?.autoMinerCost || 50;

    rebirthBonus = 1 + rebirths * (1 + prestigeUpgrades.rebirthPower * 0.5);
    updateUI();
    updateEvolutionImage();
  }
}

setInterval(saveGame, 15000);
updateUI();
updateEvolutionImage();
loadGame();
