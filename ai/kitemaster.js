export const name = "Kite";

export default function kiteMaster(self, opponent) {
  const dist = opponent.x - self.x;
  const absDist = Math.abs(dist);

  const opponentAttacking = opponent.action === 'attack';

  if (self.hitstun > 0) return 'idle';

  // keep perfect spacing logic
  const idealMin = 120;
  const idealMax = 190;

  // =========================
  // TOO CLOSE (ESCAPE)
  // =========================
  if (absDist < idealMin) {
    return dist > 0 ? 'moveLeft' : 'moveRight';
  }

  // =========================
  // IDEAL ZONE (KITE LOOP)
  // =========================
  if (absDist >= idealMin && absDist <= idealMax) {

    if (opponentAttacking && self.cooldown === 0) {
      return 'shoot';
    }

    if (Math.random() < 0.6 && self.cooldown === 0) {
      return 'shoot';
    }

    return Math.random() < 0.5
      ? 'moveLeft'
      : 'moveRight';
  }

  // =========================
  // TOO FAR (REPOSITION)
  // =========================
  if (absDist > idealMax) {
    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  if (Math.random() < 0.1) return 'jump';

  return 'idle';
}