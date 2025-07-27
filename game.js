import { Fighter } from './fighter.js';

function getRandomCharacterIndex() {
  return Math.floor(Math.random() * 32);
}

const backgroundImages = [
  './background1.jpg',
  './background2.jpg',
  './background3.jpg',
];

let background = new Image();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 400;

let playerMoney = parseInt(localStorage.getItem('playerMoney')) || 1000;
let currentBet = null;
let betAmount = 0;
const bettingTime = 15;
let bettingActive = true;
let bettingCountdown = bettingTime;
let fightActive = false;
let fightEnded = false;
let roundNumber = 1;

const stageLeftBound = 50;
const stageRightBound = 750;

let shakeTimer = 0;
const shakeDuration = 15;
const shakeIntensity = 5;

let specialFlashDuration = 0;
const specialFlashMaxDuration = 15;

function triggerSpecialEffect() {
  shakeTimer = 0;
  specialFlashDuration = specialFlashMaxDuration;
}

function aggressiveBotLogic(self, opponent) {
  const dist = opponent.x - self.x;
  if (self.action === 'attack' || self.action === 'hurt') return 'idle';
  if (self.x <= stageLeftBound) return 'moveRight';
  if (self.x >= stageRightBound) return 'moveLeft';
  if (Math.abs(dist) > 100) return dist > 0 ? 'moveRight' : 'moveLeft';
  if (Math.abs(dist) < 70 && Math.random() < 0.2) return dist > 0 ? 'moveLeft' : 'moveRight';
  if (Math.random() < 0.4 && Math.abs(dist) <= 100) return 'moveLeft';
  if (self.cooldown === 0 && Math.abs(dist) <= 150 && Math.random() < 0.4) return 'shoot';
  if (self.cooldown === 0 && Math.random() < 0.6) return 'attack';
  if (Math.random() < 0.1) return 'jump';
  return 'moveRight';
}

function tacticalBotLogic(self, opponent) {
  const dist = opponent.x - self.x;
  if (self.action === 'attack' || self.action === 'hurt') return 'idle';
  if (self.x <= stageLeftBound) return 'moveRight';
  if (self.x >= stageRightBound) return 'moveLeft';
  if (Math.abs(dist) < 50 && Math.random() < 0.5) return dist > 0 ? 'moveLeft' : 'moveRight';
  if (Math.abs(dist) >= 50 && Math.abs(dist) <= 120 && Math.random() < 0.3) return dist > 0 ? 'moveRight' : 'moveLeft';
  if (Math.abs(dist) > 120) return dist > 0 ? 'moveRight' : 'moveLeft';
  if (self.cooldown === 0 && Math.abs(dist) <= 150 && Math.random() < 0.3) return 'shoot';
  if (self.cooldown === 0 && Math.abs(dist) <= 90 && Math.random() < 0.5) return 'attack';
  if (Math.random() < 0.15) return 'jump';
  return 'moveLeft';
}

let fighter1 = new Fighter(150, 'blue', aggressiveBotLogic, getRandomCharacterIndex());
let fighter2 = new Fighter(600, 'red', tacticalBotLogic, getRandomCharacterIndex());

const betBlueBtn = document.getElementById('betBlue');
const betRedBtn = document.getElementById('betRed');
const currentBetDisplay = document.getElementById('currentBet');
const resultDisplay = document.getElementById('result');
const playerMoneyDisplay = document.getElementById('playerMoneyDisplay');
const betAmountInput = document.getElementById('betAmountInput');
const resetMoneyBtn = document.getElementById('resetMoneyBtn');
const roundDisplay = document.getElementById('roundDisplay'); // NEW

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
  if (!bettingActive) return;
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
  playerMoney -= amount;
  localStorage.setItem('playerMoney', playerMoney);
  updateMoneyDisplay();

  currentBet = color;
  betAmount = amount;
  if (currentBetDisplay) {
    currentBetDisplay.textContent = `Current bet: ${color.charAt(0).toUpperCase() + color.slice(1)} Fighter ($${betAmount})`;
  }
  if (resultDisplay) resultDisplay.textContent = '';

  if (betBlueBtn) betBlueBtn.disabled = true;
  if (betRedBtn) betRedBtn.disabled = true;
  if (betAmountInput) betAmountInput.disabled = true;
}

if (betBlueBtn) betBlueBtn.addEventListener('click', () => placeBet('blue'));
if (betRedBtn) betRedBtn.addEventListener('click', () => placeBet('red'));

function selectRandomBackground() {
  const index = Math.floor(Math.random() * backgroundImages.length);
  background.src = backgroundImages[index];
}

function resetFight() {
  fighter1 = new Fighter(150, 'blue', aggressiveBotLogic, getRandomCharacterIndex());
  fighter2 = new Fighter(600, 'red', tacticalBotLogic, getRandomCharacterIndex());
  selectRandomBackground();

  fightEnded = false;
  fightActive = false;
  bettingActive = true;
  bettingCountdown = bettingTime;
  currentBet = null;
  betAmount = 0;

  if (currentBetDisplay) currentBetDisplay.textContent = 'Current bet: None';
  if (resultDisplay) resultDisplay.textContent = '';
  if (roundDisplay) roundDisplay.textContent = `Round: ${roundNumber}`;

  if (betBlueBtn) betBlueBtn.disabled = false;
  if (betRedBtn) betRedBtn.disabled = false;
  if (betAmountInput) {
    betAmountInput.disabled = false;
    betAmountInput.value = '';
  }
}

function drawHPBar(fighter, x, y) {
  const width = 150;
  const height = 15;
  const hpPercent = Math.max(0, fighter.hp) / fighter.maxHp;

  ctx.fillStyle = 'gray';
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = fighter.color;
  ctx.fillRect(x, y, width * hpPercent, height);

  ctx.strokeStyle = 'black';
  ctx.strokeRect(x, y, width, height);

  ctx.font = 'bold 11px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${fighter.name} (${fighter.rarity})`, x + width / 2, y + height / 2 - 7);
  ctx.font = '10px Arial';
  ctx.fillText(`${fighter.hp} / ${fighter.maxHp} HP`, x + width / 2, y + height / 2 + 5);
}

let frameCount = 0;

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  if (shakeTimer < shakeDuration) {
    const dx = (Math.random() * 2 - 1) * shakeIntensity;
    const dy = (Math.random() * 2 - 1) * shakeIntensity;
    shakeTimer++;
    ctx.translate(dx, dy);
  }

  if (background.complete && background.naturalWidth !== 0) {
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = 'lightgray';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.restore();

  if (specialFlashDuration > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${specialFlashDuration / specialFlashMaxDuration})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    specialFlashDuration--;
  }

  fighter1.draw(ctx);
  fighter2.draw(ctx);

  drawHPBar(fighter1, 50, 10);
  drawHPBar(fighter2, 600, 10);

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

  ctx.fillStyle = 'white';
  ctx.font = '10px Arial';
  ctx.fillText(`Blue cooldown: ${fighter1.cooldown}`, 50, canvas.height - 360);
  ctx.fillText(`Red cooldown: ${fighter2.cooldown}`, 620, canvas.height - 360);

  if (fightActive) {
    fighter1.update(fighter2);
    fighter2.update(fighter1);

    if (fighter1.hp <= 0 || fighter2.hp <= 0) {
      fightActive = false;
      fightEnded = true;

      let winnerColor = fighter1.hp > 0 ? 'blue' : 'red';
      let winner = winnerColor === 'blue' ? fighter1 : fighter2;
      winner.wins = (winner.wins || 0) + 1;

      if (resultDisplay) {
        resultDisplay.textContent = `Fight ended! Winner: ${winnerColor.charAt(0).toUpperCase() + winnerColor.slice(1)} Fighter (${winner.name})\nWins — Blue: ${fighter1.wins || 0}, Red: ${fighter2.wins || 0}`;
      }

      if (currentBet === winnerColor) {
        playerMoney += betAmount * 2;
        if (resultDisplay) resultDisplay.textContent += ' - You won the bet!';
      } else if (currentBet) {
        if (resultDisplay) resultDisplay.textContent += ' - You lost the bet.';
      } else {
        if (resultDisplay) resultDisplay.textContent += ' - You did not place a bet.';
      }

      localStorage.setItem('playerMoney', playerMoney);
      updateMoneyDisplay();
      roundNumber++;

      if (betBlueBtn) betBlueBtn.disabled = true;
      if (betRedBtn) betRedBtn.disabled = true;
      if (betAmountInput) betAmountInput.disabled = true;

      setTimeout(() => {
        resetFight();
        if (betBlueBtn) betBlueBtn.disabled = false;
        if (betRedBtn) betRedBtn.disabled = false;
        if (betAmountInput) betAmountInput.disabled = false;
      }, 5000);
    }
  }

  frameCount++;
  requestAnimationFrame(gameLoop);
}

selectRandomBackground();
updateMoneyDisplay();
resetFight();
gameLoop();
