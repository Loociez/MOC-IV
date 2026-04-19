export const name = "VectorKnight Zenith";
export const characterIndex = 11;
export const spriteSheetIndex = 3;

export default function VectorKnight(self, opponent, bounds) {
  const dist = opponent.x - self.x;
  const abs = Math.abs(dist);
  const hpRatio = self.hp / self.maxHp;
  const enemyHpRatio = opponent.hp / opponent.maxHp;
  
  const canAct = self.cooldown === 0 && self.hitstun <= 0 && self.action !== 'hurt';
  if (!canAct) return 'idle';

  // =========================
  // 1. SUPREME BOUNDARY AWARENESS
  // =========================
  const nearLeft = self.x < bounds.left + 60;
  const nearRight = self.x > bounds.right - 60;

  if (nearLeft || nearRight) {
    // If pinned, use shadowStep to instantly swap sides with the enemy
    if (abs < 150) return 'shadowStep';
    return nearLeft ? 'moveRight' : 'moveLeft';
  }

  // =========================
  // 2. DEFENSIVE REFLEXES
  // =========================
  const isEnemyAttacking = opponent.action === 'attack' || opponent.action === 'special';
  if (isEnemyAttacking && abs < 120) {
    const roll = Math.random();
    if (roll < 0.3) return 'block';
    if (roll < 0.6) return 'shadowStep'; // More insane than a regular dash
    return 'jump';
  }

  // =========================
  // 3. DESPERATION / RAGE LOGIC
  // =========================
  if (hpRatio < 0.3) {
    if (Math.random() < 0.1) return 'rageMode';
    if (Math.random() < 0.05) return 'healPulse';
    if (abs < 100) return 'fireNova'; // Get off me tool
  }

  // =========================
  // 4. CLOSE RANGE (PREDATOR)
  // =========================
  if (abs < 90) {
    const roll = Math.random();
    // Shield break logic
    if (opponent.isBlocking && roll < 0.6) return 'groundSlam';
    
    if (roll < 0.4) return 'attack';
    if (roll < 0.6) return 'uppercut';
    if (roll < 0.8) return 'fireNova';
    return 'block';
  }

  // =========================
  // 5. MID RANGE (PRESSURE)
  // =========================
  if (abs >= 90 && abs < 280) {
    const roll = Math.random();
    
    // Trap the enemy if they try to run
    if (enemyHpRatio < hpRatio && roll < 0.3) return 'iceTrap';
    
    if (roll < 0.3) return 'energyWave';
    if (roll < 0.5) return 'shoot';
    if (roll < 0.7) return 'dash';
    return 'special';
  }

  // =========================
  // 6. LONG RANGE (ENGAGE)
  // =========================
  if (abs >= 280) {
    const roll = Math.random();
    if (roll < 0.4) return 'shadowStep'; // Surprise entrance
    if (roll < 0.7) return 'dash';
    return dist > 0 ? 'moveRight' : 'moveLeft';
  }

  return 'idle';
}
