export const name = "Godspeed Instinct";
export const characterIndex = 4;     // 👈 specific character slot
export const spriteSheetIndex = 1;   // 👈 specific sheet (optional)

const memory = new WeakMap();

function getMem(self) {
  if (!memory.has(self)) {
    memory.set(self, {
      aggression: 0.8,
      panic: 0,
    });
  }
  return memory.get(self);
}

export default function godspeed(self, opponent, bounds) {

  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  const mem = getMem(self);

  const opponentAttacking = opponent.action === 'attack';

  const lowHp = self.hp < self.maxHp * 0.35;

  // =========================
  // STATE SHIFT
  // =========================
  if (lowHp) mem.panic = Math.min(1, mem.panic + 0.05);
  else mem.panic = Math.max(0, mem.panic - 0.03);

  // =========================
  // SAFETY
  // =========================
  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';
  if (self.hitStop > 0) return 'idle';

  if (self.x <= bounds.left) return 'moveRight';
  if (self.x >= bounds.right) return 'moveLeft';

  // =========================
  // ULTRA INSTINCT DODGE
  // =========================
  if (opponentAttacking) {
    if (Math.random() < 0.5) return 'shadowStep';
    if (Math.random() < 0.4) return 'teleport';
    if (Math.random() < 0.3) return 'dash';
  }

  // =========================
  // LOW HP = GOD MODE
  // =========================
  if (lowHp) {

    if (self.cooldown === 0 && Math.random() < 0.4) return 'rageMode';
    if (self.cooldown === 0 && Math.random() < 0.4) return 'healPulse';
    if (Math.random() < 0.6) return 'teleport';
  }

  // =========================
  // CLOSE RANGE (FAST STRIKES)
  // =========================
  if (abs < 85) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.2) return 'attack';
      if (r < 0.35) return 'uppercut';
      if (r < 0.5) return 'groundSlam';
      if (r < 0.65) return 'fireNova';
      if (r < 0.8) return 'special';
      if (r < 0.95) return 'iceTrap';
    }

    return Math.random() < 0.5 ? 'dash' : 'block';
  }

  // =========================
  // MID RANGE (PROJECTILE SPAM)
  // =========================
  if (abs < 200) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.25) return 'shoot';
      if (r < 0.5) return 'energyWave';
      if (r < 0.7) return 'iceTrap';
      if (r < 0.85) return 'teleport';
      if (r < 0.95) return 'shadowStep';
    }

    return 'dash';
  }

  // =========================
  // LONG RANGE (INSTANT CLOSE)
  // =========================
  if (abs >= 200) {

    if (self.cooldown === 0) {
      if (Math.random() < 0.5) return 'teleport';
      if (Math.random() < 0.5) return 'shadowStep';
    }

    return 'dash';
  }

  return 'dash';
}