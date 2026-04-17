export class Fighter {
  constructor(x, color, botLogic, character = null, spriteSheetIndex = 1) {
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

    // 🔥 SYSTEMS
    this.hitStop = 0;
    this.comboStep = 0;
    this.comboTimer = 0;

    // ✨ VISUAL FX
    this.hitSparks = [];
    this.auraPulse = 0;

    const index = Math.max(1, Math.min(spriteSheetIndex, 6));
    this.spriteSheet = new Image();
    this.spriteSheet.src = `./sprites/sprites${index}.png`;
    this.spriteSheet.onload = () => { this.ready = true; };

    this.floatingText = null;
    this.projectiles = [];
    this.isShootingProjectile = false;

    // 👤 NAME RESTORED
    const names = ["Raze", "Vex", "Shade", "Nyx", "Zero", "Nova", "Flint", "Kai", "Blitz"];
    this.name = names[Math.floor(Math.random() * names.length)];

    // rarity
    const rarityRoll = Math.random();
    if (rarityRoll < 0.6) {
      this.rarity = 'Common';
      this.hp = 95;
      this.attackRange = 75;
      this.glow = 'rgba(255,255,255,0.2)';
    } else if (rarityRoll < 0.85) {
      this.rarity = 'Rare';
      this.hp = 105;
      this.attackRange = 80;
      this.glow = 'rgba(0,150,255,0.4)';
    } else if (rarityRoll < 0.97) {
      this.rarity = 'Epic';
      this.hp = 115;
      this.attackRange = 85;
      this.glow = 'rgba(180,0,255,0.5)';
    } else {
      this.rarity = 'Legendary';
      this.hp = 130;
      this.attackRange = 90;
      this.glow = 'rgba(255,200,0,0.6)';
    }

    this.maxHp = this.hp;
  }

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

  shootProjectile(targetX, targetY) {
    if (this.isShootingProjectile) return;
    this.isShootingProjectile = true;
    setTimeout(() => { this.isShootingProjectile = false; }, 250);

    const projectile = {
      x: this.x + this.width,
      y: this.y + this.height / 2,
      trail: [],
      targetX,
      targetY,
      speed: 8,
      active: true,

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.speed) this.active = false;
        else {
          this.x += (dx / dist) * this.speed;
          this.y += (dy / dist) * this.speed;
        }
      },

      draw(ctx) {
        for (let i = 0; i < this.trail.length; i++) {
          const t = this.trail[i];
          ctx.fillStyle = `rgba(255,255,0,${i / this.trail.length})`;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    this.projectiles.push(projectile);
  }

  update(opponent) {
    if (!this.ready) return;

    if (this.hitStop > 0) {
      this.hitStop--;
      return;
    }

    if (this.cooldown > 0) this.cooldown--;

    if (this.comboTimer > 0) this.comboTimer--;
    else this.comboStep = 0;

    this.auraPulse += 0.05;

    // bot AI
    if (!['attack', 'hurt', 'special'].includes(this.action)) {
      const action = this.botLogic(this, opponent);
      this.handleAction(action, opponent);
    }

    // =========================
    // 🧠 SAFE PHYSICS FIX (IMPORTANT)
    // =========================

    // gravity always applies unless grounded
    if (!this.isOnGround) {
      this.vy += 0.5;
      this.y += this.vy;
    }

    // HARD GROUND CLAMP (prevents infinite hover bug)
    if (this.y >= 395) {
      this.y = 395;
      this.vy = 0;
      this.isOnGround = true;
    }

    // movement
    this.x += this.vx;
    this.vx = 0;

    const distX = opponent.x - this.x;
    if (Math.abs(distX) < 45) {
      const push = (45 - Math.abs(distX)) / 2;
      this.x -= push * Math.sign(distX);
      opponent.x += push * Math.sign(distX);
    }

    this.facing = this.x < opponent.x ? 'right' : 'left';

    // animation
    this.frameTimer++;
    if (this.frameTimer >= 10) {
      this.frameTimer = 0;

      if (this.action === 'run') {
        this.frame = (this.frame + 1) % 2;
      } else if (this.action === 'attack') {
        this.frame++;
        if (this.frame > 1) {
          this.action = 'idle';
          this.frame = 0;
          this.attackHasHit = false;
        }
      }
    }

    // attack
    if (this.action === 'attack' && this.frame === 1 && !this.attackHasHit) {
      const dist = Math.abs(this.x - opponent.x);

      if (dist <= this.attackRange) {
        if (Math.random() <= 0.75) {

          if (this.comboTimer > 0) this.comboStep++;
          else this.comboStep = 1;

          this.comboTimer = 40;

          let damage = Math.floor(Math.random() * 6) + 3 + this.comboStep;

          const isCrit = Math.random() < 0.15;

          if (isCrit) {
            damage *= 2;
            opponent.showDamage(`CRIT ${damage}`, 'yellow');
            this.createHitSparks(opponent.x, opponent.y, 'yellow');
          } else {
            opponent.showDamage(damage, 'red');
            this.createHitSparks(opponent.x, opponent.y, 'orange');
          }

          opponent.takeDamage(damage);

          opponent.hitStop = 5;
          this.hitStop = 3;

          this.x += this.facing === 'right' ? 5 : -5;

        } else {
          opponent.showMiss();
        }
      }

      this.attackHasHit = true;
    }

    // projectiles
    this.projectiles = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(p => p.update());

    // sparks
    this.hitSparks.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      s.life--;
    });
    this.hitSparks = this.hitSparks.filter(s => s.life > 0);

    if (this.floatingText) {
      this.floatingText.timer--;
      this.floatingText.yOffset += 0.5;
      if (this.floatingText.timer <= 0) this.floatingText = null;
    }
  }

  handleAction(action, opponent) {
    switch (action) {
      case 'moveLeft': this.vx = -2; this.action = 'run'; break;
      case 'moveRight': this.vx = 2; this.action = 'run'; break;

      case 'attack':
        if (this.cooldown === 0) {
          this.action = 'attack';
          this.frame = 0;
          this.cooldown = 35;
          this.attackHasHit = false;
        }
      break;

      case 'shoot':
        if (!this.isShootingProjectile && this.cooldown === 0) {
          this.shootProjectile(opponent.x, opponent.y);
          this.cooldown = 60;
        }
      break;

      case 'jump':
        if (this.isOnGround) {
          this.vy = -10;
          this.isOnGround = false;
        }
      break;

      default:
        this.action = 'idle';
        this.vx = 0;
      break;
    }
  }

  draw(ctx) {
    if (!this.ready) return;

    ctx.save();

    ctx.shadowColor = this.glow;
    ctx.shadowBlur = 20 + Math.sin(this.auraPulse) * 10;

    let frameIndex = this.facing === 'left'
      ? (this.action === 'run' ? 6 + this.frame : 6)
      : (this.action === 'run' ? 9 + this.frame : 9);

    const sx = frameIndex * 32;
    const sy = (this.character || 0) * 32;

    ctx.drawImage(
      this.spriteSheet,
      sx, sy,
      32, 32,
      this.x, this.y - (this.height * 2),
      this.width * 2, this.height * 2
    );

    ctx.restore();

    this.hitSparks.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, 2, 2);
    });

    ctx.fillStyle = '#440000';
    ctx.fillRect(this.x, this.y - 70, this.width * 2, 6);
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y - 70, (this.hp / this.maxHp) * this.width * 2, 6);

    if (this.floatingText) {
      ctx.fillStyle = this.floatingText.color;
      ctx.fillText(this.floatingText.text, this.x + this.width, this.y - 80);
    }

    this.projectiles.forEach(p => p.draw(ctx));
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp < 0) this.hp = 0;
  }

  showDamage(dmg, color = 'red') {
    this.floatingText = { text: `-${dmg}`, color, timer: 30, yOffset: 0 };
  }

  showMiss() {
    this.floatingText = { text: 'Miss', color: 'white', timer: 30, yOffset: 0 };
  }
}