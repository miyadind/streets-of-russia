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
  }

  applyTuning(resetHp = false) {
    const config = GAME_CONFIG.enemies[this.enemyType] || GAME_CONFIG.enemies.dogRegime;
    this.speed = config.speed;
    this.damage = config.damage;
    this.maxHp = config.hp;
    this.scale = config.scale || GAME_CONFIG.enemyScale;
    this.minDistanceX = config.minDistanceX || 54;
    this.preferredDistanceX = config.preferredDistanceX || 92;
    this.attackRangeX = config.attackRangeX || GAME_CONFIG.enemyAttackRangeX;
    this.attackRangeY = config.attackRangeY || GAME_CONFIG.enemyAttackRangeY;
    this.maxAttackers = config.maxAttackers || 1;
    this.decisionMinMs = config.decisionMinMs || 350;
    this.decisionMaxMs = config.decisionMaxMs || 850;
    this.strafeChance = config.strafeChance == null ? 0.45 : config.strafeChance;
    this.retreatChance = config.retreatChance == null ? 0.22 : config.retreatChance;
    this.attackChance = config.attackChance == null ? 0.55 : config.attackChance;
    this.slotSpacingX = config.slotSpacingX || 72;
    this.slotSpacingY = config.slotSpacingY || 34;
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
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.decisionTimer > 0) this.decisionTimer -= dt;
    if (this.retreatTimer > 0) this.retreatTimer -= dt;

    const player = scene.player;
    const dx = player.x - this.x;
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'attack') {
      this.updateAttack(dt, scene);
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
      return;
    }

    this.moveWithSpacing(dt, scene);
    this.y = Math.max(GAME_CONFIG.laneTop, Math.min(GAME_CONFIG.laneBottom, this.y));
  }

  chooseIntent(player, canAttackNow, inAttackRange) {
    const roll = Math.random();

    if (inAttackRange && canAttackNow && this.cooldown <= 0 && roll < this.attackChance) {
      this.intent = 'attack';
    } else if (roll < this.attackChance + this.retreatChance) {
      this.intent = 'retreat';
      this.retreatTimer = 260 + Math.random() * 360;
    } else if (roll < this.attackChance + this.retreatChance + this.strafeChance) {
      this.intent = 'strafe';
      this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
    } else {
      this.intent = 'hold';
    }

    this.decisionTimer = this.decisionMinMs + Math.random() * (this.decisionMaxMs - this.decisionMinMs);
  }

  moveWithSpacing(dt, scene) {
    const player = scene.player;
    const slot = this.getCombatSlot(scene);
    const target = this.getSlotTarget(player, slot);
    const dxToPlayer = player.x - this.x;
    const absX = Math.abs(dxToPlayer);
    const dyToTarget = target.y - this.y;
    let moveX = 0;
    let moveY = 0;

    if (this.intent === 'retreat' && this.retreatTimer > 0) {
      moveX = -Math.sign(dxToPlayer || this.facing);
      if (Math.abs(dyToTarget) > 8) moveY = Math.sign(dyToTarget);
    } else if (absX < this.minDistanceX) {
      moveX = -Math.sign(dxToPlayer || this.facing);
      if (Math.abs(dyToTarget) > 10) moveY = Math.sign(dyToTarget);
    } else if (Math.abs(this.x - target.x) > 14) {
      moveX = Math.sign(target.x - this.x);
    }

    if (this.intent === 'strafe' || this.intent === 'hold') {
      if (Math.abs(dyToTarget) > 10) moveY = Math.sign(dyToTarget);
      else moveY = this.strafeDirection;
    } else if (Math.abs(dyToTarget) > 14) {
      moveY = Math.sign(dyToTarget);
    }

    if (this.intent === 'attack' && Math.abs(player.y - this.y) > this.attackRangeY * 0.65) {
      moveY = Math.sign(player.y - this.y);
    }

    this.applyMovement(moveX, moveY, dt);
  }

  getCombatSlot(scene) {
    const aliveDogs = (scene.enemies || [])
      .filter(enemy => enemy.alive && enemy.enemyType === this.enemyType)
      .sort((a, b) => a.id - b.id);
    const index = Math.max(0, aliveDogs.indexOf(this));
    const slots = [
      { side: 1, y: 0 },
      { side: -1, y: 0 },
      { side: 1, y: -1 },
      { side: -1, y: 1 },
      { side: 1, y: 1 },
      { side: -1, y: -1 }
    ];
    return slots[index % slots.length];
  }

  getSlotTarget(player, slot) {
    const x = player.x + slot.side * this.preferredDistanceX + slot.side * Math.abs(slot.y) * this.slotSpacingX;
    const y = player.y + slot.y * this.slotSpacingY;
    return {
      x: Math.max(70, Math.min(GAME_CONFIG.width - 70, x)),
      y: Math.max(GAME_CONFIG.laneTop, Math.min(GAME_CONFIG.laneBottom, y))
    };
  }

  applyMovement(moveX, moveY, dt) {
    if (moveX === 0 && moveY === 0) return;
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
      this.intent = 'retreat';
      this.retreatTimer = 220 + Math.random() * 300;
      this.cooldown = 560 + Math.random() * 420;
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
    this.intent = 'retreat';
    this.retreatTimer = 240 + Math.random() * 280;
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
    if (this.state === 'attack') return this.attackTimer < GAME_CONFIG.enemyWindupMs ? enemyImages.attack[0] : enemyImages.attack[1];
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
      const target = this.getSlotTarget({ x: 640, y: 600 }, this.getCombatSlot({ enemies: [this] }));
      if (this.state === 'attack') {
        const ab = this.getAttackBox();
        ctx.strokeStyle = 'orange';
        ctx.strokeRect(ab.x, ab.y, ab.w, ab.h);
      }
    }
  }
}