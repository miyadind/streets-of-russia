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
    this.popDuration = this.type.startsWith('support') ? 110 : 420;
  }

  getConfig() {
    const pickups = GAME_CONFIG.pickups || {};
    const config = pickups[this.type] || {};
    if (!this.type.startsWith('support')) return config;
    return { ...(pickups.supportFigure || {}), ...config, image: this.type };
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
    if (cfg.support) {
      if (player.scene && player.scene.addSupportFigure) player.scene.addSupportFigure(this.type);
      this.floatText = cfg.label || 'ПОДДЕРЖКА ПОЛУЧЕНА';
      this.floatTextX = player.x;
      this.floatTextY = player.y - 136;
      this.floatTimer = 900;
      AudioManager.playSfx('waveClear', 0.5, { playbackRate: 1.48 });
      return true;
    }
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
    const appearScale = pop < 1
      ? (this.type.startsWith('support') ? 0.82 + 0.18 * pop : 0.35 + 0.65 * pop)
      : 1;
    const scale = (cfg.scale || 0.32) * pulse * appearScale;
    const popY = pop < 1 ? -bounce * 42 : 0;

    ctx.save();
    if (this.floatTimer <= 0 && img && img.complete !== false && img.naturalWidth !== 0) {
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.globalAlpha = this.type.startsWith('support') ? Math.min(1, 0.82 + pop * 0.18) : Math.min(1, 0.25 + pop * 0.75);
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
    this.player.scene = this;
    this.enemies = [];
    this.pickups = [];
    this.damageTexts = [];
    this.pendingPickupDrops = [];
    this.supportFigures = [];
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

  addDamageText(amount, target) {
    const damage = Math.max(0, Math.round(Number(amount) || 0));
    if (!damage || !target) return;

    this.damageTexts.push({
      text: '-' + damage,
      x: target.x,
      y: target.y - 120,
      age: 0,
      duration: 820,
      driftX: (Math.random() - 0.5) * 14
    });
  }

  updateDamageTexts(dt) {
    for (const text of this.damageTexts) text.age += dt;
    this.damageTexts = this.damageTexts.filter(text => text.age < text.duration);
  }

  drawDamageTexts(ctx) {
    ctx.save();
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    for (const text of this.damageTexts) {
      const progress = Math.max(0, Math.min(1, text.age / text.duration));
      const alpha = progress < 0.7 ? 1 : (1 - progress) / 0.3;
      const rise = progress * 52;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#35bfff';
      ctx.strokeText(text.text, text.x + text.driftX * progress, text.y - rise);
      ctx.fillText(text.text, text.x + text.driftX * progress, text.y - rise);
    }
    ctx.restore();
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

  drawLevelForegroundObjects(ctx) {
    const level = this.getLevelConfig();
    const items = Array.isArray(level && level.interactives) ? level.interactives : [];
    for (const item of items) {
      if (!item || item.type !== 'vehicleObstacle' || !item.drawRect) continue;
      const rect = item.drawRect;
      const image = item.image && this.images.levelInteractiveImages && this.images.levelInteractiveImages[item.image];
      ctx.save();
      if (image && image.complete !== false && image.naturalWidth !== 0) {
        try {
          ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
          ctx.restore();
          continue;
        } catch (error) {}
      }
      ctx.fillStyle = 'rgba(20,45,75,0.82)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
  }

  spawnInitialWave() {
    this.currentWaveIndex = -1;
    this.enemies = [];
    this.pickups = [];
    this.pendingPickupDrops = [];
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
    const key = this.getWaveAppearKey(wave);
    return key === 'zetnikAppear' ? 850 : 0;
  }

  getWaveAppearKey(wave) {
    for (const group of wave.enemies || []) {
      if (group.type === 'dogRegime') continue;
      const key = group.type + 'Appear';
      if (AudioManager.isUsableSfxKey && AudioManager.isUsableSfxKey(key)) return key;
    }
    return null;
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
    if (type === 'dogRegime') {
      if (AudioManager.stopHorseAppearSfx) AudioManager.stopHorseAppearSfx();
      return;
    }
    const previousAppearType = AudioManager.enemyAppearType;
    AudioManager.enemyAppearType = type;
    try {
      AudioManager.playOptionalSfx(this.getEnemyAppearSoundKey(type), 0.9, {
        src: this.getEnemyAppearSoundPath(type),
        startAt: 0.01,
        duckMusic: type === 'negay',
        duckSource: type === 'negay' ? 'negayAppearVoice' : undefined
      });
    } finally {
      AudioManager.enemyAppearType = previousAppearType || null;
    }
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
    // A cleared wave may still have visible knockdown/death frames. Keep those
    // until their own fade timer removes them so the next enemy does not erase corpses.
    this.enemies = this.enemies.filter(enemy => enemy && !enemy.remove && (
      !enemy.alive || (enemy.alive && enemy.enemyType === 'bastard')
    ));
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
    const isChargingZetnik = group && group.type === 'zetnik';
    if (group && group.type === 'dogRegime' && AudioManager.stopHorseAppearSfx) {
      AudioManager.stopHorseAppearSfx();
    }
    let enemyId = this.enemies.length;
    let playedAppearSound = false;
    for (let i = 0; i < count; i++) {
      if (group.type === 'bastard' && this.enemies.some(enemy => enemy.enemyType === 'bastard' && enemy.alive)) {
        continue;
      }

      const spawn = this.getSpawnPoint(group.side, i, count);
      if (group.type === 'sucker' && this.player) {
        const edgeThreshold = 220;
        const playerAtLeftEdge = this.player.x <= edgeThreshold;
        const playerAtRightEdge = this.player.x >= GAME_CONFIG.width - edgeThreshold;
        if (playerAtLeftEdge || playerAtRightEdge) {
          const zone = this.getWalkZone();
          // Do not spawn the charge enemy against the player at the same edge.
          spawn.x = playerAtLeftEdge ? GAME_CONFIG.width - 140 : 140;
          spawn.y = Math.max(zone.top, Math.min(zone.bottom, this.player.y));
        }
      }
      if ((group.alignToPlayerLane || isChargingZetnik) && this.player) {
        const zone = this.getWalkZone();
        spawn.y = Math.max(zone.top, Math.min(zone.bottom, this.player.y));
      }
      if (isChargingZetnik) {
        const fromLeft = group.side === 'left' || (group.side === 'both' && i % 2 === 0);
        const offscreenMargin = 130 + i * 28;
        spawn.x = fromLeft ? -offscreenMargin : GAME_CONFIG.width + offscreenMargin;
      }
      const enemy = this.createEnemy(group.type, spawn.x, spawn.y, enemyId);
      if (!enemy) continue;

      if ((group.alignToPlayerLane || isChargingZetnik) && enemy.enemyType === 'zetnik') {
        enemy.y = spawn.y;
        enemy.chargeLaneY = spawn.y;
        enemy.laneY = spawn.y;
        enemy.chargeDirection = spawn.x < GAME_CONFIG.width / 2 ? 1 : -1;
      }

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
      // Sucker is always a regular enemy. Its appearance must never turn a
      // wave into a boss encounter, even if a dev-wave has stale boss flags.
      if (group.type === 'sucker') continue;
      const enemyConfig = GAME_CONFIG.enemies[group.type] || {};
      const isBoss = enemyConfig.bossMusic === true || group.boss === true;
      if (!isBoss) continue;
      return group.bossMusicKey || enemyConfig.bossMusicKey || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.boss) || 'bossTheme';
    }
    return null;
  }

  handleWaveAudio(wave) {
    const bossMusicKey = this.getBossMusicKey(wave);
    const containsSucker = (wave.enemies || []).some(group => group.type === 'sucker');

    if (bossMusicKey) {
      AudioManager.playSfx('bossAppear', 0.9);
      AudioManager.playMusic(bossMusicKey, true);
    } else if (containsSucker) {
      // A Sucker is not a mini-boss: preserve the current area music.
      AudioManager.playSfx('waveStart', 0.55);
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
    if (enemy && enemy.enemyType === 'zetnik' && typeof enemy.markEnteredPlayfield === 'function') {
      enemy.markEnteredPlayfield();
    }
    if (enemy && enemy.enemyType === 'zetnik' && enemy.alive && !enemy.remove &&
        enemy.hasEnteredPlayfield !== false &&
        typeof enemy.isPastEscapeMargin === 'function' && enemy.isPastEscapeMargin()) {
      if (typeof enemy.escapeOffscreen === 'function') enemy.escapeOffscreen();
      else {
        enemy.alive = false;
        enemy.hp = 0;
        enemy.remove = true;
        enemy.blocksWaveClear = false;
        enemy.pickupDropped = true;
      }
      return false;
    }
    return enemy && enemy.alive && enemy.blocksWaveClear !== false;
  }

  cleanupEscapedZetniks() {
    for (const enemy of this.enemies || []) {
      if (!enemy || enemy.enemyType !== 'zetnik' || !enemy.alive || enemy.remove) continue;
      if (typeof enemy.markEnteredPlayfield === 'function') enemy.markEnteredPlayfield();
      if (enemy.hasEnteredPlayfield !== false &&
          typeof enemy.isPastEscapeMargin === 'function' && enemy.isPastEscapeMargin()) {
        if (typeof enemy.escapeOffscreen === 'function') enemy.escapeOffscreen();
        else {
          enemy.alive = false;
          enemy.hp = 0;
          enemy.remove = true;
          enemy.blocksWaveClear = false;
          enemy.pickupDropped = true;
        }
      }
    }
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
          // Zetniks are charging hazards: only the player can stop them.
          if (a.enemyType === 'zetnik' || b.enemyType === 'zetnik') continue;
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
    if (this.player) this.player.scene = this;
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
    this.cleanupEscapedZetniks();
    this.flushPickupDrops();
    for (const pickup of this.pickups) pickup.update(dt, this);
    this.updateDamageTexts(dt);
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
    if (this.drawLevelForegroundObjects) this.drawLevelForegroundObjects(ctx);

    const entities = [{ type: 'player', y: this.player.y, ref: this.player }];
    for (const enemy of this.enemies) entities.push({ type: 'enemy', y: enemy.y, ref: enemy });
    entities.sort((a, b) => a.y - b.y);

    for (const entity of entities) entity.ref.draw(ctx, this.debug);
    for (const pickup of this.pickups) pickup.draw(ctx);
    this.drawDamageTexts(ctx);

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

  dropPickup(type, x, y, options = {}) {
    if (!type) return;
    if (type === 'supportFigure') {
      type = this.reserveSupportFigure();
      if (!type) return;
    }
    const rawX = Number.isFinite(x) ? x : GAME_CONFIG.width / 2;
    const rawY = Number.isFinite(y) ? y : GAME_CONFIG.laneBottom;
    const safeX = Math.max(70, Math.min(GAME_CONFIG.width - 70, rawX));
    const safeY = Math.max(GAME_CONFIG.laneTop + 35, Math.min(GAME_CONFIG.laneBottom, rawY));
    if (options.immediate) {
      this.pickups.push(new HealthPickup(type, safeX, safeY, this.images));
      return;
    }
    if (!this.pendingPickupDrops) this.pendingPickupDrops = [];
    this.pendingPickupDrops.push({ type, x: safeX, y: safeY });
  }

  addSupportFigure(type) {
    if (!type || !type.startsWith('support')) return;
    if (!this.supportFigures.includes(type)) this.supportFigures.push(type);
    if (this.game) {
      const collected = Array.isArray(this.game.supportFigures) ? this.game.supportFigures : [];
      if (!collected.includes(type)) collected.push(type);
      this.game.supportFigures = collected;
    }
  }

  reserveSupportFigure() {
    const allFigures = Array.from({ length: 19 }, (_, index) => 'support' + String(index + 1).padStart(2, '0'));
    const game = this.game || {};
    const reserved = Array.isArray(game.supportFigureDrops) ? game.supportFigureDrops : [];
    const collected = Array.isArray(game.supportFigures) ? game.supportFigures : [];
    const unavailable = new Set([...reserved, ...collected]);
    const available = allFigures.filter(type => !unavailable.has(type));
    if (!available.length) return null;
    const type = available[Math.floor(Math.random() * available.length)];
    if (!Array.isArray(game.supportFigureDrops)) game.supportFigureDrops = [];
    game.supportFigureDrops.push(type);
    return type;
  }

  maybeDropPickup(enemy, options = {}) {
    if (!enemy || enemy.pickupDropped) return;
    enemy.pickupDropped = true;
    if (options.source !== 'player') return;

    const rawX = Number.isFinite(enemy.x) ? enemy.x : GAME_CONFIG.width / 2;
    const rawY = Number.isFinite(enemy.y) ? enemy.y : GAME_CONFIG.laneBottom;
    const x = Math.max(70, Math.min(GAME_CONFIG.width - 70, rawX));
    const y = Math.max(GAME_CONFIG.laneTop + 35, Math.min(GAME_CONFIG.laneBottom, rawY));

    if (enemy.enemyType === 'zetnik') {
      if (enemy.gundosMinion || enemy.gundosGuarding || enemy.redirectedToBoss) return;
      if (this.gundosArenaActive || this.gundosIntroActive || this.gundosVictoryPending) return;
      this.dropPickup('medkit', x, y);
      return;
    }

    if (enemy.enemyType === 'sucker') this.dropPickup('tea', x, y);
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
