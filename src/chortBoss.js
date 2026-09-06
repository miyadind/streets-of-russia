(function () {
  if (typeof DogRegimeEnemy === 'undefined' || typeof LevelScene === 'undefined') return;

  class ChortSmokeProjectile {
    constructor(x, y, direction, image, config, targetY) {
      this.enemyType = 'chortSmokeProjectile';
      this.x = x;
      this.y = y;
      this.direction = direction >= 0 ? 1 : -1;
      this.image = image || null;
      this.targetY = targetY;
      this.laneY = y;
      this.speed = Number(config.smokeShotSpeed) || 7.8;
      this.verticalSpeed = (Number(targetY) - y) / 92;
      this.damage = Number(config.smokeShotDamage) || 18;
      this.scale = 0.085;
      this.hitboxSize = 58;
      this.alive = true;
      this.remove = false;
      this.blocksWaveClear = false;
      this.nonPhysical = true;
      this.state = 'projectile';
      this.age = 0;
    }

    update(dt, scene) {
      const frame = Math.max(0.65, Math.min(1.45, dt / 16.67));
      this.age += dt;
      this.x += this.direction * this.speed * frame;
      this.y += this.verticalSpeed * frame;
      this.laneY = this.y;
      const player = scene && scene.player;
      if (player && player.hp > 0 && Combat.canProjectileHit(this, player, {
        laneY: this.laneY,
        laneTolerance: GAME_CONFIG.yHitTolerance
      })) {
        player.receiveDamage(this.damage, {
          source: 'ranged',
          knockbackX: this.direction * 16,
          hitStunMs: 140,
          invulnerableMs: 260
        });
        this.remove = true;
      }
      if (this.x < -180 || this.x > GAME_CONFIG.width + 180) this.remove = true;
    }

    getAttackBox() {
      const size = this.hitboxSize;
      return { x: this.x - size / 2, y: this.y - size / 2, w: size, h: size };
    }

    getHurtbox() {
      return this.getAttackBox();
    }

    draw(ctx, debug) {
      ctx.save();
      const pulse = 1 + Math.sin(this.age / 80) * 0.08;
      if (this.image && this.image.complete !== false && this.image.naturalWidth !== 0) {
        const w = this.image.width * this.scale * pulse;
        const h = this.image.height * this.scale * pulse;
        ctx.globalAlpha = 0.72;
        ctx.drawImage(this.image, this.x - w / 2, this.y - h + 22, w, h);
      } else {
        const gradient = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, 34);
        gradient.addColorStop(0, 'rgba(234,238,246,0.9)');
        gradient.addColorStop(0.5, 'rgba(74,83,99,0.72)');
        gradient.addColorStop(1, 'rgba(10,12,17,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 34, 0, Math.PI * 2);
        ctx.fill();
      }
      if (debug) {
        const box = this.getAttackBox();
        ctx.strokeStyle = 'rgba(205,220,255,0.92)';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
      }
      ctx.restore();
    }
  }

  class ChortSmokeBomb {
    constructor(x, startY, targetY, config) {
      this.enemyType = 'chortSmokeBomb';
      this.x = x;
      this.y = startY;
      this.targetY = targetY;
      this.laneY = targetY;
      this.speed = Number(config.smokeBombDropSpeed) || 10.5;
      this.damage = Number(config.smokeBombDamage) || 28;
      this.radiusX = Number(config.smokeBombRadiusX) || 78;
      this.laneTolerance = Number(config.smokeBombLaneTolerance) || 42;
      this.age = 0;
      this.explosionTimer = 0;
      this.exploded = false;
      this.alive = true;
      this.remove = false;
      this.blocksWaveClear = false;
      this.nonPhysical = true;
      this.canBeHit = false;
    }

    explode(scene) {
      if (this.exploded) return;
      this.exploded = true;
      this.explosionTimer = 420;
      const player = scene && scene.player;
      const onTargetLane = player && Math.abs(player.y - this.targetY) <= this.laneTolerance;
      const inBlast = player && Math.abs(player.x - this.x) <= this.radiusX;
      if (onTargetLane && inBlast && player.hp > 0) {
        player.receiveDamage(this.damage, {
          source: 'ranged',
          knockbackX: Math.sign(player.x - this.x) * 32 || 1,
          hitStunMs: 190,
          invulnerableMs: 300
        });
      }
    }

    update(dt, scene) {
      const frame = Math.max(0.65, Math.min(1.45, dt / 16.67));
      this.age += dt;
      if (!this.exploded) {
        this.y += this.speed * frame;
        if (this.y >= this.targetY) {
          this.y = this.targetY;
          this.explode(scene);
        }
        return;
      }
      this.explosionTimer -= dt;
      if (this.explosionTimer <= 0) this.remove = true;
    }

    draw(ctx, debug) {
      ctx.save();
      if (!this.exploded) {
        const tailHeight = 54 + Math.min(64, this.age * 0.09);
        const trail = ctx.createLinearGradient(this.x, this.y - tailHeight, this.x, this.y + 14);
        trail.addColorStop(0, 'rgba(80,80,86,0)');
        trail.addColorStop(0.72, 'rgba(55,54,54,0.48)');
        trail.addColorStop(1, 'rgba(22,20,20,0.9)');
        ctx.strokeStyle = trail;
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - tailHeight);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        const glow = ctx.createRadialGradient(this.x - 4, this.y - 5, 2, this.x, this.y, 23);
        glow.addColorStop(0, '#ffb02d');
        glow.addColorStop(0.28, '#7a3216');
        glow.addColorStop(1, '#181819');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 19, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const progress = 1 - Math.max(0, this.explosionTimer) / 420;
        const radius = 28 + progress * 72;
        const explosion = ctx.createRadialGradient(this.x, this.y, 3, this.x, this.y, radius);
        explosion.addColorStop(0, 'rgba(255,220,120,0.92)');
        explosion.addColorStop(0.22, 'rgba(235,105,30,0.78)');
        explosion.addColorStop(0.56, 'rgba(72,65,71,0.5)');
        explosion.addColorStop(1, 'rgba(32,31,37,0)');
        ctx.fillStyle = explosion;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      if (debug) {
        ctx.strokeStyle = 'rgba(255,180,70,0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.radiusX, this.targetY - this.laneTolerance, this.radiusX * 2, this.laneTolerance * 2);
      }
      ctx.restore();
    }
  }

  function getConfig() {
    return GAME_CONFIG.enemies['4ort'] || {};
  }

  function getZone(scene) {
    return scene && scene.getWalkZone ? scene.getWalkZone() : {
      left: 0,
      right: GAME_CONFIG.width,
      top: GAME_CONFIG.laneTop,
      bottom: GAME_CONFIG.laneBottom
    };
  }

  function chooseSmokeTarget(enemy, scene) {
    const zone = getZone(scene);
    enemy.chortSmokeTargetX = Math.max(zone.left + 105, Math.min(zone.right - 105, zone.left + 140 + Math.random() * Math.max(1, zone.right - zone.left - 280)));
    enemy.chortSmokeTargetY = zone.top + 36;
  }

  function getRandomDelay(config, minKey, maxKey, fallback) {
    const min = Number(config[minKey]) || fallback;
    const max = Math.max(min, Number(config[maxKey]) || min);
    return min + Math.random() * (max - min);
  }

  function getVictoryTransition(scene) {
    const config = getConfig();
    const elapsed = Math.max(0, Number(scene && scene.chortVictoryTransitionMs) || 0);
    const duration = Math.max(1, Number(config.victoryFlashDurationMs) || 1200);
    const interval = Math.max(40, Number(config.victoryFlashIntervalMs) || 140);
    const isFlashing = elapsed > 0 && elapsed < duration;
    return {
      elapsed,
      duration,
      isFlashing,
      showClearSky: elapsed >= duration || (isFlashing && Math.floor(elapsed / interval) % 2 === 1)
    };
  }

  DogRegimeEnemy.prototype.initializeChortBoss = function (scene) {
    if (this.chortInitialized) return;
    const config = getConfig();
    const zone = getZone(scene);
    this.chortInitialized = true;
    this.chortPhase = 'humanIntro';
    this.chortRound = 0;
    this.chortPhaseTimer = Number(config.humanIntroMs) || 3200;
    this.chortBombTimer = getRandomDelay(config, 'smokeBombMinMs', 'smokeBombMaxMs', 1900);
    this.chortBombState = 'patrol';
    this.chortHoverTimer = 0;
    this.chortMinionTimer = getRandomDelay(config, 'smokeMinionMinMs', 'smokeMinionMaxMs', 6200);
    this.chortMinionIndex = 0;
    this.chortMoney = [];
    this.chortMoneyTimer = 0;
    // Voice lines play only when the ATM spills money, never at the boss spawn.
    this.chortVoiceIndex = 0;
    this.chortCanBeHit = false;
    this.canBeHit = false;
    this.nonPhysical = false;
    this.x = Math.min(zone.right - 180, Math.max(zone.left + 180, this.x));
    this.y = Math.min(zone.bottom - 24, Math.max(zone.top + 24, this.y));
    this.facing = -1;
    this.intent = 'hold';
    this.state = 'idle';
  };

  DogRegimeEnemy.prototype.playChortVoice = function () {
    const paths = getConfig().voicePaths || [];
    // Every lure consumes one line. Once the configured sequence is over,
    // later ATM cycles stay quiet instead of looping the first line again.
    const path = paths[this.chortVoiceIndex];
    if (!path) return false;
    AudioManager.playOptionalSfx('4ortVoice' + this.chortVoiceIndex, 1, {
      src: path,
      duckMusic: true,
      duckSource: '4ortVoice'
    });
    this.chortVoiceIndex += 1;
    return true;
  };

  DogRegimeEnemy.prototype.beginChortSmoke = function (scene) {
    const config = getConfig();
    this.chortPhase = 'smoke';
    this.chortCanBeHit = false;
    this.canBeHit = false;
    this.nonPhysical = true;
    this.state = 'walk';
    this.intent = 'smoke';
    this.chortBombTimer = getRandomDelay(config, 'smokeBombMinMs', 'smokeBombMaxMs', 1900);
    this.chortBombState = 'patrol';
    this.chortHoverTimer = 0;
    chooseSmokeTarget(this, scene);
  };

  DogRegimeEnemy.prototype.spawnChortMinion = function (scene) {
    if (!scene || !scene.spawnEnemyGroup) return;
    const config = getConfig();
    const active = (scene.enemies || []).filter(enemy => enemy && enemy.alive && enemy.chortMinion).length;
    if (active >= Math.max(1, Number(config.smokeMinionMaxActive) || 2)) return;
    const types = (config.smokeMinionTypes || []).filter(type => GAME_CONFIG.enemies && GAME_CONFIG.enemies[type]);
    if (!types.length) return;
    const type = types[this.chortMinionIndex % types.length];
    this.chortMinionIndex += 1;
    const before = scene.enemies.length;
    scene.spawnEnemyGroup({
      type,
      count: 1,
      side: this.chortMinionIndex % 2 ? 'left' : 'right',
      alignToPlayerLane: type === 'zetnik'
    });
    for (let index = before; index < scene.enemies.length; index++) {
      if (scene.enemies[index]) scene.enemies[index].chortMinion = true;
    }
  };

  DogRegimeEnemy.prototype.beginChortCollection = function (scene, atm) {
    if (this.chortPhase !== 'smoke') return false;
    const config = getConfig();
    this.chortRound += 1;
    // The governor always has to cross the same vulnerable collection phase.
    // On rounds 1-3 its HP is capped at a quarter threshold; from round 4 on
    // it can be finished, or return to smoke when the player misses the window.
    this.chortPhase = 'approachMoney';
    this.chortCanBeHit = true;
    this.canBeHit = true;
    this.nonPhysical = false;
    this.state = 'walk';
    this.intent = 'collect';
    this.chortPhaseTimer = Number(config.moneyApproachMs) || 720;
    this.chortMoneyTimer = 0;
    this.chortMoney = [];

    const rect = (atm && (atm.effectRect || atm.hitbox)) || { x: 570, y: 365, w: 142, h: 208 };
    const count = Math.max(6, Number(config.moneyCount) || 16);
    for (let index = 0; index < count; index++) {
      this.chortMoney.push({
        x: rect.x + 18 + Math.random() * Math.max(10, rect.w - 36),
        y: rect.y + rect.h - 4 - Math.random() * 34,
        rotation: (Math.random() - 0.5) * 0.35,
        age: 0
      });
    }
    this.playChortVoice();
    return true;
  };

  DogRegimeEnemy.prototype.updateChortBoss = function (dt, scene) {
    this.initializeChortBoss(scene);
    const config = getConfig();
    const frame = Math.max(0.65, Math.min(1.45, dt / 16.67));
    const zone = getZone(scene);

    if (this.chortPhase === 'humanIntro') {
      this.chortPhaseTimer -= dt;
      this.intent = 'hold';
      if (this.chortPhaseTimer <= 0) this.beginChortSmoke(scene);
      this.clampToScreen();
      return;
    }

    if (this.chortPhase === 'smoke') {
      const speed = (Number(config.smokePhaseMoveSpeed) || 3.2) * frame;
      const player = scene && scene.player;
      if (this.chortBombState === 'align') {
        this.chortSmokeTargetX = Math.max(zone.left + 105, Math.min(zone.right - 105, player ? player.x : this.x));
        this.chortSmokeTargetY = zone.top + 36;
      } else if (!Number.isFinite(this.chortSmokeTargetX) || Math.abs(this.chortSmokeTargetX - this.x) < 12) {
        chooseSmokeTarget(this, scene);
      }
      this.x += Math.sign(this.chortSmokeTargetX - this.x) * Math.min(Math.abs(this.chortSmokeTargetX - this.x), speed);
      this.y += Math.sign(this.chortSmokeTargetY - this.y) * Math.min(Math.abs(this.chortSmokeTargetY - this.y), speed * 0.62);
      this.chortMinionTimer -= dt;
      if (this.chortMinionTimer <= 0) {
        this.spawnChortMinion(scene);
        this.chortMinionTimer = getRandomDelay(config, 'smokeMinionMinMs', 'smokeMinionMaxMs', 6200);
      }
      if (this.chortBombState === 'align' && Math.abs(this.chortSmokeTargetX - this.x) < 12 && Math.abs(this.chortSmokeTargetY - this.y) < 10) {
        this.chortBombState = 'hover';
        this.chortHoverTimer = Number(config.smokeBombHoverMs) || 620;
      } else if (this.chortBombState === 'hover') {
        this.chortHoverTimer -= dt;
        if (this.chortHoverTimer <= 0) {
          const targetY = player ? Math.max(zone.top, Math.min(zone.bottom, player.y)) : zone.top + (zone.bottom - zone.top) / 2;
          scene.enemies.push(new ChortSmokeBomb(this.x, this.y - 54, targetY, config));
          this.chortBombState = 'patrol';
          this.chortBombTimer = getRandomDelay(config, 'smokeBombMinMs', 'smokeBombMaxMs', 1900);
          chooseSmokeTarget(this, scene);
        }
      } else {
        this.chortBombTimer -= dt;
        if (this.chortBombTimer <= 0) this.chortBombState = 'align';
      }
      this.clampToScreen();
      return;
    }

    if (this.chortPhase === 'approachMoney') {
      const spot = config.moneyCollectionSpot || { x: 790, y: 642 };
      const speed = 3.8 * frame;
      this.x += Math.sign(spot.x - this.x) * Math.min(Math.abs(spot.x - this.x), speed);
      this.y += Math.sign(spot.y - this.y) * Math.min(Math.abs(spot.y - this.y), speed * 0.58);
      this.chortPhaseTimer -= dt;
      if (this.chortPhaseTimer <= 0 || (Math.abs(spot.x - this.x) < 8 && Math.abs(spot.y - this.y) < 8)) {
        this.x = spot.x;
        this.y = spot.y;
        this.chortPhase = 'collecting';
        this.chortPhaseTimer = Number(config.moneyCollectMs) || 8000;
        this.chortMoneyTimer = 0;
        this.state = 'collect';
      }
      this.clampToScreen();
      return;
    }

    if (this.chortPhase === 'collecting') {
      this.chortPhaseTimer -= dt;
      this.chortMoneyTimer += dt;
      this.intent = 'collect';
      this.state = 'collect';
      const collectEvery = Math.max(380, (Number(config.moneyCollectMs) || 7200) / Math.max(1, this.chortMoney.length));
      if (this.chortMoneyTimer >= collectEvery && this.chortMoney.length) {
        this.chortMoney.shift();
        this.chortMoneyTimer = 0;
      }
      if (this.chortPhaseTimer <= 0 || !this.chortMoney.length) {
        this.chortMoney = [];
        this.chortCanBeHit = false;
        this.canBeHit = false;
        this.nonPhysical = true;
        this.chortPhase = 'smoke';
        this.beginChortSmoke(scene);
      }
      this.clampToScreen();
      return;
    }

    this.intent = 'hold';
    this.state = 'idle';
    this.clampToScreen();
  };

  DogRegimeEnemy.prototype.updateChortDissipate = function (dt, scene) {
    this.deadTimer += dt;
    if (scene) {
      scene.chortVictoryTransitionMs = this.deadTimer;
      if (this.deadTimer >= (Number(getConfig().victoryFlashDurationMs) || 1200)) {
        scene.chortVictoryBackgroundActive = true;
      }
    }
    if (this.deadTimer > (Number(getConfig().dissipateDurationMs) || 2500)) this.remove = true;
  };

  const originalUpdate = DogRegimeEnemy.prototype.update;
  DogRegimeEnemy.prototype.update = function (dt, scene) {
    if (this.enemyType !== '4ort') return originalUpdate.call(this, dt, scene);
    this.__scene = scene;
    if (this.remove) return;
    this.initializeChortBoss(scene);
    if (!this.alive) {
      this.updateChortDissipate(dt, scene);
      return;
    }
    if (this.flash > 0) this.flash -= dt;
    this.applyTuning(false);
    this.walkTimer += dt;
    if (this.walkTimer > 220) {
      this.walkTimer = 0;
      this.walkFrame = (this.walkFrame + 1) % 2;
    }
    this.updateChortBoss(dt, scene);
  };

  const originalTakeHit = DogRegimeEnemy.prototype.takeHit;
  DogRegimeEnemy.prototype.takeHit = function (damage, direction, knockback) {
    if (this.enemyType !== '4ort') return originalTakeHit.call(this, damage, direction, knockback);
    this.initializeChortBoss(this.__scene);
    if (!this.alive) return;
    if (!this.chortCanBeHit) {
      this.flash = 100;
      return;
    }

    const amount = Math.max(0, Number(damage) || 0);
    const canFinish = this.chortRound >= 4 &&
      (this.chortPhase === 'approachMoney' || this.chortPhase === 'collecting');
    const phaseFloor = canFinish
      ? 0
      : Math.max(0, this.maxHp - this.maxHp * Math.min(3, this.chortRound) / 4);
    const oldHp = this.hp;
    this.hp = Math.max(phaseFloor, this.hp - amount);
    this.flash = 130;
    this.hitStun = 0;
    this.x += (Math.sign(direction) || 0) * Math.min(12, Number(knockback) || 0);
    this.clampToScreen();

    if (canFinish && oldHp > 0 && this.hp <= 0) {
      this.alive = false;
      this.state = 'dead';
      this.chortPhase = 'dissipate';
      this.deadTimer = 0;
      this.chortCanBeHit = false;
      this.canBeHit = false;
      this.nonPhysical = true;
      if (this.__scene) {
        this.__scene.chortVictoryTransitionMs = 0;
        this.__scene.chortVictoryBackgroundActive = false;
        for (const enemy of this.__scene.enemies || []) {
          if (enemy && enemy.chortMinion) {
            enemy.remove = true;
            enemy.blocksWaveClear = false;
          }
        }
      }
    }
  };

  const originalGetImage = DogRegimeEnemy.prototype.getImage;
  DogRegimeEnemy.prototype.getImage = function () {
    if (this.enemyType !== '4ort') return originalGetImage.call(this);
    const images = this.getEnemyImages();
    const smoke = images.smoke || [];
    if (!this.alive || this.chortPhase === 'smoke' || this.chortPhase === 'dissipate') {
      return smoke[this.walkFrame % Math.max(1, smoke.length)] || images.idle;
    }
    return images.idle || originalGetImage.call(this);
  };

  const originalDraw = DogRegimeEnemy.prototype.draw;
  DogRegimeEnemy.prototype.draw = function (ctx, debug = false) {
    if (this.enemyType !== '4ort' || this.alive || this.chortPhase !== 'dissipate') {
      return originalDraw.call(this, ctx, debug);
    }

    const img = this.getImage();
    if (!img) return;
    const config = getConfig();
    const duration = Math.max(1, Number(config.dissipateDurationMs) || 2500);
    const progress = Math.max(0, Math.min(1, (Number(this.deadTimer) || 0) / duration));
    const scale = (this.scale || GAME_CONFIG.enemyScale) * (1 + progress * 0.36);
    const width = img.width * scale;
    const height = img.height * scale;

    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress * 1.18);
    ctx.translate(this.x, this.y - progress * 62);
    if (this.facing === -1 && this.mirrorSprite !== false) ctx.scale(-1, 1);
    ctx.drawImage(img, -width / 2, -height, width, height);
    ctx.restore();

    // A few fading smoke motes make the defeat read as dispersion, not a cut.
    ctx.save();
    ctx.fillStyle = 'rgba(178, 194, 217, 0.3)';
    for (let index = 0; index < 7; index++) {
      const seed = index * 1.73;
      const driftX = Math.sin(seed) * (24 + progress * 94);
      const driftY = -28 - index * 13 - progress * (52 + index * 9);
      const radius = 13 + progress * 18;
      ctx.globalAlpha = Math.max(0, (1 - progress) * (0.34 - index * 0.018));
      ctx.beginPath();
      ctx.arc(this.x + driftX, this.y + driftY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const originalEnemyPhysicalPresence = LevelScene.prototype.enemyHasPhysicalPresence;
  LevelScene.prototype.enemyHasPhysicalPresence = function (enemy) {
    if (enemy && enemy.nonPhysical) return false;
    return originalEnemyPhysicalPresence.call(this, enemy);
  };

  const originalWaveBlocker = LevelScene.prototype.isWaveBlocker;
  LevelScene.prototype.isWaveBlocker = function (enemy) {
    if (enemy && enemy.enemyType === '4ort' && enemy.chortPhase === 'dissipate' && !enemy.remove) return true;
    return originalWaveBlocker.call(this, enemy);
  };

  LevelScene.prototype.triggerChortAtm = function (atm) {
    const boss = (this.enemies || []).find(enemy => enemy && enemy.enemyType === '4ort' && enemy.alive && !enemy.remove);
    return !!(boss && boss.beginChortCollection && boss.beginChortCollection(this, atm));
  };

  const originalGetLevelBackgroundImage = LevelScene.prototype.getLevelBackgroundImage;
  LevelScene.prototype.getLevelBackgroundImage = function () {
    const level = this.getLevelConfig && this.getLevelConfig();
    const transition = getVictoryTransition(this);
    if ((this.chortVictoryBackgroundActive || transition.showClearSky) && level && level.victoryBackground) {
      const background = this.images && this.images.levelVictoryBackgrounds && this.images.levelVictoryBackgrounds[level.victoryBackground];
      if (background && background.complete !== false && background.naturalWidth !== 0) return background;
    }
    return originalGetLevelBackgroundImage.call(this);
  };

  const originalDrawForeground = LevelScene.prototype.drawLevelForegroundObjects;
  LevelScene.prototype.drawLevelForegroundObjects = function (ctx) {
    originalDrawForeground.call(this, ctx);
    const transition = getVictoryTransition(this);
    if (transition.isFlashing) {
      const flash = 0.1 + 0.17 * Math.max(0, Math.sin(transition.elapsed / 42));
      ctx.save();
      ctx.fillStyle = 'rgba(220, 239, 255, ' + flash.toFixed(3) + ')';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      ctx.restore();
    }
    const boss = (this.enemies || []).find(enemy => enemy && enemy.enemyType === '4ort');
    if (!boss || !boss.chortMoney || !boss.chortMoney.length) return;
    ctx.save();
    for (const money of boss.chortMoney) {
      ctx.save();
      ctx.translate(money.x, money.y);
      ctx.rotate(money.rotation || 0);
      ctx.fillStyle = '#b9df84';
      ctx.strokeStyle = '#315f34';
      ctx.lineWidth = 2;
      ctx.fillRect(-13, -7, 26, 14);
      ctx.strokeRect(-13, -7, 26, 14);
      ctx.fillStyle = '#386a3a';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 3);
      ctx.restore();
    }
    ctx.restore();
  };
})();
