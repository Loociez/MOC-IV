import { Fighter } from './fighter.js';

function getRandomCharacterIndex() {
  return Math.floor(Math.random() * 32);
}

// --- New: Array of background images ---
const backgroundImages = [
  './background1.jpg',
  './background2.jpg',
  './background3.jpg',
];

let background = new Image(); // We will change its src dynamically

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 400;

// Betting state
let playerMoney = parseInt(localStorage.getItem('playerMoney')) || 1000;
let currentBet = null;  // 'blue' or 'red'
let betAmount = 0;
const bettingTime = 15; // seconds
let bettingActive = true;
let bettingCountdown = bettingTime;
let fightActive = false;
let fightEnded = false;

const stageLeftBound = 50;
const stageRightBound = 750;

// Screen shake variables
let shakeTimer = 0;
const shakeDuration = 15;  // frames
const shakeIntensity = 5;

// White flash overlay variables (for special effect)
let specialFlashDuration = 0;
const specialFlashMaxDuration = 15;

// Function to trigger special effect (shake + flash)
function triggerSpecialEffect() {
  shakeTimer = 0;  // reset shake timer to start shaking
  specialFlashDuration = specialFlashMaxDuration; // start flash
}

// Example bot logics (unchanged)
function aggressiveBotLogic(self, opponent) {
  const dist = opponent.x - self.x;

  if (self.action === 'attack' || self.action === 'hurt') return 'idle';

  if (self.x <= stageLeftBound) {
    self.patrolDirection = 'right';
    return 'moveRight';
  }
  if (self.x >= stageRightBound) {
    self.patrolDirection = 'left';
    return 'moveLeft';
  }

  if (!self.patrolDirection) self.patrolDirection = Math.random() < 0.5 ? 'left' : 'right';

  if (Math.abs(dist) > 100) return dist > 0 ? 'moveRight' : 'moveLeft';

  if (Math.abs(dist) < 70 && Math.random() < 0.2) return dist > 0 ? 'moveLeft' : 'moveRight';

  if (Math.abs(dist) <= 100 && Math.random() < 0.3) return self.patrolDirection === 'left' ? 'moveLeft' : 'moveRight';

  if (self.cooldown === 0 && Math.abs(dist) <= 150 && Math.random() < 0.4) return 'shoot';

  if (self.cooldown === 0 && Math.random() < 0.6) return 'attack';

  if (Math.random() < 0.1) return 'jump';

  return self.patrolDirection === 'left' ? 'moveLeft' : 'moveRight';
}

function tacticalBotLogic(self, opponent) {
  const dist = opponent.x - self.x;

  if (self.action === 'attack' || self.action === 'hurt') return 'idle';

  if (self.x <= stageLeftBound) {
    self.patrolDirection = 'right';
    return 'moveRight';
  }
  if (self.x >= stageRightBound) {
    self.patrolDirection = 'left';
    return 'moveLeft';
  }

  if (!self.patrolDirection) self.patrolDirection = Math.random() < 0.5 ? 'left' : 'right';

  if (Math.abs(dist) < 50) {
    if (Math.random() < 0.5) return dist > 0 ? 'moveLeft' : 'moveRight';
  }

  if (Math.abs(dist) >= 50 && Math.abs(dist) <= 120) {
    if (Math.random() < 0.3) {
      return Math.random() < 0.5
        ? (dist > 0 ? 'moveRight' : 'moveLeft')
        : (dist > 0 ? 'moveLeft' : 'moveRight');
    }
    if (Math.random() < 0.3) return self.patrolDirection === 'left' ? 'moveLeft' : 'moveRight';
  }

  if (Math.abs(dist) > 120) return dist > 0 ? 'moveRight' : 'moveLeft';

  if (self.cooldown === 0 && Math.abs(dist) <= 150 && Math.random() < 0.3) return 'shoot';

  if (self.cooldown === 0 && Math.abs(dist) <= 90 && Math.random() < 0.5) return 'attack';

  if (Math.random() < 0.15) return 'jump';

  return self.patrolDirection === 'left' ? 'moveLeft' : 'moveRight';
}

// Change from const to let to allow reassignment
let fighter1 = new Fighter(150, 'blue', aggressiveBotLogic, getRandomCharacterIndex());
let fighter2 = new Fighter(600, 'red', tacticalBotLogic, getRandomCharacterIndex());

// UI elements from document (outside module)
const betBlueBtn = document.getElementById('betBlue');
const betRedBtn = document.getElementById('betRed');
const currentBetDisplay = document.getElementById('currentBet');
const resultDisplay = document.getElementById('result');
const playerMoneyDisplay = document.getElementById('playerMoneyDisplay');
const betAmountInput = document.getElementById('betAmountInput'); // New input for bet amount

const resetMoneyBtn = document.getElementById('resetMoneyBtn');

function updateMoneyDisplay() {
  if (playerMoneyDisplay) {
    playerMoneyDisplay.textContent = `Money: $${playerMoney}`;
  }
}

if (resetMoneyBtn) {
  resetMoneyBtn.addEventListener('click', () => {
    playerMoney = 1000;
    localStorage.setItem('playerMoney', playerMoney);
    updateMoneyDisplay();
  });
}

function placeBet(color) {
  if (!bettingActive) return; // no bets if fight started
  if (!betAmountInput) {
    alert('Bet amount input not found!');
    return;
  }
  let amount = parseInt(betAmountInput.value, 10);
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid bet amount greater than 0');
    return;
  }
  if (playerMoney < amount) {
    alert("You don't have enough money to bet!");
    return;
  }
  // Deduct money immediately on bet
  playerMoney -= amount;
  localStorage.setItem('playerMoney', playerMoney);
  updateMoneyDisplay();

  currentBet = color;
  betAmount = amount;
  if (currentBetDisplay) {
    currentBetDisplay.textContent = `Current bet: ${color.charAt(0).toUpperCase() + color.slice(1)} Fighter ($${betAmount})`;
  }
  if (resultDisplay) {
    resultDisplay.textContent = '';
  }

  if (betBlueBtn) betBlueBtn.disabled = true;
  if (betRedBtn) betRedBtn.disabled = true;
  if (betAmountInput) betAmountInput.disabled = true;
}

if (betBlueBtn) {
  betBlueBtn.addEventListener('click', () => placeBet('blue'));
}
if (betRedBtn) {
  betRedBtn.addEventListener('click', () => placeBet('red'));
}

// --- New function to select random background image ---
function selectRandomBackground() {
  const index = Math.floor(Math.random() * backgroundImages.length);
  background.src = backgroundImages[index];
}

function resetFight() {
  // Recreate fighters with new random characters and logic
  fighter1 = new Fighter(150, 'blue', aggressiveBotLogic, getRandomCharacterIndex());
  fighter2 = new Fighter(600, 'red', tacticalBotLogic, getRandomCharacterIndex());

  // --- New: Pick a new random background on each fight reset ---
  selectRandomBackground();

  fightEnded = false;
  fightActive = false;
  bettingActive = true;
  bettingCountdown = bettingTime;
  currentBet = null;
  betAmount = 0;

  if (currentBetDisplay) currentBetDisplay.textContent = 'Current bet: None';
  if (resultDisplay) resultDisplay.textContent = '';
  if (betBlueBtn) betBlueBtn.disabled = false;
  if (betRedBtn) betRedBtn.disabled = false;
  if (betAmountInput) {
    betAmountInput.disabled = false;
    betAmountInput.value = ''; // reset input
  }
}

function drawHPBar(fighter, x, y) {
  const width = 150;
  const height = 15;
  const hpPercent = Math.max(0, fighter.hp) / 100;
  ctx.fillStyle = 'gray';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = fighter.color;
  ctx.fillRect(x, y, width * hpPercent, height);
  ctx.strokeStyle = 'black';
  ctx.strokeRect(x, y, width, height);
}

let frameCount = 0;

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();  // Save context before applying shake

  // Apply screen shake if active
  if (shakeTimer < shakeDuration) {
    const dx = (Math.random() * 2 - 1) * shakeIntensity;
    const dy = (Math.random() * 2 - 1) * shakeIntensity;
    shakeTimer++;
    ctx.translate(dx, dy);
  }

  // Draw background (uses the dynamic background Image object)
  if (background.complete && background.naturalWidth !== 0) {
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = 'lightgray';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.restore(); // Restore context after shake

  // White flash overlay for special effect
  if (specialFlashDuration > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${specialFlashDuration / specialFlashMaxDuration})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    specialFlashDuration--;
  }

   // Draw fighters and HP bars
  fighter1.draw(ctx);
  fighter2.draw(ctx);

  drawHPBar(fighter1, 50, 10);
  drawHPBar(fighter2, 600, 10);

  // White flash overlay for special effect (after fighters)
  if (specialFlashDuration > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${specialFlashDuration / specialFlashMaxDuration})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    specialFlashDuration--;
  }

    // Betting countdown and fight start logic
  if (bettingActive) {
    if (bettingCountdown > 0) {
      if (currentBetDisplay) {
        const betText = currentBet
          ? `Betting on: ${currentBet.charAt(0).toUpperCase() + currentBet.slice(1)} Fighter ($${betAmount})`
          : 'No bet placed yet';
        currentBetDisplay.textContent = `Place your bet! Time left: ${bettingCountdown}s | ${betText}`;
      }
      if (frameCount % 60 === 0) bettingCountdown--;
    } else {
      bettingActive = false;
      fightActive = true;
      if (currentBetDisplay) currentBetDisplay.textContent = 'Fight started!';
    }
  }

  // Show cooldown timers visually for both fighters
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Blue cooldown: ${fighter1.cooldown}`, 20, canvas.height - 340);
  ctx.fillText(`Red cooldown: ${fighter2.cooldown}`, 620, canvas.height - 340);



  // Fight update
  if (fightActive) {
    fighter1.update(fighter2);
    fighter2.update(fighter1);

    // Check if one fighter is dead
    if (fighter1.hp <= 0 || fighter2.hp <= 0) {
      fightActive = false;
      fightEnded = true;

      let winnerColor = fighter1.hp > 0 ? 'blue' : 'red';
      if (resultDisplay) {
        resultDisplay.textContent = `Fight ended! Winner: ${winnerColor.charAt(0).toUpperCase() + winnerColor.slice(1)} Fighter`;
      }

      // Check betting result
      if (currentBet === winnerColor) {
        // Player wins: payout 2x the bet amount
        playerMoney += betAmount * 2;
        if (resultDisplay) resultDisplay.textContent += ' - You won the bet!';
      } else if (currentBet) {
        if (resultDisplay) resultDisplay.textContent += ' - You lost the bet.';
      } else {
        if (resultDisplay) resultDisplay.textContent += ' - You did not place a bet.';
      }

      localStorage.setItem('playerMoney', playerMoney);
      updateMoneyDisplay();

      if (betBlueBtn) betBlueBtn.disabled = true;
      if (betRedBtn) betRedBtn.disabled = true;
      if (betAmountInput) betAmountInput.disabled = true;
    
	setTimeout(() => {
    resetFight();
    if (betBlueBtn) betBlueBtn.disabled = false;
    if (betRedBtn) betRedBtn.disabled = false;
    if (betAmountInput) betAmountInput.disabled = false;
  }, 5000); // 5 seconds after fight ends
}
  }

  frameCount++;
  requestAnimationFrame(gameLoop);
}

// Start background image initially
selectRandomBackground();

// Start the game loop
updateMoneyDisplay();
resetFight();
gameLoop();
