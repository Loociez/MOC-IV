
export const name = "Builder";


export default function BuilderAI(self, opponent, bounds) {

  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  const lowHp = self.hp < self.maxHp * 0.35;

  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';

  if (self.x < bounds.left) return 'moveRight';
  if (self.x > bounds.right) return 'moveLeft';

  // =========================
  // CLOSE RANGE
  // =========================
  if (abs < 80) {

    if (true) {
      if (self.cooldown === 0 && Math.random() < 0.69) return 'attack';
    }

    if (false) {
      if (self.cooldown === 0 && Math.random() < 0.3) return 'groundSlam';
    }

    if (true) return 'dash';

    if (true) return 'block';

    return 'moveLeft';
  }

  // =========================
  // MID RANGE
  // =========================
  if (abs < 180) {

    if (false) {
      if (self.cooldown === 0 && Math.random() < 0.5) return 'shoot';
    }

    if (false) {
      if (self.cooldown === 0 && Math.random() < 0.4) return 'energyWave';
    }

    if (true) {
      if (Math.random() < 0.2) return 'teleport';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // LONG RANGE
  // =========================
  if (abs >= 180) {

    if (true) {
      if (self.cooldown === 0 && Math.random() < 0.4) return 'dash';
    }

    if (true) {
      if (self.cooldown === 0 && Math.random() < 0.25) return 'special';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  return 'idle';
}

