export const name = "Adaptive Trickster";
export const characterIndex = 11;    // specific character slot
export const spriteSheetIndex = 4;   // specific sheet

const memory = new WeakMap();

function getMem(self) {
  if (!memory.has(self)) {
    memory.set(self, {
      unpredictability: 0.7,
      feintTimer: 0,
      tauntCooldown: 0
    });
  }
  return memory.get(self);
}

function taunt(msg, mem) {
  mem.tauntCooldown = 110;
  if (window.pushFightLog) window.pushFightLog(msg, "system");
}

export default function ADtrickster(self, opponent, bounds) {
  const dist = opponent.x - self.x;
  const absDist = Math.abs(dist);

  const mem = getMem(self);
  if (mem.tauntCooldown > 0) mem.tauntCooldown--;
  if (mem.feintTimer > 0) mem.feintTimer--;

  if (self.hitstun > 0 || self.hitStop > 0) return 'idle';

  const left = bounds?.left ?? 40;
  const right = bounds?.right ?? 760;
  if (self.x <= left) return 'moveRight';
  if (self.x >= right) return 'moveLeft';

  // Reads the opponent: block a lot -> lean harder into mixups/teleports
  // to punish that habit instead of just rolling dice blindly.
  const opponentTurtling = opponent.isBlocking;
  const chaosChance = mem.unpredictability * (opponentTurtling ? 0.3 : 0.18);

  // FEINT: fake a retreat, then reverse into a punish. This is a
  // deliberate signature move rather than noise - it only fires when
  // actually close enough for it to mean something.
  if (mem.feintTimer === 0 && absDist < 120 && self.cooldown === 0 && Math.random() < 0.12) {
    mem.feintTimer = 18;
    if (mem.tauntCooldown === 0 && Math.random() < 0.4) {
      taunt(`${self.name} backs off... is it a trap?`, mem);
    }
    return dist > 0 ? 'moveLeft' : 'moveRight'; // step away from opponent
  }
  if (mem.feintTimer > 10) {
    // still retreating
    return dist > 0 ? 'moveLeft' : 'moveRight';
  }
  if (mem.feintTimer > 0 && mem.feintTimer <= 10 && self.cooldown === 0) {
    // snap back in for the punish
    if (Math.random() < 0.5) return 'shadowStep';
    return 'dash';
  }

  // RANDOM CHAOS FACTOR (reduced, and reactive to opponent behavior above)
  if (Math.random() < chaosChance) {
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

    return dist > 0 ? 'moveRight' : 'moveLeft';
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