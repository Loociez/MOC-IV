export const name = "Hyper Blitz Omega";
export const characterIndex = 4;     // 👈 specific character slot
export const spriteSheetIndex = 6;   // 👈 specific sheet (optional)

const memory = new WeakMap();

function getMem(self) {
  if (!memory.has(self)) {
    memory.set(self, {
      aggression: 0.9,
      tempo: 1,
    });
  }
  return memory.get(self);
}

export default function hyperBlitz(self, opponent, bounds) {

  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  const mem = getMem(self);

  // =========================
  // SAFETY
  // =========================
  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';
  if (self.hitStop > 0) return 'idle';

  // =========================
  // ARENA CONTROL
  // =========================
  if (self.x <= bounds.left) return 'moveRight';
  if (self.x >= bounds.right) return 'moveLeft';

  // =========================
  // CLOSE RANGE (INSANE COMBO)
  // =========================
  if (abs < 90) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.15) return 'attack';
      if (r < 0.3) return 'uppercut';
      if (r < 0.45) return 'groundSlam';
      if (r < 0.6) return 'fireNova';
      if (r < 0.75) return 'shadowStep';
      if (r < 0.9) return 'special';
    }

    if (Math.random() < 0.5) return 'dash';
    return 'block';
  }

  // =========================
  // MID RANGE (TELEPORT HELL)
  // =========================
  if (abs < 200) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.25) return 'teleport';
      if (r < 0.45) return 'shadowStep';
      if (r < 0.65) return 'shoot';
      if (r < 0.8) return 'energyWave';
      if (r < 0.95) return 'iceTrap';
    }

    return Math.random() < 0.7 ? 'dash' : (dist > 0 ? 'moveRight' : 'moveLeft');
  }

  // =========================
  // LONG RANGE (INSTANT ENGAGE)
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