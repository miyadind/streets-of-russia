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
    this.posterRemoved = {};
    this.posterPromptFlash = 0;
    this.altBackgrounds = {};
    this.preloadEventBackgrounds();
    this.spawnInitialWave();
  }

  getLevelKey() {
    return GAME_CONFIG.levelOrder[this.screenIndex] || 'street01';
  }

  getLevelConfig() {
    return GAME_CONFIG.levels[this.getLevelKey()] || GAME_CONFIG.levels.street01;
  }

  preloadEventBackgrounds() {
    const alternates = (Assets.backgrounds && Assets.backgrounds.alternate) || {};
    for (const [levelKey, src] of Object.entries(alternates)) {
      const img = new Image();
      img.onload = () => { this.altBackgrounds[levelKey] = img; };
      img.onerror = () => { console.warn('Missing alternate background:', src); };
      img.src = src;
    }
  }

  spawnInitialWave() {
    this.currentWaveIndex = -1;
    this.enemies = [];
    this.encounterActive = false;
    this.encounterCleared = false;
    this.spawnNextWave('onEnter');
  }

  spawnNextWave(expectedTrigger = 'afterWaveCleared') {
    const level = this.getLevelConfig();
    const waves = level.waves || [];

    for (let i = this.currentWaveIndex + 1; i < waves.length; i++) {
      const wave = waves[i];
      if (wave.trigger !== expectedTrigger) continue;
      this.currentWaveIndex = i;
      this.spawnWave(wave);
      this.handleWaveAudio(wave);
      this.encounterActive = this.hasWaveBlockers();
      this.encounterCleared = !this.encounterActive;
      return true;
    }

    this.encounterActive = false;
    this.encounterCleared = true;
    return false;
  }

  spawnWave(wave) {
    this.enemies = [];
    let enemyId = 0;

    for (const group of wave.enemies || []) {
      const count = Math.max(0, Number(group.count) || 0);
      for (let i = 0; i < count; i++) {
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
    this.posterRemoved[this.getLevelKey()] = false;
    this.posterPromptFlash = 0;
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
      this.posterPromptFlash = 0;
      const level = this.getLevelConfig();
      AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme');
      this.spawnInitialWave();
    } else {
      this.game.setState('mainMenu');
    }
  }

  requiresPosterAction() {
    return this.getLevelKey() === 'street02';
  }

  isPosterRemoved() {
    return this.posterRemoved[this.getLevelKey()] === true;
  }

  isExitUnlocked() {
    return !this.requiresPosterAction() || this.isPosterRemoved();
  }

  getPosterActionZone() {
    return { x: 890, y: GAME_CONFIG.laneTop, w: 280, h: GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop };
  }

  isPlayerNearPoster() {
    const zone = this.getPosterActionZone();
    return this.player.x >= zone.x && this.player.x <= zone.x + zone.w && this.player.y >= zone.y && this.player.y <= zone.y + zone.h;
  }

  removePoster() {
    if (!this.encounterCleared || !this.requiresPosterAction() || this.isPosterRemoved()) return;
    if (!this.isPlayerNearPoster()) {
      this.posterPromptFlash = 650;
      return;
    }
    this.posterRemoved[this.getLevelKey()] = true;
    this.posterPromptFlash = 0;
    AudioManager.playSfx('waveClear', 0.75);
  }

  update(dt) {
    if (Input.consume('h')) this.debug = !this.debug;
    if (Input.consume('escape')) this.game.setState('mainMenu');
    if (this.posterPromptFlash > 0) this.posterPromptFlash -= dt;

    if (this.hitStop > 0) {
      this.hitStop -= dt;
      return;
    }

    this.player.update(dt, this);

    for (const enemy of this.enemies) enemy.update(dt, this);
    this.enemies = this.enemies.filter(enemy => !enemy.remove);

    if (this.encounterActive && !this.enemies.some(enemy => this.isWaveBlocker(enemy))) {
      AudioManager.playSfx('waveClear', 0.7);
      const spawnedNext = this.spawnNextWave('afterWaveCleared');
      if (!spawnedNext) {
        this.encounterActive = false;
        this.encounterCleared = true;
      }
    }

    if (this.encounterCleared && this.requiresPosterAction() && !this.isPosterRemoved() && Input.consume('e')) {
      this.removePoster();
    }

    if (this.encounterCleared && this.isExitUnlocked() && this.player.x > GAME_CONFIG.width - 95) {
      this.nextScreen();
    }

    if (this.player.hp <= 0) {
      this.game.setState('characterSelect');
    }
  }

  getCurrentBackground() {
    const levelKey = this.getLevelKey();
    if (levelKey === 'street02' && this.isPosterRemoved() && this.altBackgrounds.street02) {
      return this.altBackgrounds.street02;
    }
    return this.images.streets[this.screenIndex] || this.images.streets[0];
  }

  drawPosterObjective(ctx) {
    if (!this.encounterCleared || !this.requiresPosterAction() || this.isPosterRemoved()) return;

    const near = this.isPlayerNearPoster();
    const zone = this.getPosterActionZone();

    ctx.save();
    ctx.fillStyle = near ? 'rgba(60,255,90,0.10)' : 'rgba(255,255,255,0.045)';
    ctx.strokeStyle = near ? 'rgba(80,255,100,0.70)' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);

    ctx.font = 'bold 27px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.strokeText('СОРВИ ПЛАКАТ ГОЛОСОВАНИЯ', GAME_CONFIG.width / 2, 106);
    ctx.fillText('СОРВИ ПЛАКАТ ГОЛОСОВАНИЯ', GAME_CONFIG.width / 2, 106);

    const promptY = near ? 465 : 150;
    const promptText = near ? 'E — СОРВАТЬ ПЛАКАТ' : 'ПОДОЙДИ К ПЛАКАТУ';
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = near ? '#5dff68' : '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(promptText, GAME_CONFIG.width / 2, promptY);
    ctx.fillText(promptText, GAME_CONFIG.width / 2, promptY);

    if (this.posterPromptFlash > 0) {
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#ffdddd';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText('СНАЧАЛА ПОДОЙДИ К ПЛАКАТУ', GAME_CONFIG.width / 2, 500);
      ctx.fillText('СНАЧАЛА ПОДОЙДИ К ПЛАКАТУ', GAME_CONFIG.width / 2, 500);
    }

    ctx.restore();
  }

  drawExitArrow(ctx) {
    if (!this.encounterCleared || !this.isExitUnlocked()) return;
    ctx.font = 'bold 42px Arial';
    ctx.fillStyle = 'lime';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText('→', GAME_CONFIG.width - 90, 380);
    ctx.fillText('→', GAME_CONFIG.width - 90, 380);
  }

  draw(ctx) {
    const bg = this.getCurrentBackground();
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

    this.drawPosterObjective(ctx);
    this.drawExitArrow(ctx);

    HUD.draw(ctx, this);

    if (this.debug) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);

      if (this.requiresPosterAction()) {
        const zone = this.getPosterActionZone();
        ctx.strokeStyle = 'rgba(80,255,100,0.9)';
        ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
      }
    }
  }
}