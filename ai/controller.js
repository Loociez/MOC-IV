export const name = "Adaptive Controller";

const memory = new WeakMap();

function getMem(self) {
  if (!memory.has(self)) {
    memory.set(self, {
      patience: 0.6,
      defenseBias: 0.5
    });
  }
  return memory.get(self);
}

export default function controller(self, opponent) {
  const dist = opponent.x - self.x;
  const absDist = Math.abs(dist);

  const mem = getMem(self);

  const opponentAttacking = opponent.action === 'attack';

  // adjust style dynamically
  if (self.hp < opponent.hp) mem.defenseBias = Math.min(1, mem.defenseBias + 0.02);
  else mem.defenseBias = Math.max(0.3, mem.defenseBias - 0.01);

  if (self.hitstun > 0 || self.hitStop > 0) return 'idle';

  if (self.x <= 50) return 'moveRight';
  if (self.x >= 750) return 'moveLeft';

  // CLOSE RANGE = DEFENSIVE REACTIONS
  if (absDist < 80) {
    if (opponentAttacking) {
      if (self.cooldown === 0 && Math.random() < 0.4) return 'groundSlam';
      if (Math.random() < 0.5) return 'block';
      return 'teleport';
    }

    if (self.cooldown === 0 && Math.random() < 0.3) return 'attack';

    return 'moveLeft';
  }

  // MID RANGE = ZONE CONTROL
  if (absDist <= 200) {
    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.4) return 'shoot';
      if (r < 0.7) return 'energyWave';
      if (r < 0.85) return 'shield';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // LONG RANGE = KEEP DISTANCE
  if (absDist > 200) {
    if (self.cooldown === 0 && Math.random() < 0.5) return 'energyWave';
    if (Math.random() < 0.3) return 'teleport';

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  return 'idle';
}