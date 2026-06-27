class ZetnikEnemy extends DogRegimeEnemy {
  constructor(x, y, images, id = 0) {
    super(x, y, images, id, 'zetnik');
    this.state = 'walk';
    this.intent = 'approach';
    this.jumpTimer = 0;
    this.prepareTimer = 0;
    this.jumpStartX = x;
    this.jumpStartY = y;
    this.jumpTargetX = x;
    this.jumpTargetY = y;
    this.lockedTargetX = x;
    this.lockedTargetY = y;
    this.jumpHasHit = false;
    this.crashTimer = 0;
    this.gundosMinion = false;
    this.gundosBoss = null;
    this.redirectedToBoss = false;
    this.gundosDirection = -1;
    this.gundosSpeed = 5.8;
    this.gundosHitPlayer = false;
    this.gundosGuarding = false;
    this.gundosGuardX = x;
    this.gundosGuardY = y;
  }

  applyTuning(resetHp = false) {
    super.applyTuning(resetHp);
    const config = GAME_CONFIG.enemies.zetnik || {};
    this.jumpTriggerDistanceX = config.jumpTriggerDistanceX || 260;
    this.jumpMinDistanceX = config.jumpMinDistanceX || 160;
    this.jumpRangeX = config.jumpRangeX || 360;
    this.jumpRangeY = config.jumpRangeY || 42;
    this.jumpDurationMs = config.jumpDurationMs || 540;
    this.jumpArcHeight = config.jumpArcHeight || 82;
    this.prepareDurationMs = config.prepareDurationMs || 1250;
    this.crashDurationMs = config.crashDurationMs || 520;
    this.selfRemoveDelayMs = config.selfRemoveDelayMs || 720;
    this.knockdownMs = config.knockdownMs || 680;
    this.crashKnockbackX = config.crashKnockbackX || 76;
    this.hitWindowX = config.hitWindowX || 54;
    this.hitWindowY = config.hitWindowY || 30;
  }

  update(dt, scene) {
    if (this.remove) return;

    if (this.gundosMinion) {
      this.updateGundosMinion(dt, scene);
      return;
    }

    if (!this.alive) {
      this.deadTimer += dt;
      if (this.deadTimer > this.selfRemoveDelayMs) this.remove = true;
      this.clampToScreen();
      return;
    }

    if (this.flash > 0) this.flash -= dt;

    if (this.state === 'prepareJump') {
      this.updatePrepareJump(dt, scene);
      return;
    }

    if (this.state === 'jump') {
      this.updateJump(dt, scene);
      return;
    }

    if (this.state === 'crash') {
      this.updateCrash(dt);
      return;
    }

    if (this.hitStun > 0) {
      this.hitStun -= dt;
      this.clampToScreen();
      return;
    }

    this.applyTuning(false);
    const player = scene.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    this.facing = dx >= 0 ? 1 : -1;

    if (this.shouldStartJump(player, absX, absY)) {
      this.startPrepareJump(player);
      return;
    }

    this.approachCarefully(dt, player, dx, dy, absX, absY);
    this.clampToScreen();
  }

  shouldStartJump(player, absX, absY) {
    if (player.state === 'knockdown' || player.state === 'pinned') return false;
    if (absY > this.jumpRangeY) return false;
    return absX >= this.jumpMinDistanceX && absX <= this.jumpTriggerDistanceX;
  }

  approachCarefully(dt, player, dx, dy, absX, absY) {
    let moveX = 0;
    let moveY = 0;

    if (absY > 10) moveY = Math.sign(dy);

    if (absX > this.jumpTriggerDistanceX) {
      moveX = Math.sign(dx);
    } else if (absX < this.jumpMinDistanceX) {
      moveX = -Math.sign(dx || this.facing);
    }

    this.applyMovement(moveX, moveY, dt);
  }

  startPrepareJump(player) {
    this.state = 'prepareJump';
    this.intent = 'attack';
    this.prepareTimer = 0;
    this.jumpHasHit = false;
    this.facing = player.x >= this.x ? 1 : -1;
    this.lockedTargetX = player.x;
    this.lockedTargetY = player.y;
    this.laneY = player.y;
    this.attackTimer = 0;
    this.attackHasHit = false;
    AudioManager.playSfx('zetnikPreparing', 0.9, { playbackRate: 1, startAt: 0.01 });
  }

  setupGundosMinion(boss) {
    this.gundosMinion = true;
    this.gundosBoss = boss || null;
    this.redirectedToBoss = false;
    this.gundosDirection = -1;
    this.gundosSpeed = 4.8 + Math.random() * 0.9;
    this.gundosHitPlayer = false;
    this.gundosGuarding = false;
    this.blocksWaveClear = false;
    this.state = 'gundosCharge';
    this.intent = 'gundosCharge';
    this.facing = -1;
    this.hp = Math.max(this.hp, 1);
    this.alive = true;
    this.remove = false;
    this.flash = 0;
    this.hitStun = 0;
    this.walkTimer = 0;
  }

  setupGundosGuard(boss, x, y) {
    this.setupGundosMinion(boss);
    this.gundosGuarding = true;
    this.gundosGuardX = x;
    this.gundosGuardY = y;
    this.x = x;
    this.y = y;
    this.gundosSpeed = 0;
    this.state = 'gundosGuard';
    this.intent = 'gundosGuard';
    this.walkFrame = 0;
  }

  updateGundosMinion(dt, scene) {
    if (!this.alive) {
      this.updateCrash(dt);
      return;
    }

    if (this.flash > 0) this.flash -= dt;
    const frameScale = Math.max(0.65, Math.min(1.55, dt / 16.67));
    if (this.gundosGuarding && !this.redirectedToBoss) {
      this.x += (this.gundosGuardX - this.x) * 0.18;
      this.y += (this.gundosGuardY - this.y) * 0.18;
      this.facing = -1;
      if (scene && scene.player && Combat.overlap(this.getHurtbox(), scene.player.getBodyBox())) {
        scene.player.x = Math.min(scene.player.x, this.x - 86);
      }
      return;
    }

    const player = scene && scene.player;
    this.x += this.gundosDirection * this.gundosSpeed * frameScale;
    this.facing = this.gundosDirection >= 0 ? 1 : -1;
    this.walkTimer += dt;
    if (this.walkTimer >= GAME_CONFIG.enemyWalkFrameMs) {
      this.walkTimer -= GAME_CONFIG.enemyWalkFrameMs;
      this.walkFrame = (this.walkFrame + 1) % 3;
    }

    if (!this.redirectedToBoss && player && !this.gundosHitPlayer &&
        Combat.actorsSameLane(this, player) && Combat.overlap(this.getHurtbox(), player.getBodyBox())) {
      this.gundosHitPlayer = true;
      player.receiveDamage(this.damage, {
        source: 'ranged',
        knockbackX: this.facing * this.crashKnockbackX,
        knockdownMs: this.knockdownMs
      });
      this.finishGundosCrash(scene);
      return;
    }

    const boss = this.gundosBoss || this.findGundosBoss(scene);
    if (this.redirectedToBoss && boss && boss.alive && Combat.overlap(this.getHurtbox(), boss.getHurtbox())) {
      if (boss.receiveZetnikHit) boss.receiveZetnikHit(this, scene);
      this.finishGundosCrash(scene);
      return;
    }

    if (this.x < -140 || this.x > GAME_CONFIG.width + 180) {
      this.remove = true;
    }
  }

  findGundosBoss(scene) {
    if (!scene || !scene.enemies) return null;
    return scene.enemies.find(enemy => enemy && enemy.enemyType === 'gundos' && enemy.alive) || null;
  }

  redirectToGundos(player) {
    const boss = this.gundosBoss;
    this.redirectedToBoss = true;
    this.gundosGuarding = false;
    this.gundosDirection = boss && boss.x < this.x ? -1 : 1;
    this.gundosSpeed = Math.max(this.gundosSpeed, 8.2);
    this.facing = this.gundosDirection >= 0 ? 1 : -1;
    this.flash = 260;
    this.state = 'gundosRedirected';
    if (player && player.playComboHitSound) player.playComboHitSound();
    AudioManager.playSfx('zetnikPreparing', 0.75, { playbackRate: 1.25, startAt: 0.01 });
  }

  holdGundosGuard(player) {
    this.flash = 220;
    if (player && player.playComboHitSound) player.playComboHitSound();
  }

  releaseGundosGuard() {
    if (!this.gundosGuarding) return;
    this.gundosGuarding = false;
    this.gundosSpeed = 4.8 + Math.random() * 0.9;
    this.state = 'gundosCharge';
    this.intent = 'gundosCharge';
  }

  finishGundosCrash(scene) {
    this.alive = false;
    this.state = 'crash';
    this.crashTimer = 0;
    this.deadTimer = 0;
    this.hp = 0;
    this.flash = 180;
    AudioManager.playSfx('zetnikCrash', 0.95, { playbackRate: 1, startAt: 0.01 });
    if (scene) scene.hitStop = Math.max(scene.hitStop || 0, 45);
  }

  updatePrepareJump(dt, scene) {
    this.prepareTimer += dt;
    if (this.prepareTimer >= this.prepareDurationMs) {
      this.startJump();
    }
  }

  startJump() {
    this.state = 'jump';
    this.intent = 'attack';
    this.jumpTimer = 0;
    this.jumpHasHit = false;
    this.jumpStartX = this.x;
    this.jumpStartY = this.y;
    this.jumpTargetX = this.lockedTargetX + this.facing * 52;
    this.jumpTargetY = this.lockedTargetY;
    this.attackTimer = 0;
    this.attackHasHit = false;
    AudioManager.playSfx('punch', 0.55, { playbackRate: 1.05, startAt: 0.01 });
  }

  updateJump(dt, scene) {
    this.jumpTimer += dt;
    const progress = Math.min(1, this.jumpTimer / this.jumpDurationMs);
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const arc = Math.sin(progress * Math.PI) * this.jumpArcHeight;

    this.x = this.jumpStartX + (this.jumpTargetX - this.jumpStartX) * eased;
    this.y = this.jumpStartY + (this.jumpTargetY - this.jumpStartY) * eased - arc;

    if (!this.jumpHasHit && progress >= 0.32) {
      this.tryHitPlayer(scene);
    }

    if (progress >= 1) {
      this.finishCrash(scene);
    }
  }

  tryHitPlayer(scene) {
    const player = scene.player;
    if (player.state === 'knockdown' || player.state === 'pinned') return;

    const stayedNearLockedY = Math.abs(player.y - this.lockedTargetY) <= this.hitWindowY;
    const stayedNearLockedX = Math.abs(player.x - this.lockedTargetX) <= this.hitWindowX;
    const projectileOverlapsPlayer = Math.abs(player.x - this.x) <= this.hitWindowX;

    if (!stayedNearLockedY || !stayedNearLockedX || !projectileOverlapsPlayer || !Combat.actorsSameLane(this, player)) return;

    const hit = player.receiveDamage(this.damage, {
      source: 'ranged',
      knockbackX: this.facing * this.crashKnockbackX,
      knockdownMs: this.knockdownMs
    });

    this.jumpHasHit = true;
    if (hit) {
      scene.hitStop = 70;
      if (player.canBeKnockedDown && player.canBeKnockedDown()) {
        AudioManager.playSfx('playerDown', 0.85, { playbackRate: 1.08, startAt: 0.01 });
      }
    }
  }

  finishCrash(scene) {
    this.y = this.jumpTargetY;
    this.laneY = this.y;
    this.state = 'crash';
    this.crashTimer = 0;
    this.alive = false;
    this.deadTimer = 0;
    this.flash = 180;
    this.hp = 0;
    AudioManager.playSfx('zetnikCrash', 1, { playbackRate: 1, startAt: 0.01 });
    scene.hitStop = Math.max(scene.hitStop || 0, 55);
  }

  updateCrash(dt) {
    this.crashTimer += dt;
    this.deadTimer += dt;
    if (this.deadTimer > this.selfRemoveDelayMs) this.remove = true;
  }

  takeHit(damage, direction, knockback) {
    if (this.gundosMinion) {
      if (this.gundosGuarding && !this.redirectedToBoss && this.alive) {
        this.holdGundosGuard();
      } else if (!this.redirectedToBoss && this.alive) {
        this.redirectToGundos();
      }
      return;
    }
    if (this.state === 'jump' || this.state === 'prepareJump') return;
    super.takeHit(damage, direction, knockback);
  }

  getHurtbox() {
    if (this.gundosMinion) {
      return { x: this.x - 58, y: this.y - 150, w: 116, h: 132 };
    }
    if (this.state === 'jump') {
      return { x: this.x - 44, y: this.y - 150, w: 88, h: 120 };
    }
    return super.getHurtbox();
  }

  getEnemyImages() {
    return (this.images.enemies && this.images.enemies.zetnik) || super.getEnemyImages();
  }

  getImage() {
    const enemyImages = this.getEnemyImages();
    if (!this.alive || this.state === 'crash') return enemyImages.crashed || enemyImages.dead || enemyImages.attack[0] || enemyImages.idle;
    if (this.gundosGuarding) return enemyImages.preparing || enemyImages.attack[0] || enemyImages.idle;
    if (this.gundosMinion) return this.redirectedToBoss
      ? (enemyImages.fly || enemyImages.preparing || enemyImages.attack[0] || enemyImages.idle)
      : (enemyImages.walk[this.walkFrame] || enemyImages.idle || enemyImages.preparing || enemyImages.attack[0]);
    if (this.state === 'prepareJump') return enemyImages.preparing || enemyImages.attack[0] || enemyImages.idle;
    if (this.state === 'jump') return enemyImages.fly || enemyImages.attack[0] || enemyImages.idle;
    if (this.hitStun > 0) return enemyImages.idle;
    return enemyImages.walk[this.walkFrame] || enemyImages.idle;
  }

  draw(ctx, debug = false) {
    const img = this.getImage();
    if (!img) return;
    const scale = this.scale || GAME_CONFIG.enemyScale;
    const w = img.width * scale;
    const h = img.height * scale;

    let alpha = 1;
    if (!this.alive) alpha = Math.max(0, 1 - this.deadTimer / this.selfRemoveDelayMs);
    else if (this.flash > 0) alpha = 0.55;

    ctx.save();
    ctx.globalAlpha = alpha;
    if (this.redirectedToBoss && this.flash > 0) {
      ctx.shadowColor = '#66ff66';
      ctx.shadowBlur = 22;
    }
    ctx.translate(this.x, this.y);
    if (this.facing === -1) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
    ctx.globalAlpha = 1;

    if (debug && !this.remove) {
      const hb = this.getHurtbox();
      ctx.strokeStyle = this.state === 'prepareJump' ? 'rgba(255,255,0,0.95)' : 'rgba(255, 180, 0, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
    }
  }
}
