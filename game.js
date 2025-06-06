// --- Game Variables ---
let gold = 0;
let goldPerClick = 1;
let goldPerSecond = 0;

let rebirthLevel = 0;
let rebirthPoints = 0;
let rebirthCost = 1000;
let rebirthBonus = 1;

let critChance = 0;
let critMultiplier = 2;
let goldBonusPercent = 0;

// --- Prestige Upgrades ---
let prestigeUpgrades = {
  goldMagnet: 0,
  luckyTouch: 0,
  clickForge: 0,
  autoMinerBoost: 0,
  rebirthPower: 0,
  megaMiner: 0,
  critMastery: 0,
  efficientClicks: 0
};

const upgrades = {
  clickPower: { cost: 10, power: 1 },
  autoMiner: { cost: 50, gps: 1 }
};

// --- DOM Elements ---
const goldText = document.getElementById('gold');
const rebirthText = document.getElementById('rebirths');
const clickPowerCostText = document.getElementById('clickPowerCost');
const autoMinerCostText = document.getElementById('autoMinerCost');
const clickEffects = document.getElementById('click-effects');
const evolutionImage = document.getElementById('evolutionImage');

// --- UI Update ---
function updateUI() {
  goldText.innerText = `Gold: ${Math.floor(gold)}`;
  clickPowerCostText.innerText = upgrades.clickPower.cost;
  autoMinerCostText.innerText = upgrades.autoMiner.cost;
  rebirthText.innerText = `Rebirth Level: ${rebirthLevel} | Bonus: x${rebirthBonus.toFixed(2)}`;
  document.getElementById('rebirthPointsDisplay').innerText = `Rebirth Points: ${rebirthPoints}`;
  document.getElementById('rebirthBtn').innerText = `Rebirth (Cost: ${rebirthCost} Gold)`;
}

function updatePrestigeInfo() {
  document.getElementById('goldMagnetInfo').innerText = `Owned: ${prestigeUpgrades.goldMagnet} (+${prestigeUpgrades.goldMagnet * 10}% Gold Bonus)`;
  document.getElementById('luckyTouchInfo').innerText = `Owned: ${prestigeUpgrades.luckyTouch} (+${prestigeUpgrades.luckyTouch * 2}% Crit Chance)`;
  document.getElementById('clickForgeInfo').innerText = `Owned: ${prestigeUpgrades.clickForge} (+${prestigeUpgrades.clickForge} Click Power)`;
  document.getElementById('autoMinerBoostInfo').innerText = `Owned: ${prestigeUpgrades.autoMinerBoost} (+${prestigeUpgrades.autoMinerBoost} Gold/sec)`;
  document.getElementById('rebirthPowerInfo').innerText = `Owned: ${prestigeUpgrades.rebirthPower} (+${prestigeUpgrades.rebirthPower * 50}% Rebirth Bonus)`;
  document.getElementById('megaMinerInfo').innerText = `Owned: ${prestigeUpgrades.megaMiner} (+${prestigeUpgrades.megaMiner * 5} Gold/sec)`;
  document.getElementById('critMasteryInfo').innerText = `Owned: ${prestigeUpgrades.critMastery} (+${prestigeUpgrades.critMastery * 0.5}x Crit Damage)`;
  document.getElementById('efficientClicksInfo').innerText = `Owned: ${prestigeUpgrades.efficientClicks} (+${prestigeUpgrades.efficientClicks}% Click Gold Bonus)`;
}

function updateEvolutionImage() {
  const stage = Math.min(rebirthLevel, 5);
  evolutionImage.src = `images/stage${stage}.png`;
}

// --- Click & Rebirth ---
document.getElementById('mineBtn').addEventListener('click', (e) => {
  let gain = (goldPerClick + prestigeUpgrades.clickForge) * rebirthBonus;
  gain *= 1 + (goldBonusPercent + prestigeUpgrades.efficientClicks) / 100;

  const isCrit = Math.random() * 100 < critChance;
  if (isCrit) gain *= critMultiplier + prestigeUpgrades.critMastery * 0.5;

  showClickEffect(e.clientX, e.clientY, `${isCrit ? 'CRIT! +' : '+'}${Math.floor(gain)}`, isCrit);
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
  if (gold >= rebirthCost) {
    gold = 0;
    goldPerClick = 1;
    goldPerSecond = 0;
    upgrades.clickPower.cost = 10;
    upgrades.autoMiner.cost = 50;

    rebirthLevel++;
    rebirthPoints++;
    rebirthCost *= 2;
    recalculateRebirthBonus();

    updateEvolutionImage();
    updateUI();
    updatePrestigeInfo();
  } else {
    alert(`You need at least ${rebirthCost} Gold to rebirth!`);
  }
});

// --- Prestige Buying ---
function buyUpgrade(type) {
  if (rebirthPoints >= 1) {
    rebirthPoints--;
    prestigeUpgrades[type]++;
    if (type === "goldMagnet") goldBonusPercent += 10;
    if (type === "luckyTouch") critChance += 2;
    if (type === "rebirthPower") recalculateRebirthBonus();
    updateUI();
    updatePrestigeInfo();
  } else {
    alert("You don't have enough Rebirth Points.");
  }
}

function recalculateRebirthBonus() {
  rebirthBonus = 1 + rebirthLevel * (1 + prestigeUpgrades.rebirthPower * 0.5);
}

// --- Attach Prestige Buttons ---
[
  "goldMagnet",
  "luckyTouch",
  "clickForge",
  "autoMinerBoost",
  "rebirthPower",
  "megaMiner",
  "critMastery",
  "efficientClicks"
].forEach(id => {
  document.getElementById(`buy${capitalize(id)}`).addEventListener('click', () => buyUpgrade(id));
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Passive Income ---
setInterval(() => {
  let gain = (goldPerSecond + prestigeUpgrades.autoMinerBoost + prestigeUpgrades.megaMiner * 5) * rebirthBonus;
  gain *= 1 + goldBonusPercent / 100;
  gold += gain;
  updateUI();
}, 1000);

// --- Effects ---
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
  const intensity = 5, duration = 300;
  let elapsed = 0, interval = 16;
  const body = document.body, originalStyle = body.style.transform;
  function shake() {
    if (elapsed < duration) {
      const x = (Math.random() - 0.5) * intensity;
      const y = (Math.random() - 0.5) * intensity;
      body.style.transform = `translate(${x}px, ${y}px)`;
      elapsed += interval;
      setTimeout(shake, interval);
    } else body.style.transform = originalStyle;
  }
  shake();
}

// --- Save/Load/Reset ---
function saveGame() {
  const saveData = {
    gold, goldPerClick, goldPerSecond,
    rebirthLevel, rebirthPoints, rebirthCost,
    rebirthBonus, critChance, goldBonusPercent,
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
    Object.assign(this, data);
    prestigeUpgrades = data.prestigeUpgrades || prestigeUpgrades;
    upgrades.clickPower.cost = data.upgrades?.clickPowerCost || 10;
    upgrades.autoMiner.cost = data.upgrades?.autoMinerCost || 50;
    recalculateRebirthBonus();
    updateUI();
    updateEvolutionImage();
    updatePrestigeInfo();
  }
}

function resetGame() {
  if (confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
    localStorage.removeItem('idleClickerSave');
    location.reload();
  }
}

document.getElementById('resetBtn').addEventListener('click', resetGame);

setInterval(saveGame, 15000);
loadGame();
updateUI();
updateEvolutionImage();
updatePrestigeInfo();
