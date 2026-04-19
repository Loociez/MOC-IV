export const name = "Adaptive Berserker";
export const characterIndex = 6;     // 👈 specific character slot
export const spriteSheetIndex = 3;   // 👈 specific sheet (optional)

const memory = new WeakMap();

function getMem(self) {
  if (!memory.has(self)) {
    memory.set(self, {
      aggression: 0.7,
      rage: 0
    });
  }
  return memory.get(self);
}

export default function berserker(self, opponent) {
  const dist = opponent.x - self.x;
  const absDist = Math.abs(dist);

  const mem = getMem(self);

  const lowHp = self.hp < self.maxHp * 0.4;
  const hasAdvantage = self.hp > opponent.hp;

  // build rage over time or when hurt
  if (lowHp) mem.rage = Math.min(1, mem.rage + 0.05);
  else mem.rage = Math.max(0, mem.rage - 0.02);

  if (hasAdvantage) mem.aggression = Math.min(1, mem.aggression + 0.02);

  // safety
  if (self.hitstun > 0 || self.hitStop > 0) return 'idle';

  if (self.x <= 50) return 'moveRight';
  if (self.x >= 750) return 'moveLeft';

  // CLOSE RANGE = CHAOS
  if (absDist < 90) {
    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.4 + mem.rage * 0.3) return 'attack';
      if (r < 0.6) return 'groundSlam';
      if (r < 0.75) return 'dash';
      if (r < 0.9) return 'rageMode';
    }

    if (Math.random() < 0.3) return 'teleport';

    return 'moveRight';
  }

  // MID RANGE = FORCE ENGAGE
  if (absDist < 200) {
    if (self.cooldown === 0) {
      if (Math.random() < 0.5) return 'dash';
      if (Math.random() < 0.7) return 'rageMode';
      return 'shoot';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // LONG RANGE = CLOSE GAP FAST
  if (self.cooldown === 0 && Math.random() < 0.6) return 'dash';
  if (Math.random() < 0.3) return 'teleport';

  return dist > 0 ? 'moveRight' : 'moveLeft';
}