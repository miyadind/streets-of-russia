class DogRegimeEnemy {
  constructor(x, y, images, id = 0, enemyType = 'dogRegime') {
    this.id = id;
    this.images = images;
    this.enemyType = enemyType;
    this.x = x;
    this.y = y;
    this.facing = -1;

    this.applyTuning(true);

    this.state = 'walk';
    this.intent = 'approach';
    this.walkFrame = 0;
    this.walkTimer = 0;

    this.attackTimer = 0;
    this.attackHasHit = false;
    this.cooldown = 250 + id * 180;
    this.decisionTimer = 120 + id * 90;
    this.strafeDirection = id % 2 === 0 ? -1 : 1;
    this.retreatTimer = 0;

    this.hitStun = 0;
    this.flash = 0;
    this.deadTimer = 0;
    this.alive = true;
    this.remove = false;

    this.halfHpKnockdownDone = false;
    this.knockdownTimer = 0;
    this.knockdownDuration = 900;
  }

  applyTuning(resetHp = false) {
    const config = GAME_CONFIG.enemies[this.enemyType] || GAME_CONFIG.enemies.dogRegime;
    this.speed = config.speed;
    this.damage = config.damage;
    this.maxHp = config.hp;
    this.scale = config.scale || GAME_CONFIG.enemyScale;
    this.minDistanceX = config.minDistanceX || 42;
    this.preferredDistanceX = config.preferredDistanceX || 76;
    this.attackRangeX = config.attackRangeX || GAME_CONFIG.enemyAttackRangeX;
    this.attackRangeY = config.attackRangeY || GAME_CONFIG.enemyAttackRangeY;
    this.maxAttackers = config.maxAttackers || 1;
    this.decisionMinMs = config.decisionMinMs || 260;
    this.decisionMaxMs = config.decisionMaxMs || 620;
    this.strafeChance = config.strafeChance == null ? 0.38 : config.strafeChance;
    this.retreatChance = config.retreatChance == null ? 0.08 : config.retreatChance;
    this.attackChance = config.attackChance == null ? 0.72 : config.attackChance;
    this.slotSpacingX = config.slotSpacingX || 46;
    this.slotSpacingY = config.slotSpacingY || 32;
    this.flankDistanceX = config.flankDistanceX || 105;
    this.pressureDistanceX = config.pressureDistanceX || 150;
    this.hp = resetHp ? this.maxHp : Math.min(this.hp, this.maxHp);
  }

  clampToScreen() {
    this.x = Math.max(45, Math.min(GAME_CONFIG.width - 45, this.x));
    this.y = Math.max(GAME_CONFIG.laneTop, Math.min(GAME_CONFIG.laneBottom, this.y));
  }

  update(dt, scene) {
    if (this.remove) return;

    if (!this.alive) {
      this.deadTimer += dt;
      if (this.deadTimer > GAME_CONFIG.enemyDeathFadeMs) this.remove = true;
      this.clampToScreen();
      return;
    }

    if (this.flash > 0) this.flash -= dt;

    if (this.state === 'knockdown') {
      this.knockdownTimer -= dt;
      this.clampToScreen();
      if (this.knockdownTimer <= 0) {
        this.state = 'walk';
        this.intent = 'flank';
        this.hitStun = 0;
        this.cooldown = 360 + Math.random() * 260;
      }
      return;
    }

    if (this.hitStun > 0) {
      this.hitStun -= dt;
      this.clampToScreen();
      return;
    }

    this.applyTuning(false);
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.decisionTimer > 0) this.decisionTimer -= dt;
    if (this.retreatTimer > 0) this.retreatTimer -= dt;

    const player = scene.player;
    const dx = player.x - this.x;
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'attack') {
      this.updateAttack(dt, scene);
      this.clampToScreen();
      return;
    }

    const activeAttackers = this.countActiveAttackers(scene);
    const canAttackNow = activeAttackers < this.maxAttackers || this.intent === 'attack';
    const inAttackRange = this.isInAttackRange(player);

    if (this.decisionTimer <= 0) this.chooseIntent(player, canAttackNow, inAttackRange);

    if (inAttackRange && canAttackNow && this.cooldown <= 0 && this.intent === 'attack') {
      this.state = 'attack';
      this.attackTimer = 0;
      this.attackHasHit = false;
      this.clampToScreen();
      return;
    }

    this.moveWithSpacing(dt, scene, canAttackNow);
    this.clampToScreen();
  }

  chooseIntent(player, canAttackNow, inAttackRange) {
    const roll = Math.random();

    if (canAttackNow && this.cooldown <= 0 && (inAttackRange || Math.abs(player.x - this.x) < this.pressureDistanceX) && roll < this.attackChance) {
      this.intent = 'attack';
    } else if (!canAttackNow) {
      this.intent = roll < 0.65 ? 'flank' : 'strafe';
      this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
    } else if (roll < this.retreatChance) {
      this.intent = 'retreat';
      this.retreatTimer = 160 + Math.random() * 180;
    } else if (roll < this.retreatChance + this.strafeChance) {
      this.intent = 'strafe';
      this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
    } else {
      this.intent = 'approach';
    }

    this.decisionTimer = this.decisionMinMs + Math.random() * Math.max(1, this.decisionMaxMs - this.decisionMinMs);
  }

  moveWithSpacing(dt, scene, canAttackNow) {
    const player = scene.player;
    const slot = this.getCombatSlot(scene, player);
    const target = this.getSlotTarget(player, slot, canAttackNow);
    const dxToPlayer = player.x - this.x;
    const absX = Math.abs(dxToPlayer);
    const dyToTarget = target.y - this.y;
    let moveX = 0;
    let moveY = 0;

    if (this.intent === 'retreat' && this.retreatTimer > 0) {
      const softRetreatX = player.x - Math.sign(dxToPlayer || this.facing) * this.preferredDistanceX;
      moveX = Math.sign(softRetreatX - this.x);
      if (Math.abs(dyToTarget) > 8) moveY = Math.sign(dyToTarget);
    } else if (absX < this.minDistanceX) {
      const stepAwayTarget = player.x - Math.sign(dxToPlayer || this.facing) * this.preferredDistanceX;
      moveX = Math.sign(stepAwayTarget - this.x);
      if (Math.abs(dyToTarget) > 8) moveY = Math.sign(dyToTarget);
    } else if (Math.abs(this.x - target.x) > 10) {
      moveX = Math.sign(target.x - this.x);
    }

    if (this.intent === 'flank') {
      if (Math.abs(dyToTarget) > 8) moveY = Math.sign(dyToTarget);
      if (Math.abs(this.x - target.x) <= 16 && Math.abs(dyToTarget) <= 10) this.intent = 'approach';
    } else if (this.intent === 'strafe') {
      if (Math.abs(dyToTarget) > 20) moveY = Math.sign(dyToTarget);
      else moveY = this.strafeDirection;
    } else if (this.intent === 'hold') {
      if (Math.abs(dyToTarget) > 10) moveY = Math.sign(dyToTarget);
    } else if (Math.abs(dyToTarget) > 12) {
      moveY = Math.sign(dyToTarget);
    }

    if (this.intent === 'attack') {
      if (Math.abs(player.y - this.y) > this.attackRangeY * 0.7) moveY = Math.sign(player.y - this.y);
      if (absX > this.attackRangeX * 0.85) moveX = Math.sign(dxToPlayer);
    }

    this.applyMovement(moveX, moveY, dt);
  }

  getCombatSlot(scene, player) {
    const aliveDogs = (scene.enemies || [])
      .filter(enemy => enemy.alive && enemy.enemyType === this.enemyType)
      .sort((a, b) => a.id - b.id);
    const index = Math.max(0, aliveDogs.indexOf(this));
    const playerFacing = player ? player.facing || 1 : 1;
    const backSide = -playerFacing;
    const frontSide = playerFacing;
    const slots = [
      { side: frontSide, y: 0, role: 'attacker' },
      { side: backSide, y: 0, role: 'back' },
      { side: backSide, y: -1, role: 'flank' },
      { side: frontSide, y: 1, role: 'frontFlank' },
      { side: backSide, y: 1, role: 'flank' },
      { side: frontSide, y: -1, role: 'frontFlank' }
    ];
    return slots[index % slots.length];
  }

  getSlotTarget(player, slot, canAttackNow) {
    let distanceX = this.preferredDistanceX;
    if (slot.role === 'back' || slot.role === 'flank') distanceX = this.flankDistanceX;
    if (!canAttackNow && slot.role !== 'attacker') distanceX = Math.min(this.flankDistanceX, this.pressureDistanceX);

    const x = player.x + slot.side * distanceX + slot.side * Math.abs(slot.y) * this.slotSpacingX;
    const y = player.y + slot.y * this.slotSpacingY;
    return {
      x: Math.max(70, Math.min(GAME_CONFIG.width - 70, x)),
      y: Math.max(GAME_CONFIG.laneTop, Math.min(GAME_CONFIG.laneBottom, y))
    };
  }

  getWalkFrameCount() {
    const enemyImages = this.getEnemyImages();
    return Math.max(1, (enemyImages.walk || []).filter(Boolean).length);
  }

  applyMovement(moveX, moveY, dt) {
    if (moveX === 0 && moveY === 0) return;
    const len = Math.hypot(moveX, moveY);
    moveX /= len;
    moveY /= len;
    this.x += moveX * this.speed;
    this.y += moveY * this.speed * GAME_CONFIG.ySpeedMultiplier;
    this.clampToScreen();

    this.walkTimer += dt;
    if (this.walkTimer >= GAME_CONFIG.enemyWalkFrameMs) {
      this.walkTimer -= GAME_CONFIG.enemyWalkFrameMs;
      this.walkFrame = (this.walkFrame + 1) % this.getWalkFrameCount();
    }
  }

  countActiveAttackers(scene) {
    return (scene.enemies || []).filter(enemy =>
      enemy !== this &&
      enemy.alive &&
      enemy.enemyType === this.enemyType &&
      (enemy.state === 'attack' || enemy.intent === 'attack')
    ).length;
  }

  isInAttackRange(player) {
    return Math.abs(player.x - this.x) < this.attackRangeX && Math.abs(player.y - this.y) < this.attackRangeY;
  }

  updateAttack(dt, scene) {
    this.attackTimer += dt;
    const activeStart = GAME_CONFIG.enemyWindupMs;
    const activeEnd = GAME_CONFIG.enemyWindupMs + GAME_CONFIG.enemyActiveMs;

    if (!this.attackHasHit && this.attackTimer >= activeStart && this.attackTimer <= activeEnd) {
      const player = scene.player;
      const sameY = Combat.sameLane(player.y, this.y, this.attackRangeY);
      const inX = Math.abs(player.x - this.x) < this.attackRangeX;
      if (sameY && inX) {
        player.hp -= this.damage;
        player.x += this.facing * 18;
        scene.hitStop = 42;
        this.attackHasHit = true;
      }
    }

    if (this.attackTimer >= GAME_CONFIG.enemyWindupMs + GAME_CONFIG.enemyActiveMs + GAME_CONFIG.enemyRecoveryMs) {
      this.state = 'walk';
      this.intent = Math.random() < 0.65 ? 'flank' : 'strafe';
      this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
      this.retreatTimer = 0;
      this.cooldown = 420 + Math.random() * 340;
      this.attackTimer = 0;
      this.attackHasHit = false;
    }
  }

  startKnockdown(direction, knockback = 82) {
    this.x += direction * knockback;
    this.clampToScreen();
    this.state = 'knockdown';
    this.knockdownTimer = this.knockdownDuration;
    this.hitStun = 0;
    this.flash = 160;
    this.intent = 'flank';
    this.retreatTimer = 0;
    this.attackTimer = 0;
    this.attackHasHit = false;
    this.facing = -direction;
  }

  takeHit(damage, direction, knockback) {
    if (!this.alive) return;
    const oldHp = this.hp;
    this.hp -= damage;
    this.x += direction * knockback;
    this.clampToScreen();
    this.hitStun = GAME_CONFIG.enemyHitStunMs;
    this.flash = 120;
    this.state = 'hit';
    this.intent = 'flank';
    this.retreatTimer = 0;
    this.attackTimer = 0;
    this.attackHasHit = false;

    if (this.hp <= 0) {
      this.alive = false;
      this.state = 'dead';
      this.deadTimer = 0;
      this.clampToScreen();
      return;
    }

    if (!this.halfHpKnockdownDone && oldHp > this.maxHp * 0.5 && this.hp <= this.maxHp * 0.5) {
      this.halfHpKnockdownDone = true;
      this.startKnockdown(direction, Math.max(72, knockback + 42));
    }
  }

  getHurtbox() {
    return { x: this.x - 38, y: this.y - 140, w: 76, h: 140 };
  }

  getAttackBox() {
    return { x: this.x + (this.facing === 1 ? 30 : -108), y: this.y - 112, w: 108, h: 50 };
  }

  getEnemyImages() {
    const enemies = this.images.enemies || {};
    return enemies[this.enemyType] || enemies.dogRegime || {
      idle: this.images.dogIdle,
      walk: this.images.dogWalk,
      attack: this.images.dogAttack,
      dead: this.images.dogDead
    };
  }

  getImage() {
    const enemyImages = this.getEnemyImages();
    if (!this.alive) return enemyImages.dead;
    if (this.state === 'knockdown') return enemyImages.dead || enemyImages.idle;
    if (this.state === 'attack') {
      const attack = enemyImages.attack || [];
      return this.attackTimer < GAME_CONFIG.enemyWindupMs ? attack[0] || enemyImages.idle : attack[1] || attack[0] || enemyImages.idle;
    }
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
      ctx.fillStyle = this.hp > this.maxHp * 0.6 ? 'lime' : this.hp > this.maxHp * 0.28 ? 'yellow' : 'red';
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
