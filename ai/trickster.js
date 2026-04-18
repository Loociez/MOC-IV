export const name = "Trickster";

export default function trickster(self, opponent) {
  const dist = opponent.x - self.x;
  const absDist = Math.abs(dist);

  const opponentAttacking = opponent.action === 'attack';

  if (self.hitstun > 0) return 'idle';
  if (self.hitStop > 0) return 'idle';

  /* =========================
     TELEPORT BAIT (NEW STYLE USAGE OF TIME SLOW WINDOW)
  ========================= */
  if (self.cooldown === 0 && absDist < 120 && Math.random() < 0.25) {
    return 'timeSlow';
  }

  /* =========================
     DASH ENGAGE
  ========================= */
  if (absDist > 90 && absDist < 160 && self.cooldown === 0) {
    if (Math.random() < 0.5) return 'dash';
  }

  /* =========================
     CLOSE COMBAT
  ========================= */
  if (absDist < 70) {

    if (opponentAttacking) {
      return Math.random() < 0.5 ? 'dash' : 'block';
    }

    return Math.random() < 0.7 ? 'attack' : 'shoot';
  }

  /* =========================
     MID RANGE
  ========================= */
  if (absDist <= 150) {
    const r = Math.random();

    if (r < 0.35) return 'dash';
    if (r < 0.6) return 'shoot';
    if (r < 0.8) return 'moveRight';
    return 'timeSlow';
  }

  return dist > 0 ? 'moveRight' : 'moveLeft';
}