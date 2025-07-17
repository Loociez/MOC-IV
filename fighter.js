export class Fighter {
  constructor(x, color, botLogic, character = null, spriteSheetIndex = 1) {
    this.x = x;
    this.y = 395;
    this.vx = 0;
    this.vy = 0;
    this.width = 32;
    this.height = 32;
    this.color = color;
    this.hp = 100;
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
    this.justHit = false;
    this.lastAttackWasProjectile = false;

    // ✅ Use specified sprite sheet index (1 through 6)
    const index = Math.max(1, Math.min(spriteSheetIndex, 6)); // Clamp to 1–6
    this.spriteSheet = new Image();
    this.spriteSheet.src = `./sprites/sprites${index}.png`;
    this.spriteSheet.onload = () => {
      this.ready = true;
    };

    // Floating text for damage/miss feedback
    this.floatingText = null;

    // Projectile related
    this.projectiles = [];
    this.isShootingProjectile = false;

    // New special move flag
    this.specialUsed = false;
    this.specialEffectTimer = 0;

    // Pre-fight taunts
    const taunts = [
      "You're going down!",
      "Let's make this quick!",
      "Is that all you've got?",
      "Time to end this!",
      "This won't take long!",
      "EZ."
    ];
    this.taunt = taunts[Math.floor(Math.random() * taunts.length)];
    this.tauntTimer = 120;
  }

  shootProjectile(targetX, targetY) {
    if (this.isShootingProjectile) return; // prevent spamming
    this.isShootingProjectile = true;
    setTimeout(() => { this.isShootingProjectile = false; }, 250);

    const startX = this.x + this.width;
    const startY = this.y + this.height / 2;

    const projectile = {
      x: startX,
      y: startY,
      targetX,
      targetY,
      speed: 8,
      radius: 4,
      active: true,

      update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < this.speed) {
          this.active = false;
        } else {
          this.x += (dx / dist) * this.speed;
          this.y += (dy / dist) * this.speed;
        }
      },

      draw(ctx) {
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    this.projectiles.push(projectile);
  }

  update(opponent) {
    if (!this.ready) return;

    if (this.cooldown > 0) this.cooldown--;

    if (!['attack', 'hurt', 'special'].includes(this.action)) {
      const action = this.botLogic(this, opponent);
      this.handleAction(action, opponent);
    }

    // Gravity
    if (!this.isOnGround) {
      this.vy += 0.5;
      this.y += this.vy;
      if (this.y >= 395) {
        this.y = 395;
        this.vy = 0;
        this.isOnGround = true;
      }
    }

    this.x += this.vx;
    this.vx = 0;

    // Prevent overlap: push fighters apart if too close
    const minDist = 45; // about double sprite width + some margin
    const distX = opponent.x - this.x;
    if (Math.abs(distX) < minDist) {
      const push = (minDist - Math.abs(distX)) / 2;
      if (distX > 0) {
        this.x -= push;
        opponent.x += push;
      } else {
        this.x += push;
        opponent.x -= push;
      }
    }

    // Determine facing based on opponent position
    if (this.x + this.width / 2 < opponent.x + opponent.width / 2) {
      this.facing = 'right';
    } else {
      this.facing = 'left';
    }

    // Animate frames
    this.frameTimer++;
    if (this.frameTimer >= 10) {
      this.frameTimer = 0;

      if (this.action === 'run') {
        this.frame = (this.frame + 1) % 2;
      } else if (this.action === 'attack' || this.action === 'hurt' || this.action === 'special') {
        this.frame++;
        const maxFrame = this.action === 'special' ? 2 : 1;
        if (this.frame > maxFrame) {
          this.action = 'idle';
          this.frame = 0;
          this.attackHasHit = false;
          if (this.action !== 'special') this.specialEffectTimer = 0;
        }
      } else {
        this.frame = 0;
      }
    }

    // Attack logic
    if (this.action === 'attack' && this.frame === 1 && !this.attackHasHit) {
      const attackRange = 80;
      const selfCenter = this.x + (this.width * 2) / 2;
      const oppCenter = opponent.x + (opponent.width * 2) / 2;
      const dist = Math.abs(selfCenter - oppCenter);

      if (dist <= attackRange) {
        const hitChance = 0.75;
        if (Math.random() <= hitChance) {
          let damage = Math.floor(Math.random() * 8) + 3;
          const critChance = 0.15;
          if (Math.random() < critChance) {
            damage *= 2;
            opponent.showDamage(`CRIT ${damage}`);
          } else {
            opponent.showDamage(damage);
          }
          opponent.takeDamage(damage);
        } else {
          opponent.showMiss();
        }
      }
      this.attackHasHit = true;
    }

    // Special move logic
    if (this.action === 'special' && this.frame === 1 && !this.attackHasHit) {
      const attackRange = 100;
      const selfCenter = this.x + (this.width * 2) / 2;
      const oppCenter = opponent.x + (opponent.width * 2) / 2;
      const dist = Math.abs(selfCenter - oppCenter);

      if (dist <= attackRange) {
        const hitChance = 0.9;
        if (Math.random() <= hitChance) {
          const damage = Math.floor(opponent.hp * 0.35);
          opponent.takeDamage(damage);
          opponent.showDamage(damage);
        } else {
          opponent.showMiss();
        }
      } else {
        opponent.showMiss();
      }
      this.attackHasHit = true;
      this.specialUsed = true;
      this.specialEffectTimer = 30;
    }

    // Update projectiles
    this.projectiles = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(p => p.update());

    // Check projectile hits
    this.projectiles.forEach(p => {
      if (p.active) {
        const distX = Math.abs(p.x - (opponent.x + opponent.width / 2));
        const distY = Math.abs(p.y - (opponent.y + opponent.height / 2));
        if (distX < 20 && distY < 20) {
          p.active = false;
          const damage = Math.floor(Math.random() * 5) + 2;
          opponent.takeDamage(damage);
          opponent.showDamage(damage);
        }
      }
    });

    // Floating text
    if (this.floatingText) {
      this.floatingText.timer--;
      this.floatingText.yOffset += 0.5;
      if (this.floatingText.timer <= 0) {
        this.floatingText = null;
      }
    }

    if (this.specialEffectTimer > 0) {
      this.specialEffectTimer--;
    }
  }

  handleAction(action, opponent) {
    switch (action) {
      case 'moveLeft':
        this.vx = -2;
        this.action = 'run';
        this.facing = 'left';
        break;
      case 'moveRight':
        this.vx = 2;
        this.action = 'run';
        this.facing = 'right';
        break;
      case 'jump':
        if (this.isOnGround) {
          this.vy = -10;
          this.isOnGround = false;
        }
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
        if (!this.isShootingProjectile && this.cooldown === 0) {
          this.shootProjectile(opponent.x + opponent.width / 2, opponent.y + opponent.height / 2);
          this.cooldown = 60;
        }
        break;
      case 'special':
        if (!this.specialUsed && this.cooldown === 0) {
          this.action = 'special';
          this.frame = 0;
          this.cooldown = 90;
          this.attackHasHit = false;
        }
        break;
      default:
        if (!['attack', 'hurt', 'special'].includes(this.action)) {
          this.action = 'idle';
          this.frame = 0;
        }
        this.vx = 0;
        break;
    }
  }

  draw(ctx) {
    if (!this.ready) return;

    let frameIndex;

    switch (this.facing) {
      case 'away':
        if (this.action === 'run') frameIndex = this.frame;
        else if (this.action === 'attack') frameIndex = 2;
        else if (this.action === 'special') frameIndex = 4;
        else frameIndex = 0;
        break;
      case 'towards':
        if (this.action === 'run') frameIndex = 3 + this.frame;
        else if (this.action === 'attack') frameIndex = 5;
        else if (this.action === 'special') frameIndex = 7;
        else frameIndex = 3;
        break;
      case 'left':
        if (this.action === 'run') frameIndex = 6 + this.frame;
        else if (this.action === 'attack') frameIndex = 8;
        else if (this.action === 'special') frameIndex = 10;
        else frameIndex = 6;
        break;
      case 'right':
      default:
        if (this.action === 'run') frameIndex = 9 + this.frame;
        else if (this.action === 'attack') frameIndex = 11;
        else if (this.action === 'special') frameIndex = 13;
        else frameIndex = 9;
        break;
    }

    const characterRow = this.character || 0;
    const sx = frameIndex * 32;
    const sy = characterRow * 32;

    if (this.specialEffectTimer > 0) {
      ctx.save();
      ctx.shadowColor = 'cyan';
      ctx.shadowBlur = 30;
      ctx.fillStyle = `rgba(0, 255, 255, ${this.specialEffectTimer / 30})`;
      ctx.fillRect(this.x - 6, this.y - (this.height * 2) - 6, this.width * 2 + 12, this.height * 2 + 12);
      ctx.restore();
    }

    ctx.drawImage(
      this.spriteSheet,
      sx, sy,
      32, 32,
      this.x, this.y - (this.height * 2),
      this.width * 2, this.height * 2
    );

    ctx.shadowColor = 'lime';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#440000';
    ctx.fillRect(this.x, this.y - (this.height * 2) - 12, this.width * 2, 6);
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y - (this.height * 2) - 12, (this.hp / 100) * this.width * 2, 6);
    ctx.shadowBlur = 0;

    if (this.floatingText) {
      ctx.font = '10px Arial';
      ctx.fillStyle = this.floatingText.color;
      ctx.fillText(this.floatingText.text, this.x, this.y - (this.height * 2) - 20 - this.floatingText.yOffset);
    }

   // ✅ Taunt text (safely drawn) with glow and improved font
if (this.tauntTimer > 0) {
  ctx.font = 'bold 16px Verdana, Geneva, Tahoma, sans-serif'; // nicer font and a bit bigger

  // Glow effect using shadow properties
  ctx.shadowColor = 'rgba(0, 255, 0, 0.7)'; // green glow color
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = 'White'; // main text color
  ctx.fillText(this.taunt, this.x, this.y - (this.height * 2) - 35);

  // Reset shadow to avoid affecting other drawings
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  this.tauntTimer--;
}


    this.projectiles.forEach(p => p.draw(ctx));
  }

  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp < 0) this.hp = 0;
  }

  showDamage(damage) {
    this.floatingText = {
      text: `-${damage}`,
      color: 'red',
      timer: 30,
      yOffset: 0
    };
  }

  showMiss() {
    this.floatingText = {
      text: 'Miss',
      color: 'white',
      timer: 30,
      yOffset: 0
    };
  }
}
