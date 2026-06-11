class SuckerEnemy extends DogRegimeEnemy {
  constructor(x, y, images, id = 0) {
    super(x, y, images, id, 'sucker');
    this.state = 'reposition';
    this.windupTimer = 0;
    this.slideDistance = 0;
    this.slideDirection = -1;
    this.slideY = y;
    this.recoveryTimer = 0;
    this.pinTimer = 0;
    this.biteTimer = 0;
    this.biteFrame = 0;
    this.hasPinnedPlayer = false;
  }

  applyTuning(resetHp = false) {
    const config = GAME_CONFIG.enemies.sucker;
    this.speed = config.speed;
    this.damage = config.damage;
    this.maxHp = config.hp;
    this.scale = config.scale || GAME_CONFIG.enemyScale;
    this.slideSpeed = config.slideSpeed;
    this.attackStartDistance = config.attackStartDistance || config.preferredDistance || 420;
    this.minDistance = config.minDistance;
    this.alignToleranceY = config.alignToleranceY;
    this.slideRange = config.slideRange;
    this.windupMs = config.windupMs;
    this.slideRecoveryMs = config.slideRecoveryMs;
    this.interruptedRecoveryMs = config.interruptedRecoveryMs || config.slideRecoveryMs || 900;
    this.pinDurationMs = config.pinDurationMs;
    this.biteTickMs = config.biteTickMs;
    this.biteDamage = config.biteDamage;
    this.otherEnemyScatterDistance = config.otherEnemyScatterDistance;
    this.hp = resetHp ? this.maxHp : Math.min(this.hp, this.maxHp);
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

    this.applyTuning(false);

    const player = scene.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'windup') {
      this.updateWindup(dt, scene);
      return;
    }

    if (this.state === 'slide') {
      this.updateSlide(dt, scene);
      return;
    }

    if (this.state === 'interrupted') {
      this.updateInterrupted(dt);
      return;
    }

    if (this.state === 'pinBite') {
      this.updatePinBite(dt, scene);
      return;
    }

    if (this.state === 'recovery') {
      this.recoveryTimer -= dt;
      if (this.recoveryTimer <= 0) this.state = 'reposition';
      return;
    }

    let moveX = 0;
    let moveY = 0;

    if (absY > this.alignToleranceY) moveY = Math.sign(dy);
    if (absX < this.minDistance) moveX = -Math.sign(dx);
    else if (absX > this.attackStartDistance) moveX = Math.sign(dx);

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      moveX /= len;
      moveY /= len;
      this.x += moveX * this.speed;
      this.y += moveY * this.speed * GAME_CONFIG.ySpeedMultiplier;
      this.updateWalkFrame(dt);
    }

    this.y = Math.max(GAME_CONFIG.laneTop, Math.min(GAME_CONFIG.laneBottom, this.y));

    const readyDistance = absX >= this.minDistance && absX <= this.attackStartDistance;
    const playerFree = player.state !== 'knockdown' && player.state !== 'pinned';
    if (absY <= this.alignToleranceY && readyDistance && playerFree) {
      this.state = 'windup';
      this.windupTimer = 0;
      this.slideDirection = this.facing;
      this.slideY = this.y;
    }
  }

  updateWalkFrame(dt) {
    this.walkTimer += dt;
    if (this.walkTimer >= GAME_CONFIG.enemyWalkFrameMs) {
      this.walkTimer -= GAME_CONFIG.enemyWalkFrameMs;
      this.walkFrame = 1 - this.walkFrame;
    }
  }

  updateWindup(dt, scene) {
    this.windupTimer += dt;
    const player = scene.player;
    this.facing = player.x >= this.x ? 1 : -1;
    this.slideDirection = this.facing;
    this.slideY = this.y;

    if (player.canCounterSlide(this)) {
      this.interruptSlide(player);
      scene.hitStop = GAME_CONFIG.playerHitStopMs;
      return;
    }

    if (this.windupTimer >= this.windupMs) {
      this.state = 'slide';
      this.slideDistance = 0;
      this.hasPinnedPlayer = false;
      this.y = this.slideY;
    }
  }

  updateSlide(dt, scene) {
    const step = this.slideSpeed * Math.max(1, dt / 16.67);
    this.x += this.slideDirection * step;
    this.y = this.slideY;
    this.slideDistance += Math.abs(step);
    this.facing = this.slideDirection;

    const player = scene.player;

    if (player.canCounterSlide(this)) {
      this.interruptSlide(player);
      scene.hitStop = GAME_CONFIG.playerHitStopMs;
      return;
    }

    if (player.state !== 'knockdown' && player.state !== 'pinned' && Combat.overlap(this.getSlideHitbox(), player.getBodyBox())) {
      this.pinPlayer(scene);
      return;
    }

    if (this.slideDistance >= this.slideRange || this.x < 40 || this.x > GAME_CONFIG.width - 40) {
      this.state = 'recovery';
      this.recoveryTimer = this.slideRecoveryMs;
    }
  }

  interruptSlide(player) {
    if (player && player.playComboHitSound) player.playComboHitSound();
    this.hp -= player.damage + 8;
    this.flash = 160;
    this.hitStun = this.interruptedRecoveryMs;
    this.state = 'interrupted';
    this.recoveryTimer = this.interruptedRecoveryMs;
    this.attackTimer = 0;
    this.attackHasHit = false;
    this.x += player.facing * 90;
    if (this.hp <= 0) {
      this.alive = false;
      this.state = 'dead';
      this.deadTimer = 0;
    }
  }

  updateInterrupted(dt) {
    this.recoveryTimer -= dt;
    if (this.recoveryTimer <= 0 && this.alive) {
      this.state = 'reposition';
      this.hitStun = 0;
    }
  }

  pinPlayer(scene) {
    const player = scene.player;
    player.hp -= this.damage;
    player.knockDown(180);
    player.pinBy(this, this.pinDurationMs);
    this.state = 'pinBite';
    this.pinTimer = 0;
    this.biteTimer = 0;
    this.biteFrame = 0;
    this.hasPinnedPlayer = true;
    this.x = player.x - this.facing * 42;
    this.y = player.y;
    this.scatterOtherEnemies(scene);
    scene.hitStop = 55;
  }

  updatePinBite(dt, scene) {
    const player = scene.player;
    this.pinTimer += dt;
    this.biteTimer += dt;

    this.x = player.x - this.facing * 42;
    this.y = player.y;

    if (this.biteTimer >= this.biteTickMs) {
      this.biteTimer -= this.biteTickMs;
      this.biteFrame = 1 - this.biteFrame;
      player.hp -= this.biteDamage;
    }

    if (this.pinTimer >= this.pinDurationMs || player.hp <= 0) {
      player.releaseFromPin();
      this.state = 'recovery';
      this.recoveryTimer = this.slideRecoveryMs;
      this.hasPinnedPlayer = false;
    }
  }

  scatterOtherEnemies(scene) {
    for (const enemy of scene.enemies || []) {
      if (enemy === this || !enemy.alive) continue;
      const direction = enemy.x < this.x ? -1 : 1;
      enemy.x += direction * this.otherEnemyScatterDistance;
      enemy.y += enemy.y < this.y ? -18 : 18;
      enemy.y = Math.max(GAME_CONFIG.laneTop, Math.min(GAME_CONFIG.laneBottom, enemy.y));
    }
  }

  takeHit(damage, direction, knockback) {
    if (!this.alive) return;
    super.takeHit(damage, direction, knockback);
    if (this.alive) {
      this.state = 'recovery';
      this.recoveryTimer = this.slideRecoveryMs;
    }
  }

  getSlideHitbox() {
    return {
      x: this.x + (this.facing === 1 ? 8 : -88),
      y: this.slideY - 112,
      w: 88,
      h: 54
    };
  }

  getEnemyImages() {
    return this.images.enemies.sucker;
  }

  getImage() {
    const enemyImages = this.getEnemyImages();
    if (!this.alive) return enemyImages.dead;
    if (this.state === 'slide') return enemyImages.slide || enemyImages.attack[0];
    if (this.state === 'pinBite') return enemyImages.bite[this.biteFrame] || enemyImages.attack[0];
    if (this.state === 'windup') return enemyImages.idle;
    if (this.state === 'interrupted') return enemyImages.dead || enemyImages.idle;
    if (this.hitStun > 0) return enemyImages.idle;
    return enemyImages.walk[this.walkFrame] || enemyImages.idle;
  }

  draw(ctx, debug = false) {
    super.draw(ctx, debug);

    if (debug && this.alive && this.state === 'slide') {
      const hb = this.getSlideHitbox();
      ctx.strokeStyle = 'cyan';
      ctx.lineWidth = 2;
      ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
    }
  }
}
