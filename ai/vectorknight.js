export const name = "VectorKnight";
export const characterIndex = 11;
export const spriteSheetIndex = 3;
function clamp(v, a, b) {
return Math.max(a, Math.min(b, v));
}
export default function VectorKnight(self, opponent, bounds) {
const dist = opponent.x - self.x;
const abs = Math.abs(dist);
const hpRatio = self.hp / self.maxHp;
const enemyHpRatio = opponent.hp / opponent.maxHp;
const lowHp = hpRatio < 0.35;
const winning = self.hp > opponent.hp;
const canAct = self.cooldown === 0 && self.hitstun <= 0;
if (!canAct) return 'idle';
if (self.x < bounds.left + 40) return 'moveRight';
if (self.x > bounds.right - 40) return 'moveLeft';
const isEnemyAttacking = opponent.state === 'attack' || opponent.state === 'special';
if (abs < 150 && isEnemyAttacking) {
const react = Math.random();
if (react < 0.4) return 'block';
if (react < 0.7) return 'dash';
}
if (lowHp && enemyHpRatio > 0.2) {
if (abs < 100) {
if (Math.random() < 0.4) return 'dash';
return dist > 0 ? 'moveLeft' : 'moveRight';
}
if (Math.random() < 0.1) return 'heal';
if (Math.random() < 0.2) return 'teleport';
}
if (abs < 90) {
if (opponent.isBlocking && Math.random() < 0.5) return 'groundSlam';
if (self.isBlocking && Math.random() < 0.6) return 'counterStrike';
if (Math.random() < 0.7) return 'attack';
if (Math.random() < 0.2) return 'blinkStrike';
return dist > 0 ? 'moveLeft' : 'moveRight';
}
if (abs >= 90 && abs < 250) {
const aggression = winning ? 0.3 : 0.6;
if (Math.random() < aggression) return 'dash';
if (Math.random() < 0.4) return 'shoot';
if (Math.random() < 0.2) return 'energyWave';
if (Math.random() < 0.15 && !lowHp) return 'gravityWell';
return dist > 0 ? 'moveRight' : 'moveLeft';
}
if (abs >= 250) {
if (Math.random() < 0.5) return 'dash';
if (winning && Math.random() < 0.3) return 'fireAura';
if (!winning && Math.random() < 0.4) return 'iceTrap';
if (Math.random() < 0.3) return 'special';
return dist > 0 ? 'moveRight' : 'moveLeft';
}
return 'idle';
}