import { Fighter } from './fighter.js';

function getRandomCharacterIndex() {
  return Math.floor(Math.random() * 32);
}

/* =========================
   CONFIG (NEW)
========================= */
const BETTING_TIME = 5;      // seconds before fight starts
const NEXT_FIGHT_TIME = 15;  // seconds between fights

/* =========================
   BACKGROUND
========================= */
const backgroundImages = [
  './background1.jpg',
  './background2.jpg',
  './background3.jpg',
];

let background = new Image();

/* =========================
   CANVAS
========================= */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 825;
canvas.height = 400;

/* =========================
   ARENA FEED HOOK
========================= */
function log(msg, type = "system") {
  if (window.pushFightLog) {
    window.pushFightLog(msg, type);
  }
}

/* =========================
   GAME STATE
========================= */
let playerMoney = parseInt(localStorage.getItem('playerMoney')) || 1000;
let currentBet = null;
let betAmount = 0;

let bettingActive = true;
let fightActive = false;
let fightEnded = false;

let roundNumber = 1;

/* =========================
   TIME SYSTEM (FIXED)
========================= */
let stateStartTime = performance.now();
let stateDuration = BETTING_TIME * 1000;

/* =========================
   BETWEEN FIGHTS
========================= */
let waitingForNextFight = false;

/* =========================
   BOUNDS
========================= */
const bounds = {
  left: 50,
  right: 750
};

/* =========================
   AI SYSTEM (UNCHANGED)
========================= */
const AI_FILES = [
  './ai/aggressive.js',
  './ai/counteraggressive.js',
  './ai/kitemaster.js',
  './ai/temporal.js',
  './ai/trickster.js',
  './ai/burst.js',
  './ai/tactical.js'
];

const AI_REGISTRY = [];

function normalizeAI(mod) {
  if (!mod) return null;

  if (typeof mod === 'function') {
    return { name: mod.name || 'Unnamed AI', logic: mod };
  }

  if (typeof mod.logic === 'function') {
    return { name: mod.name || 'Unnamed AI', logic: mod.logic };
  }

  return null;
}

async function loadAI(path) {
  try {
    const mod = await import(path);
    return normalizeAI(mod.default || mod);
  } catch (e) {
    console.warn(`AI failed to load: ${path}`, e);
    return null;
  }
}

async function loadAllAIs() {
  for (const path of AI_FILES) {
    const ai = await loadAI(path);
    if (ai) AI_REGISTRY.push(ai);
  }
  console.log(`Loaded AI: ${AI_REGISTRY.length}`);
}

function getRandomAI() {
  if (AI_REGISTRY.length === 0) return fallbackAI;
  return AI_REGISTRY[Math.floor(Math.random() * AI_REGISTRY.length)];
}

/* =========================
   FALLBACK AI
========================= */
const fallbackAI = {
  name: "Fallback AI",
  logic(self, opponent, bounds) {
    const dist = opponent.x - self.x;

    if (self.x <= bounds.left) return 'moveRight';
    if (self.x >= bounds.right) return 'moveLeft';

    if (Math.abs(dist) > 120) return dist > 0 ? 'moveRight' : 'moveLeft';

    if (self.cooldown === 0 && Math.random() < 0.3) return 'attack';

    return Math.random() < 0.5 ? 'moveLeft' : 'moveRight';
  }
};

/* =========================
   FIGHTERS
========================= */
let fighter1;
let fighter2;

/* =========================
   UI
========================= */
const betBlueBtn = document.getElementById('betBlue');
const betRedBtn = document.getElementById('betRed');
const currentBetDisplay = document.getElementById('currentBet');
const resultDisplay = document.getElementById('result');
const playerMoneyDisplay = document.getElementById('playerMoneyDisplay');
const betAmountInput = document.getElementById('betAmountInput');

const roundDisplay = document.getElementById('roundDisplay');

function updateMoneyDisplay() {
  playerMoneyDisplay.textContent = `Money: $${playerMoney}`;
}

/* =========================
   RESET FIGHT
========================= */
async function resetFight() {
  const ai1 = getRandomAI();
  const ai2 = getRandomAI();

  fighter1 = new Fighter(
    150,
    'blue',
    (self, opponent) => ai1.logic(self, opponent, bounds),
    getRandomCharacterIndex()
  );

  fighter2 = new Fighter(
    600,
    'red',
    (self, opponent) => ai2.logic(self, opponent, bounds),
    getRandomCharacterIndex()
  );

  fighter1.aiName = ai1.name;
  fighter2.aiName = ai2.name;

  background.src =
    backgroundImages[Math.floor(Math.random() * backgroundImages.length)];

  bettingActive = true;
  fightActive = false;
  fightEnded = false;

  currentBet = null;
  betAmount = 0;

  currentBetDisplay.textContent = 'Current bet: None';
  resultDisplay.textContent = '';

  roundDisplay.textContent = `Round: ${roundNumber}`;

  betBlueBtn.disabled = false;
  betRedBtn.disabled = false;
  betAmountInput.disabled = false;

  /* reset timer */
  stateStartTime = performance.now();
  stateDuration = BETTING_TIME * 1000;

  log(`🆕 Round ${roundNumber} starting...`, "system");
}

/* =========================
   COUNTDOWN (FIXED)
========================= */
function getCountdownSeconds() {
  const elapsed = performance.now() - stateStartTime;
  return Math.max(0, Math.ceil((stateDuration - elapsed) / 1000));
}

/* =========================
   HP BAR
========================= */
function drawHPBar(fighter, x, y) {
  const width = 160;
  const hpPercent = fighter.hp / fighter.maxHp;

  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, width, 16);

  ctx.fillStyle = fighter.color;
  ctx.fillRect(x, y, width * hpPercent, 16);

  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, width, 16);

  ctx.fillStyle = 'white';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';

  ctx.fillText(
    `${fighter.name} | ${fighter.aiName}`,
    x + width / 2,
    y - 8
  );

  ctx.fillText(
    `${Math.floor(fighter.hp)} / ${fighter.maxHp}`,
    x + width / 2,
    y + 30
  );
}

/* =========================
   GAME LOOP
========================= */
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (background.complete) {
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  }

  fighter1?.draw(ctx);
  fighter2?.draw(ctx);

  if (fighter1 && fighter2) {
    drawHPBar(fighter1, 50, 20);
    drawHPBar(fighter2, 580, 20);
  }

  /* =========================
     CENTER COUNTDOWN (FIXED)
  ========================= */
  const countdown = getCountdownSeconds();

  if (countdown > 0) {
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }

  /* =========================
     STATE TRANSITION (FIXED)
  ========================= */
  const elapsed = performance.now() - stateStartTime;

  if (bettingActive && elapsed >= stateDuration) {
    bettingActive = false;
    fightActive = true;

    log("⚔️ Fight Started!", "system");
  }

  if (fightActive) {
    fighter1.update(fighter2, bounds);
    fighter2.update(fighter1, bounds);

    if (fighter1.hp <= 0 || fighter2.hp <= 0) {
      fightActive = false;
      fightEnded = true;

      const winner = fighter1.hp > 0 ? 'blue' : 'red';

      log(`🏆 ${winner.toUpperCase()} wins the fight!`, "ko");

      waitingForNextFight = true;

      stateStartTime = performance.now();
      stateDuration = NEXT_FIGHT_TIME * 1000;

      roundNumber++;
    }
  }

  if (waitingForNextFight && elapsed >= stateDuration) {
    waitingForNextFight = false;
    resetFight();
  }

  requestAnimationFrame(gameLoop);
}

/* =========================
   START
========================= */
(async () => {
  await loadAllAIs();
  updateMoneyDisplay();
  await resetFight();
  gameLoop();
})();