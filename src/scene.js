class LevelScene {
  constructor(game, images) {
    this.game = game;
    this.images = images;
    this.screenIndex = 0;
    this.player = new Player(game.selectedHero || 'boris', images);
    this.enemies = [];
    this.hitStop = 0;
    this.encounterActive = false;
    this.encounterCleared = false;
    this.debug = false;
    this.currentWaveIndex = -1;
    this.nonBlockingWaveTimer = 0;
    this.pendingWave = null;
    this.pendingWaveTimer = 0;
    this.spawnInitialWave();
  }

  getLevelKey() {
    return GAME_CONFIG.levelOrder[this.screenIndex] || 'street01';
  }

  getLevelConfig() {
    return GAME_CONFIG.levels[this.getLevelKey()] || GAME_CONFIG.levels.street01;
  }

  spawnInitialWave() {
    this.currentWaveIndex = -1;
    this.enemies = [];
    this.encounterActive = false;
    this.encounterCleared = false;
    this.nonBlockingWaveTimer = 0;
    this.pendingWave = null;
    this.pendingWaveTimer = 0;
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

  getWaveAppearKey(wave) {
    for (const group of wave.enemies || []) {
      const key = group.type + 'Appear';
      if (AudioManager.sfx && AudioManager.sfx[key]) return key;
    }
    return null;
  }

  getWaveAppearDelayMs(wave) {
    if (wave.appearDelayMs != null) return Math.max(0, Number(wave.appearDelayMs) || 0);
    return this.getWaveAppearKey(wave) ? 850 : 0;
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
    const appearKey = this.getWaveAppearKey(wave);
    const delayMs = this.getWaveAppearDelayMs(wave);

    if (appearKey && delayMs > 0) {
      AudioManager.playSfx(appearKey, 0.95, { startAt: 0.01 });
      this.pendingWave = wave;
      this.pendingWaveTimer = delayMs;
      this.encounterActive = false;
      this.encounterCleared = false;
      this.nonBlockingWaveTimer = 0;
      return;
    }

    if (appearKey) AudioManager.playSfx(appearKey, 0.95, { startAt: 0.01 });
    this.materializeWave(wave);
  }

  materializeWave(wave) {
    this.spawnWave(wave);
    this.encounterActive = this.hasWaveBlockers();
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
    let enemyId = this.enemies.length;

    for (const group of wave.enemies || []) {
      const count = Math.max(0, Number(group.count) || 0);
      for (let i = 0; i < count; i++) {
        if (group.type === 'bastard' && this.enemies.some(enemy => enemy.enemyType === 'bastard' && enemy.alive)) {
          continue;
        }

        const spawn = this.getSpawnPoint(group.side, i, count);
        const enemy = this.createEnemy(group.type, spawn.x, spawn.y, enemyId);
        if (enemy) {
          this.enemies.push(enemy);
          enemyId += 1;
        }
      }
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
    if (Input.consume('h')) this.debug = !this.debug;
    if (Input.consume('escape')) this.game.setState('mainMenu');

    if (this.hitStop > 0) {
      this.hitStop -= dt;
      return;
    }

    this.player.update(dt, this);

    if (this.pendingWave) {
      this.pendingWaveTimer -= dt;
      if (this.pendingWaveTimer <= 0) {
        const wave = this.pendingWave;
        this.materializeWave(wave);
      }
    }

    for (const enemy of this.enemies) enemy.update(dt, this);
    this.enemies = this.enemies.filter(enemy => !enemy.remove);

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

    if (this.encounterActive && !this.enemies.some(enemy => this.isWaveBlocker(enemy))) {
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
      this.game.setState('characterSelect');
    }
  }

  draw(ctx) {
    const bg = this.images.streets[this.screenIndex] || this.images.streets[0];
    if (bg) ctx.drawImage(bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    else {
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.fillRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);

    const entities = [{ type: 'player', y: this.player.y, ref: this.player }];
    for (const enemy of this.enemies) entities.push({ type: 'enemy', y: enemy.y, ref: enemy });
    entities.sort((a, b) => a.y - b.y);

    for (const entity of entities) entity.ref.draw(ctx, this.debug);

    if (this.encounterActive) {
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,0,0,0.9)';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5;
      ctx.strokeText('FIGHT!', GAME_CONFIG.width / 2, 128);
      ctx.fillText('FIGHT!', GAME_CONFIG.width / 2, 128);
      ctx.textAlign = 'left';
    }

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
}
