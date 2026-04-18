export default function tactical(self, opponent) {
  const dist = opponent.x - self.x;
  const absDist = Math.abs(dist);

  const opponentBlocking = opponent.action === 'block';
  const opponentAttacking = opponent.action === 'attack';

  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';

  if (self.x <= 50) return 'moveRight';
  if (self.x >= 750) return 'moveLeft';

  /* =========================
     🔥 SPECIAL ATTACK USAGE FIX
     (this is what you were missing)
  ========================= */
  if (self.cooldown === 0) {
    if (absDist > 90 && absDist < 200 && Math.random() < 0.25) {
      return 'special';
    }

    // panic beam in close combat
    if (absDist < 60 && Math.random() < 0.15) {
      return 'special';
    }
  }

  /* =========================
     CLOSE RANGE
  ========================= */
  if (absDist < 60) {

    if (opponentAttacking && self.cooldown === 0) {
      return Math.random() < 0.5 ? 'block' : 'attack';
    }

    if (opponentBlocking) {
      return Math.random() < 0.4 ? 'shoot' : 'moveLeft';
    }

    return Math.random() < 0.7 ? 'attack' : 'moveLeft';
  }

  /* =========================
     MID RANGE CONTROL
  ========================= */
  if (absDist <= 140) {
    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.35) return 'attack';
      if (r < 0.65) return 'shoot';
      if (r < 0.85) return 'special'; // 🔥 NEW
      return dist > 0 ? 'moveRight' : 'moveLeft';
    }
  }

  return dist > 0 ? 'moveRight' : 'moveLeft';
}