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
    enemy.chortSmokeTargetX = Math.max(zone.left + 650, Math.min(zone.right - 150, zone.left + 780 + Math.random() * 280));
    enemy.chortSmokeTargetY = zone.top + 30 + Math.random() * Math.max(1, zone.bottom - zone.top - 60);
  }

  DogRegimeEnemy.prototype.initializeChortBoss = function (scene) {
    if (this.chortInitialized) return;
    const config = getConfig();
    const zone = getZone(scene);
    this.chortInitialized = true;
    this.chortPhase = 'humanIntro';
    this.chortRound = 0;
    this.chortPhaseTimer = Number(config.humanIntroMs) || 3200;
    this.chortShotTimer = Number(config.smokeShotMinMs) || 1450;
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
    const path = paths[this.chortVoiceIndex % paths.length];
    if (!path) return;
    AudioManager.playOptionalSfx('4ortVoice' + this.chortVoiceIndex, 1, {
      src: path,
      duckMusic: true,
      duckSource: '4ortVoice'
    });
    this.chortVoiceIndex += 1;
  };

  DogRegimeEnemy.prototype.beginChortSmoke = function (scene) {
    const config = getConfig();
    this.chortPhase = 'smoke';
    this.chortCanBeHit = false;
    this.canBeHit = false;
    this.nonPhysical = true;
    this.state = 'walk';
    this.intent = 'smoke';
    this.chortShotTimer = (Number(config.smokeShotMinMs) || 1450) + Math.random() * Math.max(1, (Number(config.smokeShotMaxMs) || 2200) - (Number(config.smokeShotMinMs) || 1450));
    chooseSmokeTarget(this, scene);
  };

  DogRegimeEnemy.prototype.beginChortCollection = function (scene, atm) {
    if (this.chortPhase !== 'smoke') return false;
    const config = getConfig();
    this.chortRound += 1;
    this.chortPhase = this.chortRound >= 4 ? 'finalHuman' : 'approachMoney';
    this.chortCanBeHit = true;
    this.canBeHit = true;
    this.nonPhysical = false;
    this.state = 'walk';
    this.intent = 'collect';
    this.chortPhaseTimer = this.chortRound >= 4 ? 0 : (Number(config.moneyApproachMs) || 720);
    this.chortMoneyTimer = 0;
    this.chortMoney = [];

    if (this.chortRound >= 4) return true;
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
      if (!Number.isFinite(this.chortSmokeTargetX) || Math.abs(this.chortSmokeTargetX - this.x) < 12) chooseSmokeTarget(this, scene);
      this.x += Math.sign(this.chortSmokeTargetX - this.x) * Math.min(Math.abs(this.chortSmokeTargetX - this.x), speed);
      this.y += Math.sign(this.chortSmokeTargetY - this.y) * Math.min(Math.abs(this.chortSmokeTargetY - this.y), speed * 0.62);
      this.chortShotTimer -= dt;
      if (this.chortShotTimer <= 0) {
        const player = scene && scene.player;
        const spread = Number(config.smokeShotSpreadY) || 78;
        const laneY = player
          ? Math.max(zone.top, Math.min(zone.bottom, player.y + (Math.random() * 2 - 1) * spread))
          : zone.top + Math.random() * Math.max(1, zone.bottom - zone.top);
        const direction = player && player.x < this.x ? -1 : 1;
        const images = this.getEnemyImages();
        const smokeFrames = images.smoke || [];
        scene.enemies.push(new ChortSmokeProjectile(this.x + direction * 72, this.y - 78, direction, smokeFrames[this.walkFrame % smokeFrames.length], config, laneY));
        this.chortShotTimer = (Number(config.smokeShotMinMs) || 1450) + Math.random() * Math.max(1, (Number(config.smokeShotMaxMs) || 2200) - (Number(config.smokeShotMinMs) || 1450));
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
    scene.chortSunlight = Math.min(1, (scene.chortSunlight || 0) + dt / 2200);
    if (this.deadTimer > 2600) this.remove = true;
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
    const isFinal = this.chortPhase === 'finalHuman';
    const phaseFloor = isFinal ? 0 : Math.max(0, this.maxHp - this.maxHp * Math.min(3, this.chortRound) / 4);
    const oldHp = this.hp;
    this.hp = Math.max(phaseFloor, this.hp - amount);
    this.flash = 130;
    this.hitStun = 0;
    this.x += (Math.sign(direction) || 0) * Math.min(12, Number(knockback) || 0);
    this.clampToScreen();

    if (isFinal && oldHp > 0 && this.hp <= 0) {
      this.alive = false;
      this.state = 'dead';
      this.chortPhase = 'dissipate';
      this.deadTimer = 0;
      this.chortCanBeHit = false;
      this.canBeHit = false;
      this.nonPhysical = true;
      if (this.__scene) this.__scene.chortSunlight = 0.08;
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

  const originalDrawBackgroundEffects = LevelScene.prototype.drawLevelBackgroundEffects;
  LevelScene.prototype.drawLevelBackgroundEffects = function (ctx) {
    originalDrawBackgroundEffects.call(this, ctx);
    const sunlight = Math.max(0, Math.min(1, Number(this.chortSunlight) || 0));
    if (!sunlight) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(112, 191, 255, ' + (sunlight * 0.62) + ')';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height * 0.62);
    ctx.fillStyle = 'rgba(255, 238, 174, ' + (sunlight * 0.15) + ')';
    ctx.fillRect(0, GAME_CONFIG.height * 0.28, GAME_CONFIG.width, GAME_CONFIG.height * 0.34);
    ctx.restore();
  };

  const originalDrawForeground = LevelScene.prototype.drawLevelForegroundObjects;
  LevelScene.prototype.drawLevelForegroundObjects = function (ctx) {
    originalDrawForeground.call(this, ctx);
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
