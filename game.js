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

// UI update functions

function updateUI() {
  goldText.innerText = `Gold: ${Math.floor(gold)}`;
  clickPowerCostText.innerText = upgrades.clickPower.cost;
  autoMinerCostText.innerText = upgrades.autoMiner.cost;
  rebirthText.innerText = `Rebirths: ${rebirths} | Bonus: x${rebirthBonus.toFixed(2)}`;
}

function updatePrestigeInfo() {
  document.getElementById('goldMagnetInfo').innerText =
    `Owned: ${prestigeUpgrades.goldMagnet} (Gold Bonus: ${prestigeUpgrades.goldMagnet * 10}%)`;

  document.getElementById('luckyTouchInfo').innerText =
    `Owned: ${prestigeUpgrades.luckyTouch} (Crit Chance: ${prestigeUpgrades.luckyTouch * 2}%)`;

  document.getElementById('clickForgeInfo').innerText =
    `Owned: ${prestigeUpgrades.clickForge} (+${prestigeUpgrades.clickForge} Click Power)`;

  document.getElementById('autoMinerBoostInfo').innerText =
    `Owned: ${prestigeUpgrades.autoMinerBoost} (+${prestigeUpgrades.autoMinerBoost} Gold/sec)`;

  document.getElementById('rebirthPowerInfo').innerText =
    `Owned: ${prestigeUpgrades.rebirthPower} (+${prestigeUpgrades.rebirthPower * 50}% Rebirth Bonus per rebirth)`;
}

function updateEvolutionImage() {
  const stage = Math.min(rebirths, 5);
  evolutionImage.src = `images/stage${stage}.png`;
}

// Main game actions

document.getElementById('mineBtn').addEventListener('click', (e) => {
  let gain = (goldPerClick + prestigeUpgrades.clickForge) * rebirthBonus;

  const isCrit = Math.random() * 100 < critChance;
  if (isCrit) {
    gain *= critMultiplier;
  }
  showClickEffect(e.clientX, e.clientY, `${isCrit ? 'CRIT! +' : '+'}${Math.floor(gain)}`, isCrit);

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
    updatePrestigeInfo();
  }
});

// Prestige upgrade purchase functions

function buyGoldMagnet() {
  if (rebirths >= 1) {
    rebirths--;
    prestigeUpgrades.goldMagnet++;
    goldBonusPercent += 10;
    updateUI();
    updatePrestigeInfo();
  }
}
function buyLuckyTouch() {
  if (rebirths >= 1) {
    rebirths--;
    prestigeUpgrades.luckyTouch++;
    critChance += 2;
    updateUI();
    updatePrestigeInfo();
  }
}
function buyClickForge() {
  if (rebirths >= 1) {
    rebirths--;
    prestigeUpgrades.clickForge++;
    updateUI();
    updatePrestigeInfo();
  }
}
function buyAutoMinerBoost() {
  if (rebirths >= 1) {
    rebirths--;
    prestigeUpgrades.autoMinerBoost++;
    updateUI();
    updatePrestigeInfo();
  }
}
function buyRebirthPower() {
  if (rebirths >= 1) {
    rebirths--;
    prestigeUpgrades.rebirthPower++;
    rebirthBonus = 1 + rebirths * (1 + prestigeUpgrades.rebirthPower * 0.5);
    updateUI();
    updatePrestigeInfo();
  }
}

// Attach prestige buy buttons

document.getElementById('buyGoldMagnet').addEventListener('click', buyGoldMagnet);
document.getElementById('buyLuckyTouch').addEventListener('click', buyLuckyTouch);
document.getElementById('buyClickForge').addEventListener('click', buyClickForge);
document.getElementById('buyAutoMinerBoost').addEventListener('click', buyAutoMinerBoost);
document.getElementById('buyRebirthPower').addEventListener('click', buyRebirthPower);

// Passive gold accumulation

setInterval(() => {
  let gain = (goldPerSecond + prestigeUpgrades.autoMinerBoost) * rebirthBonus;
  gain *= 1 + goldBonusPercent / 100;
  gold += gain;
  updateUI();
}, 1000);

// Visual effects

function showClickEffect(x, y, text, isCrit = false) {
  const span = document.createElement('span');
  span.className = 'floating-text';
  span.innerText = text;
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  if (isCrit) span.classList.add('crit');
  clickEffects.appendChild(span);
  setTimeout(() => span.remove(), 1000);

  if (isCrit) {
    createParticleBurst(x, y);
    shakeScreen();
  }
}

function createParticleBurst(x, y) {
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (i / 8) * 2 * Math.PI;
    const dist = 30 + Math.random() * 20;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty('--x', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--y', `${Math.sin(angle) * dist}px`);
    clickEffects.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

function shakeScreen() {
  const intensity = 5;
  const duration = 300;
  let elapsed = 0;
  const interval = 16;
  const body = document.body;

  const originalStyle = body.style.transform;

  function shake() {
    if (elapsed < duration) {
      const x = (Math.random() - 0.5) * intensity;
      const y = (Math.random() - 0.5) * intensity;
      body.style.transform = `translate(${x}px, ${y}px)`;
      elapsed += interval;
      setTimeout(shake, interval);
    } else {
      body.style.transform = originalStyle;
    }
  }
  shake();
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
    updatePrestigeInfo();
  }
}

setInterval(saveGame, 15000);

loadGame();
updateUI();
updateEvolutionImage();
updatePrestigeInfo();
