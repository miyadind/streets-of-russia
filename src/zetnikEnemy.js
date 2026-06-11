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
    this.jumpHasHit = false;
    this.crashTimer = 0;
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
  }

  update(dt, scene) {
    if (this.remove) return;

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
    this.attackTimer = 0;
    this.attackHasHit = false;
    AudioManager.playSfx('zetnikPreparing', 0.9, { playbackRate: 1, startAt: 0.01 });
  }

  updatePrepareJump(dt, scene) {
    this.prepareTimer += dt;
    const player = scene.player;
    this.facing = player.x >= this.x ? 1 : -1;

    if (this.prepareTimer >= this.prepareDurationMs) {
      this.startJump(player);
    }
  }

  startJump(player) {
    this.state = 'jump';
    this.intent = 'attack';
    this.jumpTimer = 0;
    this.jumpHasHit = false;
    this.jumpStartX = this.x;
    this.jumpStartY = this.y;
    this.facing = player.x >= this.x ? 1 : -1;
    this.jumpTargetX = player.x + this.facing * 34;
    this.jumpTargetY = player.y;
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

    const sameY = Math.abs(player.y - this.jumpTargetY) <= this.jumpRangeY;
    const inX = Math.abs(player.x - this.x) <= this.jumpRangeX * 0.30;
    if (!sameY || !inX) return;

    player.hp -= this.damage;
    player.x += this.facing * this.crashKnockbackX;
    player.knockDown(this.knockdownMs);
    this.jumpHasHit = true;
    scene.hitStop = 70;
    AudioManager.playSfx('playerDown', 0.85, { playbackRate: 1.08, startAt: 0.01 });
  }

  finishCrash(scene) {
    this.y = this.jumpTargetY;
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
    if (this.state === 'jump') return;
    super.takeHit(damage, direction, knockback);
  }

  getHurtbox() {
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
    if (!this.alive || this.state === 'crash') return enemyImages.dead || enemyImages.attack[0] || enemyImages.idle;
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
