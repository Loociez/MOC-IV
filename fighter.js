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
    this.justHit = false;
    this.lastAttackWasProjectile = false;

    const index = Math.max(1, Math.min(spriteSheetIndex, 6));
    this.spriteSheet = new Image();
    this.spriteSheet.src = `./sprites/sprites${index}.png`;
    this.spriteSheet.onload = () => {
      this.ready = true;
    };

    this.floatingText = null;
    this.projectiles = [];
    this.isShootingProjectile = false;
    this.specialUsed = false;
    this.specialEffectTimer = 0;

    // Random taunt
    const taunts = [
      "You're going down!", "Let's make this quick!", "Is that all you've got?",
      "Time to end this!", "This won't take long!", "EZ."
    ];
    this.taunt = taunts[Math.floor(Math.random() * taunts.length)];
    this.tauntTimer = 120;

    // Random name
    const names = ["Raze", "Vex", "Shade", "Nyx", "Zero", "Nova", "Flint", "Kai", "Blitz"];
    this.name = names[Math.floor(Math.random() * names.length)];

    // --- NEW: Rarity system ---
    const rarityRoll = Math.random();
    if (rarityRoll < 0.6) {
      this.rarity = 'Common';
      this.hp = 90 + Math.floor(Math.random() * 11); // 90–100
      this.attackRange = 75 + Math.floor(Math.random() * 6); // 75–80
    } else if (rarityRoll < 0.85) {
      this.rarity = 'Rare';
      this.hp = 100 + Math.floor(Math.random() * 11); // 100–110
      this.attackRange = 80 + Math.floor(Math.random() * 6); // 80–85
    } else if (rarityRoll < 0.97) {
      this.rarity = 'Epic';
      this.hp = 110 + Math.floor(Math.random() * 11); // 110–120
      this.attackRange = 85 + Math.floor(Math.random() * 6); // 85–90
    } else {
      this.rarity = 'Legendary';
      this.hp = 125 + Math.floor(Math.random() * 6); // 125–130
      this.attackRange = 90 + Math.floor(Math.random() * 6); // 90–95
    }
    this.maxHp = this.hp;

    // --- NEW: Track wins per fighter in-session ---
    this.wins = 0;
  }

  shootProjectile(targetX, targetY) {
    if (this.isShootingProjectile) return;
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
        const dist = Math.sqrt(dx * dx + dy * dy);
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

    const minDist = 45;
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

    this.facing = this.x + this.width / 2 < opponent.x + opponent.width / 2 ? 'right' : 'left';

    this.frameTimer++;
    if (this.frameTimer >= 10) {
      this.frameTimer = 0;

      if (this.action === 'run') {
        this.frame = (this.frame + 1) % 2;
      } else if (['attack', 'hurt', 'special'].includes(this.action)) {
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

    if (this.action === 'attack' && this.frame === 1 && !this.attackHasHit) {
      const dist = Math.abs(this.x + this.width - (opponent.x + opponent.width));
      if (dist <= this.attackRange) {
        const hitChance = 0.75;
        if (Math.random() <= hitChance) {
          let damage = Math.floor(Math.random() * 8) + 3;
          if (Math.random() < 0.15) {
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

    if (this.action === 'special' && this.frame === 1 && !this.attackHasHit) {
      const dist = Math.abs(this.x + this.width - (opponent.x + opponent.width));
      if (dist <= 100) {
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

    this.projectiles = this.projectiles.filter(p => p.active);
    this.projectiles.forEach(p => p.update());

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

    if (this.floatingText) {
      this.floatingText.timer--;
      this.floatingText.yOffset += 0.5;
      if (this.floatingText.timer <= 0) this.floatingText = null;
    }

    if (this.specialEffectTimer > 0) this.specialEffectTimer--;
  }

  handleAction(action, opponent) {
    switch (action) {
      case 'moveLeft': this.vx = -2; this.action = 'run'; this.facing = 'left'; break;
      case 'moveRight': this.vx = 2; this.action = 'run'; this.facing = 'right'; break;
      case 'jump':
        if (this.isOnGround) {
          this.vy = -10;
          this.isOnGround = false;
        } break;
      case 'attack':
        if (this.cooldown === 0) {
          this.action = 'attack';
          this.frame = 0;
          this.cooldown = 30;
          this.attackHasHit = false;
        } break;
      case 'shoot':
        if (!this.isShootingProjectile && this.cooldown === 0) {
          this.shootProjectile(opponent.x + opponent.width / 2, opponent.y + opponent.height / 2);
          this.cooldown = 60;
        } break;
      case 'special':
        if (!this.specialUsed && this.cooldown === 0) {
          this.action = 'special';
          this.frame = 0;
          this.cooldown = 90;
          this.attackHasHit = false;
        } break;
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
      case 'left': frameIndex = this.action === 'run' ? 6 + this.frame : (this.action === 'attack' ? 8 : (this.action === 'special' ? 10 : 6)); break;
      case 'right':
      default: frameIndex = this.action === 'run' ? 9 + this.frame : (this.action === 'attack' ? 11 : (this.action === 'special' ? 13 : 9)); break;
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
    ctx.fillRect(this.x, this.y - (this.height * 2) - 12, (this.hp / this.maxHp) * this.width * 2, 6);
    ctx.shadowBlur = 0;

    if (this.floatingText) {
      ctx.save();
      ctx.font = 'bold 12px Verdana, Geneva, sans-serif';
      ctx.fillStyle = this.floatingText.color;
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        this.floatingText.text,
        this.x + this.width,
        this.y - (this.height * 2) - 20 - this.floatingText.yOffset
      );
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    if (this.tauntTimer > 0) {
      ctx.font = 'bold 16px Verdana, Geneva, Tahoma, sans-serif';
      ctx.shadowColor = 'rgba(0, 255, 0, 0.7)';
      ctx.shadowBlur = 5;
      ctx.fillStyle = 'White';
      ctx.fillText(this.taunt, this.x, this.y - (this.height * 2) - 35);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      this.tauntTimer--;
    }

    this.projectiles.forEach(p => p.draw(ctx));
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp < 0) this.hp = 0;
  }

  showDamage(dmg) {
    this.floatingText = { text: `-${dmg}`, color: 'red', timer: 30, yOffset: 0 };
  }

  showMiss() {
    this.floatingText = { text: 'Miss', color: 'white', timer: 30, yOffset: 0 };
  }
}
