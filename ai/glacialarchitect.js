export const name = "Glacial Architect";
export const characterIndex = 15;

export default function glacialArchitect(self, opponent, bounds) {
  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  if (self.hitstun > 0) return 'idle';

  // 1. Keep away logic
  if (abs < 120) {
    if (self.cooldown === 0) return 'iceTrap'; // Freeze them if they get close
    return 'teleport'; // Then blink away
  }

  // 2. Mid-range harassment
  if (abs < 300) {
    if (self.cooldown === 0) {
      const r = Math.random();
      if (r < 0.6) return 'shoot';
      if (r < 0.9) return 'energyWave';
      return 'shield';
    }
    return dist > 0 ? 'moveLeft' : 'moveRight'; // Back away while shooting
  }

  // 3. Long range setup
  if (self.cooldown === 0 && Math.random() < 0.1) return 'iceTrap';
  return dist > 0 ? 'moveRight' : 'moveLeft'; // Approach slowly
}
