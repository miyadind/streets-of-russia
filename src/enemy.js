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
    this.cooldown = 160 + id * 120;
    this.decisionTimer = 80 + id * 60;
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
    this.attackScale = config.attackScale || 1;
    this.minDistanceX = config.minDistanceX || 42;
    this.preferredDistanceX = config.preferredDistanceX || 76;
    this.tooFarDistanceX = config.tooFarDistanceX || Math.max(this.preferredDistanceX + 40, 140);
    this.attackRangeX = config.attackRangeX || GAME_CONFIG.enemyAttackRangeX;
    this.attackRangeY = config.attackRangeY || GAME_CONFIG.enemyAttackRangeY;
    this.attackMinDistanceX = config.attackMinDistanceX || Math.max(34, this.minDistanceX - 6);
    this.attackMaxDistanceX = config.attackMaxDistanceX || this.attackRangeX;
    this.maxAttackers = config.maxAttackers || 1;
    this.decisionMinMs = config.decisionMinMs || 160;
    this.decisionMaxMs = config.decisionMaxMs || 420;
    this.strafeChance = config.strafeChance == null ? 0.32 : config.strafeChance;
    this.retreatChance = config.retreatChance == null ? 0.16 : config.retreatChance;
    this.attackChance = config.attackChance == null ? 0.82 : config.attackChance;
    this.closeRetreatChance = config.closeRetreatChance == null ? 0.42 : config.closeRetreatChance;
    this.playerAttackFearDistance = config.playerAttackFearDistance || 86;
    this.postAttackRetreatMs = config.postAttackRetreatMs || 220;
    this.attackCooldownMinMs = config.attackCooldownMinMs || 300;
    this.attackCooldownMaxMs = config.attackCooldownMaxMs || 520;
    this.backstabChance = config.backstabChance == null ? 0.78 : config.backstabChance;
    this.slotSpacingX = config.slotSpacingX || 46;
    this.slotSpacingY = config.slotSpacingY || 32;
    this.flankDistanceX = config.flankDistanceX || 105;
    this.pressureDistanceX = config.pressureDistanceX || 150;
    this.bodyRadiusX = config.bodyRadiusX || GAME_CONFIG.enemyBodyRadiusX || 42;
    this.bodyRadiusY = config.bodyRadiusY || GAME_CONFIG.enemyBodyRadiusY || 20;
    this.attackSlotRadiusX = config.attackSlotRadiusX || GAME_CONFIG.enemyAttackSlotRadiusX || 46;
    this.attackSlotRadiusY = config.attackSlotRadiusY || GAME_CONFIG.enemyAttackSlotRadiusY || 24;
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
        this.cooldown = 260 + Math.random() * 220;
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
    const absX = Math.abs(dx);
    const absY = Math.abs(player.y - this.y);
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'attack') {
      this.updateAttack(dt, scene);
      this.clampToScreen();
      return;
    }

    const activeAttackers = this.countActiveAttackers(scene);
    const hasAttackPermission = activeAttackers < this.maxAttackers || this.intent === 'attack';
    const inAttackRange = this.isInAttackRange(player);
    const clearAttackPosition = this.hasClearAttackPosition(scene);
    const frontThreat = this.isPlayerAttackThreat(player);
    const goodAttackDistance = absX >= this.attackMinDistanceX && absX <= this.attackMaxDistanceX;
    const alignedForAttack = absY <= this.attackRangeY;
    const canAttackNow = hasAttackPermission && clearAttackPosition && goodAttackDistance && alignedForAttack && !frontThreat;

    if (canAttackNow && this.cooldown <= 0) {
      this.state = 'attack';
      this.intent = 'attack';
      this.attackTimer = 0;
      this.attackHasHit = false;
      this.clampToScreen();
      return;
    }

    if (this.decisionTimer <= 0) this.chooseIntent(scene, canAttackNow, inAttackRange, frontThreat, absX);

    if (frontThreat && this.intent !== 'backstab') {
      this.intent = Math.random() < 0.58 ? 'strafe' : 'retreat';
      this.retreatTimer = 120 + Math.random() * 120;
      this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
      this.decisionTimer = 110 + Math.random() * 120;
    } else if (absX < this.attackMinDistanceX && this.intent !== 'retreat') {
      this.intent = Math.random() < this.closeRetreatChance ? 'retreat' : 'strafe';
      this.retreatTimer = 130 + Math.random() * 130;
      this.decisionTimer = 100 + Math.random() * 130;
    }

    this.moveWithSpacing(dt, scene, canAttackNow);
    this.clampToScreen();
  }

  chooseIntent(scene, canAttackNow, inAttackRange, frontThreat = false, absX = Infinity) {
    const player = scene.player;
    const roll = Math.random();
    const playerBusy = this.isPlayerBusy(scene);

    if (playerBusy && roll < this.backstabChance && !this.isBehindPlayer(player)) {
      this.intent = 'backstab';
    } else if (frontThreat) {
      this.intent = roll < 0.58 ? 'strafe' : 'retreat';
      this.retreatTimer = 120 + Math.random() * 140;
      this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
    } else if (canAttackNow && this.cooldown <= 0 && inAttackRange) {
      this.intent = 'attack';
    } else if (absX < this.attackMinDistanceX) {
      this.intent = roll < this.closeRetreatChance ? 'retreat' : 'strafe';
      this.retreatTimer = 120 + Math.random() * 150;
      this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
    } else if (absX > this.tooFarDistanceX) {
      this.intent = 'approach';
    } else if (roll < this.attackChance && this.cooldown <= 0) {
      this.intent = 'attack';
    } else if (roll < this.attackChance + this.strafeChance) {
      this.intent = 'strafe';
      this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
    } else {
      this.intent = 'hold';
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
    const frontThreat = this.isPlayerAttackThreat(player);
    let moveX = 0;
    let moveY = 0;

    if (frontThreat && this.intent !== 'backstab') {
      moveX = -Math.sign(dxToPlayer || this.facing);
      moveY = Math.abs(dyToTarget) > 8 ? Math.sign(dyToTarget) : this.strafeDirection;
    } else if (this.intent === 'retreat' && this.retreatTimer > 0) {
      const retreatTargetX = player.x - Math.sign(dxToPlayer || this.facing) * this.preferredDistanceX;
      moveX = Math.sign(retreatTargetX - this.x);
      if (Math.abs(dyToTarget) > 8) moveY = Math.sign(dyToTarget);
      else if (Math.random() < 0.25) moveY = this.strafeDirection;
    } else if (this.intent === 'backstab') {
      const backSide = -(player.facing || 1);
      const backTargetX = player.x + backSide * this.preferredDistanceX;
      moveX = Math.abs(this.x - backTargetX) > 10 ? Math.sign(backTargetX - this.x) : 0;
      moveY = Math.abs(dyToTarget) > 8 ? Math.sign(dyToTarget) : 0;
      if (this.isBehindPlayer(player) && Math.abs(this.x - backTargetX) <= 16) this.intent = 'attack';
    } else if (absX < this.attackMinDistanceX) {
      moveX = -Math.sign(dxToPlayer || this.facing);
      moveY = Math.abs(dyToTarget) > 8 ? Math.sign(dyToTarget) : this.strafeDirection;
    } else if (this.intent === 'attack') {
      if (Math.abs(player.y - this.y) > this.attackRangeY * 0.65) moveY = Math.sign(player.y - this.y);
      if (absX < this.attackMinDistanceX) moveX = -Math.sign(dxToPlayer || this.facing);
      else if (absX > this.attackMaxDistanceX) moveX = Math.sign(dxToPlayer);
      else moveX = 0;
    } else if (this.intent === 'strafe') {
      if (Math.abs(dyToTarget) > 20) moveY = Math.sign(dyToTarget);
      else moveY = this.strafeDirection;
      if (absX > this.tooFarDistanceX) moveX = Math.sign(target.x - this.x);
    } else if (this.intent === 'flank') {
      if (Math.abs(dyToTarget) > 8) moveY = Math.sign(dyToTarget);
      if (Math.abs(this.x - target.x) > 18) moveX = Math.sign(target.x - this.x);
    } else if (absX > this.tooFarDistanceX || Math.abs(this.x - target.x) > 24) {
      moveX = Math.sign(target.x - this.x);
      if (Math.abs(dyToTarget) > 12) moveY = Math.sign(dyToTarget);
    } else if (Math.abs(dyToTarget) > 12) {
      moveY = Math.sign(dyToTarget);
    }

    this.applyMovement(moveX, moveY, dt);
  }

  getCombatSlot(scene, player) {
    const aliveEnemies = (scene.enemies || [])
      .filter(enemy => enemy && enemy.alive && enemy.blocksWaveClear !== false && enemy.state !== 'jump' && enemy.state !== 'crash')
      .sort((a, b) => a.id - b.id);
    const index = Math.max(0, aliveEnemies.indexOf(this));
    const playerFacing = player ? player.facing || 1 : 1;
    const backSide = -playerFacing;
    const frontSide = playerFacing;
    const playerBusy = this.isPlayerBusy(scene);
    const backFirst = playerBusy && Math.random() < this.backstabChance;
    const slots = backFirst ? [
      { side: backSide, y: 0, role: 'attacker' },
      { side: frontSide, y: 0, role: 'attacker' },
      { side: backSide, y: -1, role: 'flank' },
      { side: backSide, y: 1, role: 'flank' },
      { side: frontSide, y: 1, role: 'frontFlank' },
      { side: frontSide, y: -1, role: 'frontFlank' },
      { side: backSide, y: -2, role: 'outer' },
      { side: frontSide, y: 2, role: 'outer' }
    ] : [
      { side: frontSide, y: 0, role: 'attacker' },
      { side: backSide, y: 0, role: 'attacker' },
      { side: backSide, y: -1, role: 'flank' },
      { side: frontSide, y: 1, role: 'frontFlank' },
      { side: backSide, y: 1, role: 'flank' },
      { side: frontSide, y: -1, role: 'frontFlank' },
      { side: frontSide, y: 2, role: 'outer' },
      { side: backSide, y: -2, role: 'outer' }
    ];
    return slots[index % slots.length];
  }

  getSlotTarget(player, slot, canAttackNow) {
    let distanceX = this.preferredDistanceX;
    if (slot.role === 'back' || slot.role === 'flank' || slot.role === 'outer') distanceX = this.flankDistanceX;
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
      enemy.blocksWaveClear !== false &&
      (enemy.state === 'attack' || enemy.intent === 'attack')
    ).length;
  }

  isPlayerBusy(scene) {
    const player = scene.player;
    return (scene.enemies || []).some(enemy =>
      enemy !== this &&
      enemy &&
      enemy.alive &&
      !enemy.remove &&
      Math.abs(enemy.x - player.x) < this.attackRangeX + 18 &&
      Math.abs(enemy.y - player.y) < this.attackRangeY + 18 &&
      (enemy.state === 'attack' || enemy.intent === 'attack' || enemy.intent === 'hold')
    );
  }

  isBehindPlayer(player) {
    if (!player) return false;
    const playerFacing = player.facing || 1;
    return Math.sign(this.x - player.x || playerFacing) === -playerFacing;
  }

  isPlayerAttackThreat(player) {
    if (!player || player.state !== 'attack') return false;
    if (this.isBehindPlayer(player)) return false;
    const sideFromPlayer = Math.sign(this.x - player.x || 1);
    const playerFacing = player.facing || 1;
    const absX = Math.abs(this.x - player.x);
    const absY = Math.abs(this.y - player.y);
    return sideFromPlayer === playerFacing && absX < this.playerAttackFearDistance && absY < this.attackRangeY * 1.25;
  }

  hasClearAttackPosition(scene) {
    const player = scene.player;
    if (!player || !this.isInAttackRange(player)) return true;

    const mySide = Math.sign(this.x - player.x || this.facing || 1);
    for (const other of scene.enemies || []) {
      if (!other || other === this || !other.alive || other.remove) continue;
      if (other.blocksWaveClear === false) continue;
      if (other.state === 'jump' || other.state === 'crash' || other.state === 'knockdown') continue;

      const otherSide = Math.sign(other.x - player.x || other.facing || 1);
      if (otherSide !== mySide) continue;

      const otherRadiusX = other.attackSlotRadiusX || other.bodyRadiusX || GAME_CONFIG.enemyAttackSlotRadiusX || 46;
      const otherRadiusY = other.attackSlotRadiusY || other.bodyRadiusY || GAME_CONFIG.enemyAttackSlotRadiusY || 24;
      const nearThisEnemy = Math.abs(other.x - this.x) < this.attackSlotRadiusX + otherRadiusX &&
        Math.abs(other.y - this.y) < this.attackSlotRadiusY + otherRadiusY;
      const nearPlayerLine = Math.abs(other.y - player.y) < this.attackRangeY;
      const otherIsCommitted = other.state === 'attack' || other.intent === 'attack' || Math.abs(other.x - player.x) < this.attackRangeX * 0.72;

      if (nearThisEnemy && nearPlayerLine && otherIsCommitted) return false;
    }

    return true;
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
      const sameY = Combat.actorsSameFootLane(this, player, this.attackRangeY);
      const inX = Math.abs(player.x - this.x) < this.attackRangeX;
      if (sameY && inX) {
        const hit = player.receiveDamage(this.damage, {
          source: 'melee',
          knockbackX: this.facing * 18
        });
        if (hit) scene.hitStop = 42;
      }
      this.attackHasHit = true;
    }

    if (this.attackTimer >= GAME_CONFIG.enemyWindupMs + GAME_CONFIG.enemyActiveMs + GAME_CONFIG.enemyRecoveryMs) {
      this.state = 'walk';
      this.intent = Math.random() < 0.58 ? 'retreat' : 'strafe';
      this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
      this.retreatTimer = this.postAttackRetreatMs;
      this.cooldown = this.attackCooldownMinMs + Math.random() * Math.max(1, this.attackCooldownMaxMs - this.attackCooldownMinMs);
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

  getGroundBodyBox() {
    return {
      x: this.x - this.bodyRadiusX,
      y: this.y - this.bodyRadiusY,
      w: this.bodyRadiusX * 2,
      h: this.bodyRadiusY * 2
    };
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
    const baseScale = this.scale || GAME_CONFIG.enemyScale;
    const frameScale = this.state === 'attack' ? baseScale * (this.attackScale || 1) : baseScale;
    const w = img.width * frameScale;
    const h = img.height * frameScale;
    const baseH = img.height * baseScale;

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
      const by = this.y - baseH - 12;
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
      const gb = this.getGroundBodyBox();
      ctx.strokeStyle = 'rgba(0,180,255,0.75)';
      ctx.strokeRect(gb.x, gb.y, gb.w, gb.h);
      ctx.strokeStyle = 'rgba(80,255,120,0.85)';
      ctx.beginPath();
      ctx.moveTo(this.x - 36, this.y);
      ctx.lineTo(this.x + 36, this.y);
      ctx.stroke();
      if (this.state === 'attack') {
        const ab = this.getAttackBox();
        ctx.strokeStyle = 'orange';
        ctx.strokeRect(ab.x, ab.y, ab.w, ab.h);
      }
    }
  }
}
