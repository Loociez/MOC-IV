export const name = "Void Stalker";
export const characterIndex = 22;

export default function voidStalker(self, opponent, bounds) {
  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);

  if (self.x <= bounds.left + 20) return 'moveRight';
  if (self.x >= bounds.right - 20) return 'moveLeft';

  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';

  if (opponent.action === 'attack' && Math.random() < 0.6) {
    if (self.x > bounds.left + 100 && self.x < bounds.right - 100) {
      return 'shadowStep';
    }
    return 'jump';
  }

  if (self.hp < self.maxHp * 0.4 && self.cooldown === 0) {
    return 'healPulse';
  }

  if (abs > 150 && abs < 400) {
    if (self.cooldown === 0) {
      const r = Math.random();
      if (r < 0.5) return 'special';
      return 'energyWave';
    }
  }

  if (abs < 80) {
    if (self.cooldown === 0) return 'groundSlam';
    
    const roomToRight = (bounds.right - self.x) > 100;
    const roomToLeft = (self.x - bounds.left) > 100;
    
    if (dist > 0 && roomToRight) return 'teleport';
    if (dist < 0 && roomToLeft) return 'teleport';
    
    return 'block';
  }

  return dist > 0 ? 'moveRight' : 'moveLeft';
}
