export const name = "Omni Adaptive Prime";
export const characterIndex = 3;     // 👈 specific character slot
export const spriteSheetIndex = 1;   // 👈 specific sheet (optional)

/* persistent memory per fighter */
const memory = new WeakMap();

function getMem(self) {
  if (!memory.has(self)) {
    memory.set(self, {
      aggression: 0.6,
      panic: 0,
      tempo: 0.5
    });
  }
  return memory.get(self);
}

export default function omni(self, opponent, bounds) {

  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  const mem = getMem(self);

  const opponentBlocking = opponent.isBlocking;
  const opponentAttacking = opponent.action === 'attack';

  const lowHp = self.hp < self.maxHp * 0.35;
  const hasAdvantage = self.hp > opponent.hp;

  // =========================
  // STATE EVOLUTION
  // =========================
  if (hasAdvantage) mem.aggression = Math.min(1, mem.aggression + 0.01);
  else mem.aggression = Math.max(0.3, mem.aggression - 0.01);

  if (lowHp) mem.panic = Math.min(1, mem.panic + 0.05);
  else mem.panic = Math.max(0, mem.panic - 0.03);

  mem.tempo = 0.4 + (mem.aggression * 0.6);

  // =========================
  // HARD LOCKS
  // =========================
  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';
  if (self.hitStop > 0) return 'idle';

  // =========================
  // ARENA CONTROL
  // =========================
  if (self.x <= bounds.left) return 'moveRight';
  if (self.x >= bounds.right) return 'moveLeft';

  // =========================
  // PANIC / SURVIVAL
  // =========================
  if (lowHp) {
    if (self.cooldown === 0 && mem.panic > 0.7) return 'healPulse';
    if (self.cooldown === 0 && mem.panic > 0.6) return 'rageMode';
    if (self.shieldTimer === 0 && mem.panic > 0.5) return 'shield';

    if (Math.random() < mem.panic * 0.5) return 'teleport';
    if (Math.random() < mem.panic * 0.4) return 'shadowStep';

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // CLOSE RANGE
  // =========================
  if (abs < 85) {

    if (opponentAttacking) {
      if (self.cooldown === 0 && Math.random() < 0.5) return 'uppercut';
      if (self.cooldown === 0 && Math.random() < 0.4) return 'groundSlam';
      if (Math.random() < 0.3) return 'shadowStep';
      return 'block';
    }

    if (opponentBlocking) {
      if (self.cooldown === 0 && Math.random() < 0.5) return 'fireNova';
      if (self.cooldown === 0 && Math.random() < 0.4) return 'special';
      if (Math.random() < 0.3) return 'dash';

      // ✅ FIX: fallback
      return 'moveRight';
    }

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.2) return 'attack';
      if (r < 0.35) return 'uppercut';
      if (r < 0.5) return 'groundSlam';
      if (r < 0.65) return 'shadowStep';
      if (r < 0.8) return 'fireNova';
      if (r < 0.9) return 'dash';
    }

    return 'idle';
  }

  // =========================
  // MID RANGE
  // =========================
  if (abs <= 180) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.2) return 'dash';
      if (r < 0.4) return 'shoot';
      if (r < 0.6) return 'energyWave';
      if (r < 0.75) return 'iceTrap';
      if (r < 0.9) return 'shadowStep';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // LONG RANGE
  // =========================
  if (abs <= 320) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.3) return 'shoot';
      if (r < 0.55) return 'energyWave';
      if (r < 0.75) return 'iceTrap';
      if (r < 0.9) return 'special';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // VERY LONG RANGE
  // =========================
  if (abs > 320) {
    if (self.cooldown === 0 && Math.random() < 0.5) return 'dash';
    if (Math.random() < 0.3) return 'teleport';
    if (Math.random() < 0.25) return 'shadowStep';

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // FINAL FALLBACK (NEVER FREEZE)
  // =========================
  return 'idle';
}