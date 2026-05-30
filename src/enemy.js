class DogRegimeEnemy {
  constructor(x, y, images, id = 0) {
    this.id = id;
    this.images = images;
    this.x = x;
    this.y = y;
    this.facing = -1;

    this.maxHp = 90;
    this.hp = 90;
    this.damage = 14;
    this.speed = 1.75;

    this.state = 'walk';
    this.walkFrame = 0;
    this.walkTimer = 0;

    this.attackTimer = 0;
    this.attackHasHit = false;
    this.cooldown = 250 + id * 180;

    this.hitStun = 0;
    this.flash = 0;
    this.deadTimer = 0;
    this.alive = true;
    this.remove = false;
  }

  update(dt, scene) {
    if (this.remove) return;

    if (!this.alive) {
      this.deadTimer += dt;
      if (this.deadTimer > GAME_CONFIG.enemyDeathFadeMs) this.remove = true;
      return;
    }

    if (this.flash > 0) this.flash -= dt;

    if (this.hitStun > 0) {
      this.hitStun -= dt;
      return;
    }

    if (this.cooldown > 0) this.cooldown -= dt;

    const player = scene.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'attack') {
      this.updateAttack(dt, scene);
      return;
    }

    if (absX < GAME_CONFIG.enemyAttackRangeX && absY < GAME_CONFIG.enemyAttackRangeY && this.cooldown <= 0) {
      this.state = 'attack';
      this.attackTimer = 0;
      this.attackHasHit = false;
      return;
    }

    let moveX = 0;
    let moveY = 0;
    if (absY > 12) moveY = Math.sign(dy);
    if (absX > 58) moveX = Math.sign(dx);

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      moveX /= len;
      moveY /= len;
      this.x += moveX * this.speed;
      this.y += moveY * this.speed * GAME_CONFIG.ySpeedMultiplier;

      this.walkTimer += dt;
      if (this.walkTimer >= GAME_CONFIG.enemyWalkFrameMs) {
        this.walkTimer -= GAME_CONFIG.enemyWalkFrameMs;
        this.walkFrame = 1 - this.walkFrame;
      }
    }

    this.y = Math.max(GAME_CONFIG.laneTop, Math.min(GAME_CONFIG.laneBottom, this.y));
  }

  updateAttack(dt, scene) {
    this.attackTimer += dt;
    const activeStart = GAME_CONFIG.enemyWindupMs;
    const activeEnd = GAME_CONFIG.enemyWindupMs + GAME_CONFIG.enemyActiveMs;

    if (!this.attackHasHit && this.attackTimer >= activeStart && this.attackTimer <= activeEnd) {
      const player = scene.player;
      const sameY = Combat.sameLane(player.y, this.y, GAME_CONFIG.enemyAttackRangeY);
      const inX = Math.abs(player.x - this.x) < GAME_CONFIG.enemyAttackRangeX;
      if (sameY && inX) {
        player.hp -= this.damage;
        player.x += this.facing * 18;
        scene.hitStop = 42;
        this.attackHasHit = true;
      }
    }

    if (this.attackTimer >= GAME_CONFIG.enemyWindupMs + GAME_CONFIG.enemyActiveMs + GAME_CONFIG.enemyRecoveryMs) {
      this.state = 'walk';
      this.cooldown = 560;
      this.attackTimer = 0;
      this.attackHasHit = false;
    }
  }

  takeHit(damage, direction, knockback) {
    if (!this.alive) return;
    this.hp -= damage;
    this.x += direction * knockback;
    this.hitStun = GAME_CONFIG.enemyHitStunMs;
    this.flash = 120;
    this.state = 'hit';
    this.attackTimer = 0;
    this.attackHasHit = false;

    if (this.hp <= 0) {
      this.alive = false;
      this.state = 'dead';
      this.deadTimer = 0;
    }
  }

  getHurtbox() {
    return { x: this.x - 38, y: this.y - 140, w: 76, h: 140 };
  }

  getAttackBox() {
    return { x: this.x + (this.facing === 1 ? 30 : -108), y: this.y - 112, w: 108, h: 50 };
  }

  getImage() {
    if (!this.alive) return this.images.dogDead;
    if (this.state === 'attack') return this.attackTimer < GAME_CONFIG.enemyWindupMs ? this.images.dogAttack[0] : this.images.dogAttack[1];
    if (this.hitStun > 0) return this.images.dogIdle;
    return this.images.dogWalk[this.walkFrame] || this.images.dogIdle;
  }

  draw(ctx, debug = false) {
    const img = this.getImage();
    if (!img) return;
    const scale = GAME_CONFIG.enemyScale;
    const w = img.width * scale;
    const h = img.height * scale;

    let alpha = 1;
    if (!this.alive) alpha = Math.max(0, 1 - this.deadTimer / GAME_CONFIG.enemyDeathFadeMs);
    else if (this.flash > 0) alpha = 0.55;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    if (this.facing === -1) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
    ctx.globalAlpha = 1;

    if (this.alive) {
      const bx = this.x - 38;
      const by = this.y - h - 12;
      ctx.fillStyle = '#220000';
      ctx.fillRect(bx, by, 76, 6);
      ctx.fillStyle = this.hp > 55 ? 'lime' : this.hp > 25 ? 'yellow' : 'red';
      ctx.fillRect(bx, by, 76 * Math.max(0, this.hp / this.maxHp), 6);
    }

    if (debug && this.alive) {
      const hb = this.getHurtbox();
      ctx.strokeStyle = 'rgba(255,0,0,0.85)';
      ctx.lineWidth = 2;
      ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
      if (this.state === 'attack') {
        const ab = this.getAttackBox();
        ctx.strokeStyle = 'orange';
        ctx.strokeRect(ab.x, ab.y, ab.w, ab.h);
      }
    }
  }
}
