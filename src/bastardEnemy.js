class BastardEnemy {
  constructor(x, y, images, id = 0) {
    this.id = id;
    this.enemyType = 'bastard';
    this.images = images;
    this.x = x;
    this.y = y;
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.fallFacing = this.facing;

    this.applyTuning(true);

    this.state = 'wander';
    this.alive = true;
    this.remove = false;
    this.blocksWaveClear = false;

    this.walkFrame = id % 3;
    this.walkTimer = 0;
    this.decisionTimer = 250 + id * 120;
    this.fallenTimer = 0;
    this.moveX = this.facing;
    this.moveY = Math.random() < 0.5 ? -1 : 1;
    this.flash = 0;
    this.knockdowns = 0;
    this.gundosMedic = false;
    this.gundosMedicTimer = 0;
    this.gundosMedicPhase = 'none';
    this.gundosMedicTargetX = x;
    this.gundosMedicHealGiven = 0;
    this.bastardHealExitQueued = false;
    this.bastardHealingExit = false;
    this.bastardHealExitDirection = -1;
  }

  applyTuning(resetHp = false) {
    const config = GAME_CONFIG.enemies.bastard || {};
    this.speed = config.speed || 0.75;
    this.damage = 0;
    this.maxHp = config.hp || 9999;
    this.scale = config.scale || GAME_CONFIG.enemyScale;
    this.canAttack = false;
    this.canDie = false;
    this.blocksWaveClear = false;
    this.wanderMinMs = config.wanderMinMs || 700;
    this.wanderMaxMs = config.wanderMaxMs || 1900;
    this.idleMinMs = config.idleMinMs || 900;
    this.idleMaxMs = config.idleMaxMs || 2200;
    this.fallenMinMs = config.fallenMinMs || 1300;
    this.fallenMaxMs = config.fallenMaxMs || 2600;
    this.idleChance = config.idleChance == null ? 0.32 : config.idleChance;
    this.fallChance = config.fallChance == null ? 0.04 : config.fallChance;
    this.turnChance = config.turnChance == null ? 0.3 : config.turnChance;
    this.knockbackX = config.knockbackX || 34;
    this.hp = resetHp ? this.maxHp : this.maxHp;
  }

  update(dt) {
    if (this.bastardHealingExit) {
      this.updateBastardHealingExit(dt);
      return;
    }
    if (this.bastardHealExitQueued && this.state !== 'fallen') {
      this.startBastardHealingExit();
      this.updateBastardHealingExit(dt);
      return;
    }

    if (this.gundosMedic) {
      this.updateGundosMedic(dt);
      return;
    }

    this.applyTuning(false);
    if (this.flash > 0) this.flash -= dt;

    if (this.state === 'fallen') {
      this.fallenTimer -= dt;
      if (this.fallenTimer <= 0) {
        this.state = 'idle';
        this.decisionTimer = this.randomBetween(this.idleMinMs, this.idleMaxMs) * 0.65;
      }
      return;
    }

    this.decisionTimer -= dt;
    if (this.decisionTimer <= 0) this.chooseNextAction();

    if (this.state === 'idle') return;
    if (this.state === 'wander') this.wander(dt);
  }

  setupGundosMedic(targetX = 285, y = this.y) {
    this.gundosMedic = true;
    this.gundosMedicTimer = 10000;
    this.gundosMedicPhase = 'enter';
    this.gundosMedicTargetX = targetX;
    this.gundosMedicHealGiven = 0;
    this.bastardHealExitQueued = false;
    this.bastardHealingExit = false;
    this.x = -70;
    this.y = y;
    this.facing = 1;
    this.moveX = 1;
    this.moveY = 0;
    this.state = 'wander';
    this.speed = Math.max(this.speed || 0.75, 1.45);
    this.blocksWaveClear = false;
    this.alive = true;
    this.remove = false;
  }

  updateGundosMedic(dt) {
    this.applyTuning(false);
    this.speed = Math.max(this.speed || 0.75, 1.45);
    if (this.flash > 0) this.flash -= dt;
    this.walkTimer += dt;
    if (this.walkTimer >= GAME_CONFIG.enemyWalkFrameMs) {
      this.walkTimer -= GAME_CONFIG.enemyWalkFrameMs;
      this.walkFrame = (this.walkFrame + 1) % 3;
    }

    if (this.gundosMedicPhase === 'enter') {
      this.facing = 1;
      this.x += this.speed * 1.75;
      if (this.x >= this.gundosMedicTargetX) {
        this.x = this.gundosMedicTargetX;
        this.gundosMedicPhase = 'idle';
        this.state = 'idle';
      }
      return;
    }

    this.gundosMedicTimer -= dt;
    if (this.state === 'fallen') {
      this.fallenTimer -= dt;
      if (this.fallenTimer > 0) return;
      this.state = 'idle';
    }

    if (this.gundosMedicTimer <= 0) {
      this.gundosMedicPhase = 'exit';
      this.state = 'wander';
    }

    if (this.gundosMedicPhase === 'exit') {
      this.facing = -1;
      this.x -= this.speed * 2.2;
      if (this.x < -120) this.remove = true;
      return;
    }

    this.state = this.flash > 0 ? 'fallen' : 'idle';
  }

  grantGundosMedicHeal(player, scene) {
    if (this.bastardHealingExit || this.bastardHealExitQueued || this.gundosMedicPhase === 'exit') return 0;
    if (!player || player.hp >= player.maxHp) return 0;
    const amount = Math.min(5, Math.max(0, player.maxHp - player.hp));
    if (amount <= 0) return 0;

    this.gundosMedicHealGiven += amount;
    player.hp = Math.min(player.maxHp, player.hp + amount);
    if (scene && scene.addGundosFloatText) scene.addGundosFloatText('+' + amount + ' HP', this.x, this.y - 150, '#6dff8d');
    return amount;
  }

  queueBastardHealingExit() {
    this.bastardHealExitQueued = true;
    this.bastardHealExitDirection = this.x < GAME_CONFIG.width / 2 ? -1 : 1;
    if (this.gundosMedic) {
      this.gundosMedicTimer = Math.min(this.gundosMedicTimer || 1300, 1300);
    }
  }

  startBastardHealingExit() {
    this.bastardHealExitQueued = false;
    this.bastardHealingExit = true;
    this.gundosMedicPhase = 'exit';
    this.state = 'wander';
    this.facing = this.bastardHealExitDirection;
    this.moveX = this.bastardHealExitDirection;
    this.moveY = 0;
  }

  isHealingExit() {
    return this.bastardHealingExit || this.gundosMedicPhase === 'exit';
  }

  updateBastardHealingExit(dt) {
    this.applyTuning(false);
    this.walkTimer += dt;
    if (this.walkTimer >= GAME_CONFIG.enemyWalkFrameMs) {
      this.walkTimer -= GAME_CONFIG.enemyWalkFrameMs;
      this.walkFrame = (this.walkFrame + 1) % 3;
    }
    this.state = 'wander';
    this.facing = this.bastardHealExitDirection || -1;
    this.x += this.facing * Math.max(this.speed || 0.75, 1.55) * 2.45;
    if (this.x < -140 || this.x > GAME_CONFIG.width + 140) this.remove = true;
  }

  chooseNextAction() {
    const roll = Math.random();

    if (roll < this.fallChance) {
      this.fallDown(this.facing);
      return;
    }

    if (roll < this.fallChance + this.idleChance) {
      this.state = 'idle';
      this.decisionTimer = this.randomBetween(this.idleMinMs, this.idleMaxMs);
      if (Math.random() < this.turnChance) this.facing *= -1;
      return;
    }

    this.state = 'wander';
    if (Math.random() < this.turnChance) this.facing *= -1;
    this.moveX = Math.random() < 0.15 ? 0 : this.facing;
    this.moveY = Math.random() < 0.45 ? 0 : (Math.random() < 0.5 ? -1 : 1);
    this.decisionTimer = this.randomBetween(this.wanderMinMs, this.wanderMaxMs);
  }

  wander(dt) {
    let moveX = this.moveX;
    let moveY = this.moveY;

    if (this.x < 80) {
      moveX = 1;
      this.facing = 1;
    } else if (this.x > GAME_CONFIG.width - 80) {
      moveX = -1;
      this.facing = -1;
    }

    if (this.y < GAME_CONFIG.laneTop + 12) moveY = 1;
    else if (this.y > GAME_CONFIG.laneBottom - 12) moveY = -1;

    if (moveX === 0 && moveY === 0) return;

    const len = Math.hypot(moveX, moveY);
    this.x += (moveX / len) * this.speed;
    this.y += (moveY / len) * this.speed * GAME_CONFIG.ySpeedMultiplier;
    this.y = Math.max(GAME_CONFIG.laneTop, Math.min(GAME_CONFIG.laneBottom, this.y));

    this.walkTimer += dt;
    if (this.walkTimer >= GAME_CONFIG.enemyWalkFrameMs) {
      this.walkTimer -= GAME_CONFIG.enemyWalkFrameMs;
      this.walkFrame = (this.walkFrame + 1) % 3;
    }
  }

  fallDown(fallFacing = this.facing) {
    this.state = 'fallen';
    this.fallFacing = fallFacing >= 0 ? 1 : -1;
    this.facing = this.fallFacing;
    this.fallenTimer = this.randomBetween(this.fallenMinMs, this.fallenMaxMs);
    if (this.gundosMedic) this.fallenTimer = 1500;
    this.walkTimer = 0;
  }

  takeHit(_damage, direction) {
    const hitDirection = direction >= 0 ? 1 : -1;
    this.x += hitDirection * this.knockbackX;
    if (!this.isHealingExit || !this.isHealingExit()) {
      this.x = Math.max(70, Math.min(GAME_CONFIG.width - 70, this.x));
    }
    this.knockdowns += 1;
    this.flash = 100;
    this.fallDown(hitDirection);
  }

  getHurtbox() {
    return { x: this.x - 38, y: this.y - 132, w: 76, h: 132 };
  }

  getAttackBox() {
    return { x: this.x, y: this.y, w: 0, h: 0 };
  }

  getImages() {
    return (this.images.enemies && this.images.enemies.bastard) || {};
  }

  getImage() {
    const enemyImages = this.getImages();
    if (this.state === 'fallen') return enemyImages.fall || enemyImages.idle;
    if (this.state === 'wander') return enemyImages.walk[this.walkFrame] || enemyImages.idle;
    return enemyImages.idle;
  }

  getDrawFacing() {
    if (this.state === 'fallen') return -(this.fallFacing || this.facing || 1);
    return this.facing || 1;
  }

  draw(ctx, debug = false) {
    const img = this.getImage();
    if (!img) return;

    const w = img.width * this.scale;
    const h = img.height * this.scale;
    const drawFacing = this.getDrawFacing();

    ctx.save();
    if (this.flash > 0) ctx.globalAlpha = 0.65;
    ctx.translate(this.x, this.y);
    if (drawFacing === -1) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
    ctx.globalAlpha = 1;

    if (debug) {
      const hb = this.getHurtbox();
      ctx.strokeStyle = 'rgba(255,255,0,0.85)';
      ctx.lineWidth = 2;
      ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);

      ctx.font = '12px Arial';
      ctx.fillStyle = '#ffff66';
      ctx.fillText('bastard: ' + this.state + ' facing=' + drawFacing, this.x - 38, this.y - h - 12);
    }
  }

  randomBetween(min, max) {
    return min + Math.random() * Math.max(1, max - min);
  }
}
