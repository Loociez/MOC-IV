export const name = "VectorKnight";
export const characterIndex = 11;
export const spriteSheetIndex = 3;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export default function VectorKnight(self, opponent, bounds) {

  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  const hpRatio = self.hp / self.maxHp;
  const enemyHpRatio = opponent.hp / opponent.maxHp;

  const lowHp = hpRatio < 0.35;
  const winning = self.hp > opponent.hp;

  const canAct = self.cooldown === 0 && self.hitstun <= 0;

  if (!canAct) return 'idle';

  // soft boundary correction (prevents wall hugging)
  if (self.x < bounds.left + 20) return 'moveRight';
  if (self.x > bounds.right - 20) return 'moveLeft';

  // =========================
  // EMERGENCY MODE (defensive)
  // =========================
  if (lowHp && enemyHpRatio > 0.2) {
    if (abs < 120 && Math.random() < 0.5) return 'block';
    if (Math.random() < 0.3) return 'dash';
    if (Math.random() < 0.2) return 'teleport';
  }

  // =========================
  // CLOSE RANGE
  // =========================
  if (abs < 90) {

    if (self.isBlocking && Math.random() < 0.3) return 'counterStrike';

    if (Math.random() < clamp(0.75 - (enemyHpRatio * 0.3), 0.2, 0.8)) {
      return 'attack';
    }

    if (Math.random() < 0.2) return 'groundSlam';
    if (Math.random() < 0.15) return 'blinkStrike';

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // MID RANGE
  // =========================
  if (abs < 200) {

    const pressure = (enemyHpRatio < 0.5) ? 0.7 : 0.4;

    if (Math.random() < pressure) return 'shoot';
    if (Math.random() < 0.25) return 'energyWave';
    if (Math.random() < 0.2 && !lowHp) return 'gravityWell';

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // LONG RANGE CONTROL
  // =========================
  if (abs >= 200) {

    if (winning && Math.random() < 0.4) return 'fireAura';
    if (!winning && Math.random() < 0.5) return 'iceTrap';

    if (Math.random() < 0.2) return 'special';

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  return 'idle';
}