class HealthPickup {
  constructor(type, x, y, images) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.images = images;
    this.age = 0;
    this.remove = false;
    this.floatText = null;
    this.floatTimer = 0;
    this.floatTextX = x;
    this.floatTextY = y - 58;
    this.popDuration = 420;
  }

  getConfig() {
    return (GAME_CONFIG.pickups && GAME_CONFIG.pickups[this.type]) || {};
  }

  getImage() {
    const cfg = this.getConfig();
    return this.images && this.images.pickups && this.images.pickups[cfg.image || this.type];
  }

  getHealAmount(player) {
    const cfg = this.getConfig();
    if (!player) return 0;
    if (cfg.fullHeal) return Math.max(0, player.maxHp - player.hp);
    if (cfg.healPercent != null) return Math.ceil(player.maxHp * cfg.healPercent);
    return Math.max(0, Number(cfg.heal) || 0);
  }

  update(dt, scene) {
    this.age += dt;
    if (this.floatTimer > 0) {
      this.floatTimer -= dt;
      if (this.floatTimer <= 0) this.remove = true;
    }
  }

  canCollect(player) {
    if (!player || player.hp <= 0) return;
    const cfg = this.getConfig();
    const dx = Math.abs(player.x - this.x);
    const dy = Math.abs(player.y - this.y);
    const radiusX = cfg.collectRadiusX == null ? 58 : cfg.collectRadiusX;
    const laneTolerance = cfg.collectLaneTolerance == null ? 42 : cfg.collectLaneTolerance;
    return dx <= radiusX && dy <= laneTolerance;
  }

  collect(player) {
    if (!this.canCollect(player)) return false;
    const cfg = this.getConfig();
    const before = player.hp;
    const heal = this.getHealAmount(player);
    player.hp = Math.min(player.maxHp, player.hp + heal);
    const gained = Math.max(0, player.hp - before);
    if (gained <= 0) return;
    this.floatText = gained > 0 ? (cfg.label || ('+' + gained + ' HP')) : 'FULL';
    this.floatTextX = player.x;
    this.floatTextY = player.y - 136;
    this.floatTimer = 650;
    AudioManager.playSfx('waveClear', 0.35, { playbackRate: 1.35 });
    return true;
  }

  draw(ctx) {
    const img = this.getImage();
    const cfg = this.getConfig();
    const pop = Math.min(1, this.age / this.popDuration);
    const bounce = Math.sin(pop * Math.PI);
    const pulse = 1 + Math.sin(this.age / 130) * 0.045;
    const appearScale = pop < 1 ? (0.35 + 0.65 * pop) : 1;
    const scale = (cfg.scale || 0.32) * pulse * appearScale;
    const popY = pop < 1 ? -bounce * 42 : 0;

    ctx.save();
    if (this.floatTimer <= 0 && img && img.complete !== false && img.naturalWidth !== 0) {
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.globalAlpha = Math.min(1, 0.25 + pop * 0.75);
      ctx.shadowColor = 'rgba(255,255,210,0.7)';
      ctx.shadowBlur = 12;
      try {
        ctx.drawImage(img, this.x - w / 2, this.y - h + popY, w, h);
      } catch (error) {
        this.drawFallback(ctx, pop, appearScale, popY);
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    } else if (this.floatTimer <= 0) {
      this.drawFallback(ctx, pop, appearScale, popY);
    }

    if (this.floatText) {
      const t = 1 - Math.max(0, this.floatTimer) / 650;
      ctx.globalAlpha = Math.max(0, 1 - t * 0.55);
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#10260f';
      ctx.fillStyle = '#87ff8f';
      ctx.strokeText(this.floatText, this.floatTextX, this.floatTextY - t * 24);
      ctx.fillText(this.floatText, this.floatTextX, this.floatTextY - t * 24);
      ctx.textAlign = 'left';
    }
    ctx.restore();
  }

  drawFallback(ctx, pop, appearScale, popY) {
    const color = this.type === 'medkit' ? '#ff3f3f' : this.type === 'tea' ? '#d89641' : '#f7b23b';
    ctx.globalAlpha = Math.min(1, 0.25 + pop * 0.75);
    ctx.shadowColor = 'rgba(255,255,210,0.75)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.strokeStyle = '#fff1c0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - 22 + popY, 24 * appearScale, 16 * appearScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111';
    ctx.fillText(this.type === 'medkit' ? '+' : this.type === 'tea' ? 'TEA' : 'HP', this.x, this.y - 18 + popY);
  }
}

class LevelScene {
  constructor(game, images) {
    this.game = game;
    this.images = images;
    this.screenIndex = 0;
    this.player = new Player(game.selectedHero || 'boris', images);
    this.enemies = [];
    this.pickups = [];
    this.pendingPickupDrops = [];
    this.levelPickupDropped = false;
    this.hitStop = 0;
    this.encounterActive = false;
    this.encounterCleared = false;
    this.debug = false;
    this.currentWaveIndex = -1;
    this.nonBlockingWaveTimer = 0;
    this.pendingWave = null;
    this.pendingWaveTimer = 0;
    this.scheduledGroups = [];
    this.spawnInitialWave();
  }

  getLevelKey() {
    return GAME_CONFIG.levelOrder[this.screenIndex] || 'street01';
  }

  getLevelConfig() {
    return GAME_CONFIG.levels[this.getLevelKey()] || GAME_CONFIG.levels.street01;
  }

  getLevelBackgroundImage() {
    return this.images.streets[this.screenIndex] || this.images.streets[0];
  }

  updateLevelInteractives(dt) {
  }

  drawLevelBackgroundEffects(ctx) {
  }

  spawnInitialWave() {
    this.currentWaveIndex = -1;
    this.enemies = [];
    this.pickups = [];
    this.pendingPickupDrops = [];
    this.levelPickupDropped = false;
    this.encounterActive = false;
    this.encounterCleared = false;
    this.nonBlockingWaveTimer = 0;
    this.pendingWave = null;
    this.pendingWaveTimer = 0;
    this.scheduledGroups = [];
    this.spawnNextWave('onEnter');
  }

  hasLaterWave(expectedTrigger = 'afterWaveCleared') {
    const level = this.getLevelConfig();
    const waves = level.waves || [];
    for (let i = this.currentWaveIndex + 1; i < waves.length; i++) {
      if (waves[i].trigger === expectedTrigger) return true;
    }
    return false;
  }

  scheduleNonBlockingWaveAdvance() {
    this.encounterActive = false;
    if (this.hasLaterWave('afterWaveCleared')) {
      this.encounterCleared = false;
      this.nonBlockingWaveTimer = 5000;
    } else {
      this.encounterCleared = true;
      this.nonBlockingWaveTimer = 0;
    }
  }

  getWaveAppearDelayMs(wave) {
    if (wave.appearDelayMs != null) return Math.max(0, Number(wave.appearDelayMs) || 0);
    return 0;
  }

  getEnemyAppearSoundKey(type) {
    return `${type}Appear`;
  }

  getEnemyAppearSoundPath(type) {
    const enemyConfig = (GAME_CONFIG.enemies && GAME_CONFIG.enemies[type]) || {};
    if (enemyConfig.appearSoundPath) return enemyConfig.appearSoundPath;
    const folder = String(type || 'enemy').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    return `assets/enemies/${folder}/appear.mp3`;
  }

  playEnemyAppearSound(type) {
    if (!type) return;
    AudioManager.playOptionalSfx(this.getEnemyAppearSoundKey(type), 0.9, {
      src: this.getEnemyAppearSoundPath(type),
      startAt: 0.01
    });
  }

  spawnNextWave(expectedTrigger = 'afterWaveCleared') {
    const level = this.getLevelConfig();
    const waves = level.waves || [];

    for (let i = this.currentWaveIndex + 1; i < waves.length; i++) {
      const wave = waves[i];
      if (wave.trigger !== expectedTrigger) continue;
      this.currentWaveIndex = i;
      this.beginWave(wave);
      return true;
    }

    this.encounterActive = false;
    this.encounterCleared = true;
    this.nonBlockingWaveTimer = 0;
    this.pendingWave = null;
    this.pendingWaveTimer = 0;
    return false;
  }

  beginWave(wave) {
    this.handleWaveAudio(wave);
    const delayMs = this.getWaveAppearDelayMs(wave);

    if (delayMs > 0) {
      this.playWaveAppearSounds(wave);
      this.pendingWave = wave;
      this.pendingWaveTimer = delayMs;
      this.encounterActive = false;
      this.encounterCleared = false;
      this.nonBlockingWaveTimer = 0;
      return;
    }

    this.materializeWave(wave);
  }

  playWaveAppearSounds(wave) {
    const playedTypes = new Set();
    for (const group of wave.enemies || []) {
      if (!group.type || playedTypes.has(group.type)) continue;
      playedTypes.add(group.type);
      this.playEnemyAppearSound(group.type);
    }
  }

  materializeWave(wave) {
    this.spawnWave(wave);
    this.encounterActive = this.hasWaveBlockers() || this.hasScheduledGroups();
    this.encounterCleared = !this.encounterActive;
    this.nonBlockingWaveTimer = 0;
    this.pendingWave = null;
    this.pendingWaveTimer = 0;

    if (!this.encounterActive) {
      this.scheduleNonBlockingWaveAdvance();
    }
  }

  spawnWave(wave) {
    this.enemies = this.enemies.filter(enemy => enemy && enemy.alive && enemy.enemyType === 'bastard');
    this.scheduledGroups = [];

    for (const group of wave.enemies || []) {
      const delayMs = Math.max(0, Number(group.delayMs) || 0);
      if (delayMs > 0) this.scheduleEnemyGroup(group, delayMs);
      else this.spawnEnemyGroup(group);
    }

    this.separateEnemies(16.67, true);
  }

  scheduleEnemyGroup(group, delayMs) {
    this.scheduledGroups.push({
      group: JSON.parse(JSON.stringify(group)),
      timer: delayMs
    });
  }

  updateScheduledGroups(dt) {
    if (!this.scheduledGroups.length) return;
    for (const item of this.scheduledGroups) item.timer -= dt;

    const ready = this.scheduledGroups.filter(item => item.timer <= 0);
    this.scheduledGroups = this.scheduledGroups.filter(item => item.timer > 0);
    for (const item of ready) {
      this.spawnEnemyGroup(item.group);
      this.separateEnemies(16.67, true);
    }
  }

  hasScheduledGroups() {
    return this.scheduledGroups && this.scheduledGroups.length > 0;
  }

  spawnEnemyGroup(group) {
    const count = Math.max(0, Number(group.count) || 0);
    let enemyId = this.enemies.length;
    let playedAppearSound = false;
    for (let i = 0; i < count; i++) {
      if (group.type === 'bastard' && this.enemies.some(enemy => enemy.enemyType === 'bastard' && enemy.alive)) {
        continue;
      }

      const spawn = this.getSpawnPoint(group.side, i, count);
      const enemy = this.createEnemy(group.type, spawn.x, spawn.y, enemyId);
      if (!enemy) continue;

      this.enemies.push(enemy);
      if (!playedAppearSound) {
        this.playEnemyAppearSound(enemy.enemyType);
        playedAppearSound = true;
      }
      enemyId += 1;
    }
  }

  getBossMusicKey(wave) {
    for (const group of wave.enemies || []) {
      const enemyConfig = GAME_CONFIG.enemies[group.type] || {};
      const isBoss = enemyConfig.bossMusic === true || group.boss === true;
      if (!isBoss) continue;
      return group.bossMusicKey || enemyConfig.bossMusicKey || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.boss) || 'bossTheme';
    }
    return null;
  }

  handleWaveAudio(wave) {
    const bossMusicKey = this.getBossMusicKey(wave);

    if (bossMusicKey) {
      AudioManager.playSfx('bossAppear', 0.9);
      AudioManager.playMusic(bossMusicKey, true);
    } else {
      AudioManager.playSfx('waveStart', 0.55);
      const level = this.getLevelConfig();
      AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme');
    }
  }

  createEnemy(type, x, y, id) {
    if (type === 'zetnik') return new ZetnikEnemy(x, y, this.images, id);
    if (type === 'sucker') return new SuckerEnemy(x, y, this.images, id);
    if (type === 'bastard') return new BastardEnemy(x, y, this.images, id);
    if (GAME_CONFIG.enemies[type]) return new DogRegimeEnemy(x, y, this.images, id, type);
    console.warn('Unknown enemy type:', type);
    return null;
  }

  hasWaveBlockers() {
    return this.enemies.some(enemy => this.isWaveBlocker(enemy));
  }

  isWaveBlocker(enemy) {
    return enemy && enemy.alive && enemy.blocksWaveClear !== false;
  }

  getSpawnPoint(side, index, count) {
    const safeSide = side || 'right';
    const rowRatio = count <= 1 ? 0.5 : index / Math.max(1, count - 1);
    const y = GAME_CONFIG.laneTop + 28 + rowRatio * (GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop - 56);

    if (safeSide === 'left') {
      return { x: 120 + index * 34, y };
    }

    if (safeSide === 'both') {
      const fromLeft = index % 2 === 0;
      return {
        x: fromLeft ? 110 + index * 18 : GAME_CONFIG.width - 110 - index * 18,
        y
      };
    }

    return { x: GAME_CONFIG.width - 130 - index * 34, y };
  }

  enemyHasPhysicalPresence(enemy) {
    if (!enemy || !enemy.alive || enemy.remove) return false;
    if (enemy.attackPositionLocked) return false;
    return !['jump', 'crash', 'pinBite', 'knockdown', 'dead', 'fallen', 'interrupted'].includes(enemy.state);
  }

  separateEnemies(dt = 16.67, force = false) {
    const active = this.enemies.filter(enemy => this.enemyHasPhysicalPresence(enemy));

    const iterations = force ? 4 : Math.max(1, GAME_CONFIG.enemySeparationIterations || 1);
    const strength = force ? 0.85 : Math.max(0, Math.min(1, GAME_CONFIG.enemySeparationStrength == null ? 0.5 : GAME_CONFIG.enemySeparationStrength));
    const dtScale = Math.max(0.65, Math.min(1.35, dt / 16.67));

    for (let pass = 0; pass < iterations; pass++) {
      for (let i = 0; i < active.length; i++) {
        const a = active[i];
        const arx = a.bodyRadiusX || GAME_CONFIG.enemyBodyRadiusX || 42;
        const ary = a.bodyRadiusY || GAME_CONFIG.enemyBodyRadiusY || 20;

        for (let j = i + 1; j < active.length; j++) {
          const b = active[j];
          const brx = b.bodyRadiusX || GAME_CONFIG.enemyBodyRadiusX || 42;
          const bry = b.bodyRadiusY || GAME_CONFIG.enemyBodyRadiusY || 20;
          const minX = arx + brx;
          const minY = ary + bry;
          let dx = b.x - a.x;
          let dy = b.y - a.y;

          if (dx === 0 && dy === 0) {
            const sign = (a.id || 0) <= (b.id || 0) ? 1 : -1;
            dx = sign * 0.01;
            dy = sign * 0.01;
          }

          const nx = dx / minX;
          const ny = dy / minY;
          const distSq = nx * nx + ny * ny;
          if (distSq >= 1) continue;

          const dist = Math.max(0.001, Math.sqrt(distSq));
          const overlap = (1 - dist) * strength * dtScale;
          const pushX = (nx / dist) * minX * overlap * 0.5;
          const pushY = (ny / dist) * minY * overlap * 0.5;

          a.x -= pushX;
          a.y -= pushY;
          b.x += pushX;
          b.y += pushY;

          if (a.clampToScreen) a.clampToScreen();
          if (b.clampToScreen) b.clampToScreen();
        }
      }
    }
  }

  restartCurrentLevel() {
    this.player.x = 190;
    this.player.y = 620;
    this.player.releaseFromPin();
    const level = this.getLevelConfig();
    AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme');
    this.spawnInitialWave();
  }

  nextScreen() {
    if (this.screenIndex < this.images.streets.length - 1) {
      this.screenIndex += 1;
      this.player.x = 190;
      this.player.y = 620;
      this.player.releaseFromPin();
      const level = this.getLevelConfig();
      AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme');
      this.spawnInitialWave();
    } else {
      this.game.setState('mainMenu');
    }
  }

  update(dt) {
    if (Input.consume('q')) this.debug = !this.debug;
    if (Input.consume('escape')) this.game.setState('mainMenu');

    if (this.hitStop > 0) {
      this.hitStop -= dt;
      return;
    }

    this.player.update(dt, this);
    this.updateLevelInteractives(dt);

    if (this.pendingWave) {
      this.pendingWaveTimer -= dt;
      if (this.pendingWaveTimer <= 0) {
        const wave = this.pendingWave;
        this.materializeWave(wave);
      }
    }

    this.updateScheduledGroups(dt);

    for (const enemy of this.enemies) {
      const wasAlive = enemy.alive;
      if (!wasAlive) this.maybeDropPickup(enemy, { source: 'system' });
      enemy.update(dt, this);
      if (wasAlive && !enemy.alive) this.maybeDropPickup(enemy, { source: 'system' });
    }
    this.flushPickupDrops();
    for (const pickup of this.pickups) pickup.update(dt, this);
    this.separateEnemies(dt);
    this.enemies = this.enemies.filter(enemy => !enemy.remove);
    this.pickups = this.pickups.filter(pickup => !pickup.remove);

    if (this.nonBlockingWaveTimer > 0) {
      this.nonBlockingWaveTimer -= dt;
      if (this.nonBlockingWaveTimer <= 0) {
        const spawnedNext = this.spawnNextWave('afterWaveCleared');
        if (!spawnedNext) {
          this.encounterActive = false;
          this.encounterCleared = true;
        }
      }
    }

    if (this.encounterActive && !this.hasScheduledGroups() && !this.enemies.some(enemy => this.isWaveBlocker(enemy))) {
      AudioManager.playSfx('waveClear', 0.7);
      const spawnedNext = this.spawnNextWave('afterWaveCleared');
      if (!spawnedNext) {
        this.encounterActive = false;
        this.encounterCleared = true;
      }
    }

    if (this.encounterCleared && this.player.x > GAME_CONFIG.width - 95) {
      this.nextScreen();
    }

    if (this.player.hp <= 0) {
      if (this.game && this.game.handleHeroDefeat) this.game.handleHeroDefeat(this);
      else this.game.setState('characterSelect');
    }
  }

  draw(ctx) {
    const bg = this.getLevelBackgroundImage();
    if (bg) ctx.drawImage(bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    else {
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    }
    this.drawLevelBackgroundEffects(ctx);

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.fillRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);

    const entities = [{ type: 'player', y: this.player.y, ref: this.player }];
    for (const enemy of this.enemies) entities.push({ type: 'enemy', y: enemy.y, ref: enemy });
    entities.sort((a, b) => a.y - b.y);

    for (const entity of entities) entity.ref.draw(ctx, this.debug);
    for (const pickup of this.pickups) pickup.draw(ctx);

    if (this.encounterCleared) {
      ctx.font = 'bold 42px Arial';
      ctx.fillStyle = 'lime';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.strokeText('→', GAME_CONFIG.width - 90, 380);
      ctx.fillText('→', GAME_CONFIG.width - 90, 380);
    }

    HUD.draw(ctx, this);

    if (this.debug) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width - 0, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);
    }
  }

  getLevelPickupRule() {
    const rules = GAME_CONFIG.levelPickupDrops || {};
    const key = this.getLevelKey ? this.getLevelKey() : null;
    return key ? rules[key] : null;
  }

  maybeDropPickup(enemy, options = {}) {
    if (!enemy || enemy.pickupDropped || enemy.gundosMinion) return;
    enemy.pickupDropped = true;
    if (options.source !== 'player') return;
    if (this.levelPickupDropped) return;

    const rule = this.getLevelPickupRule();
    if (!rule || !rule.pickup) return;
    const allowedTypes = Array.isArray(rule.enemyTypes)
      ? rule.enemyTypes
      : [rule.enemyType].filter(Boolean);
    if (allowedTypes.length && !allowedTypes.includes(enemy.enemyType)) return;

    this.levelPickupDropped = true;
    const pickupType = rule.pickup;
    const rawX = Number.isFinite(enemy.x) ? enemy.x : GAME_CONFIG.width / 2;
    const rawY = Number.isFinite(enemy.y) ? enemy.y : GAME_CONFIG.laneBottom;
    const x = Math.max(70, Math.min(GAME_CONFIG.width - 70, rawX));
    const y = Math.max(GAME_CONFIG.laneTop + 35, Math.min(GAME_CONFIG.laneBottom, rawY));
    if (!this.pendingPickupDrops) this.pendingPickupDrops = [];
    this.pendingPickupDrops.push({ type: pickupType, x, y });
  }

  flushPickupDrops() {
    if (!this.pendingPickupDrops || !this.pendingPickupDrops.length) return;
    for (const drop of this.pendingPickupDrops) {
      if (!drop || !drop.type) continue;
      this.pickups.push(new HealthPickup(drop.type, drop.x, drop.y, this.images));
    }
    this.pendingPickupDrops.length = 0;
  }

  tryCollectPickup(player) {
    if (!player || !this.pickups || !this.pickups.length) return false;
    for (const pickup of this.pickups) {
      if (!pickup || pickup.remove || pickup.floatTimer > 0) continue;
      if (pickup.collect(player)) return true;
    }
    return false;
  }
}
