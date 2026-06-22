(() => {
  if (typeof DogRegimeEnemy === 'undefined') return;
  if (DogRegimeEnemy.prototype.dogClubRangePatchApplied) return;

  DogRegimeEnemy.prototype.getClubReachBox = function () {
    const minX = Math.max(0, this.attackMinDistanceX || 0);
    const maxX = Math.max(minX + 1, this.attackRangeX || GAME_CONFIG.enemyAttackRangeX || 76);
    const rangeY = Math.max(1, this.attackRangeY || GAME_CONFIG.enemyAttackRangeY || 36);

    return {
      x: this.facing === 1 ? this.x + minX : this.x - maxX,
      y: this.y - rangeY,
      w: maxX - minX,
      h: rangeY * 2
    };
  };

  DogRegimeEnemy.prototype.canClubReachPlayer = function (player, anticipation = false) {
    if (!player) return false;

    const facing = this.facing || 1;
    const forwardDistance = (player.x - this.x) * facing;
    const yDistance = Math.abs(player.y - this.y);
    const padX = anticipation ? 6 : 0;
    const padY = anticipation ? 4 : 0;
    const minX = Math.max(0, (this.attackMinDistanceX || 0) - padX);
    const maxX = Math.max(minX + 1, (this.attackRangeX || GAME_CONFIG.enemyAttackRangeX || 76) + padX);
    const maxY = (this.attackRangeY || GAME_CONFIG.enemyAttackRangeY || 36) + padY;

    return forwardDistance >= minX && forwardDistance <= maxX && yDistance <= maxY;
  };

  DogRegimeEnemy.prototype.isInAttackRange = function (player) {
    return this.canClubReachPlayer(player, true);
  };

  const originalApplyTuning = DogRegimeEnemy.prototype.applyTuning;
  DogRegimeEnemy.prototype.applyTuning = function (resetHp = false) {
    if (typeof originalApplyTuning === 'function') originalApplyTuning.call(this, resetHp);
    const config = (GAME_CONFIG.enemies && GAME_CONFIG.enemies[this.enemyType]) || {};
    this.attackMinDistanceX = config.attackMinDistanceX == null ? 28 : config.attackMinDistanceX;
    this.attackRangeX = config.attackRangeX || GAME_CONFIG.enemyAttackRangeX || 76;
    this.attackRangeY = config.attackRangeY || GAME_CONFIG.enemyAttackRangeY || 36;
    this.attackMaxDistanceX = this.attackRangeX;
  };

  const originalMoveWithSpacing = DogRegimeEnemy.prototype.moveWithSpacing;
  DogRegimeEnemy.prototype.moveWithSpacing = function (dt, scene, canAttackNow) {
    const player = scene && scene.player;
    if (player && this.intent === 'attack' && !this.canClubReachPlayer(player, true)) {
      const facing = this.facing || 1;
      const forwardDistance = (player.x - this.x) * facing;
      const yDistance = Math.abs(player.y - this.y);
      let moveX = 0;
      let moveY = 0;

      if (yDistance > this.attackRangeY * 0.65) moveY = Math.sign(player.y - this.y);
      if (forwardDistance < this.attackMinDistanceX) moveX = -facing;
      else if (forwardDistance > this.attackRangeX) moveX = facing;

      this.applyMovement(moveX, moveY, dt);
      return;
    }

    if (typeof originalMoveWithSpacing === 'function') originalMoveWithSpacing.call(this, dt, scene, canAttackNow);
  };

  DogRegimeEnemy.prototype.updateAttack = function (dt, scene) {
    this.attackTimer += dt;
    const activeStart = GAME_CONFIG.enemyWindupMs;
    const activeEnd = GAME_CONFIG.enemyWindupMs + GAME_CONFIG.enemyActiveMs;

    if (!this.attackHasHit && this.attackTimer >= activeStart && this.attackTimer <= activeEnd) {
      const player = scene.player;
      if (this.canClubReachPlayer(player, false)) {
        const didHit = player.receiveDamage(this.damage, {
          source: 'melee',
          knockbackX: this.facing * 18
        });
        if (didHit) scene.hitStop = 42;
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
  };

  const originalDraw = DogRegimeEnemy.prototype.draw;
  DogRegimeEnemy.prototype.draw = function (ctx, debug = false) {
    if (typeof originalDraw === 'function') originalDraw.call(this, ctx, debug);
    if (debug && this.alive && typeof this.getClubReachBox === 'function') {
      const box = this.getClubReachBox();
      ctx.strokeStyle = 'rgba(255,210,0,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.w, box.h);
    }
  };

  DogRegimeEnemy.prototype.dogClubRangePatchApplied = true;
})();