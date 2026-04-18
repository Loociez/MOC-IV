export const name = "Aggressive";

export default function aggressive(self, opponent) {
  const dist = opponent.x - self.x;
  const absDist = Math.abs(dist);

  const opponentBlocking = opponent.isBlocking;
  const opponentAttacking = opponent.action === 'attack';
  const inDanger = self.hp < self.maxHp * 0.35;

  // 🚨 ALWAYS respect states (prevents freezing / desync)
  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';
  if (self.hitStop > 0) return 'idle';

  // 🧱 stage boundaries safety
  if (self.x <= 50) return 'moveRight';
  if (self.x >= 750) return 'moveLeft';

  /* =========================
     DEFENSIVE EMERGENCY
  ========================= */
  if (inDanger) {
    if (self.cooldown === 0 && Math.random() < 0.4) return 'shoot';
    if (Math.random() < 0.3) return 'jump';
    if (Math.random() < 0.2) return 'block';
  }

  /* =========================
     CLOSE RANGE COMBAT
  ========================= */
  if (absDist < 70) {

    if (opponentAttacking) {
      if (self.cooldown === 0 && Math.random() < 0.5) return 'attack';
      if (Math.random() < 0.3) return 'block';
      return 'moveLeft';
    }

    if (opponentBlocking) {
      if (self.cooldown === 0 && Math.random() < 0.4) return 'shoot';
      return 'moveLeft';
    }

    if (self.cooldown === 0) {
      const r = Math.random();
      if (r < 0.65) return 'attack';
      if (r < 0.8) return 'block';
      if (r < 0.95) return 'jump';
    }

    return 'idle';
  }

  /* =========================
     MID RANGE PRESSURE
  ========================= */
  if (absDist <= 160) {

    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.35) return dist > 0 ? 'moveRight' : 'moveLeft';
      if (r < 0.6) return 'attack';
      if (r < 0.85) return 'shoot';
      if (r < 0.95) return 'dash';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  /* =========================
     LONG RANGE APPROACH
  ========================= */
  if (self.cooldown === 0 && absDist > 160 && absDist < 300) {
    if (Math.random() < 0.4) return 'dash';
    if (Math.random() < 0.3) return 'shoot';
  }

  return dist > 0 ? 'moveRight' : 'moveLeft';
}