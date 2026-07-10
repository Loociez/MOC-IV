export const name = "Adaptive Berserker";
export const characterIndex = 6;     // specific character slot
export const spriteSheetIndex = 3;   // specific sheet

const memory = new WeakMap();

function getMem(self) {
  if (!memory.has(self)) {
    memory.set(self, {
      aggression: 0.7,
      rage: 0,
      tauntCooldown: 0,
      wasLowHp: false
    });
  }
  return memory.get(self);
}

function taunt(msg, mem) {
  mem.tauntCooldown = 100;
  if (window.pushFightLog) window.pushFightLog(msg, "system");
}

export default function berserker(self, opponent, bounds) {
  const dist = opponent.x - self.x;
  const absDist = Math.abs(dist);

  const mem = getMem(self);
  if (mem.tauntCooldown > 0) mem.tauntCooldown--;

  const lowHp = self.hp < self.maxHp * 0.4;
  const hasAdvantage = self.hp > opponent.hp;

  if (lowHp) mem.rage = Math.min(1, mem.rage + 0.05);
  else mem.rage = Math.max(0, mem.rage - 0.02);

  if (hasAdvantage) mem.aggression = Math.min(1, mem.aggression + 0.02);
  else mem.aggression = Math.max(0.4, mem.aggression - 0.01);

  if (lowHp && !mem.wasLowHp && mem.tauntCooldown === 0) {
    taunt(`${self.name} is bleeding out and getting angrier!`, mem);
  }
  mem.wasLowHp = lowHp;

  const left = bounds?.left ?? 40;
  const right = bounds?.right ?? 760;

  if (self.x <= left) return 'moveRight';
  if (self.x >= right) return 'moveLeft';

  if (absDist < 90) {
    if (self.cooldown === 0) {
      const r = Math.random();

      if (r < 0.4 + mem.rage * 0.3) return 'attack';
      if (r < 0.6) return 'groundSlam';
      if (r < 0.75) return 'dash';
      if (r < 0.85 && mem.rage > 0.6 && mem.tauntCooldown === 0) {
        taunt(`${self.name} enters a berserker rage!`, mem);
        return 'rageMode';
      }
    }

    if (Math.random() < 0.3) return 'teleport';

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  if (absDist < 200) {
    if (self.cooldown === 0) {
      if (Math.random() < 0.5) return 'dash';
      if (Math.random() < 0.2 && mem.rage > 0.5) return 'rageMode';
      return 'shoot';
    }

    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  if (self.cooldown === 0 && Math.random() < 0.6) return 'dash';
  if (Math.random() < 0.3) return 'teleport';

  return dist > 0 ? 'moveRight' : 'moveLeft';
}