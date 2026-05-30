class Player {
  constructor(heroKey, images) {
    const hero = GAME_CONFIG.heroes[heroKey];
    this.heroKey = heroKey;
    this.name = hero.name;
    this.maxHp = hero.hp;
    this.hp = hero.hp;
    this.speed = hero.speed;
    this.damage = hero.damage;
    this.images = images;

    this.x = 220;
    this.y = 620;
    this.facing = 1;
    this.state = 'idle';

    this.walkCycle = [0, 1, 2, 1];
    this.walkIndex = 1;
    this.walkFrame = 1;
    this.walkTimer = 0;

    this.comboStep = 0;
    this.comboTimer = 0;
    this.attackTimer = 0;
    this.attackHasHit = false;
  }

  update(dt, scene) {
    if (this.comboTimer > 0) this.comboTimer -= dt;
    else this.comboStep = 0;

    if (Input.consume('space')) this.startAttack();

    if (this.state === 'attack') {
      this.updateAttack(dt, scene);
      return;
    }

    let dx = 0;
    let dy = 0;
    if (Input.pressed('a') || Input.pressed('arrowleft')) dx -= 1;
    if (Input.pressed('d') || Input.pressed('arrowright')) dx += 1;
    if (Input.pressed('w') || Input.pressed('arrowup')) dy -= 1;
    if (Input.pressed('s') || Input.pressed('arrowdown')) dy += 1;

    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.x += dx * this.speed;
      this.y += dy * this.speed * GAME_CONFIG.ySpeedMultiplier;
      if (dx !== 0) this.facing = Math.sign(dx);

      if (Input.consume('a') || Input.consume('d') || Input.consume('w') || Input.consume('s') ||
          Input.consume('arrowleft') || Input.consume('arrowright') || Input.consume('arrowup') || Input.consume('arrowdown')) {
        this.nextWalkFrame();
        this.walkTimer = 0;
      }

      this.walkTimer += dt;
      if (this.walkTimer >= GAME_CONFIG.walkFrameMs) {
        this.walkTimer -= GAME_CONFIG.walkFrameMs;
        this.nextWalkFrame();
      }
      this.state = 'walk';
    } else {
      this.state = 'idle';
      this.walkTimer = 0;
    }

    this.x = Math.max(70, Math.min(GAME_CONFIG.width - 70, this.x));
    this.y = Math.max(GAME_CONFIG.laneTop, Math.min(GAME_CONFIG.laneBottom, this.y));
  }

  startAttack() {
    if (this.state === 'attack') return;
    this.comboStep += 1;
    if (this.comboStep > 3) this.comboStep = 1;
    this.comboTimer = GAME_CONFIG.comboResetMs;
    this.state = 'attack';
    this.attackTimer = 0;
    this.attackHasHit = false;
  }

  updateAttack(dt, scene) {
    this.attackTimer += dt;
    const data = this.getAttackData();

    if (!this.attackHasHit && this.attackTimer >= data.activeStart && this.attackTimer <= data.activeEnd) {
      const hitbox = this.getHitbox();
      for (const enemy of scene.enemies) {
        if (!enemy.alive) continue;
        if (Combat.sameLane(this.y, enemy.y) && Combat.overlap(hitbox, enemy.getHurtbox())) {
          enemy.takeHit(data.damage, this.facing, data.knockback);
          this.attackHasHit = true;
          scene.hitStop = GAME_CONFIG.playerHitStopMs;
          break;
        }
      }
    }

    if (this.attackTimer >= data.duration) {
      this.state = 'idle';
      this.attackTimer = 0;
      this.attackHasHit = false;
    }
  }

  getAttackData() {
    if (this.comboStep === 1) return { duration: 170, activeStart: 35, activeEnd: 120, damage: this.damage, knockback: 24, range: 46 };
    if (this.comboStep === 2) return { duration: 190, activeStart: 40, activeEnd: 135, damage: this.damage + 5, knockback: 32, range: 52 };
    return { duration: 240, activeStart: 45, activeEnd: 160, damage: this.damage + 14, knockback: 68, range: 62 };
  }

  getHitbox() {
    const data = this.getAttackData();
    return {
      x: this.x + (this.facing === 1 ? 22 : -22 - data.range),
      y: this.y - 118,
      w: data.range,
      h: 40
    };
  }

  nextWalkFrame() {
    this.walkIndex = (this.walkIndex + 1) % this.walkCycle.length;
    this.walkFrame = this.walkCycle[this.walkIndex];
  }

  getImage() {
    if (this.state === 'attack') return this.images.borisPunch[this.comboStep - 1] || this.images.borisPunch[0];
    if (this.state === 'walk') return this.images.borisWalk[this.walkFrame] || this.images.borisIdle;
    return this.images.borisIdle;
  }

  draw(ctx, debug = false) {
    const img = this.getImage();
    if (!img) return;
    const scale = GAME_CONFIG.playerScale;
    const w = img.width * scale;
    const h = img.height * scale;

    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.facing === -1) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();

    if (debug && this.state === 'attack') {
      const hb = this.getHitbox();
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 2;
      ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
    }
  }
}
