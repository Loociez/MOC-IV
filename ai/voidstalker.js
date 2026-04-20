export const name = "Void Stalker";
export const characterIndex = 22;

export default function voidStalker(self, opponent, bounds) {

  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  const opponentAirborne = !opponent.isOnGround || opponent.y < 360;
  const opponentHighAir = opponent.y < 200;
  const opponentJuggled = opponent.juggleCount > 2;

  const safeToCombo = !opponentAirborne || opponent.isOnGround;
  const isCornered = self.x <= bounds.left + 60 || self.x >= bounds.right - 60;

  // =========================
  // STAGE BOUNDARY CONTROL
  // =========================
  if (self.x <= bounds.left + 20) return 'moveRight';
  if (self.x >= bounds.right - 20) return 'moveLeft';

  // =========================
  // RECOVERY / STUN LOGIC
  // =========================
  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';

  // =========================
  // DEFENSIVE LOGIC (FIXED)
  // =========================
  if (opponent.action === 'attack' && self.cooldown === 0) {

    // ONLY respond defensively if NOT already in juggle pressure
    if (!opponentHighAir && self.juggleCount < 3) {

      if (self.x > bounds.left + 120 && self.x < bounds.right - 120) {
        return 'shadowStep';
      }

      return 'block';
    }

    // if opponent is juggling you → stop trying to react aggressively
    return 'idle';
  }

  // =========================
  // LOW HP BEHAVIOR
  // =========================
  if (self.hp < self.maxHp * 0.4 && self.cooldown === 0 && !opponentAirborne) {
    return 'healPulse';
  }

  // =========================
  // AIR JUGGLE SAFETY LOCK
  // =========================
  if (opponentAirborne) {

    // STOP ALL HEAVY ACTIONS IN AIR STATE
    if (abs < 120) return 'block';

    // keep spacing only
    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // MID RANGE OFFENSE (SAFE ONLY WHEN GROUNDED)
  // =========================
  if (abs > 150 && abs < 400 && safeToCombo) {
    if (self.cooldown === 0) {
      const r = Math.random();
      return r < 0.5 ? 'special' : 'energyWave';
    }
  }

  // =========================
  // CLOSE RANGE CONTROL
  // =========================
  if (abs < 80) {

    if (self.cooldown === 0 && !opponentAirborne) {
      return 'groundSlam';
    }

    const roomToRight = (bounds.right - self.x) > 100;
    const roomToLeft = (self.x - bounds.left) > 100;

    // REMOVE TELEPORT WHILE OPPONENT AIRBORNE (KEY FIX)
    if (!opponentAirborne) {
      if (dist > 0 && roomToRight) return 'teleport';
      if (dist < 0 && roomToLeft) return 'teleport';
    }

    return 'block';
  }

  // =========================
  // DEFAULT MOVEMENT
  // =========================
  return dist > 0 ? 'moveRight' : 'moveLeft';
}