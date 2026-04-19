export const name = "Void Stalker";
export const characterIndex = 22;

export default function voidStalker(self, opponent, bounds) {
  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  // 1. Evasive maneuvers
  if (opponent.action === 'attack' && Math.random() < 0.6) {
    return 'shadowStep'; // Fade out when attacked
  }

  // 2. Health management
  if (self.hp < self.maxHp * 0.4 && self.cooldown === 0) {
    return 'healPulse';
  }

  // 3. Precision Strikes
  if (abs > 150 && abs < 400) {
    if (self.cooldown === 0) {
      const r = Math.random();
      if (r < 0.5) return 'special'; // Sniper beam
      return 'energyWave';
    }
  }

  // 4. Mind games
  if (abs < 80) {
    if (self.cooldown === 0) return 'groundSlam'; // Pop them up
    return 'teleport'; // Blink behind them
  }

  return dist > 0 ? 'moveRight' : 'moveLeft';
}
