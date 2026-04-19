export const name = "Adaptive Aggressive v2";
export const characterIndex = 8;     // 👈 specific character slot
export const spriteSheetIndex = 6;   // 👈 specific sheet (optional)

/* lightweight memory store per fighter instance */
const memory = new WeakMap();

function getMem(self) {
  if (!memory.has(self)) {
    memory.set(self, {
      lastAction: null,
      aggression: 0.5, // shifts based on HP + advantage
      panic: 0
    });
  }
  return memory.get(self);
}

export default function hyper(self, opponent) {
  const dist = opponent.x - self.x;
  const absDist = Math.abs(dist);

  const opponentBlocking = opponent.isBlocking;
  const opponentAttacking = opponent.action === 'attack';

  const lowHp = self.hp < self.maxHp * 0.35;
  const midHp = self.hp < self.maxHp * 0.6;

  const hasAdvantage = self.hp > opponent.hp;

  const mem = getMem(self);

  // =========================
  // STATE UPDATE (SMOOTH BEHAVIOR SHIFT)
  // =========================
  if (hasAdvantage) mem.aggression = Math.min(1, mem.aggression + 0.01);
  else mem.aggression = Math.max(0.2, mem.aggression - 0.01);

  if (lowHp) mem.panic = Math.min(1, mem.panic + 0.05);
  else mem.panic = Math.max(0, mem.panic - 0.03);

  // =========================
  // HARD SAFETY LOCKS
  // =========================
  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';
  if (self.hitStop > 0) return 'idle';

  // =========================
  // STAGE CONTROL
  // =========================
  if (self.x <= 50) return 'moveRight';
  if (self.x >= 750) return 'moveLeft';

  // =========================
  // EMERGENCY DEFENSE MODE (IMPROVED)
  // =========================
  if (lowHp) {
    if (self.cooldown === 0 && mem.panic > 0.7) return 'healPulse';
    if (self.shieldTimer === 0 && mem.panic > 0.5) return 'shield';
    if (Math.random() < mem.panic) return 'teleport';
    if (Math.random() < mem.panic * 0.6) return 'jump';
  }

  // =========================
  // CLOSE RANGE (MELEE)
  // =========================
  if (absDist < 80) {

    // enemy attacking → punish window
    if (opponentAttacking) {
      if (self.cooldown === 0 && Math.random() < mem.aggression) return 'attack';
      if (self.cooldown === 0 && Math.random() < 0.4) return 'groundSlam';
      if (Math.random() < 0.35) return 'dash';
      return 'moveLeft';
    }

    // enemy blocking → guard break logic
    if (opponentBlocking) {
      if (self.cooldown === 0 && Math.random() < 0.6) return 'special';
      if (self.cooldown === 0 && Math.random() < 0.4) return 'shoot';
      if (Math.random() < 0.3) return 'dash';
      return 'moveRight';
    }

    // normal melee pressure
    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < mem.aggression * 0.4) return 'attack';
      if (r < 0.6) return 'groundSlam';
      if (r < 0.75) return 'dash';
      if (r < 0.9) return 'block';
    }

    return 'idle';
  }

  // =========================
  // MID RANGE
  // =========================
  if (absDist <= 180) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.25 * mem.aggression) return 'dash';
      if (r < 0.5) return 'shoot';
      if (r < 0.7) return 'energyWave';
      if (r < 0.85) return 'teleport';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // LONG RANGE PRESSURE
  // =========================
  if (absDist <= 320) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.35 * mem.aggression) return 'dash';
      if (r < 0.6) return 'shoot';
      if (r < 0.8) return 'energyWave';
      if (r < 0.92) return 'special';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // VERY LONG RANGE
  // =========================
  if (absDist > 320) {
    if (self.cooldown === 0 && Math.random() < 0.5 * mem.aggression) return 'dash';
    if (Math.random() < 0.35) return 'teleport';
    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // FALLBACK
  // =========================
  return dist > 0 ? 'moveRight' : 'moveLeft';
}