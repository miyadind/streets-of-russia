class GoydenishZProjectile {
  constructor(x, y, direction, image, config, owner, laneY) {
    this.enemyType = 'goydenishZ';
    this.x = x;
    this.y = y;
    this.laneY = Number.isFinite(laneY) ? laneY : y;
    this.direction = direction >= 0 ? 1 : -1;
    this.image = image || null;
    this.speed = Number(config.projectileSpeed) || 7.2;
    this.damage = Number(config.projectileDamage) || 16;
    this.scale = Number(config.projectileScale) || 0.095;
    this.hitboxSize = Number(config.projectileHitboxSize) || 112;
    this.owner = owner || null;
    this.reflected = false;
    this.reflectedDamage = 0;
    this.spin = 0;
    this.spinSpeed = 0.0105;
    this.alive = true;
    this.remove = false;
    this.blocksWaveClear = false;
    this.nonPhysical = true;
    this.canBeHit = true;
  }

  deflect(player, damage, scene) {
    if (!player) return false;
    this.direction = player.facing >= 0 ? 1 : -1;
    this.reflected = true;
    this.reflectedDamage = Math.max(1, Number(damage) || 1);
    this.spinSpeed = Math.abs(this.spinSpeed) * this.direction * 1.45;
    if (scene) scene.hitStop = Math.max(scene.hitStop || 0, GAME_CONFIG.playerHitStopMs || 40);
    return true;
  }

  update(dt, scene) {
    const frameScale = Math.max(0.65, Math.min(1.55, dt / 16.67));
    this.x += this.direction * this.speed * frameScale;
    this.spin += this.spinSpeed * dt;
    const player = scene && scene.player;
    if (!this.reflected && player && player.hp > 0 && Combat.canProjectileHit(this, player, {
      laneY: this.laneY,
      laneTolerance: GAME_CONFIG.yHitTolerance
    })) {
      const hit = player.receiveDamage(this.damage, {
        source: 'ranged',
        knockbackX: this.direction * 22,
        hitStunMs: 150,
        invulnerableMs: 240
      });
      if (hit && scene) scene.hitStop = Math.max(scene.hitStop || 0, 36);
      this.remove = true;
    }
    if (this.reflected && this.owner && this.owner.alive && Combat.canProjectileHit(this, this.owner, {
      laneY: this.laneY,
      laneTolerance: GAME_CONFIG.yHitTolerance
    })) {
      this.owner.takeHit(this.reflectedDamage, this.direction, 42);
      if (scene && scene.addDamageText) scene.addDamageText(this.reflectedDamage, this.owner);
      if (scene) scene.hitStop = Math.max(scene.hitStop || 0, 58);
      this.remove = true;
    }
    if (this.x < -140 || this.x > GAME_CONFIG.width + 140) this.remove = true;
  }

  getAttackBox() {
    const size = this.hitboxSize;
    return {
      x: this.x - size / 2,
      y: this.y - size / 2,
      w: size,
      h: size
    };
  }

  getHurtbox() {
    return this.getAttackBox();
  }

  draw(ctx, debug = false) {
    ctx.save();
    if (this.image && this.image.complete !== false && this.image.naturalWidth !== 0) {
      const w = this.image.width * this.scale;
      const h = this.image.height * this.scale;
      ctx.globalCompositeOperation = 'source-over';
      ctx.translate(this.x, this.y);
      ctx.rotate(this.spin);
      ctx.drawImage(this.image, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = '#f5d548';
      ctx.strokeStyle = '#171717';
      ctx.lineWidth = 4;
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.translate(this.x, this.y);
      ctx.rotate(this.spin);
      ctx.strokeText('Z', 0, 14);
      ctx.fillText('Z', 0, 14);
    }
    if (debug) {
      const box = this.getAttackBox();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,220,0,0.95)';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.w, box.h);
    }
    ctx.restore();
  }
}

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
    this.attackDamageSource = config.attackDamageSource || 'melee';
    this.maxHp = config.hp;
    this.scale = config.scale || GAME_CONFIG.enemyScale;
    this.attackScale = config.attackScale || 1;
    this.finalAttackScale = config.finalAttackScale || 1;
    this.mirrorSprite = config.mirrorSprite !== false;
    this.attackIdleMs = config.attackIdleMs || 0;
    this.attackWindupMs = config.attackWindupMs || GAME_CONFIG.enemyWindupMs;
    this.attackActiveMs = config.attackActiveMs || GAME_CONFIG.enemyActiveMs;
    this.attackRecoveryMs = config.attackRecoveryMs || GAME_CONFIG.enemyRecoveryMs;
    this.minDistanceX = config.minDistanceX || 42;
    this.preferredDistanceX = config.preferredDistanceX || 76;
    this.tooFarDistanceX = config.tooFarDistanceX || Math.max(this.preferredDistanceX + 40, 140);
    this.attackRangeX = config.attackRangeX || GAME_CONFIG.enemyAttackRangeX;
    this.attackRangeY = config.attackRangeY || GAME_CONFIG.enemyAttackRangeY;
    this.attackMinDistanceX = config.attackMinDistanceX == null ? 28 : config.attackMinDistanceX;
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
    const tuning = GAME_CONFIG.enemies[this.enemyType] || {};
    const margin = tuning.keepOnScreen
      ? Math.max(0, Number(tuning.screenMarginX) || 0)
      : (this.alive ? (GAME_CONFIG.enemyOffscreenMargin || 180) : 45);
    this.x = Math.max(-margin, Math.min(GAME_CONFIG.width + margin, this.x));
    this.y = Math.max(GAME_CONFIG.laneTop, Math.min(GAME_CONFIG.laneBottom, this.y));
  }

  isOffscreenX(padding = 45) {
    return this.x < padding || this.x > GAME_CONFIG.width - padding;
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

    if (this.isOffscreenX() && this.enemyType !== 'goydenish') {
      this.intent = 'approach';
      this.retreatTimer = 0;
      this.decisionTimer = Math.min(this.decisionTimer, 80);
    }

    if (this.state === 'attack') {
      this.updateAttack(dt, scene);
      this.clampToScreen();
      return;
    }

    if (this.enemyType === 'goydenish') {
      this.updateGoydenishTactics(dt, scene, absY);
      return;
    }

    const activeAttackers = this.countActiveAttackers(scene);
    const hasAttackPermission = activeAttackers < this.maxAttackers || this.intent === 'attack';
    const inAttackRange = this.isInAttackRange(player);
    const clearAttackPosition = this.hasClearAttackPosition(scene);
    const frontThreat = this.isPlayerAttackThreat(player);
    const goodAttackDistance = absX >= this.attackMinDistanceX && absX <= this.attackMaxDistanceX;
    const alignedForAttack = absY <= this.attackRangeY;
    const canAttackNow = hasAttackPermission && clearAttackPosition && goodAttackDistance && alignedForAttack && inAttackRange && !frontThreat;

    if (canAttackNow && this.cooldown <= 0) {
      this.state = 'attack';
      this.intent = 'attack';
      this.attackFacing = this.facing || 1;
      if (this.enemyType === 'horse') {
        this.attackLockX = this.x;
        this.attackLockY = this.y;
        this.attackPositionLocked = true;
      }
      this.attackTimer = 0;
      this.attackHasHit = false;
      this.clubSwingSfxPlayed = false;
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
    if (this.isOffscreenX()) {
      const returnX = this.x < 45 ? 1 : -1;
      const returnY = Math.abs(player.y - this.y) > 10 ? Math.sign(player.y - this.y) : 0;
      this.applyMovement(returnX, returnY, dt);
      return;
    }

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
    const walkFrames = Array.isArray(enemyImages.walk) ? enemyImages.walk : Object.values(enemyImages.walk || {});
    return Math.max(1, walkFrames.filter(Boolean).length);
  }

  applyMovement(moveX, moveY, dt, speedMultiplier = 1) {
    if (moveX === 0 && moveY === 0) return;
    if (this.isOffscreenX()) moveX = this.x < 45 ? 1 : -1;
    const len = Math.hypot(moveX, moveY);
    moveX /= len;
    moveY /= len;
    this.x += moveX * this.speed * speedMultiplier;
    this.y += moveY * this.speed * GAME_CONFIG.ySpeedMultiplier * speedMultiplier;
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
    return sideFromPlayer === playerFacing && absX < this.playerAttackFearDistance &&
      Combat.laneCanConnect(player, this, { laneTolerance: this.attackRangeY * 1.25 });
  }

  hasClearAttackPosition(scene) {
    const player = scene.player;
    if (!player || !this.isInAttackRange(player)) return true;

    const mySide = Math.sign(this.x - player.x || this.facing || 1);
    for (const other of scene.enemies || []) {
      if (!other || other === this || !other.alive || other.remove) continue;
      if (other.blocksWaveClear === false) continue;
      if (scene.enemyHasPhysicalPresence && !scene.enemyHasPhysicalPresence(other)) continue;
      if (!scene.enemyHasPhysicalPresence && (other.state === 'jump' || other.state === 'crash' || other.state === 'knockdown')) continue;

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
    return this.canClubReachPlayer(player, true);
  }

  getClubReachBox() {
    const minX = Math.max(0, this.attackMinDistanceX || 0);
    const maxX = Math.max(minX + 1, this.attackRangeX || GAME_CONFIG.enemyAttackRangeX || 76);
    const rangeY = Math.max(1, this.attackRangeY || GAME_CONFIG.enemyAttackRangeY || 36);
    return {
      x: this.facing === 1 ? this.x + minX : this.x - maxX,
      y: this.y - rangeY,
      w: maxX - minX,
      h: rangeY * 2
    };
  }

  canClubReachPlayer(player, anticipation = false) {
    if (!player) return false;
    if (typeof Combat !== 'undefined' && Combat.actorsSameLane && !Combat.actorsSameLane(this, player)) return false;
    const forwardDistance = (player.x - this.x) * (this.facing || 1);
    const yDistance = Math.abs(player.y - this.y);
    const padX = anticipation ? 6 : 0;
    const padY = anticipation ? 4 : 0;
    const minX = Math.max(0, (this.attackMinDistanceX || 0) - padX);
    const maxX = Math.max(minX + 1, (this.attackRangeX || GAME_CONFIG.enemyAttackRangeX || 76) + padX);
    const maxY = (this.attackRangeY || GAME_CONFIG.enemyAttackRangeY || 36) + padY;
    return forwardDistance >= minX && forwardDistance <= maxX && yDistance <= maxY;
  }

  updateAttack(dt, scene) {
    this.attackTimer += dt;
    const activeStart = GAME_CONFIG.enemyWindupMs;
    const activeEnd = GAME_CONFIG.enemyWindupMs + GAME_CONFIG.enemyActiveMs;

    if (!this.attackHasHit && this.attackTimer >= activeStart && this.attackTimer <= activeEnd) {
      const player = scene.player;
      if (this.canClubReachPlayer(player, false)) {
        const hit = player.receiveDamage(this.damage, {
          source: this.attackDamageSource,
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
      this.attackFacing = null;
      this.attackPositionLocked = false;
      this.attackLockX = null;
      this.attackLockY = null;
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
    this.attackFacing = null;
    this.attackPositionLocked = false;
    this.attackLockX = null;
    this.attackLockY = null;
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
    this.attackFacing = null;
    this.attackPositionLocked = false;
    this.attackLockX = null;
    this.attackLockY = null;

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
    if (this.enemyType === 'goydenish') {
      const side = this.facing === 1 ? 'right' : 'left';
      if (this.state === 'attack') {
        const config = GAME_CONFIG.enemies.goydenish || {};
        if (this.attackTimer < (config.attackIdleMs || 0)) return enemyImages.idle;
        if (this.attackTimer < (this.attackWindupMs || GAME_CONFIG.enemyWindupMs)) return (enemyImages.swing || {})[side] || enemyImages.idle;
        return (enemyImages.throw || {})[side] || (enemyImages.swing || {})[side] || enemyImages.idle;
      }
      if (this.hitStun > 0 || this.intent === 'hold') return enemyImages.idle;
      return (enemyImages.walk || [])[this.walkFrame % 2] || enemyImages.idle;
    }
    if (this.state === 'attack') {
      const attack = enemyImages.attack || [];
      const windupMs = this.attackWindupMs || GAME_CONFIG.enemyWindupMs;
      return this.attackTimer < windupMs ? attack[0] || enemyImages.idle : attack[1] || attack[0] || enemyImages.idle;
    }
    if (this.hitStun > 0) return enemyImages.idle;
    return enemyImages.walk[this.walkFrame] || enemyImages.idle;
  }

  getFrameScale(img, baseScale) {
    if (this.state !== 'attack') return baseScale;
    const attack = this.getEnemyImages().attack || [];
    return baseScale * (this.attackScale || 1) * (img === attack[1] ? this.finalAttackScale : 1);
  }

  updateGoydenishTactics(dt, scene, absY) {
    const player = scene.player;
    const config = GAME_CONFIG.enemies.goydenish || {};
    const distanceX = Math.abs(player.x - this.x);
    const aligned = absY <= this.attackRangeY;
    const activeAttackers = this.countActiveAttackers(scene);
    const preferredSide = this.getGoydenishPreferredSide(scene);

    if (!this.fleeTargetSide && preferredSide && (this.x - player.x) * preferredSide < 0) {
      // A pair claims opposite sides and routes around the player to get there.
      this.fleeTargetSide = preferredSide;
      this.fleeRouteY = this.id % 2
        ? GAME_CONFIG.laneTop + 28
        : GAME_CONFIG.laneBottom - 28;
    }

    if (this.fleeTargetSide || distanceX <= (config.fleeDistanceX || 270)) {
      this.intent = 'flee';
      if (!this.fleeTargetSide) {
        // Cross the player through a committed top/bottom route instead of shuffling against an edge.
        this.fleeTargetSide = this.x <= player.x ? 1 : -1;
        this.fleeRouteY = this.id % 2
          ? GAME_CONFIG.laneTop + 28
          : GAME_CONFIG.laneBottom - 28;
      }

      const targetX = this.fleeTargetSide > 0
        ? GAME_CONFIG.width - (config.screenMarginX || 70)
        : (config.screenMarginX || 70);
      const movingPastPlayer = this.fleeTargetSide > 0 ? this.x < player.x : this.x > player.x;
      const moveX = Math.abs(targetX - this.x) > 12 ? Math.sign(targetX - this.x) : 0;
      const moveY = movingPastPlayer || Math.abs(this.fleeRouteY - this.y) > 18
        ? Math.sign(this.fleeRouteY - this.y)
        : 0;
      this.applyMovement(moveX, moveY, dt, config.fleeSpeedMultiplier || 2);
      if (moveX === 0 && moveY === 0) this.fleeTargetSide = 0;
      this.clampToScreen();
      return;
    }

    if (aligned) {
      this.intent = 'hold';
      if (this.cooldown <= 0 && activeAttackers < this.maxAttackers) {
        this.state = 'attack';
        this.intent = 'attack';
        this.attackFacing = this.facing || 1;
        this.attackTimer = 0;
        this.attackHasHit = false;
      }
      this.clampToScreen();
      return;
    }

    this.intent = 'align';
    this.applyMovement(0, Math.sign(player.y - this.y), dt);
    this.clampToScreen();
  }

  getGoydenishPreferredSide(scene) {
    const goydenishes = (scene.enemies || [])
      .filter(enemy => enemy && enemy.alive && enemy.enemyType === 'goydenish')
      .sort((a, b) => a.id - b.id);
    if (goydenishes.length < 2) return 0;
    return goydenishes.indexOf(this) % 2 === 0 ? -1 : 1;
  }

  updateGoydenishAttack(dt, scene) {
    this.attackTimer += dt;
    const config = GAME_CONFIG.enemies.goydenish || {};
    const windupMs = this.attackWindupMs || GAME_CONFIG.enemyWindupMs;
    const activeMs = this.attackActiveMs || GAME_CONFIG.enemyActiveMs;
    const recoveryMs = this.attackRecoveryMs || GAME_CONFIG.enemyRecoveryMs;

    if (!this.attackHasHit && this.attackTimer >= windupMs) {
      const imageSet = this.getEnemyImages();
      const spawnX = this.x + this.facing * 92;
      const spawnY = this.y - 94;
      scene.enemies.push(new GoydenishZProjectile(spawnX, spawnY, this.facing, imageSet.projectile, config, this, this.y));
      AudioManager.playSfx('goydenishThrow', 0.9, {
        owner: 'goydenish',
        duckMusic: true,
        duckSource: 'goydenishThrowVoice'
      });
      this.attackHasHit = true;
    }

    if (this.attackTimer >= windupMs + activeMs + recoveryMs) {
      this.state = 'walk';
      this.intent = 'hold';
      this.decisionTimer = 180 + Math.random() * 180;
      this.cooldown = this.attackCooldownMinMs + Math.random() * Math.max(1, this.attackCooldownMaxMs - this.attackCooldownMinMs);
      this.attackTimer = 0;
      this.attackHasHit = false;
      this.attackFacing = null;
    }
  }

  draw(ctx, debug = false) {
    const img = this.getImage();
    if (!img) return;
    const baseScale = this.scale || GAME_CONFIG.enemyScale;
    const frameScale = typeof this.getFrameScale === 'function'
      ? this.getFrameScale(img, baseScale)
      : (this.state === 'attack'
        ? baseScale * (this.attackScale || 1) * (img === (this.getEnemyImages().attack || [])[1] ? this.finalAttackScale : 1)
        : baseScale);
    const w = img.width * frameScale;
    const h = img.height * frameScale;
    const baseH = img.height * baseScale;
    const drawOffsetY = typeof this.getDrawOffsetY === 'function' ? this.getDrawOffsetY(img, frameScale) : 0;
    const drawOffsetX = typeof this.getDrawOffsetX === 'function' ? this.getDrawOffsetX(img, frameScale) : 0;

    let alpha = 1;
    if (!this.alive) alpha = Math.max(0, 1 - this.deadTimer / GAME_CONFIG.enemyDeathFadeMs);
    else if (this.flash > 0) alpha = 0.55;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    if (this.facing === -1 && this.mirrorSprite !== false) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2 + drawOffsetX, -h + drawOffsetY, w, h);
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
