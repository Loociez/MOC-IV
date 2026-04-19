import { Fighter } from './fighter.js';
import { recordResult, getOdds, getAIStats, renderLeaderboardUI } from './rankingSystem.js';


function getRandomCharacterIndex() {
  return Math.floor(Math.random() * 32);
}

/* =========================
   MUSIC PLAYLIST (FIXED SYNC)
========================= */
const MUSIC_PLAYLIST = [
  { name: "Psychronic - Binary battle", src: "./music/song1.mp3" },
  { name: "the_mountain - Sport", src: "./music/song2.mp3" },
  { name: "Coma-media - Rock it", src: "./music/song3.mp3" },
  { name: "Nastelbom - Epic cinematic", src: "./music/song4.mp3" },
  { name: "Warriyo, Rameses B - Mortals (Rameses B Remix)", src: "./music/song6.mp3" },
  { name: "Barren Gates, Taylor Ravenna - Slip Thru", src: "./music/song7.mp3" },
  { name: "Lost Sky, Shiah Maisel - Lost pt. IIc", src: "./music/song8.mp3" },
  { name: "TANTRON, More Plastic - CERBERUS", src: "./music/song9.mp3" },
  { name: "Sapan4 - EDM gaming", src: "./music/song5.mp3" }
];

let musicIndex = 0;
let currentMusic = new Audio();
currentMusic.volume = 0.5;

let activeSong = null;

/* =========================
   CONFIG (NEW)
========================= */
const BETTING_TIME = 5;
const NEXT_FIGHT_TIME = 10;

/* ✅ ADDED */
const FIGHT_TIME = 120;

/* =========================
   BACKGROUND
========================= */
const backgroundImages = [
  './background1.jpg',
  './background2.jpg',
  './background3.jpg',
  './background4.jpg',
  './background5.jpg',
  './background6.jpg'
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

/* ✅ ADDED */
let fightStartTime = 0;

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
  './ai/adaptive.js',
  './ai/hyper.js',
  './ai/customAI.js',
  './ai/controller.js',
  './ai/berserker.js',
  './ai/adtrickster.js',
  './ai/omni.js',
  './ai/godspeed.js',
  './ai/hyperblitz.js',
  './ai/mageblade.js',
  './ai/vectorknight.js',
  './ai/chronopredator.js',
  './ai/tactical.js'
];

const AI_REGISTRY = [];

function normalizeAI(mod) {
  if (!mod) return null;

  // function-style export
  if (typeof mod === 'function') {
    return { 
      name: mod.name || 'Unnamed AI', 
      logic: mod,
      characterIndex: mod.characterIndex ?? null,
      spriteSheetIndex: mod.spriteSheetIndex ?? null
    };
  }

  // object-style export (YOUR CASE)
  if (typeof mod.default === 'function') {
    return {
      name: mod.name || 'Unnamed AI',
      logic: mod.default,
      characterIndex: mod.characterIndex ?? null,
      spriteSheetIndex: mod.spriteSheetIndex ?? null
    };
  }

  // fallback
  if (typeof mod.logic === 'function') {
    return { 
      name: mod.name || 'Unnamed AI', 
      logic: mod.logic,
      characterIndex: mod.characterIndex ?? null,
      spriteSheetIndex: mod.spriteSheetIndex ?? null
    };
  }

  return null;
}

async function loadAI(path) {
  try {
    const mod = await import(path);
    return normalizeAI(mod); // ✅ PASS FULL MODULE
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
   MUSIC CONTROL (FIXED)
========================= */
function playFightMusic() {
  if (MUSIC_PLAYLIST.length === 0) return null;

  const song = MUSIC_PLAYLIST[musicIndex];

  currentMusic.pause();
  currentMusic.currentTime = 0;
  currentMusic.src = song.src;

  currentMusic.play().catch(() => {});

  activeSong = song;

  musicIndex = (musicIndex + 1) % MUSIC_PLAYLIST.length;

  return song;
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
   MUTE LOGIC
========================= */
const muteBtn = document.getElementById("muteBtn");

muteBtn.addEventListener("click", () => {
  // Toggle the muted property on your currentMusic object
  currentMusic.muted = !currentMusic.muted;

  // Update the button text to show the current state
  if (currentMusic.muted) {
    muteBtn.innerText = "🔇 Unmute Music";
  } else {
    muteBtn.innerText = "🔊 Mute Music";
  }
});


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
  ai1.characterIndex ?? getRandomCharacterIndex(),
  ai1.spriteSheetIndex ?? 1
);

fighter2 = new Fighter(
  600,
  'red',
  (self, opponent) => ai2.logic(self, opponent, bounds),
  ai2.characterIndex ?? getRandomCharacterIndex(),
  ai2.spriteSheetIndex ?? 1
);

  fighter1.aiName = ai1.name;
  fighter2.aiName = ai2.name;

  background.src =
    backgroundImages[Math.floor(Math.random() * backgroundImages.length)];

  bettingActive = true;
fightActive = false;
fightEnded = false;
waitingForNextFight = false;

  currentBet = null;
  betAmount = 0;

  currentBetDisplay.textContent = 'Current bet: None';
  resultDisplay.textContent = '';

  roundDisplay.textContent = `Round: ${roundNumber}`;

  betBlueBtn.disabled = false;
  betRedBtn.disabled = false;
  betAmountInput.disabled = false;

  currentMusic.pause();
  currentMusic.currentTime = 0;
  activeSong = null;

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

  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const nameText = `${fighter.name} | ${fighter.aiName}`;
  const nameX = x + width / 2;
  const nameY = y - 10;

  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.strokeText(nameText, nameX, nameY);

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.strokeText(nameText, nameX, nameY);

  ctx.fillStyle = '#ffd166';
  ctx.fillText(nameText, nameX, nameY);

  const hpText = `${Math.floor(fighter.hp)} / ${fighter.maxHp}`;

  ctx.font = '11px Arial';

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.strokeText(hpText, nameX, y + 30);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(hpText, nameX, y + 30);
}
function drawFightTimer() {
  if (!fightActive) return;

  const elapsed = (performance.now() - fightStartTime) / 1000;
  const timeLeft = Math.max(0, Math.ceil(FIGHT_TIME - elapsed));

  const x = canvas.width / 2;
  const y = 40;

  ctx.save();

  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 🔥 outline (thick black)
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.strokeText(timeLeft, x, y);

  // ✨ inner glow outline
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.strokeText(timeLeft, x, y);

  // 🎯 main text
  ctx.fillStyle = timeLeft <= 10 ? '#ff3b3b' : '#ffd166'; // red when low
  ctx.fillText(timeLeft, x, y);

  ctx.restore();
}

/* =========================
   GAME LOOP
========================= */
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
if (!fightActive && !waitingForNextFight) {
  bettingActive = true;
  window.setBettingAllowed?.(true);
}
  if (background.complete) {
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  }

  fighter1?.draw(ctx);
  fighter2?.draw(ctx);

  if (fighter1 && fighter2) {
  drawHPBar(fighter1, 50, 20);
  drawHPBar(fighter2, 580, 20);

  // 🕒 ROUND TIMER
  drawFightTimer();
}

  const countdown = getCountdownSeconds();

  if (countdown > 0) {
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);

    if (activeSong) {
      ctx.font = '16px Arial';
      ctx.fillText(activeSong.name, canvas.width / 2, canvas.height / 2 + 60);
    }

    ctx.restore();
  }

  const elapsed = performance.now() - stateStartTime;

  if (bettingActive && elapsed >= stateDuration) {
  bettingActive = false;
  fightActive = true;

  window.setBettingAllowed?.(false);

  const song = playFightMusic();

  fightStartTime = performance.now();

  // 🎬 DRAMATIC START
  window.effects?.startRound();

  // 🎥 ZOOM IN
  canvas.style.transform = "scale(1.2)";
  setTimeout(() => {
    canvas.style.transform = "scale(1)";
  }, 400);

  const odds = getOdds(fighter1.aiName, fighter2.aiName);

log("⚔️ Fight Started!", "system");
log(`📊 ${fighter1.aiName} odds: x${odds[fighter1.aiName]}`, "system");
log(`📊 ${fighter2.aiName} odds: x${odds[fighter2.aiName]}`, "system");
  log(`🎵 Now Playing: ${song?.name}`, "system");
}

  if (fightActive) {
    fighter1.update(fighter2, bounds);
    fighter2.update(fighter1, bounds);

    /* ✅ TIMER CHECK */
    const fightElapsed = (performance.now() - fightStartTime) / 1000;

    if (fightElapsed >= FIGHT_TIME) {
      fightActive = false;
      fightEnded = true;

      let winner = null;
      if (fighter1.hp > fighter2.hp) winner = 'blue';
      else if (fighter2.hp > fighter1.hp) winner = 'red';

      if (winner) {
        log(`⏰ TIME UP! ${winner.toUpperCase()} wins by HP!`, "ko");
      } else {
        log(`⏰ TIME UP! DRAW!`, "ko");
      }

      if (window.betSystem && winner) {
        window.betSystem.resolveFight(winner);
        window.betSystem.resetBet();
      }

      waitingForNextFight = true;
stateStartTime = performance.now();
stateDuration = NEXT_FIGHT_TIME * 1000;
roundNumber++;

window.setBettingAllowed?.(true);
    }

            if (fighter1.hp <= 0 || fighter2.hp <= 0) {
      fightActive = false;
      fightEnded = true;

      // ✅ Use 'winner' here to match the rest of your code
      const winner = fighter1.hp > 0 ? 'blue' : 'red';
      const winnerAIName = (winner === 'blue') ? fighter1.aiName : fighter2.aiName;

      // 1. Record the result using the AI's actual name
      recordResult(fighter1.aiName, fighter2.aiName, winnerAIName);

      // 2. Refresh the leaderboard
      renderLeaderboardUI('leaderboardList');

      // 3. Log to the feed (using the 'winner' variable your code expects)
      log(`🏆 ${winner.toUpperCase()} (${winnerAIName}) wins the fight!`, "ko");



// 🎬 END FX
window.effects?.endRound();
window.effects?.flash();
window.effects?.shake();

// 🎥 DRAMATIC ZOOM OUT
canvas.style.transform = "scale(0.9)";
setTimeout(() => {
  canvas.style.transform = "scale(1)";
}, 500);

      if (window.betSystem) {
        window.betSystem.resolveFight(winner);
        window.betSystem.resetBet();
      }

      waitingForNextFight = true;

      stateStartTime = performance.now();
      stateDuration = NEXT_FIGHT_TIME * 1000;

      roundNumber++;
    }
  }

  if (waitingForNextFight && elapsed >= stateDuration) {
  waitingForNextFight = false;

  log("🔄 Preparing next fight...", "system");

  // FORCE CLEAN STATE RESET
  bettingActive = false;
  fightActive = false;
  fightEnded = false;

  window.setBettingAllowed?.(false);

  setTimeout(() => {
    resetFight();
    window.setBettingAllowed?.(true);
  }, 300);
}

  requestAnimationFrame(gameLoop);
}

/* =========================
   START
========================= */
(async () => {
  await loadAllAIs();
  
  // ✅ Initialize the leaderboard UI on startup
  renderLeaderboardUI('leaderboardList');
  
  updateMoneyDisplay();
  await resetFight();
  gameLoop();
})();
