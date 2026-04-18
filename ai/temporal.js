export const name = "Temporal";

export default function temporal(self, opponent) {
  const dist = Math.abs(opponent.x - self.x);

  const opponentAttacking = opponent.action === 'attack';

  if (self.hitstun > 0) return 'idle';
  if (self.hitStop > 0) return 'idle';

  /* =========================
     TIME SLOW FISH (core identity)
  ========================= */
  if (self.cooldown === 0 && opponentAttacking && dist < 160) {
    if (Math.random() < 0.4) return 'timeSlow';
  }

  /* =========================
     COUNTER WINDOW
  ========================= */
  if (dist < 80) {
    if (opponentAttacking) {
      return Math.random() < 0.6 ? 'attack' : 'block';
    }
    return Math.random() < 0.5 ? 'attack' : 'dash';
  }

  /* =========================
     ZONE CONTROL
  ========================= */
  if (dist <= 160) {
    const r = Math.random();
    if (r < 0.5) return 'shoot';
    if (r < 0.8) return 'moveLeft';
    return 'timeSlow';
  }

  return opponent.x > self.x ? 'moveRight' : 'moveLeft';
}