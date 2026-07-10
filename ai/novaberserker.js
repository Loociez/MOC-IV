export const name = "Nova Berserker";
export const characterIndex = 8;
export const spriteSheetIndex = 2; // explicit slot so it doesn't silently default to sheet 1

const memory = new WeakMap();

function getMem(self) {
  if (!memory.has(self)) {
    memory.set(self, {
      raging: false,
      rageTimer: 0,
      tauntCooldown: 0,
      hasHitBefore: false
    });
  }
  return memory.get(self);
}

function taunt(msg, mem) {
  mem.tauntCooldown = 90; // ~1.5s of feed-quiet between lines
  if (window.pushFightLog) window.pushFightLog(msg, "system");
}

// FIX: identity clash - a "Berserker" is supposed to be relentless, but the
// original AI spent its entire cooldown window sitting in 'block' at close
// range. Combined with an old engine bug where block never turned off, this
// fighter could look effectively unkillable. Now it presses forward with
// footwork/feints while waiting instead of turtling - this AI never blocks.
export default function novaBerserker(self, opponent, bounds) {
  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);
  const mem = getMem(self);

  if (mem.tauntCooldown > 0) mem.tauntCooldown--;

  const lowHp = self.hp < self.maxHp * 0.5;
  const left = bounds?.left ?? 40;
  const right = bounds?.right ?? 760;

  if (self.x <= left) return 'moveRight';
  if (self.x >= right) return 'moveLeft';

  // Bark when a hit lands, sparingly.
  if (self.attackHasHit && !mem.hasHitBefore && mem.tauntCooldown === 0 && Math.random() < 0.5) {
    taunt(`${self.name} roars after landing a hit!`, mem);
  }
  mem.hasHitBefore = self.attackHasHit;

  // 1. RAGE ACTIVATION - a real state, not just a coin flip every frame.
  if (!mem.raging && lowHp && self.cooldown === 0 && Math.random() < 0.08) {
    mem.raging = true;
    mem.rageTimer = 240; // ~4s of heightened aggression
    taunt(`${self.name} flies into a rage!`, mem);
    return 'rageMode';
  }
  if (mem.raging) {
    mem.rageTimer--;
    if (mem.rageTimer <= 0) mem.raging = false;
  }

  const aggression = mem.raging ? 0.9 : 0.55;

  // 2. CLOSE THE GAP - mix shadowStep gank with a straight dash so it
  // doesn't feel like the same teleport spam every time.
  if (abs > 100) {
    if (self.cooldown === 0 && Math.random() < (mem.raging ? 0.45 : 0.25)) return 'shadowStep';
    return 'dash';
  }

  // 3. CLOSE QUARTERS - always doing *something* offensive/mobile, never
  // parking in block.
  if (self.cooldown === 0) {
    const r = Math.random();
    if (r < 0.35 * aggression + 0.1) return 'fireNova';
    if (r < 0.65) return 'uppercut';
    return 'attack';
  }

  // On cooldown: keep pressure/footwork alive instead of freezing or
  // hiding behind a permanent block.
  if (Math.random() < 0.4) return dist > 0 ? 'moveRight' : 'moveLeft';
  if (Math.random() < 0.3) return dist > 0 ? 'moveLeft' : 'moveRight'; // bait a whiff
  return 'idle';
}