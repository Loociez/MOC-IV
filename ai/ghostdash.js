export const name = "Ghost Dash";
export const characterIndex = 12;    // Changed index to keep it unique
export const spriteSheetIndex = 1;

const memory = new WeakMap();

function getMem(self) {
  if (!memory.has(self)) {
    memory.set(self, {
      lastCorner: null,
      evading: false
    });
  }
  return memory.get(self);
}

export default function ghostDash(self, opponent, bounds) {
  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);
  const mem = getMem(self);

  // =========================
  // 1. CORNER ESCAPE LOGIC (The "Opposite Corner" Dash)
  // =========================
  const nearLeftWall = self.x < bounds.left + 80;
  const nearRightWall = self.x > bounds.right - 80;

  // If pushed into a corner, trigger high-priority dash to the other side
  if (nearLeftWall) {
    if (abs < 100) return 'teleport'; // Instant swap if enemy is close
    return 'moveRight'; 
  }
  if (nearRightWall) {
    if (abs < 100) return 'teleport'; // Instant swap if enemy is close
    return 'moveLeft';
  }

  // =========================
  // 2. HITSTUN / SAFETY
  // =========================
  if (self.hitstun > 0 || self.action === 'hurt') return 'idle';

  // =========================
  // 3. CLOSE RANGE BAIT & SWITCH
  // =========================
  if (abs < 100) {
    // High chance to "Nope" out of there to the furthest point
    const escapeRoll = Math.random();
    
    if (escapeRoll < 0.4) {
      // Dash away from wherever the opponent is
      return dist > 0 ? 'shadowStep' : 'shadowStep'; 
    }

    // Occasional quick strike before leaving
    if (self.cooldown === 0) {
      const r = Math.random();
      if (r < 0.3) return 'attack';
      if (r < 0.6) return 'iceTrap'; // Leave a trap while running
      return 'fireNova';
    }
    
    // Fallback: Just get out
    return dist > 0 ? 'moveLeft' : 'moveRight';
  }

  // =========================
  // 4. MID RANGE (Aggressive Poke)
  // =========================
  if (abs < 250) {
    if (self.cooldown === 0) {
      const r = Math.random();
      if (r < 0.4) return 'energyWave';
      if (r < 0.7) return 'shoot';
      if (r < 0.9) return 'dash';
    }
    // Slowly approach to bait the enemy into "Cornering" them
    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // 5. LONG RANGE (The Reset)
  // =========================
  // If at long range, wait and recover cooldowns
  if (self.cooldown === 0 && Math.random() < 0.1) return 'healPulse';
  
  // Taunt the enemy to come closer
  return 'idle';
}
