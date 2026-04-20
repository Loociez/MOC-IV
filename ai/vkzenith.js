export const name = "VectorKnight Zenith";
export const characterIndex = 11;
export const spriteSheetIndex = 3;

export default function VectorKnight(self, opponent, bounds) {

  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  const hpRatio = self.hp / self.maxHp;
  const enemyHpRatio = opponent.hp / opponent.maxHp;

  // =========================
  // CORE SAFETY GATES
  // =========================
  const canAct = self.cooldown === 0 && self.hitstun <= 0 && self.action !== 'hurt';
  if (!canAct) return 'idle';

  // =========================
  // 🔒 COMBO / LAUNCH LIMITER STATE (soft memory)
  // =========================
  self._launcherCD = self._launcherCD || 0;

  if (self._launcherCD > 0) self._launcherCD--;

  const canLaunch = self._launcherCD === 0;

  // =========================
  // 1. SUPREME BOUNDARY AWARENESS
  // =========================
  const nearLeft = self.x < bounds.left + 60;
  const nearRight = self.x > bounds.right - 60;

  if (nearLeft || nearRight) {
    if (abs < 150) return 'shadowStep';
    return nearLeft ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // 2. DEFENSIVE REFLEXES
  // =========================
  const isEnemyAttacking =
    opponent.action === 'attack' ||
    opponent.action === 'special';

  if (isEnemyAttacking && abs < 120) {
    const roll = Math.random();

    if (roll < 0.3) return 'block';
    if (roll < 0.6) return 'shadowStep';
    return 'jump';
  }

  // =========================
  // 3. DESPERATION / RAGE LOGIC
  // =========================
  if (hpRatio < 0.3) {
    const roll = Math.random();

    if (roll < 0.1) return 'rageMode';
    if (roll < 0.05) return 'healPulse';
    if (abs < 100) return 'fireNova';
  }

  // =========================
  // 4. CLOSE RANGE (PREDATOR - FIXED COMBO CONTROL)
  // =========================
  if (abs < 90) {

    const roll = Math.random();

    // anti-block punish (safe)
    if (opponent.isBlocking && roll < 0.4) {
      return 'groundSlam';
    }

    // =========================
    // 🔒 UPPERCUT LIMITER (NO JUGGLE LOCK)
    // =========================
    const opponentAirborne = opponent.y > 5;

    if (
      canLaunch &&
      !opponentAirborne &&
      roll < 0.35
    ) {
      self._launcherCD = 120; // ~2 seconds lockout

      return 'uppercut';
    }

    if (roll < 0.45) return 'attack';
    if (roll < 0.65) return 'fireNova';

    return 'block';
  }

  // =========================
  // 5. MID RANGE (PRESSURE - REDUCED CHAOS)
  // =========================
  if (abs >= 90 && abs < 280) {

    const roll = Math.random();

    if (enemyHpRatio < hpRatio && roll < 0.25) return 'iceTrap';

    if (roll < 0.25) return 'energyWave';
    if (roll < 0.45) return 'shoot';

    // ⚠️ dash nerf so it doesn’t constantly re-engage into launcher loops
    if (roll < 0.55) return 'dash';

    return 'special';
  }

  // =========================
  // 6. LONG RANGE (POSITIONING CONTROLLED)
  // =========================
  if (abs >= 280) {

    const roll = Math.random();

    if (roll < 0.3) return 'shadowStep';
    if (roll < 0.55) return 'dash';

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  return 'idle';
}