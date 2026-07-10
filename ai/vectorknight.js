export const name = "VectorKnight";
// FIX: characterIndex collided with Adaptive Trickster (both were 11),
// risking two "different" fighters rendering identically. Moved slots.
export const characterIndex = 14;
export const spriteSheetIndex = 3;

const memory = new WeakMap();
function getMem(self) {
  if (!memory.has(self)) memory.set(self, { tauntCooldown: 0 });
  return memory.get(self);
}
function taunt(msg, mem) {
  mem.tauntCooldown = 100;
  if (window.pushFightLog) window.pushFightLog(msg, "system");
}

export default function VectorKnight(self, opponent, bounds) {
  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);
  const hpRatio = self.hp / self.maxHp;
  const enemyHpRatio = opponent.hp / opponent.maxHp;
  const lowHp = hpRatio < 0.35;
  const winning = self.hp > opponent.hp;
  const mem = getMem(self);
  if (mem.tauntCooldown > 0) mem.tauntCooldown--;

  const canAct = self.cooldown === 0 && self.hitstun <= 0;

  const left = bounds?.left ?? 40;
  const right = bounds?.right ?? 760;
  if (self.x < left + 40) return 'moveRight';
  if (self.x > right - 40) return 'moveLeft';

  // FIX: this checked opponent.state, a property that doesn't exist on
  // Fighter (it's called .action) - so this reactive block/dash never
  // actually fired, no matter what the opponent was doing.
  const isEnemyAttacking = opponent.action === 'attack';
  if (abs < 150 && isEnemyAttacking) {
    const react = Math.random();
    if (react < 0.4) return 'block';
    if (react < 0.7) return 'dash';
  }

  // FIX: previously returned 'idle' on every cooldown frame, meaning this
  // fighter visibly froze in place for a chunk of every engagement. Now it
  // keeps repositioning/feinting instead.
  if (!canAct) {
    if (abs < 70) return dist > 0 ? 'moveLeft' : 'moveRight'; // circle out
    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  if (lowHp && enemyHpRatio > 0.2) {
    if (abs < 100) {
      if (Math.random() < 0.4) return 'dash';
      return dist > 0 ? 'moveLeft' : 'moveRight';
    }
    // FIX: 'heal' isn't a real move - the engine only recognizes
    // 'healPulse'. This branch used to silently do nothing.
    if (Math.random() < 0.15) {
      if (mem.tauntCooldown === 0) taunt(`${self.name} channels a healing pulse.`, mem);
      return 'healPulse';
    }
    if (Math.random() < 0.25) return 'teleport';
  }

  if (abs < 90) {
    // FIX: 'counterStrike' and 'blinkStrike' don't exist in the engine's
    // move list - mapped to real, thematically-close equivalents
    // (a launching counter, and a teleport-strike).
    if (opponent.isBlocking && Math.random() < 0.5) return 'groundSlam';
    if (self.isBlocking && Math.random() < 0.6) return 'uppercut';
    if (Math.random() < 0.6) return 'attack';
    if (Math.random() < 0.25) return 'shadowStep';
    return dist > 0 ? 'moveLeft' : 'moveRight';
  }

  if (abs >= 90 && abs < 250) {
    const aggression = winning ? 0.3 : 0.6;
    if (Math.random() < aggression) return 'dash';
    if (Math.random() < 0.4) return 'shoot';
    if (Math.random() < 0.25) return 'energyWave';
    // FIX: 'gravityWell' doesn't exist - iceTrap is the closest real
    // control tool the engine has (damage + long freeze).
    if (Math.random() < 0.15 && !lowHp) return 'iceTrap';
    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  if (abs >= 250) {
    if (Math.random() < 0.5) return 'dash';
    // FIX: 'fireAura' doesn't exist - lightningStrike is the real ranged
    // offensive tool the engine has for this range band.
    if (winning && Math.random() < 0.3) return 'lightningStrike';
    if (!winning && Math.random() < 0.4) return 'iceTrap';
    if (Math.random() < 0.3) return 'special';
    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  return dist > 0 ? 'moveRight' : 'moveLeft';
}