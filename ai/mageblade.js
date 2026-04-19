
export const name = "MageBlade";

export default function MageBlade(self, opponent, bounds) {

  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  const lowHp = self.hp < self.maxHp * 0.35;

  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';

  if (self.x < bounds.left) return 'moveRight';
  if (self.x > bounds.right) return 'moveLeft';

  // CLOSE RANGE
  if (abs < 80) {

    if (true && self.cooldown === 0 && Math.random() < 0.69) return 'attack';
    if (false && self.cooldown === 0 && Math.random() < 0.3) return 'groundSlam';
    if (true && self.cooldown === 0 && Math.random() < 0.25) return 'blinkStrike';
    if (true && self.cooldown === 0 && Math.random() < 0.25) return 'shockwaveBurst';

    if (true) return 'block';
    if (false) return 'dash';

    return 'moveLeft';
  }

  // MID RANGE
  if (abs < 180) {

    if (true && self.cooldown === 0 && Math.random() < 0.5) return 'shoot';
    if (false && self.cooldown === 0 && Math.random() < 0.4) return 'energyWave';
    if (true && self.cooldown === 0 && Math.random() < 0.25) return 'gravityWell';

    if (false && Math.random() < 0.2) return 'teleport';

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // LONG RANGE
  if (abs >= 180) {

    if (true && self.cooldown === 0 && Math.random() < 0.3) return 'fireAura';
    if (true && self.cooldown === 0 && Math.random() < 0.3) return 'iceTrap';
    if (true && self.cooldown === 0 && Math.random() < 0.25) return 'special';
    if (false && self.cooldown === 0 && Math.random() < 0.4) return 'dash';

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // LOW HP SURVIVAL
  if (lowHp) {
    if (false && self.cooldown === 0) return 'healPulse';
    if (false) return 'shield';
  }

  return 'idle';
}

