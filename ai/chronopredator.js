export const name = "ChronoPredator";
export const characterIndex = 14;
export const spriteSheetIndex = 2;

function sign(x) {
  return x > 0 ? 1 : -1;
}

export default function ChronoPredator(self, opponent, bounds) {

  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  const hp = self.hp / self.maxHp;
  const enemyHp = opponent.hp / opponent.maxHp;

  const canAct = self.cooldown === 0 && self.hitstun <= 0;
  if (!canAct) return 'idle';

  // =========================
  // EDGE CONTROL (prevents escape)
  // =========================
  if (opponent.x < bounds.left + 40) return 'moveRight';
  if (opponent.x > bounds.right - 40) return 'moveLeft';

  // =========================
  // LOW HP SURVIVAL (still aggressive)
  // =========================
  if (hp < 0.25) {
    if (abs < 120 && Math.random() < 0.6) return 'block';
    if (Math.random() < 0.4) return 'dash';
    if (Math.random() < 0.25) return 'teleport';
  }

  // =========================
  // PREDICTIVE CHASE
  // =========================
  const predictedX = opponent.x + (opponent.x - self.x) * 0.15;
  const predictedDist = predictedX - self.x;

  if (Math.abs(predictedDist) > abs) {
    return predictedDist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // CLOSE RANGE BURST
  // =========================
  if (abs < 100) {

    if (enemyHp < 0.3 && Math.random() < 0.8) return 'attack';

    if (Math.random() < 0.35) return 'attack';
    if (Math.random() < 0.2) return 'blinkStrike';
    if (Math.random() < 0.25) return 'shockwaveBurst';

    if (Math.random() < 0.15) return 'groundSlam';

    return 'block';
  }

  // =========================
  // MID RANGE PRESSURE LOOP
  // =========================
  if (abs < 220) {

    if (enemyHp < hp && Math.random() < 0.5) return 'shoot';

    if (Math.random() < 0.3) return 'energyWave';
    if (Math.random() < 0.25) return 'gravityWell';

    if (Math.random() < 0.15) return 'dash';

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // LONG RANGE SETUPS
  // =========================
  if (abs >= 220) {

    if (Math.random() < 0.4) return 'iceTrap';
    if (Math.random() < 0.3) return 'fireAura';
    if (Math.random() < 0.2) return 'special';

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  return 'idle';
}