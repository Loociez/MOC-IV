export const name = "Void Tactician";
export const characterIndex = 2;
export const spriteSheetIndex = 1;

export default function voidTactician(self, opponent, bounds) {

  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  const opponentAirborne = !opponent.isOnGround || opponent.y < 360;
  const opponentHighAir = opponent.y < 200;

  const opponentShooting = opponent.isShootingProjectile;
  const opponentClose = abs < 90;

  // =========================
  // INTERNAL AI JUGGLE LIMIT (NEW FIX)
  // =========================
  self._juggleTimer = self._juggleTimer || 0;

  if (self._juggleTimer > 0) {
    self._juggleTimer--;
  }

  const canJuggle = self._juggleTimer === 0;

  // reset window when opponent lands
  if (!opponentAirborne) {
    self._juggleTimer = 0;
  }

  if (self.hitstun > 0 || self.hitStop > 0) return 'idle';

  // =========================
  // EDGE SAFETY
  // =========================
  if (self.x <= bounds.left + 20) return 'moveRight';
  if (self.x >= bounds.right - 20) return 'moveLeft';

  // =========================
  // ANTI PROJECTILE
  // =========================
  if (opponentShooting && self.cooldown === 0) {
    return 'voidWall';
  }

  // =========================
  // AIR CONTROL RULE (CRITICAL FIX)
  // =========================
  if (opponentAirborne) {

    // STOP RE-LAUNCH LOOPING
    if (!canJuggle) {
      return dist > 0 ? 'moveRight' : 'moveLeft';
    }

    // ONLY ALLOW ONE FOLLOW-UP ACTION PER AIR STATE
    if (abs < 120 && self.cooldown === 0) {

      self._juggleTimer = 40; // 🔥 COOLDOWN WINDOW AFTER JUGGLE ACTION

      const r = Math.random();

      if (r < 0.35) return 'uppercut';
      if (r < 0.60) return 'bladeDance';

      // safe ender instead of infinite launch loop
      return 'groundSlam';
    }

    return 'dash';
  }

  // =========================
  // CLOSE RANGE CONTROL
  // =========================
  if (opponentClose) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.2) return 'bladeDance';
      if (r < 0.4) return 'uppercut';
      if (r < 0.6) return 'groundSlam';
      if (r < 0.75) return 'fireNova';
      if (r < 0.9) return 'poisonCloud';
    }

    return Math.random() < 0.5 ? 'block' : 'dash';
  }

  // =========================
  // MID RANGE CONTROL
  // =========================
  if (abs < 200) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.2) return 'poisonCloud';
      if (r < 0.4) return 'energyWave';
      if (r < 0.6) return 'lightningStrike';
      if (r < 0.75) return 'voidWall';
      if (r < 0.9) return 'shoot';
    }

    return 'dash';
  }

  // =========================
  // LONG RANGE CONTROL
  // =========================
  if (abs >= 200) {

    if (self.cooldown === 0) {
      if (Math.random() < 0.4) return 'lightningStrike';
      if (Math.random() < 0.4) return 'poisonCloud';
    }

    return 'dash';
  }

  return 'dash';
}