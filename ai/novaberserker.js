export const name = "Nova Berserker";
export const characterIndex = 8;

export default function novaBerserker(self, opponent, bounds) {
  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  // 1. Rage activation
  if (self.hp < self.maxHp * 0.5 && self.cooldown === 0 && Math.random() < 0.05) {
    return 'rageMode';
  }

  // 2. The "Stick to them" logic
  if (abs > 100) {
    if (self.cooldown === 0 && Math.random() < 0.3) return 'shadowStep'; // Get in instantly
    return 'dash'; // Or just run them down
  }

  // 3. Close quarters combat
  if (abs <= 100) {
    if (self.cooldown === 0) {
      const r = Math.random();
      if (r < 0.4) return 'fireNova'; // Blast them
      if (r < 0.7) return 'uppercut'; // Launch them
      return 'attack';
    }
    return 'block'; // Wait for cooldown while blocking
  }

  return 'idle';
}
