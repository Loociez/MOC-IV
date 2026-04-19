export const name = "Burst";
export const characterIndex = 15;     // 👈 specific character slot
export const spriteSheetIndex = 3;   // 👈 specific sheet (optional)

export default function burst(self, opponent) {
  const dist = Math.abs(opponent.x - self.x);

  const opponentAttacking = opponent.action === 'attack';

  if (self.hitstun > 0) return 'idle';

  /* =========================
     healPulse COMBO SETUP
  ========================= */
  if (self.cooldown === 0 && opponent.hp < opponent.maxHp * 0.5 && Math.random() < 0.3) {
    return 'healPulse';
  }

  /* =========================
     ALL-IN CLOSE RANGE
  ========================= */
  if (dist < 80) {
    if (opponentAttacking) return 'block';

    return self.cooldown === 0 ? 'attack' : 'idle';
  }

  /* =========================
     APPROACH BURST
  ========================= */
  if (dist <= 160) {
    if (self.cooldown === 0) {
      const r = Math.random();
      if (r < 0.5) return 'shoot';
      if (r < 0.7) return 'dash';
      if (r < 0.85) return 'moveLeft';
      return 'healPulse';
    }
  }

  return dist > 0 ? 'moveRight' : 'moveLeft';
}