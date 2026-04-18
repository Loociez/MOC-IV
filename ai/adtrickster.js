export const name = "Adaptive Trickster";

const memory = new WeakMap();

function getMem(self) {
  if (!memory.has(self)) {
    memory.set(self, {
      unpredictability: 0.7
    });
  }
  return memory.get(self);
}

export default function ADtrickster(self, opponent) {
  const dist = opponent.x - self.x;
  const absDist = Math.abs(dist);

  const mem = getMem(self);

  if (self.hitstun > 0 || self.hitStop > 0) return 'idle';

  if (self.x <= 50) return 'moveRight';
  if (self.x >= 750) return 'moveLeft';

  // RANDOM CHAOS FACTOR
  if (Math.random() < mem.unpredictability * 0.2) {
    const randomMoves = ['dash', 'teleport', 'jump', 'block'];
    return randomMoves[Math.floor(Math.random() * randomMoves.length)];
  }

  // CLOSE RANGE = MIXUPS
  if (absDist < 90) {
    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.3) return 'attack';
      if (r < 0.5) return 'groundSlam';
      if (r < 0.7) return 'special';
      if (r < 0.85) return 'shadowStep';
    }

    if (Math.random() < 0.4) return 'teleport';

    return 'moveRight';
  }

  // MID RANGE = CONFUSE ENEMY
  if (absDist <= 200) {
    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.3) return 'shoot';
      if (r < 0.5) return 'energyWave';
      if (r < 0.7) return 'teleport';
      if (r < 0.85) return 'dash';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // LONG RANGE = FAST REPOSITION
  if (self.cooldown === 0 && Math.random() < 0.4) return 'shadowStep';
  if (Math.random() < 0.5) return 'teleport';

  return dist > 0 ? 'moveRight' : 'moveLeft';
}