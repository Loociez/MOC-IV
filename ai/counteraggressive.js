export const name = "Counter";

export default function counterAggressive(self, opponent) {
  const dist = opponent.x - self.x;
  const absDist = Math.abs(dist);

  const opponentAttacking = opponent.action === 'attack';
  const opponentBlocking = opponent.isBlocking;

  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';
  if (self.hitStop > 0) return 'idle';

  /* =========================
     groundSlam
  ========================= */
  if (self.cooldown === 0 && absDist < 140 && opponentAttacking) {
    if (Math.random() < 0.25) return 'groundSlam';
  }

  /* =========================
     SAFE POKE
  ========================= */
  if (absDist > 120 && self.cooldown === 0) {
    if (Math.random() < 0.4) return 'shoot';
  }

  /* =========================
     CLOSE RANGE
  ========================= */
  if (absDist < 70) {

    if (opponentAttacking) {
      if (self.cooldown === 0 && Math.random() < 0.7) return 'attack';
      return Math.random() < 0.5 ? 'block' : 'moveLeft';
    }

    if (opponentBlocking) {
      if (self.cooldown === 0) {
        const r = Math.random();
        if (r < 0.5) return 'shoot';
        if (r < 0.75) return 'attack';
      }
      return 'moveLeft';
    }

    return self.cooldown === 0 ? 'attack' : 'idle';
  }

  /* =========================
     MID RANGE
  ========================= */
  if (absDist <= 150) {

    if (opponentAttacking && self.cooldown === 0) {
      return Math.random() < 0.6 ? 'shoot' : 'attack';
    }

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.4) return 'shoot';
      if (r < 0.65) return 'attack';
      if (r < 0.8) return dist > 0 ? 'moveRight' : 'moveLeft';
      if (r < 0.9) return 'dash';
      if (r < 0.98) return 'groundSlam';
    }
  }

  return dist > 0 ? 'moveRight' : 'moveLeft';
}