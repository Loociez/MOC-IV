export const name = "Chrono Breaker";
export const characterIndex = 6;
export const spriteSheetIndex = 1;

export default function chronoBreaker(self, opponent, bounds) {

  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  const lowHp = self.hp < self.maxHp * 0.4;

  if (self.hitstun > 0 || self.hitStop > 0) return 'idle';

  // EDGE SAFETY
  if (self.x <= bounds.left) return 'moveRight';
  if (self.x >= bounds.right) return 'moveLeft';

  // =========================
  // OPENING (TIME CONTROL)
  // =========================
  if (self.cooldown === 0 && Math.random() < 0.15) {
    return 'timeSlow';
  }

  // =========================
  // LOW HP = CHAOS MODE
  // =========================
  if (lowHp) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.3) return 'rageMode';
      if (r < 0.6) return 'timeSlow';
      if (r < 0.8) return 'windPush';
    }

    return 'dash';
  }

  // =========================
  // CLOSE RANGE (COMBO PRESSURE)
  // =========================
  if (abs < 85) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.2) return 'attack';
      if (r < 0.35) return 'bladeDance';
      if (r < 0.5) return 'uppercut';
      if (r < 0.65) return 'windPush';
      if (r < 0.8) return 'fireNova';
      if (r < 0.95) return 'groundSlam';
    }

    return 'dash';
  }

  // =========================
  // MID RANGE (PRESSURE)
  // =========================
  if (abs < 200) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.2) return 'lightningStrike';
      if (r < 0.4) return 'windPush';
      if (r < 0.6) return 'energyWave';
      if (r < 0.75) return 'shoot';
      if (r < 0.9) return 'shadowStep';
    }

    return 'dash';
  }

  // =========================
  // LONG RANGE (ENGAGE FAST)
  // =========================
  if (abs >= 200) {

    if (self.cooldown === 0) {
      if (Math.random() < 0.5) return 'shadowStep';
      if (Math.random() < 0.5) return 'teleport';
    }

    return 'dash';
  }

  return 'dash';
}