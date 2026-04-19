export const name = "Adaptive Aggressive";
export const characterIndex = 2;     // 👈 specific character slot
export const spriteSheetIndex = 2;   // 👈 specific sheet (optional)

export default function adaptive(self, opponent) {
  const dist = opponent.x - self.x;
  const absDist = Math.abs(dist);

  const opponentBlocking = opponent.isBlocking;
  const opponentAttacking = opponent.action === 'attack';

  const lowHp = self.hp < self.maxHp * 0.35;
  const midHp = self.hp < self.maxHp * 0.6;

  const hasAdvantage = self.hp > opponent.hp;
  const outnumberedPressure = opponent.cooldown > 20;

  // =========================
  // SAFETY FIRST (NEVER STUCK)
  // =========================
  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';
  if (self.hitStop > 0) return 'idle';

  // =========================
  // STAGE CONTROL
  // =========================
  if (self.x <= 50) return 'moveRight';
  if (self.x >= 750) return 'moveLeft';

  // =========================
  // EMERGENCY DEFENSE MODE
  // =========================
  if (lowHp) {
    if (self.shieldTimer === 0 && Math.random() < 0.4) return 'shield';
    if (self.cooldown === 0 && Math.random() < 0.3) return 'healPulse';
    if (Math.random() < 0.3) return 'jump';
    if (self.cooldown === 0 && Math.random() < 0.3) return 'teleport';
  }

  // =========================
  // CLOSE RANGE (MELEE ZONE)
  // =========================
  if (absDist < 80) {

    // enemy attacking → punish or escape
    if (opponentAttacking) {
      if (self.cooldown === 0 && Math.random() < 0.4) return 'groundSlam';
      if (self.cooldown === 0 && Math.random() < 0.3) return 'attack';
      if (Math.random() < 0.4) return 'teleport';
      return 'moveLeft';
    }

    // enemy blocking → break guard
    if (opponentBlocking) {
      if (self.cooldown === 0 && Math.random() < 0.5) return 'special';
      if (self.cooldown === 0 && Math.random() < 0.3) return 'shoot';
      return 'moveRight';
    }

    // normal close combat pressure
    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.35) return 'attack';
      if (r < 0.55) return 'groundSlam';
      if (r < 0.7) return 'dash';
      if (r < 0.85) return 'block';
      if (r < 0.95) return 'jump';
    }

    return 'idle';
  }

  // =========================
  // MID RANGE CONTROL
  // =========================
  if (absDist <= 180) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.2) return 'teleport';
      if (r < 0.45) return 'shoot';
      if (r < 0.65) return 'energyWave';
      if (r < 0.8) return 'dash';
      if (r < 0.9) return 'moveRight';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // LONG RANGE PRESSURE
  // =========================
  if (absDist > 180 && absDist < 320) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.3) return 'dash';
      if (r < 0.55) return 'shoot';
      if (r < 0.75) return 'energyWave';
      if (r < 0.9) return 'special';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // VERY LONG RANGE (POSITIONING)
  // =========================
  if (absDist >= 320) {
    if (self.cooldown === 0 && Math.random() < 0.4) return 'dash';
    if (Math.random() < 0.3) return 'teleport';
    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // DEFAULT
  // =========================
  return dist > 0 ? 'moveRight' : 'moveLeft';
}