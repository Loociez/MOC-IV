export function createBotLogic({ aggression = 1, jumpChance = 0.03, projectileChance = 0.6 } = {}) {
  let decisionCooldown = 0;
  let currentAction = 'idle';
  let jumpCooldown = 0;
  let projectileCooldown = 0; // cooldown before next projectile

  return function(self, opponent) {
  // Initialize specialUsed on self if undefined
if (typeof self.specialUsed === 'undefined') self.specialUsed = false;

// Initialize specialCooldown on self if undefined
if (typeof self.specialCooldown === 'undefined') self.specialCooldown = 0;

// Decrease cooldown each frame
if (self.specialCooldown > 0) self.specialCooldown--;

// Reset specialUsed flag when cooldown hits zero to allow reuse
if (self.specialCooldown === 0) {
  self.specialUsed = false;

    // If attacking or hurt, keep current action so animation finishes
    if (['attack', 'hurt', 'special'].includes(self.action)) return self.action;

    if (jumpCooldown > 0) jumpCooldown--;
    if (projectileCooldown > 0) projectileCooldown--;
    if (decisionCooldown > 0) {
      decisionCooldown--;
      return currentAction;
    }

    decisionCooldown = Math.floor(Math.random() * 10) + 10; // decision every 10–20 frames

    // Positions and distance
    const selfCenter = self.x + self.width / 2;
    const oppCenter = opponent.x + opponent.width / 2;
    const distX = oppCenter - selfCenter;
    const dist = Math.abs(distX);

    const attackRange = 70;       // melee range
    const projectileRange = 200;  // max range for projectile attacks
    const tooCloseRange = 40;

    // Use special move once if not used and cooldown is ready and opponent HP > 20
if (!self.specialUsed && self.specialCooldown === 0 && opponent.hp > 20) {
  self.specialUsed = true;
  self.specialCooldown = 300; // cooldown in frames (adjust as needed)
  currentAction = 'special';
  if (typeof self.useSpecial === 'function') {
    self.useSpecial(opponent);
  }
  return currentAction;
}


    // Dodge jump if opponent melee attacking close by
    if (opponent.action === 'attack' && dist < 80 && self.isOnGround) {
      if (Math.random() < 0.6) {
        jumpCooldown = 30;
        currentAction = 'jump';
        return currentAction;
      }
    }

    // Dodge projectiles sometimes (if opponent uses projectiles)
    if (opponent.isShootingProjectile && dist < projectileRange && self.isOnGround) {
      if (Math.random() < 0.4) {  // 40% chance to dodge projectile
        jumpCooldown = 30;
        currentAction = 'jump';
        return currentAction;
      }
    }

    // Move away if too close
    if (dist < tooCloseRange && Math.random() < 0.5) {
      currentAction = distX > 0 ? 'moveLeft' : 'moveRight';
      return currentAction;
    }

    // If in melee attack range and cooldown is ready, attack
    if (dist <= attackRange && self.cooldown === 0) {
      if (Math.random() < aggression) {
        currentAction = 'attack';
        return currentAction;
      }
    }

    // If too far but within projectile range, try projectile attack if cooldown ready
    if (dist > attackRange && dist <= projectileRange && projectileCooldown === 0) {
      if (Math.random() < projectileChance) {
        projectileCooldown = 60; // 60 frames cooldown for projectile
        currentAction = 'shootProjectile';
        // Shoot projectile if method exists
        if (typeof self.shootProjectile === 'function') {
          self.shootProjectile(oppCenter, opponent.y + opponent.height / 2);
        }
        return currentAction;
      }
    }

    // Random jump near opponent
    if (dist <= attackRange && self.isOnGround && Math.random() < jumpChance) {
      jumpCooldown = 30;
      currentAction = 'jump';
      return currentAction;
    }

    // Move towards opponent if far
    if (dist > attackRange) {
      currentAction = distX > 0 ? 'moveRight' : 'moveLeft';
      return currentAction;
    }

    // Default idle
    currentAction = 'idle';
    return currentAction;
  };
}

export const botLogicA = createBotLogic({ aggression: 1, jumpChance: 0.04, projectileChance: 0.7 });
export const botLogicB = createBotLogic({ aggression: 1, jumpChance: 0.04, projectileChance: 0.7 });
