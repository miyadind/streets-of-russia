(() => {
  if (!window.DevPanel && typeof DevPanel === 'undefined') return;
  const panel = window.DevPanel || DevPanel;
  if (!panel.fieldGroups || !panel.fieldGroups.DOG) return;

  const existing = new Set(panel.fieldGroups.DOG.map(field => field.path));
  const add = field => {
    if (!existing.has(field.path)) {
      panel.fieldGroups.DOG.push(field);
      existing.add(field.path);
    }
  };

  add({ label: 'Min dist X', path: 'enemies.dogRegime.minDistanceX', min: 20, max: 160, step: 2 });
  add({ label: 'Preferred dist X', path: 'enemies.dogRegime.preferredDistanceX', min: 40, max: 240, step: 2 });
  add({ label: 'Attack range X', path: 'enemies.dogRegime.attackRangeX', min: 30, max: 180, step: 2 });
  add({ label: 'Attack range Y', path: 'enemies.dogRegime.attackRangeY', min: 14, max: 90, step: 2 });
  add({ label: 'Max attackers', path: 'enemies.dogRegime.maxAttackers', min: 1, max: 4, step: 1 });
  add({ label: 'Decision min ms', path: 'enemies.dogRegime.decisionMinMs', min: 120, max: 1200, step: 20 });
  add({ label: 'Decision max ms', path: 'enemies.dogRegime.decisionMaxMs', min: 200, max: 2000, step: 20 });
  add({ label: 'Strafe chance', path: 'enemies.dogRegime.strafeChance', min: 0, max: 1, step: 0.05 });
  add({ label: 'Retreat chance', path: 'enemies.dogRegime.retreatChance', min: 0, max: 1, step: 0.05 });
  add({ label: 'Attack chance', path: 'enemies.dogRegime.attackChance', min: 0, max: 1, step: 0.05 });
  add({ label: 'Slot spacing X', path: 'enemies.dogRegime.slotSpacingX', min: 0, max: 180, step: 4 });
  add({ label: 'Slot spacing Y', path: 'enemies.dogRegime.slotSpacingY', min: 0, max: 120, step: 4 });
  add({ label: 'Flank distance X', path: 'enemies.dogRegime.flankDistanceX', min: 60, max: 240, step: 4 });
  add({ label: 'Pressure distance X', path: 'enemies.dogRegime.pressureDistanceX', min: 80, max: 320, step: 4 });

  if (typeof DogRegimeEnemy === 'undefined' || DogRegimeEnemy.prototype.clubReachPatchApplied) return;

  const overlaps = (a, b) => a && b &&
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;

  const padded = (box, padX = 0, padY = 0) => ({
    x: box.x - padX,
    y: box.y - padY,
    w: box.w + padX * 2,
    h: box.h + padY * 2
  });

  DogRegimeEnemy.prototype.getClubReachBox = function () {
    const reachForward = this.clubReachForward || 142;
    const reachBack = this.clubReachBack || 16;
    return {
      x: this.facing === 1 ? this.x - reachBack : this.x - reachForward,
      y: this.y - 126,
      w: reachForward + reachBack,
      h: 62
    };
  };

  DogRegimeEnemy.prototype.canClubReachPlayer = function (player, anticipation = false) {
    if (!player || typeof player.getBodyBox !== 'function') return false;
    const body = player.getBodyBox();
    const padX = anticipation ? 10 : 0;
    const padY = anticipation ? 8 : 0;
    return overlaps(this.getClubReachBox(), padded(body, padX, padY));
  };

  const originalApplyTuning = DogRegimeEnemy.prototype.applyTuning;
  DogRegimeEnemy.prototype.applyTuning = function (resetHp = false) {
    if (typeof originalApplyTuning === 'function') originalApplyTuning.call(this, resetHp);
    const config = (GAME_CONFIG.enemies && GAME_CONFIG.enemies[this.enemyType]) || {};
    this.clubReachForward = config.clubReachForward || 142;
    this.clubReachBack = config.clubReachBack || 16;
    this.preferredDistanceX = config.preferredDistanceX || 64;
    this.attackMinDistanceX = config.attackMinDistanceX || 30;
    this.attackMaxDistanceX = config.attackMaxDistanceX || 128;
    this.attackRangeX = Math.max(config.attackRangeX || 0, this.attackMaxDistanceX);
    this.attackWindupMs = config.attackWindupMs || GAME_CONFIG.enemyWindupMs;
    this.attackActiveMs = config.attackActiveMs || GAME_CONFIG.enemyActiveMs;
    this.attackRecoveryMs = config.attackRecoveryMs || GAME_CONFIG.enemyRecoveryMs;
  };

  DogRegimeEnemy.prototype.isInAttackRange = function (player) {
    return this.canClubReachPlayer(player, true);
  };

  const originalMoveWithSpacing = DogRegimeEnemy.prototype.moveWithSpacing;
  DogRegimeEnemy.prototype.moveWithSpacing = function (dt, scene, canAttackNow) {
    const player = scene && scene.player;
    if (player && this.intent === 'attack' && !this.canClubReachPlayer(player, true)) {
      const desiredSide = Math.sign(player.x - this.x || this.facing || 1);
      this.facing = desiredSide;
      const moveX = Math.sign(player.x - this.x);
      const moveY = Math.abs(player.y - this.y) > this.attackRangeY * 0.55 ? Math.sign(player.y - this.y) : 0;
      this.applyMovement(moveX, moveY, dt);
      return;
    }
    if (typeof originalMoveWithSpacing === 'function') originalMoveWithSpacing.call(this, dt, scene, canAttackNow);
  };

  DogRegimeEnemy.prototype.updateAttack = function (dt, scene) {
    this.attackTimer += dt;
    const windupMs = this.attackWindupMs || GAME_CONFIG.enemyWindupMs;
    const activeMs = this.attackActiveMs || GAME_CONFIG.enemyActiveMs;
    const recoveryMs = this.attackRecoveryMs || GAME_CONFIG.enemyRecoveryMs;
    const activeStart = windupMs;
    const activeEnd = windupMs + activeMs;

    if (!this.attackHasHit && this.attackTimer >= activeStart && this.attackTimer <= activeEnd) {
      const player = scene.player;
      if (this.canClubReachPlayer(player, false)) {
        const hit = player.receiveDamage(this.damage, {
          source: 'melee',
          knockbackX: this.facing * 18
        });
        if (hit) scene.hitStop = 42;
      }
      this.attackHasHit = true;
    }

    if (this.attackTimer >= windupMs + activeMs + recoveryMs) {
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

  DogRegimeEnemy.prototype.clubReachPatchApplied = true;
})();
