export class Fighter {
  constructor(x, color, botLogic, character = null, spriteSheetIndex = 1) {
    this.spawnX = x;
    this.x = x;
    this.y = 395;
    this.vx = 0;
    this.vy = 0;

    this.width = 32;
    this.height = 32;

    this.color = color;
    this.facing = 'right';

    this.cooldown = 0;
    this.botLogic = botLogic;

    // Frames during which the AI is not consulted for a new decision
    // (covers dash/special/teleport windup so moves can't be interrupted
    // or double-triggered mid-animation).
    this.actionLockTimer = 0;

    this.character = character;

    this.action = 'idle';
    this.frame = 0;
    this.frameTimer = 0;

    this.attackHasHit = false;
    this.ready = false;
    this.isOnGround = true;

    // ===== COMBAT STATE =====
    this.hitStop = 0;
    this.hitstun = 0;

    this.comboStep = 0;
    this.comboTimer = 0;
    this.comboCounter = 0;
    this.juggleCount = 0;

    // ===== FX SYSTEM =====
    this.hitSparks = [];
    this.floatingText = null;
    this.auraPulse = 0;

    // ===== BLOCK SYSTEM =====
    this.isBlocking = false;

    this.isShootingProjectile = false;
    this.projectiles = [];

    // ===== VISUAL FX (ADDED) =====
    this.dashTrail = [];
    this.beamEffects = [];

    // ===== NEW ABILITY FX (ADDED) =====
    this.teleportFX = [];
    this.slamWaves = [];
    this.healFX = [];
    this.shieldTimer = 0;
    this.rageBuffTimer = 0;
    this.slowTimer = 0;
    this.poisonTicksLeft = 0;
    this.poisonTickTimer = 0;
    this.energyWaves = [];
	
	// ===== UNIQUE ABILITY FX PALETTES =====
this.fxPalette = {
  uppercut: 'purple',
  fireNova: 'orange',
  iceTrap: 'cyan',
  shadowStep: 'rgba(0,255,255,0.6)',
  rageMode: 'rgba(255,0,0,0.4)',
  healPulse: 'rgba(0,255,100,0.5)',
  shield: 'rgba(0,150,255,0.4)',
  teleport: 'rgba(180,0,255,0.4)',
  groundSlam: 'orange',
  energyWave: 'rgba(0,200,255,0.6)',
  special: 'yellow'
};

    // ===== SPRITE =====
    const index = Math.max(1, Math.min(spriteSheetIndex, 6));
    this.spriteSheet = new Image();
    this.spriteSheet.src = `./sprites/sprites${index}.png`;
    this.spriteSheet.onload = () => (this.ready = true);

    // ===== NAME =====
    const names = ["Camcard","rhYno","Coconut","Rayo","Pomni","Solek","Arz","ThePhork","Tammy","Corcoran","Athena","Harley","Madam","JesusCon","Rich","Consty","Diabolic","Fidks","Hyrul","Tameshi","Volk","Beastly7","UFO"];
    this.name = names[Math.floor(Math.random() * names.length)];

    // ===== STATS =====
    const rarityRoll = Math.random();
if (rarityRoll < 0.6) {
this.rarity = 'Common';
this.hp = 295;
this.attackRange = 75;
this.glow = 'rgba(220, 240, 255, 0.5)';
} else if (rarityRoll < 0.85) {
this.rarity = 'Rare';
this.hp = 305;
this.attackRange = 75;
this.glow = 'rgba(0, 220, 255, 0.8)';
} else if (rarityRoll < 0.97) {
this.rarity = 'Epic';
this.hp = 355;
this.attackRange = 75;
this.glow = 'rgba(230, 50, 255, 0.9)';
} else {
this.rarity = 'Legendary';
this.hp = 430;
this.attackRange = 75;
this.glow = 'rgba(255, 255, 0, 1.0)';
}

    this.maxHp = this.hp;
  }

  /* =========================
     SPRITE MAPPING (12 FRAMES PER CHARACTER)
     0-11 = character 1
     12-23 = character 2
     etc...
     32 columns per row, 1024x1024 sheet
  ========================= */

  getFrameIndex() {
    // 0: up walk, 1: up idle, 2: up attack
    // 3: down walk, 4: down idle, 5: down attack
    // 6: left walk, 7: left idle, 8: left attack
    // 9: right walk, 10: right idle, 11: right attack

    let base = 0;

    const isMoving = Math.abs(this.vx) > 0.5;
    const isAttacking = this.action === 'attack';

    // ALWAYS face opponent (forced externally + reinforced here)
    const dir =
      this.facing === 'up' ? 'up' :
      this.facing === 'down' ? 'down' :
      this.facing === 'left' ? 'left' : 'right';

    if (dir === 'up') {
      base = isAttacking ? 2 : (isMoving ? 0 : 1);
    }
    else if (dir === 'down') {
      base = isAttacking ? 5 : (isMoving ? 3 : 4);
    }
    else if (dir === 'left') {
      base = isAttacking ? 8 : (isMoving ? 6 : 7);
    }
    else if (dir === 'right') {
      base = isAttacking ? 11 : (isMoving ? 9 : 10);
    }

    const characterOffset = (this.character || 0) * 12;

    return characterOffset + base;
  }

  /* =========================
     FX
  ========================= */

  createHitSparks(x, y, color = 'orange') {
    for (let i = 0; i < 6; i++) {
      this.hitSparks.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 20,
        color
      });
    }
  }

  showDamage(dmg, color = 'red') {
    this.floatingText = {
      text: `-${dmg}`,
      color,
      timer: 30,
      yOffset: 0
    };
  }

  /* =========================
     PROJECTILES
  ========================= */

  shootProjectile(targetX, targetY) {
    if (this.isShootingProjectile) return;

    this.isShootingProjectile = true;
    setTimeout(() => (this.isShootingProjectile = false), 250);

    const projectile = {
      x: this.x + this.width,
      y: this.y + this.height / 2,
      speed: 8,
      active: true,
      hitRadius: 18,
      trail: [],

      update: function(enemy, owner) {
        if (!this.trail) this.trail = [];

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();

        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.speed || dist === 0) {
          this.active = false;
          return;
        }

        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;

        const hit =
          Math.abs(this.x - enemy.x) < this.hitRadius + enemy.width / 2 &&
          Math.abs(this.y - enemy.y) < this.hitRadius + enemy.height / 2;

        if (hit) {
          const dmg = 6 + Math.floor(Math.random() * 6);
          const finalDmg = enemy.isBlocking ? Math.floor(dmg * 0.35) : dmg;

          enemy.takeDamage(finalDmg);

// 💥 IMPACT FX
window.effects?.shake();
window.effects?.flash();

if (finalDmg >= 8) {
  window.effects?.text("CRITICAL!", 400);
}

          enemy.hitstun = enemy.isBlocking ? 5 : 15;
          enemy.vx = this.x < enemy.x ? 3 : -3;
          enemy.vy = -4;

          enemy.createHitSparks(enemy.x, enemy.y - 30, 'yellow');
          enemy.showDamage(finalDmg);

          enemy.hitStop = 3;
          owner.hitStop = 2;

          this.active = false;
        }
      },

      draw: function(ctx) {
        if (!this.trail) return;

        for (let i = 0; i < this.trail.length; i++) {
          const t = this.trail[i];
          ctx.fillStyle = `rgba(255,255,0,${i / this.trail.length})`;
          ctx.fillRect(t.x, t.y, 2, 2);
        }

        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    this.projectiles.push(projectile);
  }

  /* =========================
     UPDATE
  ========================= */

  update(opponent, bounds) {
    if (!this.ready) return;

    if (this.hitStop > 0) {
      this.hitStop--;
      return;
    }

    if (this.hitstun > 0) {
      this.hitstun--;
      this.action = 'hurt';
    }

    if (this.cooldown > 0) this.cooldown--;

    if (this.shieldTimer > 0) this.shieldTimer--;
    if (this.rageBuffTimer > 0) this.rageBuffTimer--;
    if (this.slowTimer > 0) this.slowTimer--;

    // FIX: poisonCloud used to apply nothing. Now it's a real
    // damage-over-time tick, ~1 tick every 20 frames while stacks remain.
    if (this.poisonTicksLeft > 0) {
      this.poisonTickTimer++;
      if (this.poisonTickTimer >= 20) {
        this.poisonTickTimer = 0;
        this.poisonTicksLeft--;
        const tickDmg = 2 + Math.floor(Math.random() * 3);
        this.takeDamage(tickDmg);
        this.showDamage(tickDmg, 'rgba(0,255,100,0.9)');
      }
    }

    if (this.actionLockTimer > 0) this.actionLockTimer--;

    this.auraPulse += 0.05;

    // FIX: previously checked this.action for 'dash'/'special', but those
    // cases actually set this.action to 'run'/'attack', so the guard never
    // caught them and AI could spam re-decisions mid-move. Now uses a real
    // timer set explicitly by the moves that need a committed window.
    if (
  this.hitstun === 0 &&
  this.juggleCount < 4 && // STOP AIR LOCK COMBOS
  this.actionLockTimer === 0 &&
  this.action !== 'attack'
) {
  const action = this.botLogic(this, opponent);
  this.handleAction(action, opponent);
}

  // =========================
// PHYSICS (SAFE ARENA CONTAINMENT FIX)
// =========================

// FIX: timeSlow used to set slowTimer but nothing ever read it. Now a
// slowed fighter actually moves at reduced speed while it's active.
const slowFactor = this.slowTimer > 0 ? 0.4 : 1;

this.x += this.vx * slowFactor;
this.y += this.vy;

// =========================
// GLOBAL DAMPING
// =========================
this.vx *= 0.85;

// =========================
// HARD VELOCITY LIMITS (NEW)
// prevents being launched out of map
// =========================
const MAX_VX = 10;
const MAX_VY = 12;

this.vx = Math.max(-MAX_VX, Math.min(MAX_VX, this.vx));
this.vy = Math.max(-MAX_VY, Math.min(MAX_VY, this.vy));

// -------------------------
// CONSTANTS
// -------------------------
const ground = 395;
const ceiling = 0;
// FIX (bounds mismatch): game.js hands AI scripts a `bounds` object
// (self.x <= bounds.left / >= bounds.right checks live in every AI file)
// but this physics code used to hardcode its own different numbers
// (40/760), so the walls the AI "saw" weren't the walls that actually
// stopped it. Now both read from the same object, with these as a
// fallback only if none is passed in.
const stageLeft = bounds?.left ?? 40;
const stageRight = bounds?.right ?? 760;

// Stash so handleAction() (called earlier this same tick, before these
// consts existed) and ability moves like teleport/shadowStep can clamp
// against the exact same walls instead of their own hardcoded numbers.
this.arenaLeft = stageLeft;
this.arenaRight = stageRight;

// -------------------------
// FLOOR (GROUND LOCK)
// -------------------------
if (this.y >= ground) {
  this.y = ground;
  this.vy = 0;
  this.isOnGround = true;
  this.juggleCount = 0;
} else {
  this.isOnGround = false;
  this.vy += 0.5; // gravity always applies when airborne
}

// -------------------------
// CEILING (IMPORTANT FIX)
// prevents infinite launch / soft-lock above arena
// -------------------------
if (this.y <= ceiling) {
  this.y = ceiling;

  // stop upward momentum
  this.vy = Math.max(0, this.vy);

  // BREAK AIR COMBOS WHEN HIT CEILING
  this.juggleCount = Math.max(this.juggleCount, 2);

  // force re-entry into gravity loop
  this.isOnGround = false;
}

// -------------------------
// LEFT WALL
// -------------------------
if (this.x <= stageLeft) {
  this.x = stageLeft;

  // bounce back instead of sticking
  if (this.vx < 0) this.vx = Math.abs(this.vx) * 0.3;
}

// -------------------------
// RIGHT WALL
// -------------------------
if (this.x >= stageRight) {
  this.x = stageRight;

  if (this.vx > 0) this.vx = -Math.abs(this.vx) * 0.3;
}

    // ALWAYS FACE OPPONENT
    this.facing = this.x < opponent.x ? 'right' : 'left';

    // animation timing
    this.frameTimer++;
    if (this.frameTimer > 10) {
      this.frameTimer = 0;

      if (this.action === 'run') this.frame = (this.frame + 1) % 2;

      if (this.action === 'attack') {
        this.frame++;
        if (this.frame > 1) {
          this.action = 'idle';
          this.frame = 0;
          this.attackHasHit = false;
        }
      }
    }

    /* =========================
       MELEE
    ========================= */

    if (this.action === 'attack' && this.frame === 1 && !this.attackHasHit) {
      const dist = Math.abs(this.x - opponent.x);

      if (dist <= this.attackRange) {
        const rageMult = this.rageBuffTimer > 0 ? 1.4 : 1;
        const dmg = Math.floor((5 + Math.floor(Math.random() * 6)) * rageMult);
        const finalDmg = opponent.isBlocking ? Math.floor(dmg * 0.4) : dmg;

        opponent.takeDamage(finalDmg);

// 💥 IMPACT FX
window.effects?.shake();
window.effects?.flash();

// 🎯 CRITICAL HIT FEEL
if (finalDmg >= 8) {
  window.effects?.text("CRITICAL!", 400);
}

opponent.hitstun = opponent.isBlocking ? 8 : 20;

// =========================
// SAFE KNOCKBACK SYSTEM (FIXED ANTI-INFINITE JUGGLE)
// =========================

const MAX_AIR_JUGGLE = 3;

// horizontal knockback (safe + capped)
opponent.vx = this.x < opponent.x ? 3 : -3;

// vertical knockback (CONTROLLED LAUNCH SYSTEM)
if (opponent.isOnGround) {
  // normal grounded hit launch
  opponent.vy = -5;
} else {
  // air hit = weak pop only (prevents infinite stacking upward)
  opponent.vy = Math.max(opponent.vy, -2);
}

// juggle counter
opponent.juggleCount = (opponent.juggleCount || 0) + 1;

// HARD RESET if over juggle limit
if (opponent.juggleCount > MAX_AIR_JUGGLE) {
  opponent.vy = Math.min(opponent.vy, 2);   // force downward drift
  opponent.hitstun = 10;
}

// =========================
// 🧱 HARD ANTI-CEILING STALL FIX (IMPORTANT ADDITION)
// =========================

// if opponent is already high in air and still being launched upward,
// force gravity correction immediately
if (opponent.y < 80) {
  opponent.vy = Math.max(opponent.vy, 2);   // push downward
  opponent.hitstun = Math.max(opponent.hitstun, 6);
}

// if velocity is still going upward too long, cancel it
if (opponent.vy < -10 && !opponent.isOnGround) {
  opponent.vy = -2;
}

// =========================
// FINAL HIT RESPONSE
// =========================

opponent.createHitSparks(opponent.x, opponent.y - 30, this.color);
opponent.showDamage(finalDmg);

opponent.hitStop = 4;
this.hitStop = 2;

this.attackHasHit = true;
      }
    }

    /* =========================
       PROJECTILES
    ========================= */

    /* =========================
   PROJECTILES
========================= */


// VOID WALL BLOCK CHECK
if (this.voidWallActive) {
  this.projectiles.forEach(p => {
    if (
      p.x > this.voidWall.x &&
      p.x < this.voidWall.x + this.voidWall.width &&
      p.y > this.voidWall.y &&
      p.y < this.voidWall.y + this.voidWall.height
    ) {
      p.active = false;
    }
  });
}

this.projectiles.forEach(p => p.update(opponent, this));
this.projectiles = this.projectiles.filter(p => p.active);

    /* =========================
       FX UPDATE
    ========================= */

    this.hitSparks = this.hitSparks.filter(s => {
  s.x += s.vx;
  s.y += s.vy;
  return --s.life > 0;
});

if (this.floatingText) {
  this.floatingText.timer--;
  if (this.floatingText.timer <= 0) this.floatingText = null;
}

this.dashTrail = this.dashTrail.filter(t => --t.life > 0);
this.beamEffects = this.beamEffects.filter(b => --b.life > 0);
this.teleportFX = this.teleportFX.filter(t => --t.life > 0);
this.slamWaves = this.slamWaves.filter(s => --s.life > 0);
this.healFX = this.healFX.filter(h => --h.life > 0);

// FIX: energyWave used to only move/decay inside draw() (wrong place -
// rendering code shouldn't be the thing driving gameplay state) and had
// no collision check at all, so it could never actually hit anyone. Now
// it moves and checks for a hit here in update(), same as everything
// else that affects game state.
this.energyWaves.forEach(e => {
  if (!e.active || e.hasHit) return;
  e.x += e.speed;

  const hit = Math.abs(e.x - opponent.x) < 24 && Math.abs(e.y - opponent.y) < 40;
  if (hit) {
    const dmg = 5 + Math.floor(Math.random() * 5);
    const finalDmg = opponent.isBlocking ? Math.floor(dmg * 0.35) : dmg;
    opponent.takeDamage(finalDmg);
    opponent.hitstun = opponent.isBlocking ? 5 : 12;
    opponent.createHitSparks(opponent.x, opponent.y - 20, 'rgba(0,200,255,0.9)');
    opponent.showDamage(finalDmg);
    e.hasHit = true;
    e.active = false;
  }
});
this.energyWaves = this.energyWaves.filter(e => e.active && --e.life > 0);

// NEW FX CLEANUP
this.voidWallFX = this.voidWallFX?.filter(v => --v.life > 0) || [];
this.lightningFX = this.lightningFX?.filter(l => --l.life > 0) || [];
this.windFX = this.windFX?.filter(w => --w.life > 0) || [];
this.poisonFX = this.poisonFX?.filter(p => --p.life > 0) || [];
this.bladeFX = this.bladeFX?.filter(b => --b.life > 0) || [];
this.timeFX = this.timeFX?.filter(t => --t.life > 0) || [];

// VOID WALL TIMER
if (this.voidWallActive) {
  this.voidWallTimer--;
  if (this.voidWallTimer <= 0) {
    this.voidWallActive = false;
  }
}

}

/* =========================
   ACTIONS
========================= */

handleAction(action, opponent) {
  if (this.hitstun > 0) return;

  // FIX ("can't be attacked" bug): isBlocking used to only get cleared by
  // moveLeft/moveRight, so any AI that called 'block' once stayed
  // heavily damage-reduced forever after, even mid-attack. Now every
  // action starts by clearing it, and only 'block' turns it back on.
  if (action !== 'block') {
    this.isBlocking = false;
  }

  switch (action) {

    case 'moveLeft':
      this.vx = -2;
      this.action = 'run';
      break;

    case 'moveRight':
      this.vx = 2;
      this.action = 'run';
      break;

    case 'attack':
      if (this.cooldown === 0) {
        this.action = 'attack';
        this.frame = 0;
        this.cooldown = this.rageBuffTimer > 0 ? 18 : 30; // rage = faster swings too
        this.attackHasHit = false;
      } else {
        // FIX (AI "freeze" bug): requesting an attack while on cooldown
        // used to do nothing at all, so fighters could stand frozen in
        // place for the whole cooldown window. Now they at least keep
        // stepping toward their opponent so they stay dynamic.
        this.vx = this.x < opponent.x ? 1.2 : -1.2;
        this.action = 'run';
      }
      break;

    case 'shoot':
      if (this.cooldown === 0) {
        this.shootProjectile(opponent.x, opponent.y);
        this.cooldown = 50;
      } else {
        this.vx = this.x < opponent.x ? 1.2 : -1.2;
        this.action = 'run';
      }
      break;

    case 'jump':
      if (this.isOnGround) {
        this.vy = -10;
        this.isOnGround = false;
      }
      break;

    case 'block':
      this.action = 'idle';
      this.isBlocking = true;
      this.vx = 0;
      break;

    case 'dash':
      this.vx = this.facing === 'right' ? 6 : -6;
      this.action = 'run';
      this.actionLockTimer = 8;

      this.dashTrail = this.dashTrail || [];
      this.dashTrail.push({ x: this.x, y: this.y, life: 10 });
      break;

    /* =========================
       EXISTING ABILITIES
    ========================= */

    case 'teleport':
      // FIX (leaving-arena bug): this used to move the fighter +/-80px
      // with no bounds clamp and no relation to the opponent, so it could
      // fling a fighter to a nonsensical spot right at (or past) a wall.
      // Now it's clamped like shadowStep, and always repositions relative
      // to the opponent so it reads as an intentional reposition rather
      // than a random glitch.
      {
        const side = this.x < opponent.x ? -1 : 1; // land on our own side
        const targetX = opponent.x + side * 80;
        const left = this.arenaLeft ?? 40;
        const right = this.arenaRight ?? 760;
        this.x = Math.max(left, Math.min(right, targetX));
      }
      this.actionLockTimer = 6;

      this.teleportFX = this.teleportFX || [];
      this.teleportFX.push({ x: this.x, y: this.y, life: 10 });
      break;

    case 'groundSlam':
      // FIX: this used to have zero mechanical effect and no range/cooldown
      // gate - it could hitstun/launch an opponent from anywhere on the
      // stage for free, every single frame it was requested. Now it's a
      // real close-range AOE attack that only lands (and only knocks up)
      // if the opponent is actually close enough, and it costs a cooldown
      // like every other attack.
      if (this.cooldown === 0) {
        this.action = 'attack';
        this.cooldown = 45;

        this.slamWaves = this.slamWaves || [];
        this.slamWaves.push({ x: this.x, y: this.y, life: 15 });

        const slamDist = Math.abs(this.x - opponent.x);
        if (slamDist <= 100) {
          const dmg = 7 + Math.floor(Math.random() * 6);
          const finalDmg = opponent.isBlocking ? Math.floor(dmg * 0.4) : dmg;
          opponent.takeDamage(finalDmg);
          opponent.hitstun = opponent.isBlocking ? 6 : 10;
          opponent.vy = -6;
          opponent.createHitSparks(opponent.x, opponent.y - 20, 'orange');
          opponent.showDamage(finalDmg);
          window.effects?.shake();
          window.effects?.flash();
        }
      } else {
        this.vx = this.x < opponent.x ? 1.2 : -1.2;
        this.action = 'run';
      }
      break;

    case 'healPulse':
      // FIX: this never actually restored HP (FX only), and had no
      // cooldown, so an AI could "heal" every frame for a purely cosmetic
      // green glow while taking real damage. Now it heals a real amount
      // and is gated behind a meaningful cooldown so it's a genuine
      // tactical choice rather than free decoration.
      if (this.cooldown === 0) {
        this.cooldown = 90;
        const healAmount = 15 + Math.floor(Math.random() * 11);
        this.hp = Math.min(this.maxHp, this.hp + healAmount);

        this.healFX = this.healFX || [];
        this.healFX.push({
          x: this.x,
          y: this.y,
          life: 40,
          radius: 5
        });

        this.hitSparks.push({
          x: this.x,
          y: this.y,
          vx: 0,
          vy: -2,
          life: 20,
          color: 'lime'
        });

        this.floatingText = { text: `+${healAmount}`, color: 'lime', timer: 30, yOffset: 0 };
      }
      break;

    case 'shield':
      // FIX: had no cooldown at all, so an AI could call 'shield' every
      // single frame and stay permanently at 50% damage reduction forever
      // - the same "unhittable" problem as the old block bug, just under
      // a different move name.
      if (this.cooldown === 0) {
        this.cooldown = 70;
        this.shieldTimer = 60;
      }
      break;

    case 'energyWave':
      // FIX: this used to spawn a rectangle that visually "traveled" but
      // could never actually hit anyone (no collision check existed
      // anywhere), and had no cooldown so it could be spammed every frame.
      // Collision + damage now happens in update() (see energyWaves loop).
      if (this.cooldown === 0) {
        this.cooldown = 45;
        this.energyWaves = this.energyWaves || [];
        this.energyWaves.push({
          x: this.x,
          y: this.y - 20,
          speed: (this.facing === 'right' ? 6 : -6),
          life: 60,
          active: true,
          hasHit: false
        });
      }
      break;

     case 'special':
      // FIX: this never actually checked cooldown, so an AI that forgot
      // to gate its own 'special' call could refire it as soon as the
      // brief attack-animation lock cleared, ignoring the 70-frame
      // cooldown entirely.
      if (this.cooldown === 0) {
        this.action = 'attack';
        this.cooldown = 70;
        this.shootProjectile(opponent.x, opponent.y);

        this.beamEffects = this.beamEffects || [];
        this.beamEffects.push({
          x: this.x - 0,
          y: this.y - 0,
          tx: opponent.x,
          ty: opponent.y,
          life: 10
        });
      } else {
        this.vx = this.x < opponent.x ? 1.2 : -1.2;
        this.action = 'run';
      }
      break;

    /* =========================
       NEW ABILITIES (FIXED)
    ========================= */

    case 'uppercut':
      // FIX: used to be FX-only with no damage, no launch, no range check,
      // and no cooldown - a free, infinitely-spammable no-op. Now it's a
      // real close-range launcher.
      if (this.cooldown === 0) {
        this.action = 'attack';
        this.cooldown = 40;

        this.hitEffects = this.hitEffects || [];
        this.hitEffects.push({ x: opponent.x, y: opponent.y, life: 12, type: 'uppercut' });

        const upDist = Math.abs(this.x - opponent.x);
        if (upDist <= 80) {
          const dmg = 9 + Math.floor(Math.random() * 7);
          const finalDmg = opponent.isBlocking ? Math.floor(dmg * 0.4) : dmg;
          opponent.takeDamage(finalDmg);
          opponent.vy = -9; // real launch, unlike before
          opponent.hitstun = opponent.isBlocking ? 8 : 16;
          opponent.juggleCount = (opponent.juggleCount || 0) + 1;

          this.hitSparks.push({ x: opponent.x, y: opponent.y, vx: 0, vy: -4, life: 15, color: 'white' });
          opponent.showDamage(finalDmg);
          window.effects?.shake();
          window.effects?.flash();
        }
      } else {
        this.vx = this.x < opponent.x ? 1.2 : -1.2;
        this.action = 'run';
      }
      break;

    case 'fireNova':
      // FIX: FX-only before - a fire "nova" that burned nobody. Now it's
      // a real close-range AOE burst.
      if (this.cooldown === 0) {
        this.action = 'attack';
        this.cooldown = 55;

        this.novaFX = this.novaFX || [];
        this.novaFX.push({ x: this.x, y: this.y, radius: 0, life: 25, pulse: 0 });
        this.hitSparks.push({ x: this.x, y: this.y, vx: 0, vy: 0, life: 20, color: 'orange' });

        const novaDist = Math.abs(this.x - opponent.x);
        if (novaDist <= 110) {
          const dmg = 8 + Math.floor(Math.random() * 7);
          const finalDmg = opponent.isBlocking ? Math.floor(dmg * 0.4) : dmg;
          opponent.takeDamage(finalDmg);
          opponent.hitstun = opponent.isBlocking ? 6 : 12;
          opponent.vx = this.x < opponent.x ? 4 : -4;
          opponent.createHitSparks(opponent.x, opponent.y - 20, 'orange');
          opponent.showDamage(finalDmg);
          window.effects?.shake();
          window.effects?.flash();
        }
      } else {
        this.vx = this.x < opponent.x ? 1.2 : -1.2;
        this.action = 'run';
      }
      break;

    case 'iceTrap':
      // FIX: FX-only before - "trapped" nobody and never slowed anything.
      // Now it deals a modest hit and applies a real, extended freeze
      // (long hitstun) so it reads as actual crowd control.
      if (this.cooldown === 0) {
        this.action = 'attack';
        this.cooldown = 60;

        this.iceFX = this.iceFX || [];
        this.iceFX.push({ x: opponent.x, y: opponent.y, life: 40 });
        for (let i = 0; i < 6; i++) {
          this.hitSparks.push({
            x: opponent.x, y: opponent.y,
            vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
            life: 25, color: 'cyan'
          });
        }

        const iceDist = Math.abs(this.x - opponent.x);
        if (iceDist <= 150) {
          const dmg = 4 + Math.floor(Math.random() * 5);
          const finalDmg = opponent.isBlocking ? Math.floor(dmg * 0.4) : dmg;
          opponent.takeDamage(finalDmg);
          opponent.hitstun = opponent.isBlocking ? 10 : 24; // the "freeze"
          opponent.vx *= 0.2;
          opponent.showDamage(finalDmg, 'cyan');
        }
      } else {
        this.vx = this.x < opponent.x ? 1.2 : -1.2;
        this.action = 'run';
      }
      break;

   case 'shadowStep':

  // ONLY allow teleport if grounded or low juggle
  if (!this.isOnGround && this.juggleCount > 2) {
    break;
  }

  this.teleportFX = this.teleportFX || [];

  this.teleportFX.push({
    x: this.x,
    y: this.y,
    life: 12,
    type: 'fadeOut'
  });

  const newX = opponent.x + (this.facing === 'right' ? -60 : 60);

  this.x = Math.max(this.arenaLeft ?? 40, Math.min(this.arenaRight ?? 760, newX));

  this.teleportFX.push({
    x: this.x,
    y: this.y,
    life: 12,
    type: 'fadeIn'
  });

  // IMPORTANT: prevents mid-air reset abuse
  this.vy *= 0.5;
  this.juggleCount = Math.min(this.juggleCount + 1, 3);

  break;

    case 'rageMode':
      // FIX: this used to be a pure light-show with no gameplay effect and
      // no cooldown, so it could be re-triggered every frame for free.
      // Now it grants a real, temporary damage/speed buff (read by the
      // 'attack' case below) and costs a real cooldown.
      if (this.cooldown === 0) {
        this.cooldown = 180;
        this.rageBuffTimer = 240; // ~4s of buffed attacks

        this.rageFX = this.rageFX || [];
        this.rageFX.push({ x: this.x, y: this.y, life: 80, pulse: 0 });

        for (let i = 0; i < 12; i++) {
          this.hitSparks.push({
            x: this.x, y: this.y,
            vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
            life: 30, color: 'red'
          });
        }
      }
      break;

  case 'voidWall':
      this.voidWallActive = true;
      this.voidWallTimer = 60;

      const offset = this.facing === 'right' ? 40 : -40;

      this.voidWall = {
        x: this.x + offset,
        y: this.y - 60,
        width: 20,
        height: 60
      };

      this.voidWallFX = this.voidWallFX || [];
      this.voidWallFX.push({
        ...this.voidWall,
        life: 60
      });
      break;

    case 'lightningStrike':
      // FIX: FX + hitstun only, no damage, no cooldown, no range check -
      // a free stun from anywhere on the stage.
      if (this.cooldown === 0) {
        this.cooldown = 65;
        this.lightningFX = this.lightningFX || [];
        this.lightningFX.push({ x: opponent.x, y: opponent.y - 80, life: 10 });

        const boltDist = Math.abs(this.x - opponent.x);
        if (boltDist <= 300) {
          const dmg = 6 + Math.floor(Math.random() * 6);
          const finalDmg = opponent.isBlocking ? Math.floor(dmg * 0.4) : dmg;
          opponent.takeDamage(finalDmg);
          opponent.hitstun = opponent.isBlocking ? 5 : 8;
          opponent.showDamage(finalDmg, 'yellow');
        }
      }
      break;

    case 'windPush':
      // FIX: knockback + hitstun applied unconditionally with no range
      // check or cooldown; kept the push utility but added a small real
      // hit and gating so it's a genuine close-range tool.
      if (this.cooldown === 0) {
        this.cooldown = 40;
        this.windFX = this.windFX || [];
        this.windFX.push({ x: this.x, y: this.y, life: 20 });

        const pushDist = Math.abs(this.x - opponent.x);
        if (pushDist <= 120) {
          const dmg = 3 + Math.floor(Math.random() * 4);
          const finalDmg = opponent.isBlocking ? Math.floor(dmg * 0.4) : dmg;
          opponent.takeDamage(finalDmg);
          opponent.vx += this.facing === 'right' ? 5 : -5;
          opponent.hitstun = opponent.isBlocking ? 4 : 5;
          opponent.showDamage(finalDmg);
        }
      }
      break;

    case 'poisonCloud':
      // FIX: this created a visual cloud that never damaged anyone. Now
      // it applies a real damage-over-time stack (ticked in update()).
      if (this.cooldown === 0) {
        const poisonDist = Math.abs(this.x - opponent.x);
        if (poisonDist <= 140) {
          this.cooldown = 90;
          this.poisonFX = this.poisonFX || [];
          this.poisonFX.push({ x: opponent.x, y: opponent.y, life: 80 });
          opponent.poisonTicksLeft = (opponent.poisonTicksLeft || 0) + 5;
          opponent.poisonTickTimer = opponent.poisonTickTimer || 0;
        }
      }
      break;

    case 'bladeDance':
      // FIX: FX + hitstun only, no damage, no cooldown, no range check.
      if (this.cooldown === 0) {
        this.action = 'attack';
        this.cooldown = 50;
        this.bladeFX = this.bladeFX || [];
        for (let i = 0; i < 3; i++) {
          this.bladeFX.push({
            x: opponent.x + (Math.random() * 20 - 10),
            y: opponent.y + (Math.random() * 20 - 10),
            life: 10
          });
        }

        const bladeDist = Math.abs(this.x - opponent.x);
        if (bladeDist <= 95) {
          const dmg = 9 + Math.floor(Math.random() * 8); // multi-hit flurry, hits hard
          const finalDmg = opponent.isBlocking ? Math.floor(dmg * 0.4) : dmg;
          opponent.takeDamage(finalDmg);
          opponent.hitstun = opponent.isBlocking ? 6 : 12;
          opponent.showDamage(finalDmg);
        }
      } else {
        this.vx = this.x < opponent.x ? 1.2 : -1.2;
        this.action = 'run';
      }
      break;

    case 'timeSlow':
      // FIX: set opponent.slowTimer but nothing ever read it, so it did
      // literally nothing. Now the physics step (see update()) checks
      // this and actually dampens the opponent's movement while active.
      if (this.cooldown === 0) {
        this.cooldown = 100;
        this.timeFX = this.timeFX || [];
        this.timeFX.push({ x: this.x, y: this.y, life: 60 });
        opponent.slowTimer = 90;
      }
      break;

    default:
      this.action = 'idle';
      this.vx = 0;
      this.isBlocking = false;
  }
}

  /* =========================
     DRAW
  ========================= */

  draw(ctx) {
    if (!this.ready) return;

    const frameIndex = this.getFrameIndex();
    const sx = (frameIndex % 32) * 32;
    const sy = Math.floor(frameIndex / 32) * 32;

    ctx.save();
    ctx.shadowColor = this.glow;
    ctx.shadowBlur = 20;

    ctx.drawImage(
      this.spriteSheet,
      sx, sy, 32, 32,
      this.x, this.y - 64,
      64, 64
    );

    ctx.restore();

    this.dashTrail.forEach(t => {
ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
ctx.fillRect(t.x, t.y - 64, 64, 64);
});

    this.beamEffects.forEach(b => {
      ctx.strokeStyle = 'rgba(0,150,255,0.8)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.tx, b.ty);
      ctx.stroke();
    });

    this.teleportFX.forEach(t => {
ctx.globalCompositeOperation = 'lighter';
ctx.fillStyle = 'rgba(0, 100, 255, 0.6)';
ctx.fillRect(t.x + 16, t.y - 48, 32, 32);
ctx.fillStyle = 'rgba(200, 240, 255, 0.8)';
ctx.fillRect(t.x + 20, t.y - 44, 24, 24);
for (let i = 0; i < 4; i++) {
let px = t.x + 24 + (Math.random() * 16);
let py = (t.y - 48) + (Math.random() * 32);
let size = Math.random() * 2 + 1;
ctx.fillStyle = 'rgba(0, 200, 255, 0.9)';
ctx.fillRect(px, py, size, size);
}
ctx.globalCompositeOperation = 'source-over';
});

    this.slamWaves.forEach(s => {
      ctx.strokeStyle = 'orange';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 20, 0, Math.PI * 2);
      ctx.stroke();
    });

    this.healFX.forEach(h => {
ctx.globalCompositeOperation = 'lighter';
ctx.fillStyle = 'rgba(0, 255, 100, 0.4)';
ctx.fillRect(h.x + 12, h.y - 40, 40, 40);
ctx.fillStyle = 'rgba(150, 255, 150, 0.6)';
ctx.fillRect(h.x + 20, h.y - 32, 24, 24);
for (let i = 0; i < 6; i++) {
let px = h.x + 10 + (Math.random() * 44);
let py = (h.y - 50) + (Math.random() * 50);
let size = Math.random() * 3 + 1;
ctx.fillStyle = i % 2 === 0 ? 'rgba(50, 255, 50, 0.8)' : 'rgba(200, 255, 200, 0.9)';
ctx.fillRect(px, py, size, size);
}
ctx.globalCompositeOperation = 'source-over';
});

    this.energyWaves.forEach(e => {
      ctx.fillStyle = 'rgba(0,200,255,0.6)';
      ctx.fillRect(e.x, e.y, 14, 5);
    });

    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y - 70, 64, 6);

    ctx.fillStyle = 'lime';
    ctx.fillRect(this.x, this.y - 70, (this.hp / this.maxHp) * 64, 6);

    this.hitSparks.forEach(s => {
  ctx.fillStyle = s.color;
  ctx.fillRect(s.x, s.y, 2, 2);
});

if (this.floatingText) {
  ctx.fillStyle = this.floatingText.color;
  ctx.fillText(this.floatingText.text, this.x + 20, this.y - 80);
}

/* =========================
   NEW FX DRAW (PUT HERE)
========================= */

// VOID WALL
this.voidWallFX?.forEach(v => {
  ctx.fillStyle = 'rgba(100, 0, 150, 0.5)';
  ctx.fillRect(v.x, v.y, v.width, v.height);
});

// LIGHTNING
this.lightningFX?.forEach(l => {
  ctx.strokeStyle = 'yellow';
  ctx.beginPath();
  ctx.moveTo(l.x, l.y);
  ctx.lineTo(l.x, l.y + 80);
  ctx.stroke();
});

// WIND
this.windFX?.forEach(w => {
  ctx.fillStyle = 'rgba(200,200,255,0.3)';
  ctx.fillRect(w.x, w.y - 40, 50, 40);
});

// POISON
this.poisonFX?.forEach(p => {
  ctx.fillStyle = 'rgba(0,255,100,0.2)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
  ctx.fill();
});

// BLADES
this.bladeFX?.forEach(b => {
  ctx.fillStyle = 'white';
  ctx.fillRect(b.x, b.y, 6, 2);
});

// TIME SLOW
this.timeFX?.forEach(t => {
  ctx.strokeStyle = 'cyan';
  ctx.beginPath();
  ctx.arc(t.x, t.y, 40, 0, Math.PI * 2);
  ctx.stroke();
});

this.projectiles.forEach(p => p.draw(ctx));

    this.projectiles.forEach(p => p.draw(ctx));
  }

  takeDamage(dmg) {
  const final = this.shieldTimer > 0 ? Math.floor(dmg * 0.5) : dmg;
  this.hp = Math.max(0, this.hp - final);

  // =========================
  // JUGGLE LIMIT SYSTEM (NEW)
  // =========================
  this.juggleCount = (this.juggleCount || 0) + 1;

  // HARD LIMIT: prevents infinite air combo
  const MAX_JUGGLE = 4;

  if (this.juggleCount > MAX_JUGGLE) {
    this.hitstun = 8;
    this.vy = Math.min(this.vy, 2); // force downward drift
  }

  // =========================
  // HIT RESPONSE
  // =========================
  if (final >= 10) {
    this.hitStop = 6;
  }

  // =========================
  // AIR CONTROL BREAK (CRITICAL FIX)
  // =========================
  if (!this.isOnGround) {
    this.vx *= 0.6; // reduce launch carry
  }
}
}