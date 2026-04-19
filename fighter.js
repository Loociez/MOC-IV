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
    this.energyWaves = [];

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
      this.rarity = 'Common'; this.hp = 95;
      this.attackRange = 75;
      this.glow = 'rgba(255,255,255,0.2)';
    } else if (rarityRoll < 0.85) {
      this.rarity = 'Rare'; this.hp = 105;
      this.attackRange = 80;
      this.glow = 'rgba(0,150,255,0.4)';
    } else if (rarityRoll < 0.97) {
      this.rarity = 'Epic'; this.hp = 115;
      this.attackRange = 85;
      this.glow = 'rgba(180,0,255,0.5)';
    } else {
      this.rarity = 'Legendary'; this.hp = 130;
      this.attackRange = 90;
      this.glow = 'rgba(255,200,0,0.6)';
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

  update(opponent) {
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

    this.auraPulse += 0.05;

    if (this.hitstun === 0 && !['attack', 'special', 'dash'].includes(this.action)) {
      const action = this.botLogic(this, opponent);
      this.handleAction(action, opponent);
    }

    // physics
    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.85;

    if (this.y >= 395) {
      this.y = 395;
      this.vy = 0;
      this.isOnGround = true;
      this.juggleCount = 0;
    } else {
      this.isOnGround = false;
      this.vy += 0.5;
    }

    const stageLeft = 40;
    const stageRight = 760;

    if (this.x <= stageLeft) {
      this.x = stageLeft;
      this.vx = Math.abs(this.vx) * 0.3;
    }

    if (this.x >= stageRight) {
      this.x = stageRight;
      this.vx = -Math.abs(this.vx) * 0.3;
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
        const dmg = 5 + Math.floor(Math.random() * 6);
        const finalDmg = opponent.isBlocking ? Math.floor(dmg * 0.4) : dmg;

        opponent.takeDamage(finalDmg);

        opponent.hitstun = opponent.isBlocking ? 8 : 20;
        opponent.vx = this.x < opponent.x ? 4 : -4;
        opponent.vy = -5;

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
    this.energyWaves = this.energyWaves.filter(e => --e.life > 0);
  }

/* =========================
   ACTIONS
========================= */

handleAction(action, opponent) {
  if (this.hitstun > 0) return;

  switch (action) {

    case 'moveLeft':
      this.vx = -2;
      this.action = 'run';
      this.isBlocking = false;
      break;

    case 'moveRight':
      this.vx = 2;
      this.action = 'run';
      this.isBlocking = false;
      break;

    case 'attack':
      if (this.cooldown === 0) {
        this.action = 'attack';
        this.frame = 0;
        this.cooldown = 30;
        this.attackHasHit = false;
      }
      break;

    case 'shoot':
      if (this.cooldown === 0) {
        this.shootProjectile(opponent.x, opponent.y);
        this.cooldown = 50;
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

      this.dashTrail = this.dashTrail || [];
      this.dashTrail.push({ x: this.x, y: this.y, life: 10 });
      break;

    /* =========================
       EXISTING ABILITIES
    ========================= */

    case 'teleport':
      this.x += this.facing === 'right' ? 80 : -80;

      this.teleportFX = this.teleportFX || [];
      this.teleportFX.push({ x: this.x, y: this.y, life: 10 });
      break;

    case 'groundSlam':
      this.slamWaves = this.slamWaves || [];
      this.slamWaves.push({ x: this.x, y: this.y, life: 15 });

      opponent.hitstun = 10;
      opponent.vy = -6;
      break;

    case 'healPulse':
      this.hp = Math.min(this.maxHp, this.hp + 10);

      this.healFX = this.healFX || [];
      this.healFX.push({ x: this.x, y: this.y - 20, life: 20 });
      break;

    case 'shield':
      this.shieldTimer = 60;
      break;

    case 'energyWave':
      this.energyWaves = this.energyWaves || [];
      this.energyWaves.push({
        x: this.x,
        y: this.y,
        speed: 6,
        life: 60,
        active: true
      });
      break;

    case 'special':
      this.action = 'attack';
      this.cooldown = 70;
      this.shootProjectile(opponent.x, opponent.y);

      this.beamEffects = this.beamEffects || [];
      this.beamEffects.push({
        x: this.x,
        y: this.y - 20,
        tx: opponent.x,
        ty: opponent.y,
        life: 10
      });
      break;

    /* =========================
       NEW ABILITIES (FIXED)
    ========================= */

    case 'uppercut':
      if (this.cooldown === 0) {
        this.action = 'attack';
        this.cooldown = 40;

        opponent.hitstun = 15;
        opponent.vy = -10;

        this.hitEffects = this.hitEffects || [];
        this.hitEffects.push({ x: opponent.x, y: opponent.y - 20, life: 10 });
      }
      break;

    case 'fireNova':
      if (this.cooldown === 0) {
        this.cooldown = 80;

        this.novaFX = this.novaFX || [];
        this.novaFX.push({ x: this.x, y: this.y, radius: 0, life: 20 });

        const dist = Math.abs(opponent.x - this.x);
        if (dist < 120) {
          opponent.hitstun = 12;
          opponent.hp -= 8;
        }
      }
      break;

    case 'iceTrap':
      if (this.cooldown === 0) {
        this.cooldown = 60;

        this.iceFX = this.iceFX || [];
        this.iceFX.push({ x: opponent.x, y: opponent.y, life: 30 });

        opponent.hitstun = 20;
        opponent.vx *= 0.3;
      }
      break;

    case 'shadowStep':
      if (this.cooldown === 0) {
        this.cooldown = 35;

        this.x = opponent.x + (this.facing === 'right' ? -40 : 40);

        this.teleportFX = this.teleportFX || [];
        this.teleportFX.push({ x: this.x, y: this.y, life: 12 });
      }
      break;

    case 'rageMode':
      if (this.cooldown === 0) {
        this.cooldown = 120;

        this.rageTimer = 120;

        this.rageFX = this.rageFX || [];
        this.rageFX.push({ x: this.x, y: this.y, life: 60 });
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
      ctx.fillStyle = 'rgba(0,150,255,0.3)';
      ctx.fillRect(t.x, t.y - 64, 64, 64);
    });

    this.beamEffects.forEach(b => {
      ctx.strokeStyle = 'rgba(0,150,255,0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.tx, b.ty);
      ctx.stroke();
    });

    this.teleportFX.forEach(t => {
      ctx.fillStyle = 'rgba(0,255,255,0.4)';
      ctx.fillRect(t.x, t.y - 64, 64, 64);
    });

    this.slamWaves.forEach(s => {
      ctx.strokeStyle = 'orange';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 20, 0, Math.PI * 2);
      ctx.stroke();
    });

    this.healFX.forEach(h => {
      ctx.fillStyle = 'rgba(0,255,0,0.4)';
      ctx.fillRect(h.x, h.y, 20, 20);
    });

    this.energyWaves.forEach(e => {
      ctx.fillStyle = 'rgba(0,200,255,0.6)';
      ctx.fillRect(e.x, e.y, 10, 4);
      e.x += e.speed;
      e.life--;
      if (e.life <= 0) e.active = false;
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

    this.projectiles.forEach(p => p.draw(ctx));
  }

  takeDamage(dmg) {
    const final = this.shieldTimer > 0 ? Math.floor(dmg * 0.5) : dmg;
    this.hp = Math.max(0, this.hp - final);
  }
}